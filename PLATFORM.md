# RTM Platform — apps, domains, and databases

**Vercel deploys & Git commit authors:** see [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) (Hobby plan, grants vs Lughoper45, push tokens).

## Dashboard roles

RTM runs three distinct signed-in experiences on shared `kajwp` auth: **membership dashboard** (`membership.rtmbusinessdirectory.com`) for signup, Stripe payment, referrals, and aid; **member/business dashboard** (`rtmbusinessdirectory.com/dashboard`) for directory listings, deals, and links into the grants workspace; and **admin dashboard** (`rtmbusinessdirectory.com/admin`) for operators managing businesses, users, membership ops, and grant applications. Grants execution lives on **GrantPilot** (`grants.rtmbusinessdirectory.com`) on the same database.

## Runtime map

| Domain | App repo | Supabase project | Role |
|--------|----------|------------------|------|
| `rtmbusinessdirectory.com` | `launchpad-canada-ai` | `kajwpmyloxaqeciyndwf` | Directory, deals, admin, edge functions |
| `membership.rtmbusinessdirectory.com` | `Membership/rtm-community-network` | `kajwpmyloxaqeciyndwf` | Signup, Stripe, `profiles.membership_status`, referrals |
| `grants.rtmbusinessdirectory.com` | `stellar-business-os` | `kajwpmyloxaqeciyndwf` | GrantPilot, grant applications |
| `worldcup.rtmbusinessdirectory.com` | `stellar-business-os` | `kajwpmyloxaqeciyndwf` | World Cup Ready portal |

**Single database:** all apps use `kajwpmyloxaqeciyndwf` (directory, membership, grants, World Cup).

## CLI / deploy

- Launchpad `supabase/config.toml` → `project_id = "kajwpmyloxaqeciyndwf"` (must match `VITE_SUPABASE_URL`).
- Stellar `supabase/config.toml` → `project_id = "kajwpmyloxaqeciyndwf"`.
- Membership `supabase/config.toml` → `project_id = "kajwpmyloxaqeciyndwf"`.

## Membership source of truth

- **Active member:** `public.profiles.membership_status = 'active'` on `kajwpmyloxaqeciyndwf`.
- **Legacy fallback:** `public.user_memberships` (launchpad-era); still honored until fully migrated.
- **Signup / payment:** always `membership.rtmbusinessdirectory.com` — not launchpad `membership-checkout`.

## One RTM account (no double signup)

- **Sign up once** at `membership.rtmbusinessdirectory.com`.
- **Grants / World Cup** use the same login (`kajwp` auth) — sign in with your existing email/password.
- If membership is not active yet, grants sends you to **membership dashboard to pay**, not to create another account.

Grant catalog, applications, and grant profiles live on `kajwp` (`public.grants`, `public.applications`, `public.grant_profiles`).

**Grant Intake Hub (Option 1):** structured intake, readiness scoring, and advisor queue — see [GRANT_INTAKE_HUB_PLAN.md](./GRANT_INTAKE_HUB_PLAN.md). Phase 1 adds `grant_intakes` and the `grant-intake-assistant` edge function (rules-only; LLM drafts in Phase 2).

## Cross-subdomain sign-in (important)

Supabase browser sessions are stored in **per-origin `localStorage`** (`rtm-platform-auth` on kajwp). They do **not** automatically sync across:

- `membership.rtmbusinessdirectory.com`
- `rtmbusinessdirectory.com`
- `grants.rtmbusinessdirectory.com`

Signing in on membership does **not** sign you in on grants until you either:

1. Use **Open grant workspace** on the membership dashboard (token handoff to `grants…/auth#access_token=…`), or
2. Sign in once on **grants** `/auth` with the **same email and password**.

Cookie `Domain=.rtmbusinessdirectory.com` does not apply to Supabase JS sessions (localStorage, not shared cookies).

### Supabase Auth URL configuration (kajwp)

In [Supabase Dashboard → Authentication → URL Configuration](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/auth/url-configuration) set:

| Setting | Values |
|---------|--------|
| **Site URL** | `https://membership.rtmbusinessdirectory.com` (primary signup) or `https://rtmbusinessdirectory.com` |
| **Redirect URLs** | `https://membership.rtmbusinessdirectory.com/**`, `https://rtmbusinessdirectory.com/**`, `https://grants.rtmbusinessdirectory.com/**`, `https://worldcup.rtmbusinessdirectory.com/**`, `http://localhost:5173/**`, `http://localhost:8080/**` |

Email confirmation and password reset links must use hosts listed above.

### Grants / World Cup production env

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to **kajwp** on all Vercel projects (including grants/worldcup). Legacy `VITE_PLATFORM_SUPABASE_*` / `VITE_STELLAR_*` are optional fallbacks only — safe to remove from Vercel after redeploy.

## Cross-app API

| Function | Project | Purpose |
|----------|---------|---------|
| `check-membership` | launchpad (`kajwp`) | Returns `{ active, status, email }` for platform JWT or service key + email |
| `provision-member-account` | launchpad (`kajwp`) | After Stripe payment: create auth user if needed, set `membership_status = active`, email temp password + login URLs (Resend) |
| `list-admin-users` | launchpad (`kajwp`) | Admin-only profile list with auth emails |
| `admin-grants-bff` | launchpad (`kajwp`) | Admin-only read of `applications` / `grants` (uses auto-injected `SUPABASE_SERVICE_ROLE_KEY`) |
| `verify-platform-membership` | stellar (`kajwp`) | Validates platform JWT, calls `check-membership` by email (optional; can simplify to SQL later) |

