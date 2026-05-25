-- Shared GrantPilot schema for kajwpmyloxaqeciyndwf.
-- Kept idempotent because kajwp already has membership/directory tables.

create table if not exists public.grants (
  id text primary key,
  name text not null,
  organization text not null,
  amount numeric not null default 0,
  match_score int default 0,
  deadline_days int default 30,
  difficulty text,
  type text,
  requirements text[] default '{}',
  approval_rate int default 0,
  description text,
  official_url text,
  deadline_label text,
  sectors text[] default '{}',
  provinces text[] default '{}',
  is_active boolean not null default true,
  eligibility_summary text,
  application_steps text[] default '{}',
  funding_notes text,
  created_at timestamptz not null default now()
);

alter table public.grants add column if not exists official_url text;
alter table public.grants add column if not exists deadline_label text;
alter table public.grants add column if not exists sectors text[] default '{}';
alter table public.grants add column if not exists provinces text[] default '{}';
alter table public.grants add column if not exists is_active boolean not null default true;
alter table public.grants add column if not exists eligibility_summary text;
alter table public.grants add column if not exists application_steps text[] default '{}';
alter table public.grants add column if not exists funding_notes text;

alter table public.grants enable row level security;

drop policy if exists "grants public read" on public.grants;
create policy "grants public read"
on public.grants for select
using (true);

drop policy if exists "grants service role all" on public.grants;
create policy "grants service role all"
on public.grants for all
to service_role
using (true)
with check (true);

create index if not exists grants_active_name_idx
on public.grants (is_active, name)
where is_active = true;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  item_type text not null,
  item_id text not null,
  status text not null default 'submitted',
  notes text,
  data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.applications.user_id is
  'RTM platform user id (auth.users.id from kajwpmyloxaqeciyndwf)';

alter table public.applications enable row level security;

drop policy if exists "applications service role all" on public.applications;
create policy "applications service role all"
on public.applications for all
to service_role
using (true)
with check (true);

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
before update on public.applications
for each row
execute function public.update_updated_at_column();

create table if not exists public.grant_profiles (
  user_id uuid primary key,
  profile jsonb not null default '{}'::jsonb,
  completion_pct int not null default 40 check (completion_pct >= 0 and completion_pct <= 100),
  updated_at timestamptz not null default now()
);

comment on table public.grant_profiles is
  'Per-user grant matching profile; user_id is kajwp auth.users.id';

comment on column public.grant_profiles.user_id is
  'RTM platform user id (auth.users.id from kajwpmyloxaqeciyndwf)';

alter table public.grant_profiles enable row level security;

drop policy if exists "grant_profiles service role all" on public.grant_profiles;
create policy "grant_profiles service role all"
on public.grant_profiles for all
to service_role
using (true)
with check (true);

drop trigger if exists grant_profiles_updated_at on public.grant_profiles;
create trigger grant_profiles_updated_at
before update on public.grant_profiles
for each row
execute function public.update_updated_at_column();

