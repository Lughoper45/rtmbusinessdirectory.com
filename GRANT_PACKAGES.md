# RTM Grant Packages — Stripe setup (Phase 2)

Create these Stripe **Products** and **Prices** when enabling checkout. Do not store secrets in this repo.

| Package ID | Product name | List price (CAD) | Member price (CAD) | Suggested Stripe metadata |
|---|---|---:|---:|---|
| `maple-checklist` | Maple Checklist | $299 | $149 | `grant_package_id=maple-checklist` |
| `true-north-standard` | True North Standard | $2,000 | $1,000 | `grant_package_id=true-north-standard` |
| `provincial-bridge` | Provincial Bridge | $3,200 | $1,600 | `grant_package_id=provincial-bridge` |
| `northern-star` | Northern Star | $6,500 | $3,250 | `grant_package_id=northern-star` |

## Recommended Stripe model

1. One Product per tier (four products total).
2. Two recurring or one-time Prices per product:
   - `price_list_*` — standard (non-member) amount
   - `price_member_*` — RTM active membership amount (50% off list)
3. Store `grant_package_id` in Product metadata for webhook routing.
4. Gate member prices in the app via `fetchPlatformMembership` until checkout is wired.
5. Checkout success URL: `https://grants.rtmbusinessdirectory.com/grants` (GrantPilot workspace).

## Env vars (future)

- `STRIPE_SECRET_KEY` — server / edge function only
- `STRIPE_WEBHOOK_SECRET` — grant package fulfillment webhook
- `VITE_STRIPE_PUBLISHABLE_KEY` — client checkout (when live)

Until Stripe is live, package CTAs use `mailto:info@rtmbusinessdirectory.com` with the package id in the subject/body.
