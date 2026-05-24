# RTM Grant Packages — Stripe setup

Official package pricing (CAD):

| Package ID | Product name | List price | Member price (50% off) |
|---|---|---:|---:|
| `maple-checklist` | Maple Checklist | $299 | $149 |
| `true-north-standard` | True North Standard | $2,000 | $1,000 |
| `provincial-bridge` | Provincial Bridge | $3,200 | $1,600 |
| `northern-star` | Northern Star | $6,500 | $3,250 |

## Checkout flow (live)

1. Grants workspace (`ApplyForMeModal`) calls edge function **`grant-package-checkout`** with `package_id` + `grant_id`.
2. Edge function verifies auth, checks RTM membership server-side, inserts `grant_service_orders` with status **`pending`**, creates Stripe Checkout (`mode: payment`, inline `price_data`).
3. User pays on Stripe; **`stripe-webhook`** handles `checkout.session.completed` when `metadata.checkoutType = grant_package`.
4. Webhook sets order **`paid`**, creates **`grant_intakes`** (`source: package_checkout`), links `grant_service_orders.intake_id`.
5. Success redirect: `https://grants.rtmbusinessdirectory.com/grants/intake/:grantId?package=:packageId&checkout=success`

Apply modal tier mapping:

| UI tier | Package ID | Payment |
|---|---|---|
| Assisted (self-serve) | — | Free wizard |
| Guided | `true-north-standard` | Stripe |
| Full Service | `northern-star` | Stripe |

## Env vars (Supabase edge — project `kajwpmyloxaqeciyndwf`)

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Create Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Verify webhook signatures |
| `GRANTS_APP_URL` | Success/cancel URLs (defaults to `https://grants.rtmbusinessdirectory.com`) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` | Auto-injected by Supabase |

Client (grants app — stellar-business-os):

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | kajwp project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Auth session + invoke `grant-package-checkout` |

## Deploy

```bash
cd launchpad-canada-ai
supabase functions deploy grant-package-checkout --project-ref kajwpmyloxaqeciyndwf
supabase functions deploy stripe-webhook --project-ref kajwpmyloxaqeciyndwf
```

Ensure Stripe webhook endpoint includes `checkout.session.completed`.

## Optional: Stripe Products / Prices

MVP uses inline `price_data` (no pre-created Price IDs). When moving to catalog prices:

1. One Product per tier (four products).
2. Two one-time Prices per product: list + member.
3. Store `grant_package_id` in Product metadata.
4. Add env vars e.g. `STRIPE_PRICE_TRUE_NORTH_MEMBER` and resolve in `grant-package-checkout`.

Until catalog prices exist, member vs list amounts are computed server-side from `_shared/grantPackages.ts`.
