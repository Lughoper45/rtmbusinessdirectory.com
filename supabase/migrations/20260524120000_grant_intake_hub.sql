-- Grant Intake Hub (Phase 1) — kajwpmyloxaqeciyndwf
-- Structured intake, readiness checks, service orders; extends grants catalog.

-- ---------------------------------------------------------------------------
-- Extend grants with structured requirements
-- ---------------------------------------------------------------------------

alter table public.grants add column if not exists required_fields jsonb not null default '[]'::jsonb;
alter table public.grants add column if not exists required_documents jsonb not null default '[]'::jsonb;

comment on column public.grants.required_fields is
  'Weighted intake field keys: [{ "key", "label", "required", "weight" }]';
comment on column public.grants.required_documents is
  'Weighted document types: [{ "key", "label", "required", "weight" }]';

-- Generic Canadian SME document set (customize per grant later)
update public.grants
set required_documents = '[
  {"key": "business_registration", "label": "Business registration or incorporation documents", "required": true, "weight": 2},
  {"key": "financial_statements", "label": "Recent financial statements (last 2 fiscal years)", "required": true, "weight": 2},
  {"key": "business_plan", "label": "Business plan or executive summary", "required": true, "weight": 1},
  {"key": "tax_returns", "label": "Corporate or personal tax returns (most recent)", "required": false, "weight": 1},
  {"key": "project_budget", "label": "Project budget and timeline", "required": false, "weight": 1},
  {"key": "owner_resume", "label": "Owner or key personnel resume", "required": false, "weight": 1}
]'::jsonb,
required_fields = '[
  {"key": "business_name", "label": "Legal business name", "required": true, "weight": 2},
  {"key": "legal_structure", "label": "Legal structure (incorporated, sole prop, etc.)", "required": true, "weight": 1},
  {"key": "province", "label": "Primary province of operation", "required": true, "weight": 2},
  {"key": "industry", "label": "Industry or sector", "required": true, "weight": 1},
  {"key": "employee_count", "label": "Number of employees", "required": true, "weight": 1},
  {"key": "revenue_range", "label": "Annual revenue range", "required": true, "weight": 1},
  {"key": "project_summary", "label": "Project or funding purpose summary", "required": true, "weight": 2},
  {"key": "funding_amount_requested", "label": "Funding amount requested", "required": false, "weight": 1}
]'::jsonb
where is_active = true
  and (required_documents = '[]'::jsonb or required_documents is null);

-- ---------------------------------------------------------------------------
-- grant_service_orders (before grant_intakes — FK from intakes)
-- ---------------------------------------------------------------------------

create table if not exists public.grant_service_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  package_id text not null,
  intake_id uuid,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_cents int not null default 0 check (amount_cents >= 0),
  currency text not null default 'cad',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grant_service_orders_status_check
    check (status in ('pending', 'paid', 'fulfilled', 'refunded', 'cancelled')),
  constraint grant_service_orders_package_id_check
    check (package_id in (
      'maple-checklist',
      'true-north-standard',
      'provincial-bridge',
      'northern-star'
    ))
);

comment on table public.grant_service_orders is
  'Paid RTM grant advisor packages; links Stripe checkout to grant intakes.';

create index if not exists grant_service_orders_user_id_idx
  on public.grant_service_orders (user_id);

create index if not exists grant_service_orders_status_idx
  on public.grant_service_orders (status);

-- ---------------------------------------------------------------------------
-- grant_intakes
-- ---------------------------------------------------------------------------

create table if not exists public.grant_intakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  grant_id text not null references public.grants (id) on delete restrict,
  package_id text,
  service_order_id uuid references public.grant_service_orders (id) on delete set null,
  status text not null default 'draft',
  readiness_score int not null default 0 check (readiness_score >= 0 and readiness_score <= 100),
  readiness_status text not null default 'not_ready',
  advisor_notes text,
  source text not null default 'grants_workspace',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grant_intakes_status_check
    check (status in (
      'draft',
      'collecting',
      'ready_for_review',
      'with_advisor',
      'submitted_externally',
      'closed'
    )),
  constraint grant_intakes_readiness_status_check
    check (readiness_status in (
      'not_ready',
      'partially_ready',
      'mostly_ready',
      'ready'
    )),
  constraint grant_intakes_package_id_check
    check (
      package_id is null
      or package_id in (
        'maple-checklist',
        'true-north-standard',
        'provincial-bridge',
        'northern-star'
      )
    )
);

comment on table public.grant_intakes is
  'Per-user grant application intake; drives readiness scoring and advisor queue.';

create index if not exists grant_intakes_user_id_idx
  on public.grant_intakes (user_id);

create index if not exists grant_intakes_grant_id_idx
  on public.grant_intakes (grant_id);

create index if not exists grant_intakes_status_idx
  on public.grant_intakes (status);

create unique index if not exists grant_intakes_open_user_grant_uidx
  on public.grant_intakes (user_id, grant_id)
  where status not in ('closed', 'submitted_externally');

-- ---------------------------------------------------------------------------
-- grant_intake_answers
-- ---------------------------------------------------------------------------

create table if not exists public.grant_intake_answers (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.grant_intakes (id) on delete cascade,
  field_key text not null,
  value jsonb not null default 'null'::jsonb,
  source text not null default 'user_input',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grant_intake_answers_source_check
    check (source in ('profile', 'user_input', 'ai_suggested', 'advisor')),
  unique (intake_id, field_key)
);

create index if not exists grant_intake_answers_intake_id_idx
  on public.grant_intake_answers (intake_id);

-- ---------------------------------------------------------------------------
-- grant_documents
-- ---------------------------------------------------------------------------

