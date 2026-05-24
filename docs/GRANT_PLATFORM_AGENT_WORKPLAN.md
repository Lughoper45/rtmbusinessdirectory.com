# RTM Grant Platform — Agent Execution Workplan

**Document type:** Master Product Spec v2.0 → executable task registry for AI agents and developers  
**Version:** 1.0 · May 2026  
**Supersedes:** Ad-hoc FIX_ROADMAP notes; complements [GRANT_PLATFORM_ROADMAP.md](../GRANT_PLATFORM_ROADMAP.md) (summary view)  
**Authority:** [Master Product Specification v2.0](../GRANT_PLATFORM_ROADMAP.md) (user-provided May 2026 spec — trust, funnel, ops, SEO)

> **North star:** Legitimate private Canadian grant advisory platform. Passes Stripe, legal, security, and user scrutiny. Every visible feature works end-to-end in production without manual workarounds.

---

## 0 — How agents should use this document

### 0.1 Read order (every session)

1. This file — find your task ID and check **status** + **dependencies**.
2. [PLATFORM.md](../PLATFORM.md) — repos, domains, Supabase project, membership rules.
3. [VERCEL_DEPLOY.md](../VERCEL_DEPLOY.md) — deploy author rules (grants Hobby project requires Jothan tip commit unless moved to Lughoper45).
4. Task-specific doc: [GRANT_PACKAGES.md](../GRANT_PACKAGES.md), [GRANT_INTAKE_HUB_PLAN.md](../GRANT_INTAKE_HUB_PLAN.md), [RTM_AI_INTEGRATION_ROADMAP.md](./RTM_AI_INTEGRATION_ROADMAP.md).

### 0.2 Repos and domains

| Repo | Path (local) | Production domain | Branch |
|------|----------------|-------------------|--------|
| **launchpad-canada-ai** | `launchpad-canada-ai/` | `rtmbusinessdirectory.com` | `main` (Lughoper45/rtmbusinessdirectory.com — push may need collaborator access) |
| **stellar-business-os** | `stellar-business-os/` | `grants.rtmbusinessdirectory.com`, `worldcup.rtmbusinessdirectory.com` | `main` (jothanjoseph26-ctrl/stellar-business-os) |
| **rtm-community-network** | separate | `membership.rtmbusinessdirectory.com` | membership flows only |

**Supabase (all apps):** `kajwpmyloxaqeciyndwf`  
**Never commit:** `.env`, service role keys, Stripe secrets, `OPENROUTER_API_KEY`.

### 0.3 Agent execution rules

| Rule | Detail |
|------|--------|
| **Minimize scope** | One task ID per PR/commit when possible. Do not refactor unrelated code. |
| **Both repos** | Trust UI (disclaimer, score labels) must ship in **launchpad + stellar** unless task says otherwise. |
| **Edge functions** | Deploy from launchpad: `npx supabase functions deploy <name> --project-ref kajwpmyloxaqeciyndwf` |
| **Migrations** | Apply on kajwp before UI that depends on new columns/tables. |
| **No mock in prod** | Remove `setTimeout` fake AI, hardcoded grant lists, placeholder legal text before marking DONE. |
| **Deploy grants** | After stellar push: tip commit author must be `jothanjoseph26-ctrl` on jothans-projects Hobby — see [stellar VERCEL_DEPLOY.md](../../stellar-business-os/VERCEL_DEPLOY.md). |
| **Verify** | Run `npm run build` in affected repo; hit acceptance criteria checklist before marking task DONE. |
| **Ops tasks** | Human email actions (checklist leads) — document completion of completion in admin, do not fake. |

### 0.4 Status legend

| Status | Meaning |
|--------|---------|
| **DONE** | Shipped to production or fully implemented locally with deploy unblocked |
| **PARTIAL** | Code exists; not deployed, incomplete wiring, or missing cross-repo parity |
| **TODO** | Not started |
| **BLOCKED** | External dependency (Vercel access, DNS, counsel review, Stripe dashboard) |

