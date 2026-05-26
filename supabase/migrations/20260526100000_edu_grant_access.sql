-- Education grant access — links RTM members to govgranteducation.ca

create table if not exists public.edu_grant_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status text not null default 'pending',
  webhook_status text not null default 'pending',
  webhook_response jsonb,
  access_token text,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint edu_grant_access_status_check
    check (status in ('pending', 'active', 'expired')),
  constraint edu_grant_access_webhook_check
    check (webhook_status in ('pending', 'sent', 'failed'))
);

create unique index if not exists edu_grant_access_email_idx on public.edu_grant_access (lower(email));
create index if not exists edu_grant_access_user_id_idx on public.edu_grant_access (user_id);

create or replace function public.set_edu_grant_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists edu_grant_access_updated_at on public.edu_grant_access;
create trigger edu_grant_access_updated_at
before update on public.edu_grant_access
for each row execute function public.set_edu_grant_updated_at();

alter table public.edu_grant_access enable row level security;

drop policy if exists "Users read own edu grant access" on public.edu_grant_access;
create policy "Users read own edu grant access"
on public.edu_grant_access for select
using (auth.uid() = user_id);

drop policy if exists "Admins manage edu grant access" on public.edu_grant_access;
create policy "Admins manage edu grant access"
on public.edu_grant_access for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
