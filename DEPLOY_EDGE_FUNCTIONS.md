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
3. `admin-grants-bff` reads `grants` / `applications` on **kajwp** using auto-injected `SUPABASE_SERVICE_ROLE_KEY` — no `STELLAR_*` secrets.

## Deploy commands

From repo root:

```powershell
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase functions deploy list-admin-users --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy admin-grants-bff --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy grant-checklist-lead --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
npx supabase functions deploy grant-intake-assistant --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
```

**Grant intake assistant secrets** (kajwp → Project Settings → Edge Functions → Secrets):

- `OPENROUTER_API_KEY` — required for `generate_draft`
- `OPENROUTER_MODEL` — optional; default `openai/gpt-oss-120b:free`

Validate before deploy: `OPENROUTER_API_KEY=sk-or-… node scripts/test-openrouter-model.mjs`

`verify_jwt = false` in `supabase/config.toml` may **not** apply on deploy. Use `--no-verify-jwt` on deploy **and** turn off **Enforce JWT Verification** in the Dashboard for both functions.

After changing CORS or JWT settings, redeploy both functions.

### If CLI returns 403

The logged-in Supabase account may not have access to project `kajwpmyloxaqeciyndwf`. Use an owner account, or deploy manually:

1. [Supabase Dashboard](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/functions) → Edge Functions
2. Create or open `list-admin-users` and `admin-grants-bff`
3. Paste code from `supabase/functions/<name>/index.ts` and include `_shared/cors.ts` (or deploy via CLI with a project owner token)
4. Confirm **Enforce JWT Verification** is **off** for these two functions (matches `verify_jwt = false`)
5. Confirm migration `20260523110000_grants_platform_schema.sql` is applied on kajwp

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
3. **Remove** legacy `STELLAR_*` and duplicate `PLATFORM_SUPABASE_*` from kajwp Edge secrets if present (auto-injected `SUPABASE_*` is enough).
4. Hard refresh the admin site (Ctrl+Shift+R) or clear site data — browsers cache failed CORS preflights

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — `admin-grants-bff` uses them to query `public.grants` and `public.applications` on kajwp.

### Verify grants tables on kajwp

After `db push` or running `20260523110000_grants_platform_schema.sql`, POST `list-applications` as an admin should return rows from kajwp.

Admin UI calls:

- `list-admin-users` — `/admin/users`
- `admin-grants-bff` — `/admin/grants` (`list-applications`, `list-grants`)
- `grant-checklist-lead` — `/grants` checklist form (public POST; saves lead + optional Resend emails)

See `GRANT_CHECKLIST_LEADS.md` for migration, seed, and reply templates.
