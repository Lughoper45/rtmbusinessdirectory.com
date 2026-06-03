# RTM Marketing System — Work Plan & Implementation Status

**Database:** `kajwpmyloxaqeciyndwf`  
**Admin UI:** `/admin/marketing`  
**Last updated:** 2026-06-05

Related: [RTM_OPERATIONS_AUTOMATION_MASTER_PLAN.md](./RTM_OPERATIONS_AUTOMATION_MASTER_PLAN.md), [DIRECTORY_LISTING_OUTREACH_AUTOMATION_PLAN.md](./DIRECTORY_LISTING_OUTREACH_AUTOMATION_PLAN.md), [pricing_model.md](./pricing_model.md)

---

## North star

Build a **two-sided** marketing engine:

1. **Supply** — Canadian businesses import/paste → automated intro about **RTM member deals** → claim listing → publish `business_deals`.
2. **Demand** — Grant seekers / consumers → existing S0–S9 lifecycle after capture.

Membership requires **businesses that offer discounts**; this system fills the supply side at scale without manual one-by-one sending.

---

## Automation-first design (not manual blast)

| Layer | Behavior |
|-------|----------|
| **Import** | Paste/CSV → validate every email → CRM upsert |
| **Campaign** | Admin clicks **Start auto-send** once per batch |
| **Send** | `ops-dispatcher` cron runs `processMarketingCampaigns` (daily cap, default 50) |
| **Sequence** | Step 0 immediate; step N after `delay_hours` — no human per email |
| **Tracking** | Resend webhook → `marketing_sends.opened_at` / `clicked_at` → admin open/click % |

Optional `send_mode: manual_review` on campaign (future gate) — default is **`automated`**.

---

## What is implemented in repo

### Database (`20260605120000_marketing_automation.sql`)

- `marketing_email_templates` — editable HTML + subject
- `marketing_sequences` + `marketing_sequence_steps`
- `marketing_campaigns` — running/paused, daily cap
- `marketing_import_batches` + `marketing_prospects` — validation status per row
- `marketing_campaign_enrollments` — scheduler state (`next_send_at`)
- `marketing_sends` — per message + Resend id + open/click counts

Seeded: `deal_partner_intro`, `deal_partner_followup`, `directory_claim_intro`, sequence `deal_partner_onboarding`.

### Edge functions

| Function | Role |
|----------|------|
| `marketing-admin-bff` | Import, templates, sequences, campaigns, analytics, manual dispatch |
| `resend-webhook` | `email.opened`, `email.clicked`, `email.delivered`, `email.bounced` |
| `ops-dispatcher` | Calls `processMarketingCampaigns` each cron run |

### Email validation (`marketingEmailValidation.ts`)

On import (and `validate-batch`):

- Syntax regex
- Disposable domain blocklist
- MX (fallback A) DNS check
- Role accounts (`info@`, `sales@`, …) → `role_account` (sendable)
- Suppression list check → `suppressed`
- Duplicate email → `duplicate`

Only `valid` and `role_account` enroll when `only_valid_emails` is true (default).

### Admin UI (`AdminMarketing.tsx`)

Tabs: **Import**, **Campaigns**, **Templates**, **Sequences**, **Prospects**, **Analytics**.

---

## Operator workflow

1. **Import** — Paste tab-separated data with header: `email`, `business_name`, `city`, `province`.
2. **Templates** — Edit copy/variables; save to DB (no deploy needed).
3. **Sequences** — Adjust steps, delays, template keys.
4. **Campaigns** — Create draft → **Start auto-send** (uses last import `batch_id`).
5. **Cron** — Ensure `ops-dispatcher` runs on schedule (existing OPS cron). Or click **Run send queue now**.
6. **Analytics** — Configure Resend webhook (below); refresh open/click rates.

---

## Deploy checklist

```bash
# 1. Migration
supabase db push

# 2. Functions
supabase functions deploy marketing-admin-bff
supabase functions deploy resend-webhook
supabase functions deploy ops-dispatcher

# 3. Secrets (Supabase Edge) + Vault for pg_cron
RESEND_API_KEY=...
OPS_CRON_SECRET=...   # Edge Functions secret
# SQL editor (once) — same value as OPS_CRON_SECRET:
# select vault.create_secret('<OPS_CRON_SECRET>', 'ops_cron_secret', 'Cron auth for ops-dispatcher');
MARKETING_DAILY_SEND_CAP=50
RESEND_WEBHOOK_SECRET=<random>   # optional but recommended
# Do NOT use ALTER DATABASE SET app.ops_cron_secret (permission denied on hosted Supabase).

# 4. Resend dashboard → Webhooks
# URL: https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/resend-webhook?secret=<RESEND_WEBHOOK_SECRET>
# Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
```

---

## Phased roadmap (remaining)

| Phase | Scope | Status |
|-------|--------|--------|
| P0 | Tables, auto-send, validation, admin UI, webhook | ✅ In repo |
| P1 | Partner wizard `/partner` → create `business_deals` | 📋 Next |
| P2 | CSV file upload (not only paste) | 📋 |
| P3 | Link enrollments to `crm_activities.contact_id` | 📋 |
| P4 | Demand-side campaigns → existing grant nurture | 📋 |
| P5 | Enrichment API for missing emails | 📋 (reuse `listing-contact-enricher`) |

---

## CASL & compliance

- Store `casl_basis` on prospects (`manual_verified` default for imports you own rights to contact).
- Do **not** upload purchased lists without consent.
- Every template includes `{{unsubscribe_url}}` → `/listing-opt-out`.
- Complaints via Resend webhook → `listing_suppressions`.

---

## Metrics

| Metric | Source |
|--------|--------|
| Sent / delivered | `marketing_sends` |
| Open rate | `opened_at` / sent (webhook) |
| Click rate | `clicked_at` / sent (webhook) |
| Bounce rate | `status = bounced` |
| Enrolled | `marketing_campaign_enrollments` |

---

## Template variables

`{{business_name}}`, `{{city}}`, `{{province}}`, `{{contact_name}}`, `{{contact_name_greeting}}`, `{{partner_url}}`, `{{deals_url}}`, `{{grants_url}}`, `{{claim_url}}`, `{{unsubscribe_url}}`
