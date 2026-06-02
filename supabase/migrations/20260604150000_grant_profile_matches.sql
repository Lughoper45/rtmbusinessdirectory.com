-- Per-user grant matches (true personalization for S2/S5 UI/email)
-- Computes a user-specific score based on grant profile (province/sector) + global match_score.

create table if not exists public.grant_profile_matches (
  user_id uuid not null references auth.users(id) on delete cascade,
  grant_id text not null references public.grants(id) on delete cascade,
  score int not null check (score >= 0 and score <= 100),
  reasons jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  primary key (user_id, grant_id)
);

create index if not exists grant_profile_matches_user_score_idx
  on public.grant_profile_matches (user_id, score desc);

alter table public.grant_profile_matches enable row level security;

drop policy if exists "grant_profile_matches service role all" on public.grant_profile_matches;
create policy "grant_profile_matches service role all"
on public.grant_profile_matches for all
to service_role
using (true)
with check (true);

drop policy if exists "Users read own grant matches" on public.grant_profile_matches;
create policy "Users read own grant matches"
on public.grant_profile_matches for select
to authenticated
using (auth.uid() = user_id);

-- Refresh user matches. Uses best-effort JSON extraction from grant_profiles.profile.
create or replace function public.refresh_grant_profile_matches(p_user_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile jsonb;
  v_province text;
  v_sector text;
  v_count int := 0;
begin
  select gp.profile into v_profile
  from public.grant_profiles gp
  where gp.user_id = p_user_id;

  if v_profile is null then
    return 0;
  end if;

  -- Accept several naming conventions (stellar profile is JSON).
  v_province := nullif(trim(coalesce(
    v_profile->>'province',
    v_profile->>'province_code',
    v_profile->>'location',
    ''
  )), '');

  v_sector := nullif(trim(coalesce(
    v_profile->>'sector',
    v_profile->>'industry',
    ''
  )), '');

  with scored as (
    select
      g.id as grant_id,
      greatest(
        0,
        least(
          100,
          coalesce(g.match_score, 0)
          + case
              when v_province is not null
               and (g.provinces && array[v_province]::text[] or g.provinces && array['All Canada']::text[])
              then 10 else 0 end
          + case when v_sector is not null and g.sectors && array[v_sector]::text[] then 10 else 0 end
        )
      )::int as score,
      jsonb_build_object(
        'province', v_province,
        'sector', v_sector,
        'base_match_score', coalesce(g.match_score, 0),
        'province_overlap', (v_province is not null and (g.provinces && array[v_province]::text[] or g.provinces && array['All Canada']::text[])),
        'sector_overlap', (v_sector is not null and g.sectors && array[v_sector]::text[])
      ) as reasons
    from public.grants g
    where g.is_active = true
  )
  insert into public.grant_profile_matches (user_id, grant_id, score, reasons, computed_at)
  select p_user_id, s.grant_id, s.score, s.reasons, now()
  from scored s
  on conflict (user_id, grant_id) do update set
    score = excluded.score,
    reasons = excluded.reasons,
    computed_at = excluded.computed_at;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.refresh_grant_profile_matches(uuid) from public;
grant execute on function public.refresh_grant_profile_matches(uuid) to service_role;

-- Recompute after any grant_profile update.
create or replace function public.grant_profiles_refresh_matches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_grant_profile_matches(new.user_id);
  return new;
end;
$$;

drop trigger if exists grant_profiles_refresh_matches on public.grant_profiles;
create trigger grant_profiles_refresh_matches
after insert or update of profile on public.grant_profiles
for each row
execute function public.grant_profiles_refresh_matches();

