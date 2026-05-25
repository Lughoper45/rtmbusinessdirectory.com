-- Directory listing outreach, unified CRM, social queue (kajwpmyloxaqeciyndwf)

-- ─── Businesses: claim + owner fields ───────────────────────────────────────
alter table public.businesses add column if not exists owner_email text;
alter table public.businesses add column if not exists owner_name text;
alter table public.businesses add column if not exists claim_status text not null default 'unclaimed';
alter table public.businesses add column if not exists claimed_by_user_id uuid references auth.users(id);
alter table public.businesses add column if not exists last_outreach_at timestamptz;
alter table public.businesses add column if not exists social_share_enabled boolean not null default false;
alter table public.businesses add column if not exists profile_completion_pct integer not null default 0;

do $$ begin
  alter table public.businesses add constraint businesses_claim_status_check
    check (claim_status in ('unclaimed', 'invited', 'claimed', 'disputed', 'suppressed'));
exception when duplicate_object then null;
end $$;

create index if not exists businesses_claim_status_idx on public.businesses (claim_status);
create index if not exists businesses_owner_email_idx on public.businesses (lower(owner_email));

-- ─── Listing contacts (enrichment) ──────────────────────────────────────────
create table if not exists public.listing_contacts (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.businesses(business_id) on delete cascade,
  email text,
  phone text,
  name text,
  role text,
  source text not null default 'manual',
  source_url text,
  confidence integer not null default 0 check (confidence >= 0 and confidence <= 100),
  casl_basis text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_contacts_business_id_idx on public.listing_contacts (business_id);
create index if not exists listing_contacts_email_idx on public.listing_contacts (lower(email));
create unique index if not exists listing_contacts_business_email_idx
  on public.listing_contacts (business_id, lower(email))
  where email is not null;

-- ─── Outreach queue ─────────────────────────────────────────────────────────
create table if not exists public.listing_outreach (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.businesses(business_id) on delete cascade,
  contact_id uuid references public.listing_contacts(id) on delete set null,
  sequence_id text not null default 'claim_invite_v1',
  step integer not null default 0,
  status text not null default 'queued',
  invite_token text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  resend_message_id text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_outreach_status_check check (
    status in ('queued', 'approved', 'sent', 'bounced', 'replied', 'opted_out', 'claimed', 'cancelled')
  )
);

create index if not exists listing_outreach_status_idx on public.listing_outreach (status);
create index if not exists listing_outreach_business_id_idx on public.listing_outreach (business_id);
create unique index if not exists listing_outreach_invite_token_idx on public.listing_outreach (invite_token) where invite_token is not null;

-- ─── Suppressions (CASL opt-out) ────────────────────────────────────────────
create table if not exists public.listing_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  domain text,
  reason text not null default 'opt_out',
  business_id text references public.businesses(business_id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists listing_suppressions_email_idx on public.listing_suppressions (lower(email));

-- ─── Social post queue ──────────────────────────────────────────────────────
create table if not exists public.social_post_queue (
  id uuid primary key default gen_random_uuid(),
  business_id text references public.businesses(business_id) on delete set null,
  product_type text not null default 'listing',
  payload jsonb not null default '{}',
  channels text[] not null default array['facebook', 'linkedin', 'x'],
  status text not null default 'draft',
  published_urls jsonb default '{}',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  scheduled_at timestamptz,
  published_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_post_queue_status_check check (
    status in ('draft', 'approved', 'scheduled', 'published', 'failed', 'cancelled')
  )
);

create index if not exists social_post_queue_status_idx on public.social_post_queue (status);

-- ─── Owner social OAuth (Phase E) ───────────────────────────────────────────
create table if not exists public.social_oauth_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id text references public.businesses(business_id) on delete cascade,
  provider text not null,
  account_name text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, business_id, provider)
);

-- ─── Unified CRM ────────────────────────────────────────────────────────────
create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  phone text,
  company text,
  stage text not null default 'lead',
  source text,
  tags text[] not null default '{}',
  profile_id uuid,
  lead_score integer not null default 0,
  owner_user_id uuid references auth.users(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_contacts_stage_check check (
    stage in ('visitor', 'lead', 'qualified', 'member', 'opportunity', 'customer', 'alumni')
  )
);

