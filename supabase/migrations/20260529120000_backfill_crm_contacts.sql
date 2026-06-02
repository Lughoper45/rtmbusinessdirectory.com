-- Backfill crm_contacts from existing lead tables (insert triggers only run on new rows).

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
      set stage = case when stage = 'visitor' then 'lead' else stage end
      where id = v_contact_id and stage = 'visitor';
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
      p.full_name,
      p.id as profile_id,
      p.membership_status::text as membership_status
    from public.profiles p
    join auth.users u on u.id = p.user_id
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
          when crm_contacts.stage = 'visitor' then 'lead'
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
    'grant_checklist_leads', v_grant,
    'growth_audit_leads', v_growth,
    'profiles', v_members,
    'listing_contacts', v_listing,
    'synced_at', now()
  );
end;
$$;

revoke all on function public.backfill_crm_contacts() from public;
grant execute on function public.backfill_crm_contacts() to service_role;

-- Run once when migration is applied.
select public.backfill_crm_contacts();
