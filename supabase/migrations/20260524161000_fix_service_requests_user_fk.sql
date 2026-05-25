-- Fix service_requests insert FK failures when client session uid does not exist
-- in this project's auth.users (e.g. legacy vinbf JWT, wrong Supabase project in .env).
-- Aligns with applications.user_id (platform uid, no auth.users FK).

alter table public.service_requests
  drop constraint if exists service_requests_user_id_fkey;

comment on column public.service_requests.user_id is
  'RTM platform auth uid (kajwp auth.users.id). Nullable; no FK — set from auth.uid() on insert when signed in.';

create or replace function public.service_requests_sync_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists service_requests_sync_user_id on public.service_requests;
create trigger service_requests_sync_user_id
  before insert on public.service_requests
  for each row
  execute function public.service_requests_sync_user_id();
