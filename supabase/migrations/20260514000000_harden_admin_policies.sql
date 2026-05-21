alter table public.profiles
add column if not exists role text;

update public.profiles
set role = 'member'
where role is null;

alter table public.profiles
alter column role set default 'member';

alter table public.profiles
alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_role_check
    check (role in ('member', 'business', 'admin'));
  end if;
end $$;

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
    where user_id = check_user_id
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_admin(uuid) to service_role;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
    and old.role is distinct from new.role
    and not public.is_admin(auth.uid())
  then
    raise exception 'Only admins can change profile roles';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation on public.profiles;
create trigger prevent_profile_role_escalation
before update on public.profiles
for each row
execute function public.prevent_profile_role_escalation();

drop policy if exists "Authenticated users can insert businesses" on public.businesses;
drop policy if exists "Authenticated users can update businesses" on public.businesses;
drop policy if exists "Authenticated users can delete businesses" on public.businesses;

create policy "Admins can insert businesses"
on public.businesses for insert
with check (public.is_admin(auth.uid()));

create policy "Admins can update businesses"
on public.businesses for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can delete businesses"
on public.businesses for delete
using (public.is_admin(auth.uid()));

drop policy if exists "Authenticated users can manage deals" on public.business_deals;

create policy "Admins can manage deals"
on public.business_deals for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Admins can view all profiles'
  ) then
    create policy "Admins can view all profiles"
    on public.profiles for select
    using (public.is_admin(auth.uid()));
  end if;
end $$;
