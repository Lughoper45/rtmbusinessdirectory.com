-- RTM Growth Services enterprise: orders, engagements, delivery milestones

-- ─── Service orders (Stripe) ───────────────────────────────────────────────
create table if not exists public.growth_service_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null,
  amount_cents integer not null,
  currency text not null default 'cad',
  billing_interval text not null default 'month',
  member_active boolean not null default false,
  status text not null default 'pending',
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  engagement_id uuid,
  audit_lead_id uuid references public.growth_audit_leads(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_service_orders_status_check
    check (status in ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  constraint growth_service_orders_package_check
    check (package_id in (
      'visibility-starter',
      'sales-engine',
      'growth-os',
      'digital-transformation'
    ))
);

create index if not exists growth_service_orders_user_id_idx
  on public.growth_service_orders (user_id);
create index if not exists growth_service_orders_status_idx
  on public.growth_service_orders (status);

-- ─── Client engagements ──────────────────────────────────────────────────────
create table if not exists public.growth_engagements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null,
  order_id uuid references public.growth_service_orders(id) on delete set null,
  audit_lead_id uuid references public.growth_audit_leads(id) on delete set null,
  business_name text,
  business_id text references public.businesses(business_id) on delete set null,
  status text not null default 'pending_payment',
  advisor_notes text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_engagements_status_check
    check (status in (
      'pending_payment',
      'active',
      'paused',
      'completed',
      'cancelled'
    )),
  constraint growth_engagements_package_check
    check (package_id in (
      'visibility-starter',
      'sales-engine',
      'growth-os',
      'digital-transformation'
    ))
);

create index if not exists growth_engagements_user_id_idx
  on public.growth_engagements (user_id);
create index if not exists growth_engagements_status_idx
  on public.growth_engagements (status);

alter table public.growth_service_orders
  drop constraint if exists growth_service_orders_engagement_fk;
alter table public.growth_service_orders
  add constraint growth_service_orders_engagement_fk
  foreign key (engagement_id) references public.growth_engagements(id) on delete set null;

