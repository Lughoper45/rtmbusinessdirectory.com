# Deploy kajwp edge functions

Project: `kajwpmyloxaqeciyndwf` (see `supabase/config.toml`).

## Why CORS preflight fails

Browser errors like **"Response to preflight request doesn't pass access control check: It does not have HTTP OK status"** usually mean one of:

1. **Function not deployed** — OPTIONS returns 404 before your handler runs.
2. **`verify_jwt = true` in `config.toml`** — the Supabase gateway rejects OPTIONS (no `Authorization` header on preflight). Admin functions use `verify_jwt = false` and validate JWT inside the function.
3. **Missing CORS headers** — use `supabase/functions/_shared/cors.ts` (`handleCorsPreflight`, `jsonResponse`).

Allowed origins: `https://www.rtmbusinessdirectory.com`, `https://rtmbusinessdirectory.com`, localhost dev ports.

## Prerequisites

1. Log in: `npx supabase login` (or set `SUPABASE_ACCESS_TOKEN` in `.env.local`)
2. Link or pass project ref: `--project-ref kajwpmyloxaqeciyndwf`
3. Set Supabase secrets for `admin-grants-bff` on **kajwp** (not on vinbf). See [Set Stellar secrets on kajwp](#set-stellar-secrets-on-kajwp-dashboard) below.

## Deploy commands

From repo root:

```powershell
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase functions deploy list-admin-users --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy admin-grants-bff --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy grant-checklist-lead --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
```

`verify_jwt = false` in `supabase/config.toml` may **not** apply on deploy. Use `--no-verify-jwt` on deploy **and** turn off **Enforce JWT Verification** in the Dashboard for both functions.

After changing CORS or JWT settings, redeploy both functions.

### If CLI returns 403

The logged-in Supabase account may not have access to project `kajwpmyloxaqeciyndwf`. Use an owner account, or deploy manually:

1. [Supabase Dashboard](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/functions) → Edge Functions
2. Create or open `list-admin-users` and `admin-grants-bff`
3. Paste code from `supabase/functions/<name>/index.ts` and include `_shared/cors.ts` (or deploy via CLI with a project owner token)
4. Confirm **Enforce JWT Verification** is **off** for these two functions (matches `verify_jwt = false`)
5. Set secrets for `admin-grants-bff` as above

## Verify

```powershell
npx supabase functions list --project-ref kajwpmyloxaqeciyndwf
```

Test OPTIONS (replace origin if needed):

```powershell
curl -i -X OPTIONS "https://kajwpmyloxaqeciyndwf.supabase.co/functions/v1/list-admin-users" `
  -H "Origin: https://www.rtmbusinessdirectory.com" `
  -H "Access-Control-Request-Method: POST" `
  -H "Access-Control-Request-Headers: authorization,content-type,apikey,x-client-info"
```

Expect `HTTP/1.1 200` and `Access-Control-Allow-Origin: https://www.rtmbusinessdirectory.com`.

## Dashboard checklist (do after every deploy)

1. [Edge Functions](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/functions) → open `list-admin-users` and `admin-grants-bff`
2. **Enforce JWT Verification** → **OFF** for both (preflight has no `Authorization` header; JWT is checked inside the function)
3. **Secrets** (project or function scope) for `admin-grants-bff`:
   - `STELLAR_SUPABASE_URL` = `https://vinbfneyficvgjrcduuj.supabase.co`
   - `STELLAR_SERVICE_ROLE_KEY` = vinbf service role key
4. Hard refresh the admin site (Ctrl+Shift+R) or clear site data — browsers cache failed CORS preflights

If POST returns `{"error":"Stellar grants backend is not configured."}`, CORS is fine; set the Stellar secrets below.

After redeploying `admin-grants-bff` with the latest code, unauthenticated `list-applications` still requires admin JWT; missing Stellar secrets return **200** with `applications: []` and a `warning` field so `/admin/grants` loads. `list-grants` still returns **500** until secrets are set.

## Set Stellar secrets on kajwp (Dashboard)

Secrets are stored on the **kajwp** project (`kajwpmyloxaqeciyndwf`). The edge function reads vinbf (Stellar) using these names — do **not** use `VITE_` prefixes here.

| Secret name (exact) | Value |
| --- | --- |
| `STELLAR_SUPABASE_URL` | `https://vinbfneyficvgjrcduuj.supabase.co` |
| `STELLAR_SERVICE_ROLE_KEY` | vinbf **service_role** JWT from the vinbf project |

### Where to copy the vinbf service role key

1. Open [vinbf project Settings → API](https://supabase.com/dashboard/project/vinbfneyficvgjrcduuj/settings/api).
2. Under **Project API keys**, find **service_role** (labeled secret).
3. Click **Reveal** / copy. This is **not** the anon/public key and **not** kajwp’s `SERVICE_ROLE_KEY` from launchpad `.env.local` (that key is for `kajwpmyloxaqeciyndwf` only).

### Where to paste secrets on kajwp

1. Open [kajwp Edge Functions](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/functions).
2. Click **Secrets** in the left sidebar (or **Project Settings → Edge Functions → Secrets**).
3. **Add new secret** → Name: `STELLAR_SUPABASE_URL` → Value: `https://vinbfneyficvgjrcduuj.supabase.co` → Save.
4. **Add new secret** → Name: `STELLAR_SERVICE_ROLE_KEY` → Value: paste the vinbf service_role JWT (no quotes, no `Bearer ` prefix) → Save.
5. Redeploy `admin-grants-bff` (CLI or Dashboard) so the function process picks up new secrets.
6. Hard refresh `/admin/grants` (Ctrl+Shift+R).

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` on kajwp are injected automatically by Supabase for edge functions — you do not set those manually for `admin-grants-bff`.

### Local `.env.local` (optional, for CLI only)

`.env.example` documents `STELLAR_SUPABASE_URL` and `STELLAR_SERVICE_ROLE_KEY` for local `supabase secrets set` workflows. A typical launchpad `.env.local` has kajwp `SERVICE_ROLE_KEY` but **not** vinbf — add vinbf service role only if you run `supabase secrets set` from the CLI; never commit it.

### Verify vinbf `applications` table

With vinbf service role configured on kajwp, POST `list-applications` as an admin should return rows. The `applications` table exists on vinbf (anon REST may return RLS/401; service role bypasses RLS).

Admin UI calls:

- `list-admin-users` — `/admin/users`
- `admin-grants-bff` — `/admin/grants` (`list-applications`, `list-grants`)
- `grant-checklist-lead` — `/grants` checklist form (public POST; saves lead + optional Resend emails)

See `GRANT_CHECKLIST_LEADS.md` for migration, seed, and reply templates.