create unique index if not exists crm_contacts_email_lower_idx on public.crm_contacts (lower(email));
create index if not exists crm_contacts_stage_idx on public.crm_contacts (stage);

create table if not exists public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.crm_contacts(id) on delete cascade,
  deal_type text not null,
  amount_cents integer,
  stage text not null default 'discovery',
  stripe_session_id text,
  grant_service_order_id uuid,
  package_id text,
  business_id text references public.businesses(business_id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_deals_stage_check check (
    stage in ('discovery', 'proposal', 'checkout_started', 'won', 'lost')
  )
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  deal_id uuid references public.crm_deals(id) on delete set null,
  kind text not null,
  payload jsonb not null default '{}',
  created_by text not null default 'system',
  created_at timestamptz not null default now()
);

create index if not exists crm_activities_contact_id_idx on public.crm_activities (contact_id, created_at desc);

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.crm_contacts(id) on delete cascade,
  task_type text not null,
  title text not null,
  due_at timestamptz,
  status text not null default 'open',
  assigned_to uuid references auth.users(id),
  ai_suggested_body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_tasks_status_check check (status in ('open', 'in_progress', 'done', 'cancelled'))
);

create table if not exists public.ops_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  retry_count integer not null default 0,
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint ops_events_status_check check (status in ('pending', 'processing', 'done', 'failed'))
);

create index if not exists ops_events_pending_idx on public.ops_events (status, created_at) where status = 'pending';

-- ─── Updated_at triggers ────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ declare t text;
begin
  foreach t in array array[
    'listing_contacts', 'listing_outreach', 'social_post_queue',
    'crm_contacts', 'crm_deals', 'crm_tasks'
  ] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ─── CRM upsert helper ──────────────────────────────────────────────────────
create or replace function public.upsert_crm_contact(
  p_email text,
  p_name text default null,
  p_source text default null,
  p_tags text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) < 5 then
    return null;
  end if;
  insert into public.crm_contacts (email, name, source, tags)
  values (v_email, p_name, p_source, coalesce(p_tags, '{}'))
  on conflict ((lower(email))) do update set
    name = coalesce(excluded.name, crm_contacts.name),
    source = coalesce(excluded.source, crm_contacts.source),
    tags = (
      select array(select distinct unnest(crm_contacts.tags || excluded.tags))
    ),
    updated_at = now()
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.upsert_crm_contact(text, text, text, text[]) from public;
grant execute on function public.upsert_crm_contact(text, text, text, text[]) to service_role;

-- Sync checklist leads → CRM
create or replace function public.sync_checklist_lead_to_crm()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.upsert_crm_contact(
    new.email,
    new.name,
    coalesce(new.source, 'grant_checklist'),
    array['grant_lead']::text[]
  );
  insert into public.ops_events (event_type, payload)
  values ('checklist_lead.created', jsonb_build_object('lead_id', new.id, 'email', new.email));
  return new;
end;
$$;

drop trigger if exists grant_checklist_leads_crm_sync on public.grant_checklist_leads;
create trigger grant_checklist_leads_crm_sync
after insert on public.grant_checklist_leads
for each row execute function public.sync_checklist_lead_to_crm();

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.listing_contacts enable row level security;
alter table public.listing_outreach enable row level security;
alter table public.listing_suppressions enable row level security;
alter table public.social_post_queue enable row level security;
alter table public.social_oauth_connections enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.ops_events enable row level security;

-- Admin policies
do $$ declare tbl text;
begin
  foreach tbl in array array[
    'listing_contacts', 'listing_outreach', 'listing_suppressions',
    'social_post_queue', 'social_oauth_connections',
    'crm_contacts', 'crm_deals', 'crm_activities', 'crm_tasks', 'ops_events'
  ] loop
    execute format('drop policy if exists "Admins manage %I" on public.%I', tbl, tbl);
    execute format(
      'create policy "Admins manage %I" on public.%I for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))',
      tbl, tbl
    );
  end loop;
end $$;

-- Admins can update businesses claim fields
drop policy if exists "Admins update business claim fields" on public.businesses;
create policy "Admins update business claim fields"
on public.businesses for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Admins can update all claims
drop policy if exists "Admins manage business claims" on public.business_claims;
create policy "Admins manage business claims"
on public.business_claims for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
