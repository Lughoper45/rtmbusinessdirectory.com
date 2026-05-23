# RTM Platform — apps, domains, and databases

**Vercel deploys & Git commit authors:** see [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) (Hobby plan, grants vs Lughoper45, push tokens).

## Runtime map

| Domain | App repo | Supabase project | Role |
|--------|----------|------------------|------|
| `rtmbusinessdirectory.com` | `launchpad-canada-ai` | `kajwpmyloxaqeciyndwf` | Directory, deals, admin, edge functions |
| `membership.rtmbusinessdirectory.com` | `Membership/rtm-community-network` | `kajwpmyloxaqeciyndwf` | Signup, Stripe, `profiles.membership_status`, referrals |
| `grants.rtmbusinessdirectory.com` | `stellar-business-os` | `vinbfneyficvgjrcduuj` | GrantPilot, grant applications |
| `worldcup.rtmbusinessdirectory.com` | `stellar-business-os` | `vinbfneyficvgjrcduuj` | World Cup Ready portal |

**Two databases:** main + membership share `kajwpmyloxaqeciyndwf`; Stellar uses `vinbfneyficvgjrcduuj`.

## CLI / deploy

- Launchpad `supabase/config.toml` → `project_id = "kajwpmyloxaqeciyndwf"` (must match `VITE_SUPABASE_URL`).
- Stellar `supabase/config.toml` → `project_id = "vinbfneyficvgjrcduuj"`.
- Membership `supabase/config.toml` → `project_id = "kajwpmyloxaqeciyndwf"`.

## Membership source of truth

- **Active member:** `public.profiles.membership_status = 'active'` on `kajwpmyloxaqeciyndwf`.
- **Legacy fallback:** `public.user_memberships` (launchpad-era); still honored until fully migrated.
- **Signup / payment:** always `membership.rtmbusinessdirectory.com` — not launchpad `membership-checkout`.

## One RTM account (no double signup)

- **Sign up once** at `membership.rtmbusinessdirectory.com`.
- **Grants / World Cup** use the same login (`kajwp` auth) — sign in with your existing email/password.
- If membership is not active yet, grants sends you to **membership dashboard to pay**, not to create another account.

Grant rows still live in `vinbf`; only identity and membership status use `kajwp`.

## Cross-app API

| Function | Project | Purpose |
|----------|---------|---------|
| `check-membership` | launchpad (`kajwp`) | Returns `{ active, status, email }` for platform JWT or service key + email |
| `verify-platform-membership` | stellar (`vinbf`) | Validates stellar user, calls platform `check-membership` by email |

Set the same secret on both projects:

```bash
PLATFORM_SERVICE_KEY=<random-long-secret>
```

Stellar also needs:

```bash
PLATFORM_SUPABASE_URL=https://kajwpmyloxaqeciyndwf.supabase.co
```

## Environment variables (frontends)

### launchpad-canada-ai

```env
VITE_SUPABASE_URL=https://kajwpmyloxaqeciyndwf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_MEMBERSHIP_APP_URL=https://membership.rtmbusinessdirectory.com
VITE_GRANTS_APP_URL=https://grants.rtmbusinessdirectory.com
VITE_WORLDCUP_APP_URL=https://worldcup.rtmbusinessdirectory.com
# Grants catalog on /grants (vinbf) — optional; built-in fallback in stellarClient.ts
VITE_STELLAR_SUPABASE_URL=https://vinbfneyficvgjrcduuj.supabase.co
VITE_STELLAR_SUPABASE_PUBLISHABLE_KEY=<vinbf anon key from Supabase dashboard>
```

### stellar-business-os

```env
VITE_SUPABASE_URL=https://vinbfneyficvgjrcduuj.supabase.co
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