-- ─── Delivery milestones ─────────────────────────────────────────────────────
create table if not exists public.growth_milestones (
  id uuid primary key default gen_random_uuid(),
  engagement_id uuid not null references public.growth_engagements(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'pending',
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint growth_milestones_status_check
    check (status in ('pending', 'in_progress', 'done', 'skipped'))
);

create index if not exists growth_milestones_engagement_id_idx
  on public.growth_milestones (engagement_id, sort_order);

-- ─── Timestamps ──────────────────────────────────────────────────────────────
create or replace function public.set_growth_row_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists growth_service_orders_updated_at on public.growth_service_orders;
create trigger growth_service_orders_updated_at
before update on public.growth_service_orders
for each row execute function public.set_growth_row_updated_at();

drop trigger if exists growth_engagements_updated_at on public.growth_engagements;
create trigger growth_engagements_updated_at
before update on public.growth_engagements
for each row execute function public.set_growth_row_updated_at();

drop trigger if exists growth_milestones_updated_at on public.growth_milestones;
create trigger growth_milestones_updated_at
before update on public.growth_milestones
for each row execute function public.set_growth_row_updated_at();

-- ─── Seed milestones per package ─────────────────────────────────────────────
create or replace function public.seed_growth_milestones(p_engagement_id uuid, p_package_id text)
returns void language plpgsql security definer set search_path = public as $$
declare
  rec record;
begin
  for rec in
    select * from (
      values
        ('visibility-starter', 10, 'Kickoff & goals', '30-minute call to confirm scope and timeline'),
        ('visibility-starter', 20, 'Google Business Profile', 'Create, claim, or optimize your GBP listing'),
        ('visibility-starter', 30, 'RTM featured listing', 'Complete and feature your directory profile'),
        ('visibility-starter', 40, 'Website / landing page', 'Publish a 1-page professional site'),
        ('visibility-starter', 50, 'Professional email', 'Configure yourname@yourbusiness.com'),
        ('visibility-starter', 60, 'Review generation plan', 'Launch a Google review strategy'),
        ('visibility-starter', 70, 'Month 1 performance report', 'Summary of visibility metrics and next steps'),

        ('sales-engine', 10, 'Kickoff & goals', 'Confirm Sales Engine scope and integrations'),
        ('sales-engine', 20, 'Visibility deliverables', 'Complete Visibility Starter foundation'),
        ('sales-engine', 30, 'WhatsApp Business CRM', 'Auto-replies, labels, and follow-up flows'),
        ('sales-engine', 40, '5-page website + booking', 'Contact form and booking integration live'),
        ('sales-engine', 50, 'Social setup (IG + FB)', 'Profiles configured; first 8 posts scheduled'),
        ('sales-engine', 60, 'Local SEO launch', 'City + category targeting live'),
        ('sales-engine', 70, 'Monthly strategy call', 'First advisor strategy session completed'),

        ('growth-os', 10, 'Kickoff & roadmap', 'Quarterly growth roadmap drafted'),
        ('growth-os', 20, 'Sales Engine foundation', 'All Sales Engine deliverables verified'),
        ('growth-os', 30, 'AI website chatbot', 'FAQ, qualify, and book appointments 24/7'),
        ('growth-os', 40, 'Meta + Google ads', 'Campaigns live (ad spend separate)'),
        ('growth-os', 50, 'CRM automation', 'HubSpot/Zoho pipelines and sequences'),
        ('growth-os', 60, 'Grant funding review', 'Identify programs that may fund digital spend'),
        ('growth-os', 70, 'Monthly strategy review', 'First Growth OS strategy session completed')
    ) as t(pkg, ord, title, description)
    where t.pkg = p_package_id
  loop
    insert into public.growth_milestones (engagement_id, title, description, sort_order)
    values (p_engagement_id, rec.title, rec.description, rec.ord);
  end loop;
end;
$$;

create or replace function public.on_growth_engagement_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.package_id <> 'digital-transformation' then
    perform public.seed_growth_milestones(new.id, new.package_id);
  end if;
  insert into public.ops_events (event_type, payload)
  values (
    'growth_engagement.created',
    jsonb_build_object(
      'engagement_id', new.id,
      'user_id', new.user_id,
      'package_id', new.package_id
    )
  );
  return new;
end;
$$;

drop trigger if exists growth_engagement_created on public.growth_engagements;
create trigger growth_engagement_created
after insert on public.growth_engagements
for each row execute function public.on_growth_engagement_created();

-- Link orders → engagements on paid (handled in webhook; optional audit link)
alter table public.growth_audit_leads
  add column if not exists engagement_id uuid references public.growth_engagements(id) on delete set null;

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.growth_service_orders enable row level security;
alter table public.growth_engagements enable row level security;
alter table public.growth_milestones enable row level security;

drop policy if exists "Users read own growth orders" on public.growth_service_orders;
create policy "Users read own growth orders"
on public.growth_service_orders for select
using (auth.uid() = user_id);

drop policy if exists "Admins manage growth orders" on public.growth_service_orders;
create policy "Admins manage growth orders"
on public.growth_service_orders for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Users read own engagements" on public.growth_engagements;
create policy "Users read own engagements"
on public.growth_engagements for select
using (auth.uid() = user_id);

drop policy if exists "Admins manage engagements" on public.growth_engagements;
create policy "Admins manage engagements"
on public.growth_engagements for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Users read own milestones" on public.growth_milestones;
create policy "Users read own milestones"
on public.growth_milestones for select
using (
  exists (
    select 1 from public.growth_engagements e
    where e.id = engagement_id and e.user_id = auth.uid()
  )
);

drop policy if exists "Admins manage milestones" on public.growth_milestones;
create policy "Admins manage milestones"
on public.growth_milestones for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
