-- Optional A/B cohort flags for pricing tests (pricing_model §3.3, Phase 4)

alter table public.profiles
  add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.profiles.metadata is
  'Extensible flags, e.g. {"pricing_cohort":"passport_49"} for Option B tests';

create index if not exists profiles_metadata_gin_idx
  on public.profiles using gin (metadata);