create table if not exists public.grant_documents (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.grant_intakes (id) on delete cascade,
  user_id uuid not null,
  document_type text not null,
  storage_path text,
  file_name text,
  mime_type text,
  status text not null default 'missing',
  uploaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grant_documents_status_check
    check (status in ('missing', 'uploaded', 'verified', 'rejected'))
);

create index if not exists grant_documents_intake_id_idx
  on public.grant_documents (intake_id);

create index if not exists grant_documents_user_id_idx
  on public.grant_documents (user_id);

create unique index if not exists grant_documents_intake_type_uidx
  on public.grant_documents (intake_id, document_type);

-- ---------------------------------------------------------------------------
-- grant_readiness_checks
-- ---------------------------------------------------------------------------

create table if not exists public.grant_readiness_checks (
  id uuid primary key default gen_random_uuid(),
  intake_id uuid not null references public.grant_intakes (id) on delete cascade,
  check_type text not null default 'rules',
  score int not null check (score >= 0 and score <= 100),
  status text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint grant_readiness_checks_type_check
    check (check_type in ('rules', 'ai')),
  constraint grant_readiness_checks_status_check
    check (status in ('not_ready', 'partially_ready', 'mostly_ready', 'ready'))
);

create index if not exists grant_readiness_checks_intake_id_idx
  on public.grant_readiness_checks (intake_id, created_at desc);

-- ---------------------------------------------------------------------------
-- FK grant_service_orders.intake_id (deferred until grant_intakes exists)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'grant_service_orders_intake_id_fkey'
  ) then
    alter table public.grant_service_orders
      add constraint grant_service_orders_intake_id_fkey
      foreign key (intake_id) references public.grant_intakes (id) on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

drop trigger if exists grant_service_orders_updated_at on public.grant_service_orders;
create trigger grant_service_orders_updated_at
before update on public.grant_service_orders
for each row
execute function public.update_updated_at_column();

drop trigger if exists grant_intakes_updated_at on public.grant_intakes;
create trigger grant_intakes_updated_at
before update on public.grant_intakes
for each row
execute function public.update_updated_at_column();

drop trigger if exists grant_intake_answers_updated_at on public.grant_intake_answers;
create trigger grant_intake_answers_updated_at
before update on public.grant_intake_answers
for each row
execute function public.update_updated_at_column();

drop trigger if exists grant_documents_updated_at on public.grant_documents;
create trigger grant_documents_updated_at
before update on public.grant_documents
for each row
execute function public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.grant_service_orders enable row level security;
alter table public.grant_intakes enable row level security;
alter table public.grant_intake_answers enable row level security;
alter table public.grant_documents enable row level security;
alter table public.grant_readiness_checks enable row level security;

-- grant_service_orders
drop policy if exists "grant_service_orders service role all" on public.grant_service_orders;
create policy "grant_service_orders service role all"
on public.grant_service_orders for all
to service_role
using (true)
with check (true);

drop policy if exists "Users read own grant service orders" on public.grant_service_orders;
create policy "Users read own grant service orders"
on public.grant_service_orders for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins manage grant service orders" on public.grant_service_orders;
create policy "Admins manage grant service orders"
on public.grant_service_orders for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- grant_intakes
drop policy if exists "grant_intakes service role all" on public.grant_intakes;
create policy "grant_intakes service role all"
on public.grant_intakes for all
to service_role
using (true)
with check (true);

drop policy if exists "Users manage own grant intakes" on public.grant_intakes;
create policy "Users manage own grant intakes"
on public.grant_intakes for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins manage all grant intakes" on public.grant_intakes;
create policy "Admins manage all grant intakes"
on public.grant_intakes for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- grant_intake_answers (via intake ownership)
drop policy if exists "grant_intake_answers service role all" on public.grant_intake_answers;
create policy "grant_intake_answers service role all"
on public.grant_intake_answers for all
to service_role
using (true)
with check (true);

drop policy if exists "Users manage own intake answers" on public.grant_intake_answers;
create policy "Users manage own intake answers"
on public.grant_intake_answers for all
to authenticated
using (
  exists (
    select 1 from public.grant_intakes gi
    where gi.id = intake_id and gi.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.grant_intakes gi
    where gi.id = intake_id and gi.user_id = auth.uid()
  )
);

drop policy if exists "Admins manage all intake answers" on public.grant_intake_answers;
create policy "Admins manage all intake answers"
on public.grant_intake_answers for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- grant_documents
drop policy if exists "grant_documents service role all" on public.grant_documents;
create policy "grant_documents service role all"
on public.grant_documents for all
to service_role
using (true)
with check (true);

drop policy if exists "Users manage own grant documents" on public.grant_documents;
create policy "Users manage own grant documents"
on public.grant_documents for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins manage all grant documents" on public.grant_documents;
create policy "Admins manage all grant documents"
on public.grant_documents for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- grant_readiness_checks (read-only for users; insert via edge/service)
drop policy if exists "grant_readiness_checks service role all" on public.grant_readiness_checks;
create policy "grant_readiness_checks service role all"
on public.grant_readiness_checks for all
to service_role
using (true)
with check (true);

drop policy if exists "Users read own readiness checks" on public.grant_readiness_checks;
create policy "Users read own readiness checks"
on public.grant_readiness_checks for select
to authenticated
using (
  exists (
    select 1 from public.grant_intakes gi
    where gi.id = intake_id and gi.user_id = auth.uid()
  )
);

drop policy if exists "Admins read all readiness checks" on public.grant_readiness_checks;
create policy "Admins read all readiness checks"
on public.grant_readiness_checks for select
to authenticated
using (public.is_admin(auth.uid()));