---

## 1 — Progress vs Master Spec v2.0 (honest snapshot)

*Updated May 2026 after AI + LaunchBot sprint. Spec Section 2 assumed some items were still mock — several are now ahead.*

### 1.1 Completed or ahead of spec

| Area | Spec said | Actual state | Task IDs |
|------|-----------|--------------|----------|
| **217 grants in DB** | PASS | Migration `20260524140000_import_rtm_canada_grants.sql` + `fetchGrantCatalog` | GP-DATA-001 |
| **Shared auth (kajwp)** | PASS | Single project; `platformAuthHandoff` / `getGrantsWorkspaceUrl` | — |
| **Stripe checkout edge fn** | PASS | `grant-package-checkout` + docs in GRANT_PACKAGES.md | GP-REV-003 |
| **Intake hub schema** | PASS | `grant_intakes`, `grant_service_orders`, migrations applied | GP-INT-001 |
| **Checklist lead capture** | PASS | `grant-checklist-lead` + admin tab | GP-OPS-002 |
| **Homepage AI (directory)** | FIX (mock) | **DONE** — `AIChatAssistant` → `directory-assistant` OpenRouter | GP-AI-001 |
| **LaunchBot (grants workspace)** | Not in v2 spec | **DONE** — real AI + Option C workflow/actions (`stellar` 311d786+) | GP-AI-002 |
| **Grant intake AI backend** | BUILD | **PARTIAL** — `grant-intake-assistant` deployed; `GrantIntakeHub` on launchpad GrantDetail | GP-AI-003 |
| **Listing AI migration** | — | **DONE** — `generate-business-description`, `analyze-website` → OpenRouter | GP-AI-004 |
| **AI rate limiting** | — | **DONE** — `20260524150000_ai_rate_limits.sql` + shared rateLimit.ts | GP-AI-005 |
| **GrantCatalog (local)** | FIX (not deployed) | **PARTIAL** — built in launchpad; `GrantPilot` uses it locally; **prod may still lag** | GP-PROD-001 |
| **GrantDetail + intake hub UI** | — | **PARTIAL** — launchpad `GrantDetail.tsx` + `GrantIntakeHub.tsx` | GP-INT-002 |
| **directory-assistant grounding** | — | **DONE** — live grants/profile context, LaunchBot workflow payload | GP-AI-006 |
| **Official URL on detail (stellar)** | FIX | **PARTIAL** — `GrantDetail.tsx`, `GrantMarketplace.tsx` show link; catalog cards incomplete | GP-UX-003 |

### 1.2 Still open (spec remains accurate)

| Area | Status | Priority | Task IDs |
|------|--------|----------|----------|
| Grant advisory disclaimer | **DONE** | **P0** | GP-TRUST-001 |
| Privacy / Terms / Cookies (real content) | **DONE** | **P0** | GP-TRUST-002 |
| Match score labeling | **DONE** | **P0** | GP-UX-001 |
| Package CTAs → Stripe (not mailto) | **DONE** | **P0** | GP-REV-001, GP-REV-002 |
| GrantCatalog on **production** marketing `/grants` | **DONE** (local commit `9b6d7d7`; push needs Lughoper45) | **P0** | GP-PROD-001 |
| stellar still uses `GrantDiscovery` | **DONE** | **P1** | GP-PROD-002 — pushed `3020536` |
| Vercel split / author mismatch | **BLOCKED** (human) | **P1** | GP-INFRA-001 |
| `GrantsSection.tsx` mock data | **DONE** | **P1** | GP-PROD-003 |
| Post-checkout auto-intake (webhook) | **DONE** | **P1** | GP-INT-003 / GP-REV-003 |
| 4 checklist leads unanswered | **BLOCKED** (human ops) | **P0** | GP-OPS-001 — see OPS_CHECKLIST_LEADS.md |
| Resend + SPF/DKIM | **BLOCKED** (human DNS) | **P1** | GP-OPS-003 |
| Lead/order alert webhooks | **DONE** (checklist + stripe webhook email) | **P2** | GP-OPS-004 |
| SEO, sitemap, JSON-LD, security.txt | **DONE** | **P2** | GP-SEO-001–004 |
| LaunchBot on launchpad marketing site | — | **P3** | GP-AI-007 (optional parity) |

