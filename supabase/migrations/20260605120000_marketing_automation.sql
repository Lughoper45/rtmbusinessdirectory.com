-- RTM Marketing Automation: imports, sequences, templates, sends, engagement tracking

-- ─── Editable templates (admin UI) ─────────────────────────────────────────
create table if not exists public.marketing_email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null unique,
  name text not null,
  audience_type text not null default 'directory_owner',
  subject text not null,
  html_body text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_email_templates_audience_check check (
    audience_type in (
      'directory_owner',
      'deal_partner_prospect',
      'grant_seeker',
      'member_prospect',
      'dual'
    )
  )
);

-- ─── Sequences (ordered steps referencing templates) ───────────────────────
create table if not exists public.marketing_sequences (
  id uuid primary key default gen_random_uuid(),
  sequence_key text not null unique,
  name text not null,
  audience_type text not null default 'directory_owner',
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_sequence_steps (
  id uuid primary key default gen_random_uuid(),
  sequence_id uuid not null references public.marketing_sequences(id) on delete cascade,
  step_index integer not null,
  delay_hours integer not null default 0,
  template_key text not null references public.marketing_email_templates(template_key),
  subject_override text,
  created_at timestamptz not null default now(),
  unique (sequence_id, step_index)
);

create index if not exists marketing_sequence_steps_seq_idx
  on public.marketing_sequence_steps (sequence_id, step_index);

-- ─── Campaigns (automated send via ops-dispatcher) ─────────────────────────
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sequence_id uuid not null references public.marketing_sequences(id),
  status text not null default 'draft',
  send_mode text not null default 'automated',
  daily_send_cap integer not null default 50,
  only_valid_emails boolean not null default true,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_campaigns_status_check check (
    status in ('draft', 'running', 'paused', 'completed')
  ),
  constraint marketing_campaigns_send_mode_check check (
    send_mode in ('automated', 'manual_review')
  )
);

-- ─── Import batches & prospects ────────────────────────────────────────────
create table if not exists public.marketing_import_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source text not null default 'paste',
  row_count integer not null default 0,
  valid_count integer not null default 0,
  status text not null default 'processing',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint marketing_import_batches_source_check check (
    source in ('paste', 'csv', 'directory')
  ),
  constraint marketing_import_batches_status_check check (
    status in ('processing', 'ready', 'failed')
  )
);

create table if not exists public.marketing_prospects (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.marketing_import_batches(id) on delete set null,
  email text not null,
  contact_name text,
  business_name text,
  phone text,
  city text,
  province text,
  category text,
  website text,
  audience_type text not null default 'deal_partner_prospect',
  casl_basis text default 'manual_verified',
  email_status text not null default 'pending',
  email_status_detail text,
  validated_at timestamptz,
  business_id text references public.businesses(business_id) on delete set null,
  crm_contact_id uuid references public.crm_contacts(id) on delete set null,
  status text not null default 'imported',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint marketing_prospects_email_status_check check (
    email_status in (
      'pending',
      'valid',
      'invalid_syntax',
      'disposable',
      'no_mx',
      'role_account',
      'duplicate',
      'suppressed'
    )
  ),
  constraint marketing_prospects_status_check check (
    status in (
      'imported',
      'validated',
      'enrolled',
      'completed',
      'bounced',
      'unsubscribed'
    )
  )
);

alter table public.marketing_prospects
  add constraint marketing_prospects_email_unique unique (email);
create index if not exists marketing_prospects_batch_idx on public.marketing_prospects (batch_id);
create index if not exists marketing_prospects_email_status_idx on public.marketing_prospects (email_status);

-- ─── Enrollments & per-message send log (opens/clicks via webhook) ───────────
create table if not exists public.marketing_campaign_enrollments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  prospect_id uuid not null references public.marketing_prospects(id) on delete cascade,
  current_step integer not null default 0,
  next_send_at timestamptz,
  completed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, prospect_id)
);

create index if not exists marketing_enrollments_next_send_idx
  on public.marketing_campaign_enrollments (campaign_id, next_send_at)
  where completed_at is null and unsubscribed_at is null;

create table if not exists public.marketing_sends (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.marketing_campaign_enrollments(id) on delete cascade,
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  prospect_id uuid not null references public.marketing_prospects(id) on delete cascade,
  step_index integer not null,
  template_key text not null,
  email text not null,
  subject text not null,
  resend_message_id text,
  status text not null default 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  open_count integer not null default 0,
  click_count integer not null default 0,
  last_event_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  constraint marketing_sends_status_check check (
    status in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')
  )
);

create index if not exists marketing_sends_resend_id_idx
  on public.marketing_sends (resend_message_id)
  where resend_message_id is not null;
create index if not exists marketing_sends_campaign_idx
  on public.marketing_sends (campaign_id, sent_at desc);

