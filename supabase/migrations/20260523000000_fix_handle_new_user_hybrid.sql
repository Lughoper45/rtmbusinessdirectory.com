-- Fix auth signup on kajwp hybrid schema (directory user_id + membership columns).
-- Root cause: membership handle_new_user inserted id/email/referral_code but omitted
-- legacy NOT NULL user_id (and sometimes role / referral_code on directory-only rows).

create extension if not exists pgcrypto;

-- Membership columns (safe if already applied via 20260522000000)
alter table public.profiles add column if not exists membership_status text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists referral_code text;
alter table public.profiles add column if not exists referred_by uuid;
alter table public.profiles add column if not exists joined_at timestamptz;
alter table public.profiles add column if not exists user_id uuid;
alter table public.profiles add column if not exists role text;

update public.profiles set role = coalesce(role, 'member') where role is null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    alter table public.profiles alter column role set default 'member';
  end if;
exception when others then null;
end $$;

-- Allow membership-style rows (id = auth uid) without forcing legacy user_id
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'user_id'
      and is_nullable = 'NO'
  ) then
    alter table public.profiles alter column user_id drop not null;
  end if;
end $$;

create or replace function public.gen_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  code text;
begin
  loop
    code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
    exit when not exists (
      select 1 from public.profiles where referral_code = code
    );
  end loop;
  return code;
end;
$$;

revoke execute on function public.gen_referral_code() from public, anon, authenticated;
grant execute on function public.gen_referral_code() to service_role;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ref_code text;
  ref_id uuid;
  existing_id uuid;
  display text;
  full_name_val text;
  has_membership boolean;
  has_user_id boolean;
  has_referral_code boolean;
  has_referred_by boolean;
  has_role boolean;
  has_full_name boolean;
  has_display_name boolean;
begin
  display := coalesce(
    nullif(trim(new.raw_user_meta_data->>'display_name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
  full_name_val := coalesce(
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    display
  );

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'membership_status'
  ) into has_membership;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'user_id'
  ) into has_user_id;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'referral_code'
  ) into has_referral_code;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) into has_role;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'full_name'
  ) into has_full_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'display_name'
  ) into has_display_name;

  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'referred_by'
  ) into has_referred_by;

  ref_code := nullif(trim(new.raw_user_meta_data->>'referral_code'), '');
  if ref_code is not null and has_referral_code then
    select id into ref_id
    from public.profiles
    where referral_code = upper(ref_code)
    limit 1;
  end if;

  if has_user_id then
    select id into existing_id from public.profiles where user_id = new.id limit 1;
  end if;

  if existing_id is null then
    select id into existing_id from public.profiles where id = new.id limit 1;
  end if;

  if existing_id is not null then
    update public.profiles p
    set
      email = coalesce(new.email, p.email),
      display_name = case when has_display_name then coalesce(display, p.display_name) else p.display_name end,
      full_name = case when has_full_name then coalesce(full_name_val, p.full_name) else p.full_name end,
      referred_by = coalesce(p.referred_by, ref_id),
      membership_status = case
        when has_membership then coalesce(p.membership_status, 'pending_payment')
        else p.membership_status
      end,
      referral_code = case
        when has_referral_code and (p.referral_code is null or p.referral_code = '')
          then public.gen_referral_code()
        else p.referral_code
      end,
      role = case when has_role then coalesce(p.role, 'member') else p.role end,
      user_id = case when has_user_id then coalesce(p.user_id, new.id) else p.user_id end
    where p.id = existing_id;

    return new;
  end if;

  if has_membership or has_referral_code then
    if has_full_name and has_display_name then
      insert into public.profiles (
        id, user_id, email, display_name, full_name, referral_code, referred_by, membership_status, role
      )
      values (
        new.id,
        case when has_user_id then new.id else null end,
        new.email,
        display,
        full_name_val,
        case when has_referral_code then public.gen_referral_code() else null end,
        case when has_referred_by then ref_id else null end,
        'pending_payment',
        case when has_role then 'member' else null end
      );
    elsif has_display_name then
      insert into public.profiles (
        id, user_id, email, display_name, referral_code, referred_by, membership_status, role
      )
      values (
        new.id,
        case when has_user_id then new.id else null end,
        new.email,
        display,
        case when has_referral_code then public.gen_referral_code() else null end,
        case when has_referred_by then ref_id else null end,
        'pending_payment',
        case when has_role then 'member' else null end
      );
    else
      insert into public.profiles (
        id, user_id, email, referral_code, referred_by, membership_status, role
      )
      values (
        new.id,
        case when has_user_id then new.id else null end,
        new.email,
        case when has_referral_code then public.gen_referral_code() else null end,
        case when has_referred_by then ref_id else null end,
        'pending_payment',
        case when has_role then 'member' else null end
      );
    end if;
  elsif has_user_id then
    if has_full_name then
      insert into public.profiles (user_id, full_name, role)
      values (
        new.id,
        full_name_val,
        case when has_role then 'member' else null end
      );
    else
      insert into public.profiles (user_id, role)
      values (
        new.id,
        case when has_role then 'member' else null end
      );
    end if;
  end if;

  return new;
exception
  when unique_violation then
    update public.profiles p
    set
      email = coalesce(new.email, p.email),
      display_name = case when has_display_name then coalesce(display, p.display_name) else p.display_name end,
      membership_status = case
        when has_membership then coalesce(p.membership_status, 'pending_payment')
        else p.membership_status
      end,
      user_id = case when has_user_id then coalesce(p.user_id, new.id) else p.user_id end
    where p.id = new.id or (has_user_id and p.user_id = new.id);

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to service_role;
