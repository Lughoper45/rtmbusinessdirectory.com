# Listing outreach automation — deploy

## 1. Database

```powershell
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase db push --project-ref kajwpmyloxaqeciyndwf
```

Migrations:

| File | Purpose |
|------|---------|
| `20260525100000_listing_outreach_and_crm.sql` | CRM, outreach, social queue |
| `20260525120000_ops_nurture_and_views.sql` | Nurture dedup log, view counter |

## 2. Secrets

Copy **[RTM_SECRETS_PLACEHOLDER.env](./RTM_SECRETS_PLACEHOLDER.env)** → `RTM_SECRETS.local.env`, fill values, then paste into Supabase Edge secrets.

**Minimum to run outreach:**

| Secret | Required |
|--------|----------|
| `RESEND_API_KEY` | Yes |
| `OPS_CRON_SECRET` | Yes |
| `SITE_URL` | Yes |

**Optional (enables features):**

| Secret | Feature |
|--------|---------|
| `META_PAGE_ACCESS_TOKEN` + `META_PAGE_ID` | Live Facebook posts |
| `LINKEDIN_ACCESS_TOKEN` + `LINKEDIN_ORGANIZATION_URN` | Live LinkedIn posts |
| `X_API_BEARER_TOKEN` | Live X/Twitter posts |
| `GOOGLE_PLACES_API_KEY` | Better website/phone discovery |
| `OPENROUTER_API_KEY` | AI social copy in admin Generate |

## 3. Edge functions

```powershell
npx supabase functions deploy listing-contact-enricher --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy listing-admin-bff --project-ref kajwpmyloxaqeciyndwf
npx supabase functions deploy listing-public --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy ops-dispatcher --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy send-claim-email --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
```

## 4. Cron (daily) — runs all automations

```http
POST https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/ops-dispatcher
x-ops-cron-secret: <OPS_CRON_SECRET>
```

**Dispatcher now handles:**

- Pending `ops_events` (outreach send, social publish)
- Claim invite reminders (day 7 / step 2)
- Checklist nurture (day 1, 3, 7)
- Post-claim nurture (photos day 3, grants day 7)
- Listing views email (~day 14 after claim)

**Nightly enrich (optional):**

```http
POST .../listing-contact-enricher
x-ops-cron-secret: <OPS_CRON_SECRET>
{"limit": 50}
```

## 5. Admin UI

- `/admin/listings` — enrich, queue, approve outreach, social, claims
- `/admin/ops` — CRM contacts
- Public: `/claim`, `/listing-opt-out`

## 6. Ops workflow

1. **Run enricher** on unclaimed listings  
2. Review **Contacts** (confidence ≥ 70)  
3. **Build outreach queue** → approve batch → **Run dispatcher**  
4. Owner claims via `/claim` → **Approve claim** in admin (creates CRM deal + nurture schedule)  
5. **Generate social** → approve → publish (needs social API secrets for live posts)
