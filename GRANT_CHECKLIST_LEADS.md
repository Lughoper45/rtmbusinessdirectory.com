# Free Grant Checklist leads

## Current behavior (before this change)

The **Request checklist** CTA on [GrantPilot](/grants) (`src/pages/GrantPilot.tsx`) was a **`mailto:info@rtmbusinessdirectory.com?subject=Grant Checklist Request`** link. Submissions went **only to the RTM inbox** — no Supabase table, no edge function, no auto-reply.

The checklist is **not** in `rtm-community-network`; it lives on the directory site at **`/grants`**.

## What was built

| Piece | Purpose |
|-------|---------|
| `grant_checklist_leads` table (kajwp) | Stores email, optional name, source, status, notes |
| `grant-checklist-lead` edge function | Inserts lead, auto-replies to requester, notifies RTM (Resend) |
| `GrantChecklistRequestDialog` | Replaces mailto on `/grants` |
| `/admin/grants` → **Checklist leads** tab | List leads, update status/notes, mailto + copy reply template |
| Seed rows | Four inbox leads from May 20–21, 2026 |

### Status values

`new` → `contacted` → `replied` → `closed`

---

## Respond to the 4 people now (copy-paste)

**Subject:** `Your Free Grant Checklist — RTM`

Send from **info@rtmbusinessdirectory.com** to each address below. Personalize the greeting if you know their name.

```
Hello,

Thank you for requesting the Free Grant Checklist from RTM Business Directory — and sorry for the delay getting back to you.

Download your general preparation checklist (PDF):
https://www.rtmbusinessdirectory.com/downloads/RTM_Grant_Checklist.pdf

This PDF covers document prep and application steps used across many programs. A personalized program shortlist comes with the Maple Checklist advisor package or your member Funding Workspace after you build your RTM Grant Profile.

An RTM grant advisor will follow up within two business days with next steps for Canadian programs that may fit your business.

Grants hub (packages and featured programs):
https://www.rtmbusinessdirectory.com/grants

RTM membership ($100/year) unlocks member package pricing (50% off list — Maple Checklist from $149) and the Funding Workspace:
https://membership.rtmbusinessdirectory.com/signup

Funding Workspace (members): https://grants.rtmbusinessdirectory.com

Questions? Reply to this email or call +1 416 900 8728.

Warm regards,
RTM Grant Advisory Team
640 Sentinel Road, North York, ON M3J 0B2
info@rtmbusinessdirectory.com
```

**Recipients:**

| Email | Requested |
|-------|-----------|
| marciamorrison049@gmail.com | May 21 |
| okunlolatokunbo@gmail.com | May 20 |
| nonsoa2014@gmail.com | May 20 |
| orders@southsouthpot.com | May 20 |

After sending, mark each lead **contacted** or **replied** in `/admin/grants` → Checklist leads.

---

## Deploy steps

### 1. Run migration on kajwp

Project ref: `kajwpmyloxaqeciyndwf`

```powershell
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase db push --project-ref kajwpmyloxaqeciyndwf
```

Or run `supabase/migrations/20260523100000_grant_checklist_leads.sql` in the [SQL editor](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/sql).

### 2. Deploy edge function

Uses existing **`RESEND_API_KEY`** (same as other functions). Optional secrets:

| Secret | Default |
|--------|---------|
| `GRANT_CHECKLIST_NOTIFY_EMAIL` | `info@rtmbusinessdirectory.com` |
| `SITE_URL` | `https://rtmbusinessdirectory.com` |
| `GRANTS_PAGE_URL` | `{SITE_URL}/grants` |
| `GRANT_CHECKLIST_PDF_URL` | `{SITE_URL}/downloads/RTM_Grant_Checklist.pdf` |
| `GRANTS_APP_URL` | `https://grants.rtmbusinessdirectory.com` |
| `MEMBERSHIP_APP_URL` | `https://membership.rtmbusinessdirectory.com` |

### Checklist asset (source + PDF)

| File | URL (after deploy) |
|------|-------------------|
| `public/downloads/RTM_Grant_Checklist.html` | Print source — open in browser → Save as PDF |
| `public/downloads/RTM_Grant_Checklist.pdf` | https://www.rtmbusinessdirectory.com/downloads/RTM_Grant_Checklist.pdf |

Regenerate PDF locally: `node scripts/generate-grant-checklist-pdf.mjs` (requires `npm i -D puppeteer` once).

```powershell
npx supabase functions deploy grant-checklist-lead --project-ref kajwpmyloxaqeciyndwf --no-verify-jwt
```

Dashboard: [Edge Functions](https://supabase.com/dashboard/project/kajwpmyloxaqeciyndwf/functions) → `grant-checklist-lead` → **Enforce JWT Verification OFF**.

### 3. Deploy frontend (Vercel)

Push to the directory repo; Vercel redeploys `rtmbusinessdirectory.com` (and `/grants`, `/admin/grants`).

### 4. Verify

1. Open https://rtmbusinessdirectory.com/grants — submit test email (use your own).
2. Confirm row in `/admin/grants` → Checklist leads.
3. Confirm auto-reply + team notification if Resend is configured.

---

## Manual seed (if migration already ran without seed)

```sql
insert into public.grant_checklist_leads (email, source, status, created_at, notes)
select v.email, v.source, v.status, v.created_at, v.notes
from (values
  ('marciamorrison049@gmail.com'::text, 'email_inbound'::text, 'new'::text, '2026-05-21T12:00:00+00'::timestamptz, 'Imported from inbox'),
  ('okunlolatokunbo@gmail.com', 'email_inbound', 'new', '2026-05-20T12:00:00+00', 'Imported from inbox'),
  ('nonsoa2014@gmail.com', 'email_inbound', 'new', '2026-05-20T12:00:00+00'::timestamptz, 'Imported from inbox'),
  ('orders@southsouthpot.com', 'email_inbound', 'new', '2026-05-20T12:00:00+00', 'Imported from inbox')
) as v(email, source, status, created_at, notes)
where not exists (
  select 1 from public.grant_checklist_leads g where lower(g.email) = lower(v.email)
);
```

(Fix typo in third row if copying manually: use quoted timestamptz for all rows.)

---

## Code references

- Templates: `src/lib/grantChecklistLeads.ts`
- Submit service: `src/services/grantChecklist.ts`
- Edge function: `supabase/functions/grant-checklist-lead/index.ts`
- Admin UI: `src/pages/admin/AdminGrants.tsx`
