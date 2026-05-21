-- Admin membership monitoring (self-contained: creates is_admin if missing).

-- Role column (directory admin UI)
alter table public.profiles add column if not exists role text;

update public.profiles
set role = coalesce(role, 'member')
where role is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_role_check
    check (role in ('member', 'business', 'admin'));
  end if;
exception
  when others then null;
end $$;

-- Membership columns (membership app signups)
alter table public.profiles add column if not exists membership_status text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists joined_at timestamptz;
alter table public.profiles add column if not exists user_id uuid;

-- Works for directory profiles (user_id) and membership profiles (id = auth uid)
create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where (
      user_id = check_user_id
      or id = check_user_id
    )
    and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to service_role;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
on public.profiles for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'membership_payments'
  ) then
    execute 'alter table public.membership_payments enable row level security';
    execute 'drop policy if exists "Admins can view membership payments" on public.membership_payments';
    execute '' ||
      'create policy "Admins can view membership payments" ' ||
      'on public.membership_payments for select to authenticated ' ||
      'using (public.is_admin(auth.uid()))';
  end if;

  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'referrals'
  ) then
    execute 'alter table public.referrals enable row level security';
    execute 'drop policy if exists "Admins can view referrals" on public.referrals';
    execute '' ||
      'create policy "Admins can view referrals" ' ||
      'on public.referrals for select to authenticated ' ||
      'using (public.is_admin(auth.uid()))';
  end if;
end $$;