insert into public.grants (
  id, name, organization, amount, match_score, deadline_days, difficulty, type,
  requirements, approval_rate, description, official_url, deadline_label, sectors,
  provinces, is_active, eligibility_summary, application_steps, funding_notes
) values
(
  'csbfp',
  'Canada Small Business Financing Program',
  'Innovation, Science and Economic Development Canada',
  1500000,
  82,
  90,
  'Medium',
  'Federal',
  array['Canadian for-profit SME', 'Revenues under $10M', 'Tangible asset financing need'],
  0,
  'Government-backed loans through financial institutions to help Canadian SMEs purchase equipment, commercial real estate, and leasehold improvements.',
  'https://ised-isde.canada.ca/site/canada-small-business-financing-program/en',
  'Ongoing - apply through your bank',
  array['General', 'Manufacturing', 'Retail', 'Services'],
  array['All Canada'],
  true,
  'For incorporated Canadian small businesses with gross annual revenues of $10 million or less.',
  array['Confirm eligibility with your bank', 'Prepare business plan and financial statements', 'Apply through a participating lender', 'Track lender decision timeline'],
  'This is a loan guarantee program, not a non-repayable grant. Terms depend on your financial institution.'
),
(
  'nrc-irap',
  'Industrial Research Assistance Program (IRAP)',
  'National Research Council of Canada',
  500000,
  78,
  60,
  'Hard',
  'Federal',
  array['Canadian incorporated SME', 'Innovation or R&D project', 'Technical staff on payroll'],
  0,
  'Advisory services and funding to accelerate R&D, commercialization, and technology adoption for innovative Canadian SMEs.',
  'https://nrc.canada.ca/en/support-technology-innovation/industrial-research-assistance-program-nrc-irap',
  'Rolling intake - advisor assessment required',
  array['Technology', 'Manufacturing', 'Clean Technology', 'Professional Services'],
  array['All Canada'],
  true,
  'Best suited to firms developing or adopting technology with measurable innovation outcomes.',
  array['Book IRAP advisory discussion', 'Define project scope and milestones', 'Submit funding request with advisor support', 'Report on project deliverables'],
  'Funding amount varies by project. IRAP advisors guide the application process.'
),
(
  'canexport-smes',
  'CanExport SMEs',
  'Canadian Trade Commissioner Service',
  50000,
  75,
  45,
  'Medium',
  'Federal',
  array['Incorporated or LLC in Canada', 'New export market focus', '1-499 FTE'],
  0,
  'Financial assistance for Canadian SMEs to develop new export markets through activities such as market research, trade shows, and market-entry planning.',
  'https://www.tradecommissioner.gc.ca/en/market-industry-info/export-ready/canexport-smes.html',
  'Check current intake windows on program page',
  array['Export', 'Manufacturing', 'Technology', 'Food & Beverage'],
  array['All Canada'],
  true,
  'Supports export-oriented SMEs expanding into international markets with eligible business development activities.',
  array['Review eligible activities and funding caps', 'Prepare export market plan', 'Submit through CanExport portal when intake is open', 'Keep receipts and activity reports'],
  'Program rules and reimbursement rates are updated by Global Affairs Canada.'
),
(
  'feddev-ontario-sme',
  'FedDev Ontario - Business Scale-up and Productivity',
  'Federal Economic Development Agency for Southern Ontario',
  250000,
  80,
  30,
  'Medium',
  'Federal',
  array['Ontario business', 'Growth or scale project', 'Measurable job or revenue outcomes'],
  0,
  'Southern Ontario SMEs can access repayable contributions for scale-up, productivity, and competitiveness projects.',
  'https://feddev-ontario.canada.ca/en/feddev-ontarios-southern-ontario-scaleup-and-productivity-fund',
  'Intake periods announced on FedDev Ontario site',
  array['Manufacturing', 'Technology', 'Professional Services', 'Food & Beverage'],
  array['Ontario'],
  true,
  'Business must operate in southern Ontario and demonstrate ability to execute the proposed project.',
  array['Confirm regional eligibility', 'Align project to fund priorities', 'Prepare budget and workplan', 'Apply when intake is open'],
  'Contribution is often repayable. Read current fund guidelines before applying.'
),
(
  'bdc-growth',
  'BDC Growth & Transition Capital',
  'Business Development Bank of Canada',
  500000,
  70,
  365,
  'Medium',
  'Federal',
  array['Canadian business', 'Growth, acquisition, or transition financing need'],
  0,
  'Flexible financing solutions for Canadian entrepreneurs pursuing growth, ownership transitions, and strategic projects.',
  'https://www.bdc.ca/en/financing',
  'Ongoing - speak with BDC account manager',
  array['General', 'Technology', 'Manufacturing', 'Retail'],
  array['All Canada'],
  true,
  'Ideal for established businesses with recurring revenue seeking expansion capital.',
  array['Prepare financial statements', 'Book BDC consultation', 'Submit financing request', 'Complete due diligence'],
  'This is financing, not a grant. Rates and structure depend on risk profile.'
),
(
  'wes-loan',
  'Women Entrepreneurship Loan Fund',
  'Women Entrepreneurship Strategy (Government of Canada)',
  50000,
  76,
  90,
  'Easy',
  'Federal',
  array['Women-owned or led business', 'Canadian business', 'Growth or working capital need'],
  0,
  'Microloans up to $50,000 for women entrepreneurs to start or scale businesses across Canada.',
  'https://women-entrepreneurship.strategy.canada.ca/en/women-entrepreneurship-loan-fund',
  'Ongoing through participating organizations',
  array['General', 'Retail', 'Professional Services', 'Food & Beverage'],
  array['All Canada'],
  true,
  'Applicants must meet women ownership or leadership criteria defined by participating lenders.',
  array['Confirm participating lender in your region', 'Prepare business overview', 'Submit loan application', 'Use funds per approved plan'],
  'Delivered through third-party organizations; terms vary by lender.'
),
(
  'toronto-small-business',
  'City of Toronto - Small Business Property Tax & Utility Relief',
  'City of Toronto',
  10000,
  68,
  21,
  'Easy',
  'Municipal',
  array['Toronto business location', 'Eligible property tax or utility costs', 'Active business license'],
  0,
  'Programs may provide relief or incentives for qualifying Toronto small businesses facing property tax and utility pressures.',
  'https://www.toronto.ca/business-economy/business-operation-growth/city-support-for-business/',
  'See City of Toronto business support page for open programs',
  array['Retail', 'Food & Beverage', 'Professional Services'],
  array['Ontario'],
  true,
  'Must maintain a Toronto business address and meet program-specific criteria when applications open.',
  array['Review open City programs', 'Gather tax and utility statements', 'Submit when application window is active'],
  'Municipal programs change frequently - always verify on the official City site.'
),
(
  'ai-horizons',
  'AI Horizons Canada - Compute Access Fund',
  'Government of Canada (ISED)',
  2000000,
  72,
  120,
  'Hard',
  'Federal',
  array['Canadian organization', 'AI adoption or development project', 'Eligible compute use case'],
  0,
  'Supports access to compute resources for Canadian organizations undertaking artificial intelligence innovation projects.',
  'https://ised-isde.canada.ca/site/ai-horizons-canada/en/ai-horizons-canada-compute-access-fund',
  'Check program page for application cycles',
  array['Technology', 'Professional Services', 'Healthcare'],
  array['All Canada'],
  true,
  'Focused on AI workloads with defined technical milestones and eligible compute providers.',
  array['Define AI project scope', 'Estimate compute requirements', 'Apply during open intake', 'Track reporting obligations'],
  'Highly competitive. Review technical eligibility before investing application time.'
)
on conflict (id) do update set
  name = excluded.name,
  organization = excluded.organization,
  amount = excluded.amount,
  match_score = excluded.match_score,
  deadline_days = excluded.deadline_days,
  difficulty = excluded.difficulty,
  type = excluded.type,
  requirements = excluded.requirements,
  approval_rate = excluded.approval_rate,
  description = excluded.description,
  official_url = excluded.official_url,
  deadline_label = excluded.deadline_label,
  sectors = excluded.sectors,
  provinces = excluded.provinces,
  is_active = excluded.is_active,
  eligibility_summary = excluded.eligibility_summary,
  application_steps = excluded.application_steps,
  funding_notes = excluded.funding_notes;