---

## 2 — Task registry (agent-executable)

Each task has: **ID**, **status**, **repos**, **files**, **steps**, **acceptance criteria**, **spec section**, **depends on**.

---

### TRUST & COMPLIANCE (Spec §3) — Week 1 / Days 1–2

#### GP-TRUST-001 — Grant advisory disclaimer component
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §3.1 |
| **Repos** | launchpad + stellar |
| **Create** | `src/components/grantpilot/GrantAdvisoryDisclaimer.tsx` (both repos — keep copy identical) |
| **Props** | `variant: 'full' \| 'slim'` |
| **Copy** | Verbatim baseline from Master Spec §3.1 (private advisory, not government, no guarantee, no auto-submit without consent) |
| **Mount** | launchpad: `GrantPilot.tsx`, `GrantDetail.tsx`; stellar: `GrantPilot.tsx`, `GrantDetail.tsx`, `GrantPackages.tsx` |
| **Style** | Muted bg, info/shield icon, links to `/privacy` and `/terms`, **not dismissible** |
| **Acceptance** | Visible on `/grants` above fold or directly under hero; on every grant detail; on packages page; automated scan finds disclaimer text |
| **Depends on** | — |

#### GP-TRUST-002 — Replace placeholder legal pages
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §3.2 |
| **Repo** | launchpad |
| **File** | `src/pages/ContentPage.tsx` (routes `/privacy`, `/terms`, `/cookies`) |
| **Remove** | All user-visible "should be reviewed by counsel" / placeholder language |
| **Include** |embedding per spec: PIPEDA, Supabase/Stripe/Resend processors, Storage `grant-documents`, retention, refund policy, package prices, Ontario governing law |
| **Acceptance** | No placeholder text; Stripe dashboard business URL can point to live `/terms` and `/privacy` |
| **Depends on** | — |
| **Note** | Mark internal `[REVIEW: counsel]` only in draft commits if needed — never in production strings |

#### GP-UX-001 — Match score labeling standard
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §3.3 |
| **Repos** | both |
| **Files** | launchpad: `src/lib/grants.ts`, `GrantCatalog.tsx`, `GrantDetail.tsx`, `GrantDiscovery.tsx`; stellar: `GrantDiscovery.tsx`, `GrantMarketplace.tsx`, `RecommendedGrants.tsx`, `ApplyForMeModal.tsx`; FAQ copy in `GrantPilot.tsx` |
| **Change** | "Eligibility match" / "X% match" → **"RTM compatibility estimate"** / **"X% compatibility"** with tooltip: *"Based on your RTM profile and published program criteria. Only the program administrator can confirm eligibility."* |
| **CTA** | "Get Funding" → "Prepare your application" where applicable |
| **Acceptance** | `rg "Eligibility match|verified eligibility|% match"` returns no user-facing strings without qualifier |
| **Depends on** | — |

#### GP-UX-003 — Official program URLs on catalog cards
| Field | Value |
|-------|-------|
| **Status** | PARTIAL |
| **Spec** | §5.2 |
| **Repos** | launchpad (primary), stellar |
| **Files** | `GrantCatalog.tsx`, `GrantDiscovery.tsx` (until removed), `GrantDetail.tsx` |
| **Change** | Primary card CTA: **View official program guide** → `grant.official_url` (`target="_blank" rel="noopener noreferrer"`) |
| **Fallback** | Missing URL → Contact advisor mailto with grant name in subject — never silent omission |
| **Acceptance** | Sample grants `fed-001`, `on-001`, `bc-001` show working external links |
| **Depends on** | — |

