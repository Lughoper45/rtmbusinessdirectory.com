# RTM Growth Services — `grow.rtmbusinessdirectory.com`

Enterprise growth pillar: marketing site, Stripe subscriptions, client workspace, admin delivery CRM.

## Architecture

| Surface | URL | App entry |
|---------|-----|-----------|
| Directory (main) | rtmbusinessdirectory.com | `App.tsx` — `/grow` redirects to grow subdomain |
| **Growth** | grow.rtmbusinessdirectory.com | `GrowApp.tsx` via `VITE_APP_SURFACE=grow` or hostname `grow.*` |
| Grants | grants.rtmbusinessdirectory.com | Same repo, grants routes |
| Membership | membership.rtmbusinessdirectory.com | External signup app |

Shared Supabase project (`kajwpmyloxaqeciyndwf`): `growth_audit_leads`, `growth_engagements`, `growth_milestones`, `growth_service_orders`.

## Deploy steps

1. **DNS**: CNAME `grow` → same host as main site (Vercel/Netlify/Cloudflare Pages).
2. **Build**: `npm run build` (hostname detection works in production) or `npm run build:grow` with `VITE_APP_SURFACE=grow`.
3. **Supabase migration**: `supabase db push` — apply `20260525300000_growth_enterprise.sql`.
4. **Edge functions**:
   - `supabase functions deploy growth-audit-lead`
   - `supabase functions deploy growth-package-checkout`
   - `supabase functions deploy stripe-webhook` (growth checkout fulfillment)
5. **Secrets** (Dashboard → Edge Functions):
   - `GROW_APP_URL=https://grow.rtmbusinessdirectory.com`
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - `RESEND_API_KEY` (audit + paid notifications)

## Routes (grow host)

| Path | Purpose |
|------|---------|
| `/` | Marketing + free audit |
| `/packages` | Package grid + Stripe subscribe |
| `/workspace` | Client delivery tracker (auth required) |
| `/auth` | Sign-in with `returnUrl` handoff |

## Client flow

1. Free audit → `growth_audit_leads` + CRM sync
2. Subscribe → `growth-package-checkout` → Stripe subscription
3. Webhook → `growth_engagements` status `active` + seeded milestones
4. Client sees progress in `/workspace`
5. Admin updates milestones at `/admin/growth` → Engagements tab

## Local dev

```bash
npm run dev:grow
```

Uses `.env.grow` (`VITE_APP_SURFACE=grow`). Open http://localhost:8080

## Cross-links

- Main footer / hero / three pillars → `getGrowPortalUrl()`
- `/grants` banner → grow audit with `?source=grantpilot`
- `/membership` → member pricing CTA
- `/pricing` → growth package strip
