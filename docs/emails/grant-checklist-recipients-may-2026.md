# Grant checklist delivery — May 2026 batch

Personalized HTML files for the four inbox requests (May 20–21, 2026).

| File | Email | Greeting |
|------|--------|----------|
| [marciamorrison049-gmail-com.html](./may-2026/marciamorrison049-gmail-com.html) | marciamorrison049@gmail.com | Hi Marcia, |
| [okunlolatokunbo-gmail-com.html](./may-2026/okunlolatokunbo-gmail-com.html) | okunlolatokunbo@gmail.com | Hi Tokunbo, |
| [nonsoa2014-gmail-com.html](./may-2026/nonsoa2014-gmail-com.html) | nonsoa2014@gmail.com | Hi Nonso, |
| [orders-southsouthpot-com.html](./may-2026/orders-southsouthpot-com.html) | orders@southsouthpot.com | Hi South South Pot team, |

## Automated send (recommended)

1. Open **Admin → Grants → Checklist leads** on rtmbusinessdirectory.com
2. Click **Send** (per row) or **Send to all new (4)** for batch
3. Requires `admin-grants-bff` deployed with `RESEND_API_KEY` on Supabase

**Subject:** `Your RTM Free Grant Checklist + next steps`  
**From:** `RTM Grants <noreply@rtmbusinessdirectory.com>`  
**Reply-to:** `info@rtmbusinessdirectory.com`

Leads are seeded in `grant_checklist_leads` (migration `20260523100000`).

## Regenerate HTML files

```bash
node scripts/generate-checklist-emails.mjs
```

## Manual send

Open any file above in a browser, copy HTML into your mail client, attach `RTM_Grant_Checklist.pdf`.