---

### REVENUE FUNNEL (Spec §4) — Days 6–7

#### GP-REV-001 — Marketing → grants workspace checkout URL
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §4.1–4.2 |
| **Repo** | launchpad |
| **File** | `src/lib/grantPackages.ts` — add `getPackageCheckoutUrl(packageId: string): string` |
| **Behavior** | URL = `{GRANTS_APP_URL}/grants/packages?package={packageId}`; append session handoff via existing `getGrantsWorkspaceUrl` when session available |
| **Replace** | `getPackageRequestMailto()` on **primary** package CTAs in `GrantPilot.tsx`, `ApplyForMeModal.tsx` |
| **Keep** | mailto only as secondary "Contact advisor" |
| **Acceptance** | Clicking Maple/True North/Northern Star on marketing `/grants` navigates to grants subdomain packages page with correct `?package=` |
| **Depends on** | GP-TRUST-001 (disclaimer on destination pages) |

#### GP-REV-002 — GrantPackages Stripe primary CTA
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §4.1 step 4–5 |
| **Repo** | stellar |
| **File** | `src/pages/GrantPackages.tsx` |
| **Steps** | 1) Read `?package=` on mount and highlight package. 2) Wire **Buy Package** → `startGrantPackageCheckout({ packageId, grantId })`. 3) If no `grantId`, open grant selection modal before checkout. 4) Success URL: `/grants/intake/:grantId?checkout=success`. Cancel: `/grants/packages`. |
| **Acceptance** | Stripe test mode completes; no primary mailto on packages page |
| **Depends on** | GP-REV-001, GP-TRUST-001 |

#### GP-REV-003 — Webhook → service order + intake row
| Field | Value |
|-------|-------|
| **Status** | PARTIAL |
| **Spec** | §4.1 step 6, §4.2 webhook |
| **Repo** | launchpad (edge functions on kajwp) |
| **Files** | `supabase/functions/stripe-webhook/index.ts`, `grant-package-checkout/index.ts` |
| **Steps** | Confirm `grant_service_orders` created; extend webhook to create `grant_intakes` with status suitable for advisor queue; Resend confirmation email; advisor alert (email or Slack secret) |
| **Acceptance** | Test payment → rows in both tables → user lands on intake success URL → admin shows new intake |
| **Depends on** | GP-REV-002, GP-OPS-003 |

---

### PRODUCT & DEPLOY (Spec §5) — Days 5, 8–9

#### GP-PROD-001 — Deploy 217-grant catalog (launchpad marketing)
| Field | Value |
|-------|-------|
| **Status** | PARTIAL |
| **Spec** | §5.1 |
| **Repo** | launchpad |
| **Files** | `GrantCatalog.tsx`, `GrantPilot.tsx`, `GrantDetail.tsx`, migration `20260524140000_import_rtm_canada_grants.sql` |
| **Steps** | 1) Confirm migration applied on kajwp (`select count(*) from grants where is_active`). 2) Commit any pending catalog changes. 3) Push + deploy Lughoper45 Vercel (directory). 4) Verify prod `/grants` shows searchable catalog not 3-card Featured only. |
| **Acceptance** | `/grants/:id` loads `fed-001` with real data; full catalog searchable |
| **Depends on** | GP-UX-001, GP-UX-003, GP-TRUST-001 for production-ready trust |
| **Blocker** | launchpad git push 403 if Lughoper45 lacks write — resolve GitHub access first |

#### GP-PROD-002 — Port GrantCatalog to stellar (replace GrantDiscovery)
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §5.1 (grants subdomain parity) |
| **Repo** | stellar |
| **Steps** | Copy/adapt launchpad `GrantCatalog.tsx` + `fetchGrantCatalog` from `src/lib/grants.ts`; replace `GrantDiscovery` in `GrantPilot.tsx`; port disclaimer + label changes |
| **Acceptance** | `grants.rtmbusinessdirectory.com/grants` shows full catalog |
| **Depends on** | GP-PROD-001 patterns, GP-TRUST-001, GP-UX-001 |

