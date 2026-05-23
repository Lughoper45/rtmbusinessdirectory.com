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
3. Set Supabase secrets for `admin-grants-bff` (Dashboard → Edge Functions → Secrets):

   - `STELLAR_SUPABASE_URL` = `https://vinbfneyficvgjrcduuj.supabase.co`
   - `STELLAR_SERVICE_ROLE_KEY` = vinbf service role key (never commit)

## Deploy commands

From repo root:

```powershell
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase functions deploy list-admin-users --project-ref kajwpmyloxaqeciyndwf
npx supabase functions deploy admin-grants-bff --project-ref kajwpmyloxaqeciyndwf
```

Deploy applies `verify_jwt` from `supabase/config.toml`. After changing CORS or JWT settings, redeploy both functions.

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

Admin UI calls:

- `list-admin-users` — `/admin/users`
- `admin-grants-bff` — `/admin/grants` (`list-applications`, `list-grants`)
