-- Free Digital Growth Audit leads (Grow My Business pillar)

create table if not exists public.growth_audit_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  business_name text,
  phone text,
  city text,
  business_type text,
  years_operating text,
  online_presence text[] not null default '{}',
  biggest_challenge text,
  interested_package text,
  answers jsonb not null default '{}',
  source text not null default 'grow_page',
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_audit_leads_status_check
    check (status in ('new', 'contacted', 'audit_scheduled', 'proposal_sent', 'won', 'closed')),
  constraint growth_audit_leads_email_check
    check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create index if not exists growth_audit_leads_created_at_idx
  on public.growth_audit_leads (created_at desc);
create index if not exists growth_audit_leads_status_idx
  on public.growth_audit_leads (status);

create or replace function public.set_growth_audit_leads_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists growth_audit_leads_updated_at on public.growth_audit_leads;
create trigger growth_audit_leads_updated_at
before update on public.growth_audit_leads
for each row execute function public.set_growth_audit_leads_updated_at();

alter table public.growth_audit_leads enable row level security;

drop policy if exists "Admins manage growth audit leads" on public.growth_audit_leads;
create policy "Admins manage growth audit leads"
on public.growth_audit_leads for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- CRM sync on insert
create or replace function public.sync_growth_audit_to_crm()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.upsert_crm_contact(
    new.email,
    coalesce(new.name, new.business_name),
    coalesce(new.source, 'growth_audit'),
    array['growth_lead', 'directory_owner']::text[]
  );
  insert into public.ops_events (event_type, payload)
  values ('growth_audit.created', jsonb_build_object('lead_id', new.id, 'email', new.email));
  return new;
end;
$$;

drop trigger if exists growth_audit_leads_crm_sync on public.growth_audit_leads;
create trigger growth_audit_leads_crm_sync
after insert on public.growth_audit_leads
for each row execute function public.sync_growth_audit_to_crm();
