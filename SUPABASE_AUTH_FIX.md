# Supabase auth signup fix (kajwp `kajwpmyloxaqeciyndwf`)

## Symptom

- Membership signup / resend: `Supabase could not generate confirmation link: Database error saving new user`
- `POST /api/resend-confirmation` returns **500** (membership app: `rtm-community-network`)

## Root cause

Both **rtmbusinessdirectory.com** (directory) and **membership.rtmbusinessdirectory.com** share one Supabase project (`kajwpmyloxaqeciyndwf`).

1. Directory created `public.profiles` with random `id` and required **`user_id`** → `auth.users.id`.
2. Membership migrations replaced `handle_new_user()` to insert **`id = new.id`** plus membership fields but often **omitted `user_id`**.
3. On insert into `auth.users`, the trigger failed (`23502` NOT NULL on `user_id`, or missing `referral_code` / `role`), so Auth reported **Database error saving new user**. The resend-confirmation API only surfaces that failure from `auth.admin.generateLink({ type: "signup" })`.

Stellar (`vinbfneyficvgjrcduuj`) is **not** involved in membership signup.

## Fix (repo)

Migration: `supabase/migrations/20260523000000_fix_handle_new_user_hybrid.sql`

- Drops NOT NULL on legacy `user_id` when present
- Adds `gen_referral_code()` if missing
- Replaces `handle_new_user()` to set **`user_id` and `id` to `new.id`**, membership fields, `role`, and referral code; updates existing rows matched by `user_id` or `id`

Same file is copied in `Membership/rtm-community-network/supabase/migrations/`.

## Apply on production (if migration not pushed)

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/sql/new) for project **kajwp**.
2. Paste and run the full contents of:
   `launchpad-canada-ai/supabase/migrations/20260523000000_fix_handle_new_user_hybrid.sql`
3. Optional diagnostics before/after:

```sql
-- Current trigger function (should mention user_id / hybrid after fix)
select pg_get_functiondef('public.handle_new_user()'::regprocedure);

-- user_id should be nullable after fix
select column_name, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'profiles'
  and column_name in ('user_id', 'referral_code', 'role', 'membership_status');
```

4. **Stuck users**: If signup failed mid-flight, auth user may exist without a profile. After the fix, use membership **Resend confirmation** or delete the orphan in Authentication → Users and sign up again.

## Directory `/auth` (launchpad-canada-ai)

**Symptoms**

- Login: `POST .../auth/v1/token?grant_type=password` → **400** (often `email_not_confirmed` or invalid credentials)
- Signup: `POST .../functions/v1/signup` → **500** (`Database error saving new user` from broken trigger, or Resend failure)

**App fix (repo)**

- `src/pages/Auth.tsx` now uses `supabase.auth.signUp()` instead of the custom `signup` edge function (broken confirmation URL + duplicate admin path).
- `src/lib/authErrors.ts` maps common Auth errors to clearer toasts.

**Supabase dashboard (after SQL fix)**

1. **Authentication → URL configuration**: add `https://rtmbusinessdirectory.com/auth` (and `http://localhost:5173/auth` for local) to **Redirect URLs**.
2. **Authentication → Providers → Email**: if **Confirm email** is enabled, users must confirm before password login (400 until confirmed). Optional: disable for internal testing only.
3. Deploy edge functions only if you still need `reset-password`; `signup` is no longer called from the main site.

## Verify

1. **SQL applied** (see Apply on production above).
2. **Directory signup**: https://rtmbusinessdirectory.com/auth → Sign Up → success toast; no 500 on `/functions/v1/signup` (request should not fire).
3. **Directory login**: confirm email if required → Sign In → 200 on token endpoint, redirect to dashboard.
4. **New signup (membership)**: https://membership.rtmbusinessdirectory.com/signup — submit form → toast success, no 500 on `/api/resend-confirmation`.
5. **Resend**: Same page → Resend confirmation → 200, email received.
6. **DB**: New user in Authentication; row in `public.profiles` with `id = user_id = auth.users.id`, `membership_status = 'pending_payment'`, `referral_code` set.
7. **Directory login** (optional): existing directory users still resolve via `profiles.user_id`.

## API route (no code change required)

`rtm-community-network/src/routes/api/resend-confirmation.ts` — uses service role `generateLink`; fix is database-only.