-- ─── updated_at triggers ───────────────────────────────────────────────────
do $$ declare t text;
begin
  foreach t in array array[
    'marketing_email_templates',
    'marketing_sequences',
    'marketing_campaigns',
    'marketing_prospects',
    'marketing_campaign_enrollments'
  ] loop
    execute format('drop trigger if exists %I_updated_at on public.%I', t, t);
    execute format(
      'create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end $$;

-- ─── RLS (admin + service role) ────────────────────────────────────────────
alter table public.marketing_email_templates enable row level security;
alter table public.marketing_sequences enable row level security;
alter table public.marketing_sequence_steps enable row level security;
alter table public.marketing_campaigns enable row level security;
alter table public.marketing_import_batches enable row level security;
alter table public.marketing_prospects enable row level security;
alter table public.marketing_campaign_enrollments enable row level security;
alter table public.marketing_sends enable row level security;

do $$ declare t text;
begin
  foreach t in array array[
    'marketing_email_templates',
    'marketing_sequences',
    'marketing_sequence_steps',
    'marketing_campaigns',
    'marketing_import_batches',
    'marketing_prospects',
    'marketing_campaign_enrollments',
    'marketing_sends'
  ] loop
    execute format('drop policy if exists "Admins manage %I" on public.%I', t, t);
    execute format(
      'create policy "Admins manage %I" on public.%I for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))',
      t, t
    );
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- ─── Seed default templates & sequence (editable in admin) ─────────────────
insert into public.marketing_email_templates (template_key, name, audience_type, subject, html_body, description)
values
  (
    'deal_partner_intro',
    'Deal partner — introduction',
    'deal_partner_prospect',
    'RTM member deals in {{city}} — list your business',
    '<div style="font-family:sans-serif;max-width:560px;color:#111"><p>Hi{{contact_name_greeting}},</p><p><strong>{{business_name}}</strong> can reach RTM members in {{city}}, {{province}} who actively look for local offers.</p><p>RTM is Canada''s business directory with a <strong>member discount program</strong>: businesses list a real offer (typically 10–20% off), and members redeem through the RTM network.</p><p><strong>It''s free to start</strong> — claim your listing and add your first member deal in minutes.</p><p><a href="{{partner_url}}" style="display:inline-block;background:#c41e3a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">List your business &amp; first deal</a></p><p style="font-size:12px;color:#666">RTM Global Canada · Toronto, ON · <a href="{{unsubscribe_url}}">Unsubscribe</a></p></div>',
    'Automated intro for imported Canadian businesses — discount program'
  ),
  (
    'deal_partner_followup',
    'Deal partner — follow-up',
    'deal_partner_prospect',
    'Quick reminder: add one member offer for {{business_name}}',
    '<div style="font-family:sans-serif;max-width:560px;color:#111"><p>Hi{{contact_name_greeting}},</p><p>Members in {{city}} browse RTM for savings before they shop. A single clear offer (e.g. <strong>15% off</strong> for RTM members) is enough to get started.</p><p><a href="{{partner_url}}" style="display:inline-block;background:#c41e3a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Add your member deal</a></p><p style="font-size:12px;color:#666"><a href="{{unsubscribe_url}}">Unsubscribe</a></p></div>',
    'Step 2 — nudge to publish first deal'
  ),
  (
    'directory_claim_intro',
    'Directory — claim listing',
    'directory_owner',
    'Is this your business? {{business_name}} on RTM',
    '<div style="font-family:sans-serif;max-width:560px;color:#111"><p>Hi{{contact_name_greeting}},</p><p>We listed <strong>{{business_name}}</strong> on the RTM Canadian business directory ({{city}}, {{province}}).</p><p>Claim your profile to update hours, photos, and <strong>member deals</strong> — and connect with grant guidance used by Canadian SMEs.</p><p><a href="{{claim_url}}" style="display:inline-block;background:#c41e3a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Claim your listing</a></p><p style="font-size:12px;color:#666"><a href="{{unsubscribe_url}}">Unsubscribe</a></p></div>',
    'Claim invite for directory owners'
  )
on conflict (template_key) do nothing;

insert into public.marketing_sequences (sequence_key, name, audience_type, description)
values (
  'deal_partner_onboarding',
  'Deal partner onboarding (automated)',
  'deal_partner_prospect',
  'Intro + follow-up for businesses invited to list member discounts'
)
on conflict (sequence_key) do nothing;

insert into public.marketing_sequence_steps (sequence_id, step_index, delay_hours, template_key)
select s.id, v.step_index, v.delay_hours, v.template_key
from public.marketing_sequences s
cross join (
  values
    (0, 0, 'deal_partner_intro'),
    (1, 96, 'deal_partner_followup')
) as v(step_index, delay_hours, template_key)
where s.sequence_key = 'deal_partner_onboarding'
  and not exists (
    select 1 from public.marketing_sequence_steps ss
    where ss.sequence_id = s.id and ss.step_index = v.step_index
  );

comment on table public.marketing_sends is
  'Per-message log; open/click rates updated via resend-webhook from Resend events.';
