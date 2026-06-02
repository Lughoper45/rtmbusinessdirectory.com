# RTM platform — repository layout

Shared Supabase project: **kajwpmyloxaqeciyndwf**

| Surface | Local path | Production domain |
|---------|------------|-------------------|
| **Directory + admin + edge functions** | `C:\Users\flood\new rtm\launchpad-canada-ai` | rtmbusinessdirectory.com |
| **Grants (GrantPilot)** | `C:\Users\flood\new rtm\stellar-business-os` | grants.rtmbusinessdirectory.com |
| **Membership (signup, Passport checkout)** | `C:\Users\flood\Membership\rtm-community-network` | membership.rtmbusinessdirectory.com |
| **Grow** | `launchpad-canada-ai` (Grow routes) | grow.rtmbusinessdirectory.com |
| **Education grants** | `C:\Users\flood\new rtm\govgranteducation` | govgranteducation.ca |

## Sync rules

- **`membershipAccess.ts`** — keep identical in launchpad, stellar, and `Membership\rtm-community-network`.
- **Email templates (S0–S9)** — `launchpad-canada-ai/supabase/functions/send-member-email` + `membership-email-trigger`; membership app calls these via service role.
- **Migrations** — apply from **launchpad-canada-ai** (`supabase db push`).
- **Commercial strategy** — `launchpad-canada-ai/docs/pricing_model.md`

## Deploy order (typical)

1. `supabase db push` (launchpad)
2. `supabase functions deploy …` (launchpad)
3. Vercel: stellar (grants), Membership (membership), launchpad (directory)

## Vercel + GitHub (which account pushes where)

**Canonical guide:** [VERCEL_DEPLOY.md](../VERCEL_DEPLOY.md) in this repo.

| App | Local folder | GitHub repo | Vercel team | Commit author for deploy |
|-----|--------------|-------------|-------------|---------------------------|
| Directory | `launchpad-canada-ai` | `Lughoper45/rtmbusinessdirectory.com` | Lughoper45 | **Lughoper45** |
| Membership | `C:\Users\flood\Membership\rtm-community-network` | `Lughoper45/rtm-community-network` | Lughoper45 | **Lughoper45** |
| Grants / World Cup | `stellar-business-os` | `jothanjoseph26-ctrl/stellar-business-os` | jothans-projects | **jothanjoseph26-ctrl** (Hobby rule) |

Grants detail + env vars: [stellar-business-os/docs/VERCEL_DEPLOY_STELLAR.md](../../stellar-business-os/docs/VERCEL_DEPLOY_STELLAR.md).

Push with PAT when CLI is wrong user: `GITHUB_TOKEN` in `C:\Users\flood\Membership\.env` — see VERCEL_DEPLOY.md § “Pushing when GitHub says Repository not found”.
