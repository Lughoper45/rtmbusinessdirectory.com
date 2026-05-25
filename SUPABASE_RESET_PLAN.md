# Supabase reset plan (RTM platform)

**Purpose:** Move off Lovable-managed Supabase (`kajwp`, `vinbf`) to a **user-owned** project with full CLI deploy, aligned with Q3 single-database intent.

> **Do not delete or wipe `kajwpmyloxaqeciyndwf` or `vinbfneyficvgjrcduuj` until production cutover is verified and you explicitly confirm.** Keep old projects read-only as rollback for at least 30 days.

---

## Consolidated to kajwp (in progress — May 2026)

Grants data and auth now target **`kajwpmyloxaqeciyndwf`** instead of a separate `vinbf` project.

| Done in repo | Remaining ops |
|--------------|----------------|
| `20260523110000_grants_platform_schema.sql` — `grants`, `applications`, `grant_profiles` | `npx supabase db push --project-ref kajwpmyloxaqeciyndwf` if not applied in dashboard |
| `grants.ts` uses unified `supabase` client | Remove `VITE_STELLAR_*` from launchpad Vercel after redeploy |
| `admin-grants-bff` uses `SUPABASE_SERVICE_ROLE_KEY` only | Redeploy `admin-grants-bff`; delete `STELLAR_*` from kajwp Edge secrets |
| Stellar `client.ts` / `config.toml` → kajwp | Deploy stellar edge functions to **kajwp** (not vinbf) |
| `PLATFORM.md` Vercel table | Update all 3 Vercel projects; rotate keys if exposed in `.env.local` |

