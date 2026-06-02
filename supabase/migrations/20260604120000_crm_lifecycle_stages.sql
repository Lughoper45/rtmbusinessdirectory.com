-- Align crm_contacts.stage with pricing_model.md §4.1 lifecycle stages

alter table public.crm_contacts drop constraint if exists crm_contacts_stage_check;

update public.crm_contacts
set stage = case stage
  when 'visitor' then 'stranger'
  when 'lead' then 'explorer'
  when 'qualified' then 'explorer'
  when 'opportunity' then 'ready_to_submit'
  when 'customer' then 'client'
  when 'alumni' then 'client'
  else stage
end;

alter table public.crm_contacts
  alter column stage set default 'stranger';

alter table public.crm_contacts
  add constraint crm_contacts_stage_check check (
    stage in ('stranger', 'explorer', 'ready_to_submit', 'member', 'client')
  );

comment on column public.crm_contacts.stage is
  'Lifecycle: stranger → explorer → ready_to_submit → member → client (pricing_model §4.1)';

-- Keep CRM stage in sync when membership_status changes
create or replace function public.sync_crm_stage_from_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stage text;
  v_email text;
begin
  v_email := lower(trim(coalesce(new.email, '')));
  if length(v_email) < 5 then
    return new;
  end if;

  v_stage := case new.membership_status::text
    when 'active' then 'member'
    when 'grant_intake_started' then 'ready_to_submit'
    when 'profile_incomplete' then 'explorer'
    when 'expired' then 'explorer'
    when 'suspended' then 'explorer'
    else 'explorer'
  end;

  update public.crm_contacts
  set
    stage = v_stage,
    profile_id = coalesce(profile_id, new.id),
    updated_at = now()
  where lower(email) = v_email;

  if not found then
    perform public.upsert_crm_contact(v_email, new.display_name, 'grants_workspace', array['grant_user']::text[]);
    update public.crm_contacts
    set stage = v_stage, profile_id = new.id, updated_at = now()
    where lower(email) = v_email;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_sync_crm_stage on public.profiles;
create trigger profiles_sync_crm_stage
after insert or update of membership_status, email, display_name on public.profiles
for each row
execute function public.sync_crm_stage_from_profile();

-- Checklist leads enter as stranger
create or replace function public.sync_checklist_lead_to_crm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  v_id := public.upsert_crm_contact(
    new.email,
    new.name,
    coalesce(new.source, 'grant_checklist'),
    array['grant_lead']::text[]
  );
  if v_id is not null then
    update public.crm_contacts
    set stage = case when stage = 'member' then stage else 'stranger' end
    where id = v_id and stage not in ('member', 'client', 'ready_to_submit');
  end if;

  insert into public.ops_events (event_type, payload)
  values ('checklist_lead.created', jsonb_build_object('lead_id', new.id, 'email', new.email));
  return new;
end;
$$;

create or replace view public.crm_lifecycle_funnel as
select
  stage,
  count(*)::int as contact_count
from public.crm_contacts
group by stage
order by case stage
  when 'stranger' then 1
  when 'explorer' then 2
  when 'ready_to_submit' then 3
  when 'member' then 4
  when 'client' then 5
  else 6
end;

grant select on public.crm_lifecycle_funnel to authenticated;

-- Refresh backfill stage mapping for new enum
create or replace function public.backfill_crm_contacts()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grant int := 0;
  v_growth int := 0;
  v_members int := 0;
  v_listing int := 0;
  r record;
  v_contact_id uuid;
begin
  for r in
    select email, name, coalesce(nullif(trim(source), ''), 'grant_checklist') as source
    from public.grant_checklist_leads
    where email is not null and length(trim(email)) >= 5
  loop
    v_contact_id := public.upsert_crm_contact(
      r.email,
      r.name,
      r.source,
      array['grant_lead']::text[]
    );
    if v_contact_id is not null then
      update public.crm_contacts
      set stage = case when stage in ('member', 'client', 'ready_to_submit') then stage else 'stranger' end
      where id = v_contact_id;
      v_grant := v_grant + 1;
    end if;
  end loop;

  for r in
    select
      email,
      coalesce(nullif(trim(name), ''), nullif(trim(business_name), '')) as name,
      coalesce(nullif(trim(source), ''), 'growth_audit') as source
    from public.growth_audit_leads
    where email is not null and length(trim(email)) >= 5
  loop
    v_contact_id := public.upsert_crm_contact(
      r.email,
      r.name,
      r.source,
      array['growth_lead']::text[]
    );
    if v_contact_id is not null then
      v_growth := v_growth + 1;
    end if;
  end loop;

  for r in
    select
      u.email,
      p.display_name as full_name,
      p.id as profile_id,
      p.membership_status::text as membership_status
    from public.profiles p
    join auth.users u on u.id = coalesce(p.user_id, p.id)
    where u.email is not null and length(trim(u.email)) >= 5
  loop
    v_contact_id := public.upsert_crm_contact(
      r.email,
      r.full_name,
      'member',
      array['rtm_member']::text[]
    );
    if v_contact_id is not null then
      update public.crm_contacts
      set
        profile_id = coalesce(crm_contacts.profile_id, r.profile_id),
        stage = case
          when r.membership_status = 'active' then 'member'
          when r.membership_status = 'grant_intake_started' then 'ready_to_submit'
          when r.membership_status in ('profile_incomplete', 'expired', 'suspended') then 'explorer'
          else crm_contacts.stage
        end
      where id = v_contact_id;
      v_members := v_members + 1;
    end if;
  end loop;

  for r in
    select distinct on (lower(trim(email)))
      lower(trim(email)) as email,
      name
    from public.listing_contacts
    where email is not null and length(trim(email)) >= 5
    order by lower(trim(email)), created_at desc nulls last
  loop
    v_contact_id := public.upsert_crm_contact(
      r.email,
      r.name,
      'listing_outreach',
      array['directory_owner']::text[]
    );
    if v_contact_id is not null then
      v_listing := v_listing + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'grant_leads', v_grant,
    'growth_leads', v_growth,
    'members', v_members,
    'listing_contacts', v_listing
  );
end;
$$;
