-- Free Grant Checklist lead capture (kajwp / directory site)

create table if not exists public.grant_checklist_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  source text not null default 'grants_page',
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grant_checklist_leads_status_check
    check (status in ('new', 'contacted', 'replied', 'closed')),
  constraint grant_checklist_leads_email_check
    check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create index if not exists grant_checklist_leads_created_at_idx
  on public.grant_checklist_leads (created_at desc);

create index if not exists grant_checklist_leads_status_idx
  on public.grant_checklist_leads (status);

create or replace function public.set_grant_checklist_leads_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists grant_checklist_leads_updated_at on public.grant_checklist_leads;
create trigger grant_checklist_leads_updated_at
before update on public.grant_checklist_leads
for each row
execute function public.set_grant_checklist_leads_updated_at();

alter table public.grant_checklist_leads enable row level security;

drop policy if exists "Admins can view grant checklist leads" on public.grant_checklist_leads;
create policy "Admins can view grant checklist leads"
on public.grant_checklist_leads for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update grant checklist leads" on public.grant_checklist_leads;
create policy "Admins can update grant checklist leads"
on public.grant_checklist_leads for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Seed inbound email leads (user-provided, last 7 days)
insert into public.grant_checklist_leads (email, source, status, created_at, notes)
select v.email, v.source, v.status, v.created_at, v.notes
from (values
  ('marciamorrison049@gmail.com'::text, 'email_inbound'::text, 'new'::text, '2026-05-21T12:00:00+00'::timestamptz, 'Imported from inbox — Free Grant Checklist request'::text),
  ('okunlolatokunbo@gmail.com', 'email_inbound', 'new', '2026-05-20T12:00:00+00', 'Imported from inbox — Free Grant Checklist request'),
  ('nonsoa2014@gmail.com', 'email_inbound', 'new', '2026-05-20T12:00:00+00', 'Imported from inbox — Free Grant Checklist request'),
  ('orders@southsouthpot.com', 'email_inbound', 'new', '2026-05-20T12:00:00+00', 'Imported from inbox — Free Grant Checklist request')
) as v(email, source, status, created_at, notes)
where not exists (
  select 1 from public.grant_checklist_leads g where lower(g.email) = lower(v.email)
);
