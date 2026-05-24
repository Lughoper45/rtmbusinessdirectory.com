-- Rate limiting for directory-assistant and other public AI edge functions.

create table if not exists public.ai_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null,
  request_count int not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

comment on table public.ai_rate_limits is
  'Hourly request counters for AI edge functions (IP or user scoped).';

create index if not exists ai_rate_limits_window_start_idx
  on public.ai_rate_limits (window_start);

alter table public.ai_rate_limits enable row level security;

drop policy if exists "ai_rate_limits service role all" on public.ai_rate_limits;
create policy "ai_rate_limits service role all"
on public.ai_rate_limits for all
to service_role
using (true)
with check (true);
