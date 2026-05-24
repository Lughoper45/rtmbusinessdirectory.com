-- World Cup / grants service intake form (kajwpmyloxaqeciyndwf).
-- Idempotent: safe if stellar vinbf-era migrations were never applied on kajwp.

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  service_type text not null,
  full_name text not null,
  email text not null,
  phone text,
  company text,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table public.service_requests enable row level security;

drop policy if exists "service_requests owner read" on public.service_requests;
create policy "service_requests owner read"
on public.service_requests for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists "service_requests anyone insert" on public.service_requests;
drop policy if exists "service_requests valid insert" on public.service_requests;
create policy "service_requests valid insert"
on public.service_requests for insert
with check (length(trim(full_name)) > 0 and length(trim(email)) > 3);

drop policy if exists "service_requests admin update" on public.service_requests;
create policy "service_requests admin update"
on public.service_requests for update
using (public.is_admin(auth.uid()));

create index if not exists service_requests_created_at_idx
on public.service_requests (created_at desc);

create index if not exists service_requests_status_idx
on public.service_requests (status);