**Vercel checklist:** see [PLATFORM.md — Consolidated to kajwp](./PLATFORM.md#consolidated-to-kajwp-may-2026).

**Option A (new `rtm-platform` project)** below is still valid if you want to leave Lovable org entirely; the kajwp merge is an interim single-DB on the existing ref.

---

## Current inventory (repos)

| Repo | Supabase ref (today) | Edge functions | SQL migrations (repo) |
|------|----------------------|----------------|------------------------|
| `launchpad-canada-ai` | `kajwpmyloxaqeciyndwf` | **17** | 12 active + 3 `.bak` (skip `.bak`) |
| `stellar-business-os` | `vinbfneyficvgjrcduuj` | **4** | 6 |
| `rtm-community-network` | `kajwp` (shared) | **0** | 6 (overlap with kajwp — apply once) |

### Launchpad edge functions (17)

`admin-grants-bff`, `analyze-website`, `check-membership`, `create-checkout`, `create-portal-session`, `generate-business-description`, `grant-checklist-lead`, `import-businesses`, `list-admin-users`, `membership-checkout`, `provision-member-account`, `reset-password`, `seed-businesses`, `send-claim-email`, `send-email`, `setup-stripe-prices`, `signup`, `stripe-webhook`

### Stellar edge functions (4)

`grant-profile`, `list-my-applications`, `submit-application`, `verify-platform-membership`

### Membership

Stripe webhook runs on **Vercel** (`/api/stripe-webhook`), not Supabase. Auth + `profiles` use kajwp.

---

## Why CLI deploy fails on Lovable-linked projects

| Self-owned Supabase | Lovable-provisioned / linked |
|---------------------|------------------------------|
| You own the **organization** and project | Project often lives under **Lovable’s org** or a managed link |
| `supabase login` + `functions deploy` / `db push` work with your access token | CLI returns **403** if your account is not **project/org owner** (see `DEPLOY_EDGE_FUNCTIONS.md`) |
| Secrets and deploys are under your control | Dashboard paste-deploy may work; **CLI and CI are blocked** for collaborators |
| You can transfer, fork, and merge DBs freely | Disconnecting from Lovable may require **Lovable support** or project transfer |

**Symptom you likely see:** `npx supabase functions deploy … --project-ref kajwp…` → 403, while Dashboard editor access still allows viewing tables.

**Not the same issue as Vercel Hobby** (commit author) — that is frontend-only; this doc is database/backend.

---

## Options comparison

| | **A — New `rtm-platform` (recommended)** | **B — Keep kajwp + vinbf** | **C — Lovable DB + external edges** |
|---|------------------------------------------|----------------------------|-------------------------------------|
| **CLI deploy** | Full | Dashboard-only or owner token only | Edges off-platform; DB still locked |
| **Q3 single DB** | Built in from day one | Still two DBs + `admin-grants-bff` bridge | Worst of both |
| **Auth** | One project, one JWT | Same as today (kajwp + vinbf reads) | Broken or duplicated |
| **Effort (3 people)** | ~1 week reset | Lowest if dashboard deploy is enough | High (rewrite URLs, secrets, CORS) |
| **Test users only** | Ideal time to reset | Kicks can down road | Avoid |
| **Risk** | Migration merge care (grants schema) | Stays on Lovable constraints | High operational debt |

**Recommendation:** **Yes — fresh user-owned Supabase** (Option A), single project `rtm-platform` (pick your own ref slug in dashboard). With only test users and planned Q3 merge, cost of reset is low; cost of staying on Lovable grows with every edge function.

---

## Option A — Step-by-step (you create project in dashboard)

### Phase 0 — Prerequisites (Day 0)

- [ ] Create Supabase org you control (not Lovable).
- [ ] Create project (e.g. display name **RTM Platform**, note new **project ref** — below called `NEW_REF`).
- [ ] Save **anon** and **service_role** keys in a password manager (never commit).
- [ ] Decide cutover window; announce to team.

### Phase 1 — Schema (Day 1–2)

**Order (single database):**

1. **Launchpad** `supabase/migrations/*.sql` in filename order — **skip** `*.bak`.
2. **Membership** `rtm-community-network/supabase/migrations/*.sql` — only files **not** already covered by launchpad (compare names; skip duplicates like `20260523000000_fix_handle_new_user_hybrid.sql` if identical).
3. **Stellar grants** migrations — apply **grants/applications** migrations (`20260520*`, `20260521*`, `20260523*`, `20260602*`) — **do not** re-run stellar bootstrap that recreates `profiles` / `user_roles` if launchpad already created them. Resolve conflicts in SQL editor before applying.

**Grants seed (after tables exist):**

- [ ] `stellar-business-os/supabase/migrations/20260602000000_grants_marketplace_seed.sql`
- [ ] `20260521000000_enhance_grants_real_programs.sql` (if not in seed)

**Auth configuration (`NEW_REF`):**

- [ ] Site URL: `https://membership.rtmbusinessdirectory.com`
- [ ] Redirect URLs: `membership`, `rtmbusinessdirectory`, `grants`, `worldcup` `/**` + localhost ports (see `PLATFORM.md`).

**Storage (if needed):**

- [ ] Recreate bucket `business-images` (public) on new project.
- [ ] Re-upload or script-copy objects from kajwp (optional for test reset — can re-seed businesses).

### Phase 2 — Edge functions (Day 2–3)

From machine with `supabase login` as **org owner**:

```powershell
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase link --project-ref NEW_REF
# Deploy all 17 launchpad functions (see DEPLOY_EDGE_FUNCTIONS.md for --no-verify-jwt flags)

cd "c:\Users\flood\new rtm\stellar-business-os"
npx supabase link --project-ref NEW_REF
# Deploy 4 stellar functions to SAME project
```

**Post-merge simplification:** `admin-grants-bff` can query `applications` / `grants` locally — remove `STELLAR_*` secrets. `verify-platform-membership` still calls `check-membership` on same DB (simplify to direct SQL or keep HTTP).

### Phase 3 — Secrets on `NEW_REF` (Day 3)

Set in Dashboard → Edge Functions → Secrets (no `VITE_` prefix):

| Secret | Used by |
|--------|---------|
| `RESEND_API_KEY` | email functions, grant-checklist-lead, provision-member-account |
| `STRIPE_SECRET_KEY` | checkout, webhook, setup-stripe-prices |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook |
| `STRIPE_PRICE_BASIC_YEAR` / `PREMIUM` / `PRO` | membership-checkout, setup-stripe-prices |
| `SITE_URL` | emails, checkout redirects |
| `PLATFORM_SERVICE_KEY` | check-membership, verify-platform-membership |
| `LOVABLE_API_KEY` | analyze-website, generate-business-description (optional) |

**Removed after single DB:** `STELLAR_SUPABASE_URL`, `STELLAR_SERVICE_ROLE_KEY` on platform.

Auto-injected by Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Phase 4 — Vercel env vars (Day 3–4)

Update **all** Lughoper45 + grants projects; redeploy.

#### launchpad-canada-ai (directory)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://NEW_REF.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key |
| `VITE_SUPABASE_PROJECT_ID` | `NEW_REF` |
| `VITE_STELLAR_SUPABASE_URL` | same as platform until UI reads one client |
| `VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY` | same anon key (or remove fallback in code later) |
| `VITE_MEMBERSHIP_APP_URL` | `https://membership.rtmbusinessdirectory.com` |
| `VITE_GRANTS_APP_URL` | `https://grants.rtmbusinessdirectory.com` |
| `VITE_WORLDCUP_APP_URL` | `https://worldcup.rtmbusinessdirectory.com` |
| `VITE_SITE_URL` | `https://rtmbusinessdirectory.com` |
| `VITE_DIRECTORY_SOURCE_MODE` | `database` or `hybrid` |

#### rtm-community-network (membership)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://NEW_REF.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key |
| `VITE_DIRECTORY_APP_URL` | directory URL |
| `VITE_GRANTS_APP_URL` | grants URL |
| `VITE_WORLDCUP_APP_URL` | worldcup URL |
| `SUPABASE_URL` | same (server routes) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | from Stripe dashboard |
| `RESEND_API_KEY` | Resend |
| `SITE_URL` | `https://membership.rtmbusinessdirectory.com` |

#### stellar-business-os (grants + worldcup)

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://NEW_REF.supabase.co` (grants data) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key |
| `VITE_PLATFORM_SUPABASE_URL` | **same** URL |
| `VITE_PLATFORM_SUPABASE_PUBLISHABLE_KEY` | **same** anon key |
| Cross-app `VITE_*_APP_URL` | per `PLATFORM.md` |

**Stellar edge secrets:** `PLATFORM_SUPABASE_URL`, `PLATFORM_SUPABASE_ANON_KEY`, `PLATFORM_SERVICE_KEY` → point to `NEW_REF`.

### Phase 5 — Stripe & users (Day 4–5)

- [ ] Create **new** Stripe webhook endpoints pointing to new URLs (membership Vercel webhook + `stripe-webhook` edge if used).
- [ ] Recreate **test** auth users on membership signup flow (password reset emails).
- [ ] Set `profiles.membership_status = 'active'` for test admins.
- [ ] Smoke: membership signup → pay → grants login → submit application → admin `/admin/grants`.

### Phase 6 — Repo config (Day 5)

- [ ] Update `supabase/config.toml` `project_id` in all three repos to `NEW_REF`.
- [ ] Update `.env.example` refs (no real keys).
- [ ] Update `PLATFORM.md` project table.

---

## What to migrate vs abandon

| Migrate | Abandon (after cutover confirmed) |
|---------|-----------------------------------|
| Migration SQL (consolidated) | Old Lovable org linkage |
| Grants seed data | `admin-grants-bff` cross-DB `STELLAR_*` pattern |
| Test users (recreate) | Duplicate membership-only migrations already in launchpad |
| Stripe products (same account) | kajwp/vinbf edge deploy workarounds |
| Business directory data (if production) | `user_memberships` legacy (deprecate later) |
| Checklist leads (if any real rows) | vinbf-only auth users (grants used platform login) |

---

## Timeline (3-person team, ~1 week)

| Day | Owner focus |
|-----|-------------|
| 1 | Create `NEW_REF`, run launchpad + membership SQL, auth URLs |
| 2 | Grants schema merge + seed; fix SQL conflicts |
| 3 | Deploy 21 edge functions; set secrets |
| 4 | Vercel env on all apps; Stripe webhooks |
| 5 | E2E smoke + admin; fix CORS/JWT flags |
| 6–7 | Buffer: storage images, directory import, docs |

---

## Option B — Keep kajwp + vinbf (short-term)

- [ ] Confirm Supabase dashboard role: **Owner** vs **Developer**.
- [ ] Deploy edges via [Dashboard](https://supabase.com/dashboard) paste or get Owner to run CLI.
- [ ] Request **project transfer** out of Lovable org (Supabase support + Lovable).
- [ ] Defer Q3 merge; keep `STELLAR_*` on kajwp for `admin-grants-bff`.

---

## Option C — Not recommended

Hosting Deno functions on Cloudflare/Vercel while DB stays on Lovable duplicates secrets, breaks `*.supabase.co/functions/v1/*` URLs in apps, and does not fix DB ownership.

---

## Verification checklist

- [ ] `npx supabase functions list --project-ref NEW_REF` shows 21 functions
- [ ] OPTIONS preflight 200 for `list-admin-users`, `grant-checklist-lead`
- [ ] `check-membership` returns active for paid test user
- [ ] Grants app: `VITE_SUPABASE_PUBLISHABLE_KEY` set (see `PLATFORM.md`)
- [ ] No production DNS cutover until sign-off

---

## References

- [PLATFORM.md](./PLATFORM.md) — domains, auth, cross-app map
- [DEPLOY_EDGE_FUNCTIONS.md](./DEPLOY_EDGE_FUNCTIONS.md) — CORS, 403, secrets
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) — Vercel Hobby (separate from Supabase)
- [GRANT_CHECKLIST_LEADS.md](./GRANT_CHECKLIST_LEADS.md) — checklist feature deploy
