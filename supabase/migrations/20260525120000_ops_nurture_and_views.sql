-- Nurture deduplication + listing view counter for owner emails

create table if not exists public.ops_email_log (
  sequence_key text primary key,
  email text not null,
  payload jsonb not null default '{}',
  sent_at timestamptz not null default now()
);

create index if not exists ops_email_log_email_idx on public.ops_email_log (lower(email));
create index if not exists ops_email_log_sent_at_idx on public.ops_email_log (sent_at desc);

alter table public.businesses add column if not exists listing_view_count integer not null default 0;
alter table public.businesses add column if not exists claim_approved_at timestamptz;

comment on table public.ops_email_log is
  'Idempotent keys for automated nurture (checklist day N, post-claim steps).';

alter table public.ops_email_log enable row level security;

drop policy if exists "Admins manage ops_email_log" on public.ops_email_log;
create policy "Admins manage ops_email_log"
on public.ops_email_log for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant all on public.ops_email_log to service_role;
