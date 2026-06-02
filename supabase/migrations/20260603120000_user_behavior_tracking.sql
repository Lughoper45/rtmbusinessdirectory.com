-- Sprint A: behavioral intelligence — event stream + rolling session state
-- Project: kajwpmyloxaqeciyndwf

create table if not exists public.user_behavior_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  page_path text,
  element_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ube_session_created
  on public.user_behavior_events (session_id, created_at desc);

create index if not exists idx_ube_event_type_created
  on public.user_behavior_events (event_type, created_at desc);

create index if not exists idx_ube_page_path_created
  on public.user_behavior_events (page_path, created_at desc);

create index if not exists idx_ube_user_created
  on public.user_behavior_events (user_id, created_at desc)
  where user_id is not null;

comment on table public.user_behavior_events is
  'Append-only client behavior events (heatmap + confusion signals). Writes via behavior-ingest edge fn.';

create table if not exists public.user_sessions (
  session_id text primary key,
  user_id uuid references auth.users (id) on delete set null,
  started_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  page_history jsonb not null default '[]'::jsonb,
  current_page text,
  grant_ids_viewed jsonb not null default '[]'::jsonb,
  profile_builder_step int not null default 0,
  membership_status text,
  profile_completion_pct int not null default 0,
  confusion_score int not null default 0,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_user_sessions_last_active
  on public.user_sessions (last_active_at desc);

create index if not exists idx_user_sessions_user
  on public.user_sessions (user_id, last_active_at desc)
  where user_id is not null;

comment on table public.user_sessions is
  'One row per browser session; upserted by behavior-ingest with rolling confusion_score.';

create table if not exists public.trigger_fires (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  rule_id text not null,
  page_path text,
  message text,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_trigger_fires_session_rule
  on public.trigger_fires (session_id, rule_id);

comment on table public.trigger_fires is
  'Proactive LaunchBot trigger dedup log (Sprint B).';

-- Service-role only (edge function). No client RLS policies.
alter table public.user_behavior_events enable row level security;
alter table public.user_sessions enable row level security;
alter table public.trigger_fires enable row level security;

-- Admin read for future dashboard (Sprint D)
create policy "Admins read behavior events"
  on public.user_behavior_events
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admins read user sessions"
  on public.user_sessions
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

create policy "Admins read trigger fires"
  on public.trigger_fires
  for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- Heatmap aggregates (admin dashboard Sprint D)
create or replace view public.behavior_page_funnel as
select
  page_path,
  count(*) filter (where event_type = 'page_view') as page_views,
  count(distinct session_id) filter (where event_type = 'page_view') as unique_sessions,
  count(*) filter (where event_type = 'auth_abandoned') as auth_abandons,
  count(*) filter (where event_type = 'modal_dismissed') as modal_dismissals,
  count(*) filter (where event_type = 'rage_click') as rage_clicks
from public.user_behavior_events
where page_path is not null
  and created_at > now() - interval '30 days'
group by page_path
order by page_views desc;

create or replace view public.behavior_builder_dropoff as
select
  (metadata->>'step')::int as step,
  metadata->>'field' as field,
  count(distinct session_id) as sessions_reached,
  count(*) filter (where event_type = 'profile_builder_step') as step_events
from public.user_behavior_events
where event_type = 'profile_builder_step'
  and created_at > now() - interval '30 days'
group by 1, 2
order by 1;
