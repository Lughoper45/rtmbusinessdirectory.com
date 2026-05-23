# Deploy kajwp edge functions

Project: `kajwpmyloxaqeciyndwf` (see `supabase/config.toml`).

## Prerequisites

1. Log in: `npx supabase login`
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

If deploy returns **403** (CLI account lacks project access), use a Supabase account that owns `kajwpmyloxaqeciyndwf`, or deploy from the Supabase Dashboard (Edge Functions → Deploy).

## Verify

```powershell
npx supabase functions list --project-ref kajwpmyloxaqeciyndwf
```

Admin UI calls:

- `list-admin-users` — `/admin/users`
- `admin-grants-bff` — `/admin/grants` (`list-applications`, `list-grants`)