#### GP-PROD-003 — Delete mock grant artifacts
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §5.1 |
| **Repo** | launchpad |
| **Delete** | `src/components/GrantsSection.tsx` |
| **Deprecate** | `GrantDiscovery.tsx` after catalog live (or thin wrapper only) |
| **Acceptance** | `rg "GrantsSection|mockBusinesses"` — no grant UI using hardcoded fake programs |

---

### OPERATIONS (Spec §7) — Day 4, Day 10

#### GP-OPS-001 — Clear 4 checklist leads (human)
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §7.1 |
| **Action** | Email checklist PDF v2 + 3-question eligibility follow-up to: marciamorrison049@gmail.com, okunlolatokunbo@gmail.com, nonsoa2014@gmail.com, orders@southsouthpot.com |
| **Admin** | Mark contacted in `/admin/grants` → Checklist leads |
| **Acceptance** | All 4 status ≠ `new` |
| **Agent note** | Prepare template + admin update instructions; human sends email |

#### GP-OPS-002 — Verify checklist auto-reply
| Field | Value |
|-------|-------|
| **Status** | PARTIAL |
| **Spec** | §7.4 |
| **Steps** | Confirm `RESEND_API_KEY` in kajwp edge secrets; submit test lead on production; confirm inbox auto-reply |
| **Acceptance** | Auto-reply within minutes |

#### GP-OPS-003 — Resend domain authentication (SPF/DKIM/DMARC)
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §6.4, §7.4 |
| **Owner** | Infra / DNS (human) |
| **Steps** | Resend dashboard → domain auth for `rtmbusinessdirectory.com`; add DNS records; test from `noreply@rtmbusinessdirectory.com` |
| **Acceptance** | Transactional mail not in spam; checklist auto-reply deliverability |

#### GP-OPS-004 — Lead + order alert webhooks
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §7.2 |
| **Steps** | Supabase Database Webhook on INSERT to `grant_checklist_leads` and `grant_service_orders` → edge function or Slack URL secret; fire within 5 minutes |
| **Acceptance** | New lead/purchase notifies team without manual admin polling |

---

### INFRASTRUCTURE (Spec §2, §8 Days 8–9)

#### GP-INFRA-001 — Vercel consolidation
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Spec** | §2, §8 Day 8 |
| **Goal** | Single `git push` deploys grants without Jothan empty commit |
| **Steps** | Option A: Import `stellar-business-os` under **Lughoper45** Vercel; point `grants.rtmbusinessdirectory.com`; disable jothans-projects duplicate. Option B (interim): Jothan trigger commit per [stellar VERCEL_DEPLOY.md](../../stellar-business-os/VERCEL_DEPLOY.md) |
| **Acceptance** | Lughoper45 push → production deploy succeeds |
| **Align** | `VITE_SUPABASE_*` identical on directory, membership, grants Vercel projects |

#### GP-INFRA-002 — Align env vars across 3 Vercel projects
| Field | Value |
|-------|-------|
| **Status** | PARTIAL |
| **Reference** | [stellar docs/VERCEL_DEPLOY_STELLAR.md](../../stellar-business-os/docs/VERCEL_DEPLOY_STELLAR.md) |
| **Acceptance** | All apps use kajwp URL + anon key; no legacy `vinbf` or truncated URLs |

---

### INTAKE HUB (Spec §4.1 step 6–7, §8 Weeks 5–6)

#### GP-INT-001 — Schema
| **Status** | DONE — see `20260524120000_grant_intake_hub.sql` |

