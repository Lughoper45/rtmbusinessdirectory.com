# Listing outreach automation — deploy

## 1. Database

```powershell
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase db push --project-ref kajwpmyloxaqeciyndwf
```

Migration: `20260525100000_listing_outreach_and_crm.sql`

## 2. Supabase secrets

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Claim + outreach emails |
| `OPS_CRON_SECRET` | Protect `ops-dispatcher` + enricher cron |
| `SITE_URL` | `https://www.rtmbusinessdirectory.com` |
| `LISTING_DAILY_SEND_CAP` | Default `50` |
| `META_PAGE_ACCESS_TOKEN` | Optional Facebook/Instagram publish |
| `GOOGLE_PLACES_API_KEY` | Optional enricher Phase E |

## 3. Edge functions

```powershell
npx supabase functions deploy listing-contact-enricher --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy listing-admin-bff --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy listing-public --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy ops-dispatcher --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy send-claim-email --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
```

## 4. Cron (daily)

POST `https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/ops-dispatcher`  
Header: `x-ops-cron-secret: <OPS_CRON_SECRET>`

Optional nightly enrich:

POST `.../listing-contact-enricher` with same header, body `{ "limit": 50 }`

## 5. Admin UI

- `/admin/listings` — enrich, queue, approve outreach, social
- `/admin/ops` — CRM contacts
- Public: `/claim`, `/listing-opt-out`

## 6. Ops workflow

1. **Run enricher** on unclaimed listings  
2. Review **Contacts** (confidence ≥ 70)  
3. **Build outreach queue** → approve batch → **Run dispatcher**  
4. Owner claims via `/claim` → approve in admin (or add Claims tab later)  
5. **Generate social** → approve → publish  