Set the same secret on both projects:

```bash
PLATFORM_SERVICE_KEY=<random-long-secret>
```

On **kajwp** edge secrets (grants functions deployed to same project):

```bash
PLATFORM_SERVICE_KEY=<shared-secret>   # check-membership, submit-application (optional verify-platform-membership)
# SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected on kajwp edge deploys.
# Legacy PLATFORM_SUPABASE_URL / PLATFORM_SUPABASE_ANON_KEY optional aliases — not required on same project.
```

## Consolidated to kajwp (May 2026)

| What changed | Detail |
|--------------|--------|
| Grants schema | Migration `20260523110000_grants_platform_schema.sql` on `kajwpmyloxaqeciyndwf` |
| Service requests (World Cup form) | Migration `20260524150000_service_requests.sql` on `kajwpmyloxaqeciyndwf` |
| `admin-grants-bff` | Queries `grants` / `applications` on kajwp only — **remove** `STELLAR_SUPABASE_URL`, `STELLAR_SERVICE_ROLE_KEY` from kajwp Edge secrets |
| Frontends | Single `supabase` client per app (`rtm-platform-auth` storage key on grants/membership/directory) |
| Legacy `vinbf` | Read-only rollback; do not delete until smoke tests pass |

### Vercel env vars — all 3 projects

**Remove everywhere (no longer used):**

| Variable | Where it was |
|----------|----------------|
| `VITE_STELLAR_SUPABASE_URL` | launchpad Vercel |
| `VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY` | launchpad Vercel |
| `VITE_PLATFORM_SUPABASE_URL` | stellar/worldcup Vercel |
| `VITE_PLATFORM_SUPABASE_PUBLISHABLE_KEY` | stellar/worldcup Vercel |
| `STELLAR_SUPABASE_URL` | kajwp Edge secrets |
| `STELLAR_SERVICE_ROLE_KEY` | kajwp Edge secrets |
| `PLATFORM_SUPABASE_URL` / `PLATFORM_SUPABASE_ANON_KEY` | kajwp Edge secrets (use auto-injected `SUPABASE_*` instead) |

#### launchpad-canada-ai (`rtmbusinessdirectory.com`)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://kajwpmyloxaqeciyndwf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | kajwp anon key |
| `VITE_MEMBERSHIP_APP_URL` | `https://membership.rtmbusinessdirectory.com` |
| `VITE_GRANTS_APP_URL` | `https://grants.rtmbusinessdirectory.com` |
| `VITE_WORLDCUP_APP_URL` | `https://worldcup.rtmbusinessdirectory.com` |

#### rtm-community-network (`membership.rtmbusinessdirectory.com`)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://kajwpmyloxaqeciyndwf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | kajwp anon key |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | kajwp (Vercel server routes / webhook) |
| Cross-app `VITE_*_APP_URL` | per table above |
| Stripe / Resend / `SITE_URL` | unchanged |

#### stellar-business-os (`grants` + `worldcup`)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://kajwpmyloxaqeciyndwf.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | kajwp anon key |
| Cross-app `VITE_*_APP_URL` | per table above |

**kajwp Edge secrets to keep:** `PLATFORM_SERVICE_KEY`, Stripe, Resend, `SITE_URL`, etc. **Do not** set `STELLAR_*` on kajwp after redeploying `admin-grants-bff`.

### Security — key rotation

If `SERVICE_ROLE_KEY`, database passwords, or anon keys appeared in committed `.env.local` or chat logs, **rotate** them in [kajwp API settings](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/settings/api), update Vercel + Edge secrets, and redeploy. Never commit real keys.

## Environment variables (frontends)

### launchpad-canada-ai

```env
VITE_SUPABASE_URL=https://kajwpmyloxaqeciyndwf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_MEMBERSHIP_APP_URL=https://membership.rtmbusinessdirectory.com
VITE_GRANTS_APP_URL=https://grants.rtmbusinessdirectory.com
VITE_WORLDCUP_APP_URL=https://worldcup.rtmbusinessdirectory.com
```

### stellar-business-os

```env
VITE_SUPABASE_URL=https://kajwpmyloxaqeciyndwf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<kajwp anon key>
VITE_DIRECTORY_APP_URL=https://rtmbusinessdirectory.com
VITE_MEMBERSHIP_APP_URL=https://membership.rtmbusinessdirectory.com
VITE_GRANTS_APP_URL=https://grants.rtmbusinessdirectory.com
VITE_WORLDCUP_APP_URL=https://worldcup.rtmbusinessdirectory.com
```

### rtm-community-network

```env
VITE_SUPABASE_URL=https://kajwpmyloxaqeciyndwf.supabase.co
VITE_DIRECTORY_APP_URL=https://rtmbusinessdirectory.com
VITE_GRANTS_APP_URL=https://grants.rtmbusinessdirectory.com
VITE_WORLDCUP_APP_URL=https://worldcup.rtmbusinessdirectory.com
```