#### GP-INT-002 — GrantIntakeHub UI (launchpad)
| Field | Value |
|-------|-------|
| **Status** | PARTIAL |
| **Files** | `src/components/grantpilot/GrantIntakeHub.tsx`, `src/pages/GrantDetail.tsx`, `src/services/grantIntakeAssistant.ts` |
| **Remaining** | Production deploy; stellar parity on `GrantIntake.tsx` route; end-to-end with paid orders |
| **Reference** | [GRANT_INTAKE_HUB_PLAN.md](../GRANT_INTAKE_HUB_PLAN.md) Phases 2–4 |

#### GP-INT-003 — Post-payment intake landing
| Field | Value |
|-------|-------|
| **Status** | TODO |
| **Route** | stellar `/grants/intake/:grantId?checkout=success` |
| **Depends on** | GP-REV-003 |

---

### AI PLATFORM (ahead of Spec §2 — track separately)

| ID | Task | Status | Repo | Key files |
|----|------|--------|------|-----------|
| GP-AI-001 | Directory homepage chat → OpenRouter | **DONE** | launchpad | `AIChatAssistant.tsx`, `directory-assistant/` |
| GP-AI-002 | LaunchBot guided workflow (Option C) | **DONE** | stellar | `LaunchBotWidget.tsx`, `launchbot/*`, `launchBotActions.ts` |
| GP-AI-003 | Grant intake assistant UI | **PARTIAL** | launchpad | `GrantIntakeHub.tsx`, `grant-intake-assistant/` |
| GP-AI-004 | Listing AI → OpenRouter | **DONE** | launchpad | `generate-business-description`, `analyze-website` |
| GP-AI-005 | AI rate limits | **DONE** | launchpad | `20260524150000_ai_rate_limits.sql` |
| GP-AI-006 | LaunchBot workflow/actions in edge fn | **DONE** | launchpad | `_shared/launchBotWorkflow.ts`, deployed `directory-assistant` |
| GP-AI-007 | Port LaunchBot to launchpad `/grants` (optional) | **TODO** | launchpad | Reuse stellar pattern or embed link to grants workspace |

**Full AI spec:** [RTM_AI_INTEGRATION_ROADMAP.md](./RTM_AI_INTEGRATION_ROADMAP.md)

**Agent note:** Do not revert AI to mock. New grant/marketing AI work extends `directory-assistant` — never expose OpenRouter key in frontend.

---

### SEO & GLOBAL VISIBILITY (Spec §6) — Days 9–10, backlog

#### GP-SEO-001 — Sitemaps + Search Console
| **Status** | TODO | Submit sitemaps for directory + grants; request re-crawl `/` and `/grants` |

#### GP-SEO-002 — WordPress 301 redirects
| **Status** | TODO | `/business-type/*` → `/directory`; `/registration/` → `/auth`; per spec §6.1 |

#### GP-SEO-003 — Organisation JSON-LD
| **Status** | TODO | Homepage `ProfessionalService` schema per spec §6.3 |

#### GP-SEO-004 — security.txt + CSP headers
| **Status** | TODO | `public/.well-known/security.txt`; `vercel.json` headers §6.4 |

#### GP-SEO-005 — Per-page SEO for `/grants` and `/grants/:id`
| **Status** | TODO | Title, meta description, canonical — spec §6.2 table |

---

## 3 — Six-week sprint schedule (agent pick-up order)

Tasks sequenced per Master Spec §8. **Start at first TODO** unless user directs otherwise.

| Day | Focus | Task IDs | Exit gate |
|-----|-------|----------|-----------|
| **1** | Trust foundation | GP-TRUST-001 | Disclaimer live both repos |
| **2** | Legal pages | GP-TRUST-002 | No placeholder on /privacy, /terms, /cookies |
| **3** | UX honesty + catalog links | GP-UX-001, GP-UX-003 | Score labels + official URLs |
| **4** | Ops + email | GP-OPS-001, GP-OPS-002, GP-OPS-003 | 4 leads contacted; auto-reply verified |
| **5** | Deploy catalog | GP-PROD-001, GP-PROD-002, GP-PROD-003 | Prod shows 217 grants |
| **6–7** | Revenue funnel | GP-REV-001, GP-REV-002, GP-REV-003 | Stripe E2E without mailto primary |
| **8** | Infra | GP-INFRA-001, GP-INFRA-002 | Deploy without author hack |
| **9** | SEO pass 1 | GP-SEO-001, GP-SEO-002, GP-SEO-003 | Sitemap + schema committed |
| **10** | E2E + alerts | GP-OPS-004, GP-SEO-004, full funnel test | Spec §8 Day 10 checklist |
| **11–14** | Auth handoff + copy audit | Cross-subdomain §5.3 | ≤2 clicks member → checkout |
| **15–30** | Intake hub completion | GP-INT-002, GP-INT-003, GRANT_INTAKE_HUB Phases 2–4 | Paid → intake → advisor queue |

---

## 4 — Recommended agent workflow (single task)

```
1. User assigns task ID (e.g. GP-TRUST-001)
2. Agent reads task row + spec section + PLATFORM.md
3. Agent implements in listed files (both repos if needed)
4. npm run build in each touched repo
5. Deploy: edge functions (if any) → git push → Vercel trigger (stellar: Jothan tip if needed)
6. Agent runs acceptance criteria; updates task status in this doc (or reports to user)
7. Do NOT commit .env; warn if user asks to commit secrets
```

### Deploy commands (copy-paste)

```powershell
# Edge function (launchpad)
cd "c:\Users\flood\new rtm\launchpad-canada-ai"
npx supabase functions deploy directory-assistant --project-ref kajwpmyloxaqeciyndwf

# Stellar grants app — after feature commit
cd "c:\Users\flood\new rtm\stellar-business-os"
git push origin main
# If Hobby author block:
$env:GIT_AUTHOR_NAME='jothanjoseph26-ctrl'
$env:GIT_AUTHOR_EMAIL='245008573+jothanjoseph26-ctrl@users.noreply.github.com'
$env:GIT_COMMITTER_NAME='jothanjoseph26-ctrl'
$env:GIT_COMMITTER_EMAIL='245008573+jothanjoseph26-ctrl@users.noreply.github.com'
git commit --allow-empty -m "chore: trigger Vercel deploy with project owner as commit author."
git push origin main
```

---

## 5 — Cross-repo file map (quick reference)

### launchpad-canada-ai (`rtmbusinessdirectory.com`)

```
src/components/grantpilot/
  GrantAdvisoryDisclaimer.tsx     GP-TRUST-001 (CREATE)
  GrantCatalog.tsx                GP-PROD-001 (DEPLOY)
  GrantIntakeHub.tsx              GP-INT-002 (PARTIAL)
  GrantDiscovery.tsx              GP-PROD-003 (REMOVE)
src/pages/
  GrantPilot.tsx                  GP-TRUST-001, GP-REV-001, GP-UX-001
  GrantDetail.tsx                 GP-TRUST-001, GP-UX-001, GP-UX-003
  ContentPage.tsx                 GP-TRUST-002
src/lib/
  grantPackages.ts                GP-REV-001 (getPackageCheckoutUrl)
  grants.ts                       GP-UX-001 (display label helper)
src/components/
  AIChatAssistant.tsx             GP-AI-001 (DONE)
  GrantsSection.tsx               GP-PROD-003 (DELETE)
supabase/functions/
  directory-assistant/            GP-AI-001, GP-AI-006 (DONE)
  grant-intake-assistant/         GP-AI-003
  grant-package-checkout/         GP-REV-002
  stripe-webhook/                 GP-REV-003
  grant-checklist-lead/           GP-OPS-002
```

### stellar-business-os (`grants.rtmbusinessdirectory.com`)

```
src/components/
  LaunchBotWidget.tsx             GP-AI-002 (DONE)
  launchbot/*                       GP-AI-002 (DONE)
src/pages/
  GrantPackages.tsx               GP-REV-002, GP-TRUST-001
  GrantPilot.tsx                  GP-PROD-002, GP-TRUST-001
  GrantIntake.tsx                 GP-INT-003
src/components/grantpilot/
  GrantDiscovery.tsx              GP-PROD-002 (REPLACE)
  MasterProfileWizard.tsx         Used by LaunchBot profile_wizard action
```

---

## 6 — Definition of done (Master Spec §10)

The platform meets **done** when **all** are true simultaneously:

- [ ] Automated scan of `/grants`: disclaimer, legal links, no placeholder text, no broken forms, no government impersonation
- [ ] Stripe reviewer: live Terms + Privacy linked from checkout; refund policy; physical address; no guaranteed outcome language
- [ ] User journey: Google → 217 real programs → pay package → advisor contact → application prep — no manual steps
- [ ] Developer: deploy directory + grants from **one** Vercel team with **one** push (GP-INFRA-001)
- [ ] Advisor: all leads, orders, intakes visible in admin — no SQL

---

## 7 — Success metrics (30 days post-sprint — Spec §9)

| Metric | Target | Source |
|--------|--------|--------|
| Package checkout starts from marketing | ≥1/week | Stripe + UTM |
| Stripe checkout completion | ≥60% | Stripe |
| Time to first advisor contact | <2 business days | `grant_checklist_leads.contacted_at` |
| Catalog load errors | <1% sessions | Frontend logs |
| Vercel deploy success | 100% on unified owner | Vercel dashboard |
| Disclaimer on scan | Pass | Manual + a11y scan |
| Legal pages zero placeholder | Pass | Manual review |
| `/grants` indexed | Within 30 days | Search Console |
| security.txt | Pass | `/.well-known/security.txt` |

---

## 8 — Explicit non-goals (do not implement)

Per Master Spec §1.2 — agents must **not**:

- Imply government affiliation (.gc.ca styling, official logos)
- Label heuristic scores as verified eligibility
- Auto-submit to government portals without explicit user consent
- Collect SIN/banking in marketing forms
- Use mailto as **primary** payment path
- Ship placeholder legal pages to production
- Put API keys in frontend bundles

---

## 9 — Related documents

| Document | Purpose |
|----------|---------|
| [GRANT_PLATFORM_ROADMAP.md](../GRANT_PLATFORM_ROADMAP.md) | Human-readable sprint summary |
| [GRANT_INTAKE_HUB_PLAN.md](../GRANT_INTAKE_HUB_PLAN.md) | Intake data model + phases |
| [GRANT_PACKAGES.md](../GRANT_PACKAGES.md) | Stripe products + webhook |
| [RTM_AI_INTEGRATION_ROADMAP.md](./RTM_AI_INTEGRATION_ROADMAP.md) | AI architecture (mostly DONE) |
| [PLATFORM.md](../PLATFORM.md) | Domains, databases, membership |
| [VERCEL_DEPLOY.md](../VERCEL_DEPLOY.md) | Directory/membership deploy |
| [stellar VERCEL_DEPLOY.md](../../stellar-business-os/VERCEL_DEPLOY.md) | Grants deploy author rules |

---

## 10 — Next task for agents (default pick-up)

If the user says **"continue the grant platform"** without specifying:

1. **GP-TRUST-001** — Disclaimer component (highest impact, unblocks Stripe + trust scans)
2. Then **GP-TRUST-002** — Legal pages
3. Then **GP-UX-001** + **GP-UX-003** — Labels + official URLs
4. Then **GP-PROD-001** — Deploy catalog to production

**Contact (decisions / counsel):** info@rtmbusinessdirectory.com · +1 416 900 8728 · 640 Sentinel Road, North York, ON M3J 0B2
