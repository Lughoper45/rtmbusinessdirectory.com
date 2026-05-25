# RTM Grant Platform — Fix Roadmap

**Status:** Active plan  
**Last updated:** 2026-05-24  
**Agent execution guide:** [docs/GRANT_PLATFORM_AGENT_WORKPLAN.md](./docs/GRANT_PLATFORM_AGENT_WORKPLAN.md) — **use this for task IDs, file paths, deploy steps, and done/partial status**  
**Related:** [docs/GRANT_OS_IA_STRATEGY.md](./docs/GRANT_OS_IA_STRATEGY.md) (Feed vs Dashboard — canonical IA) · [docs/RTM_OPERATIONS_AUTOMATION_MASTER_PLAN.md](./docs/RTM_OPERATIONS_AUTOMATION_MASTER_PLAN.md) (ops: email → CRM → close, HITL) · [GRANT_INTAKE_HUB_PLAN.md](./GRANT_INTAKE_HUB_PLAN.md) · [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) · [GRANT_PACKAGES.md](./GRANT_PACKAGES.md) · [RTM_AI_INTEGRATION_ROADMAP.md](./docs/RTM_AI_INTEGRATION_ROADMAP.md)

> **Master Product Spec v2.0** (May 2026) is the authority for trust, funnel, and compliance. Several items in §2 "Current State" are now **ahead** — especially AI (directory-assistant, LaunchBot Option C) and local GrantCatalog. See the agent workplan §1 for the honest delta.

---

## North star

> **Backend engineering is ahead of front-facing trust signals.**  
> Close that gap so automated scanners, payment auditors, and skeptical users see a legitimate **private Canadian grant advisory platform** — and so revenue flows without manual `mailto:` steps.

### Already ahead of Master Spec v2.0 (May 2026)

| Done / partial | Detail |
|----------------|--------|
| **AI (directory)** | `AIChatAssistant` → `directory-assistant` (OpenRouter) — no longer mock |
| **AI (grants)** | LaunchBot Option C: markdown, workflow stepper, executable actions — deployed stellar `main` |
| **Grant catalog (local)** | `GrantCatalog.tsx` wired in launchpad `GrantPilot.tsx` — **prod deploy still pending** |
| **Intake hub** | Schema + `GrantIntakeHub` on launchpad detail — not full E2E with Stripe webhook |
| **217 grants migration** | SQL in repo; confirm applied on kajwp before prod catalog deploy |

Full task IDs and agent steps: **[docs/GRANT_PLATFORM_AGENT_WORKPLAN.md](./docs/GRANT_PLATFORM_AGENT_WORKPLAN.md)**.

| Layer | Today | Target (6 weeks) |
|-------|--------|------------------|
| **Trust** | Placeholder legal pages, aggressive copy, heuristic scores look official | Disclaimers, real policies, honest scoring labels |
| **Funnel** | Marketing → mailto; workspace → Stripe | Single path: browse → sign in → pay → intake |
| **Ops** | Checklist leads in DB; manual inbox | Auto-reply + SLA alerts + admin queue |
| **Deploy** | Split Vercel owners; local catalog not shipped | One owner; directory + grants deploy in sync |

---

## What we are fixing (consolidated findings)

### Confirmed real (keep building on this)

- **217 active grants** in Supabase (`kajwpmyloxaqeciyndwf`) with `official_url` on real programs
- Shared auth + membership gate across directory, membership, grants
- Stripe checkout edge function (`grant-package-checkout`) + webhook path documented in `GRANT_PACKAGES.md`
- Intake hub schema + Phase 2 UI in `stellar-business-os`
- Checklist lead capture (`grant-checklist-lead`) + admin tab

### Gaps to close

| Gap | Risk | Sprint |
|-------|------|--------|
| Placeholder `/privacy`, `/terms`, `/cookies` | Payment processor + trust flags | Week 1 |
| No grant disclaimer on marketing or workspace | Looks like government / guarantee | Week 1 |
| Match scores labeled like eligibility | Misleading UX | Week 1 |
| `/grants` package CTAs → `mailto:` | Revenue leak, informal ops | Week 2 |
| `GrantCatalog.tsx` not deployed (prod still `GrantDiscovery`) | Stale UX vs local work | Week 2 |
| Vercel split (Lughoper45 vs jothanjoseph26-ctrl) | Deploy friction | Week 2 |
| `GrantsSection.tsx` mock data in repo | Accidental credibility damage | Week 2 |
| 4 checklist leads unanswered | Real users waiting | Week 1 (ops) |
| Cross-subdomain auth friction | Drop-off before checkout | Week 3–4 |
| Intake hub not end-to-end in production | Paid orders don't auto-fulfill | Week 3–6 |

---

## 2-week sprint (immediate)

```
Week 1: Trust & legal patching  ──►  Week 2: Funnel + deploy + ops
         (conversion + scanners)            (revenue + pipeline)
```

### Week 1 — Trust & compliance patching

**Goal:** Any visitor, scanner, or Stripe reviewer immediately understands: *private advisory, not government, no guarantee*.

#### 1.1 Global grant disclaimer component

| Item | Detail |
|------|--------|
| **Create** | `src/components/grantpilot/GrantAdvisoryDisclaimer.tsx` (shared pattern; copy to stellar) |
| **Mount on** | `src/pages/GrantPilot.tsx`, `src/pages/GrantDetail.tsx`, stellar `GrantPilot.tsx`, `GrantDetail.tsx`, `GrantPackages.tsx` |
| **Also** | Footer on grant-related pages; optional slim banner variant for workspace |

**Required copy baseline** (Gemini-aligned; counsel can refine, not replace):

> RTM Business Directory is a private Canadian business advisory and consulting platform. We are not a government agency, we do not disburse public funds, and we do not guarantee grant approval. All programs are administered by their respective third-party or government entities, which hold sole authority over final eligibility determinations.

**Acceptance criteria**

- [ ] Visible above the fold or directly under hero on `/grants`
- [ ] Present on every grant detail page
- [ ] Link to `/privacy` and `/terms`
- [ ] No dismiss-only hide on first visit (persistent trust signal)

#### 1.2 Replace placeholder legal content

| Page | File | Action |
|------|------|--------|
| Privacy | `src/pages/ContentPage.tsx` → `privacy` | Replace placeholder sections with advisory-specific policy |
| Terms | `ContentPage.tsx` → `terms` | Cover packages, refunds, advisor scope, no guarantee |
| Cookies | `ContentPage.tsx` → `cookies` | List Supabase auth, Stripe, analytics if any |

**Policy must explicitly cover**

- Data stored in Supabase (profile, intakes, checklist leads)
- Document uploads (Storage bucket `grant-documents`)
- Advisor review process; RTM does not submit on user's behalf without consent
- Retention and contact: `info@rtmbusinessdirectory.com`, 640 Sentinel Road address
- **Legal review:** Mark sections needing counsel with `[REVIEW: counsel]` only in draft — **remove all "should be reviewed by counsel" user-facing text before deploy**

**Acceptance criteria**

- [ ] No user-visible "placeholder" language on `/privacy`, `/terms`, `/cookies`
- [ ] Grant disclaimer cross-linked from privacy policy
- [ ] Stripe dashboard business URL points to live `/terms` and `/privacy`

#### 1.3 Rename and explain match scores

| Location | Change |
|----------|--------|
| `src/lib/grants.ts` | Keep `computedMatch` internal; export display label helper |
| `GrantCatalog.tsx`, `GrantDiscovery.tsx`, `GrantDetail.tsx` | **"RTM compatibility estimate"** or **"Readiness score"** — not "Eligibility match" |
| stellar `GrantMarketplace`, `RecommendedGrants`, `ApplyForMeModal` | Same label + tooltip |

**Tooltip copy:**

> Estimate based on your RTM profile and published program criteria. Only the program administrator can confirm eligibility.

**Acceptance criteria**

- [ ] Zero instances of "verified eligibility" or "% match" without qualifier in grant UI
- [ ] FAQ on `/grants` updated to match

#### 1.4 Official outbound links in catalog

| Location | Change |
|----------|--------|
| `GrantCatalog.tsx` | Primary CTA: **View official program guide** → `grant.official_url` (new tab) |
| `GrantDetail.tsx` | Same + secondary "Prepare with RTM" for members |
| `GrantDiscovery.tsx` | Until removed, add official link on cards |

**Acceptance criteria**

- [ ] Every catalog card with `official_url` shows external link with `rel="noopener noreferrer"`
- [ ] Broken/missing URLs fall back to mailto advisor, not silent omission

#### 1.5 Ops — clear checklist backlog (same week)

| Lead | Action |
|------|--------|
| marciamorrison049@gmail.com | Send template from `GRANT_CHECKLIST_LEADS.md` |
| okunlolatokunbo@gmail.com | Same |
| nonsoa2014@gmail.com | Same |
| orders@southsouthpot.com | Same |

Mark **contacted** / **replied** in `/admin/grants` → Checklist leads.

**Acceptance criteria**

- [ ] All 4 leads status ≠ `new`
- [ ] Test checklist submit on production; confirm auto-reply if `RESEND_API_KEY` set

---

### Week 2 — Funnel alignment & technical polish

**Goal:** Marketing page hands off to the same Stripe + intake path as the workspace; ship pending UI; remove mock artifacts.

#### 2.1 Bridge marketing → Stripe checkout

**Recommended flow** (minimal new routes):

```
rtmbusinessdirectory.com/grants
  → user clicks package (e.g. maple-checklist)
  → redirect to grants.rtmbusinessdirectory.com/grants/packages?package=maple-checklist
     (with auth handoff if session exists — see getGrantsWorkspaceUrl)
  → signed-in + active member → Stripe via grant-package-checkout
  → not signed in → /auth?returnUrl=/grants/packages?package=...
  → member inactive → membership activate with returnUrl
```

| Repo | File | Change |
|------|------|--------|
| launchpad | `src/lib/grantPackages.ts` | Add `getPackageCheckoutUrl(packageId)` → grants workspace URL |
| launchpad | `src/pages/GrantPilot.tsx` | Replace `getPackageRequestMailto` on package buttons with checkout URL |
| stellar | `src/pages/GrantPackages.tsx` | Read `?package=`; wire **Buy package** → `startGrantPackageCheckout` (needs `grant_id` — use modal to pick grant or default "general advisory") |
| stellar | `src/App.tsx` | Optional: `/grants/checkout` alias → packages page with query |

**Fallback:** Keep **Contact advisor** as secondary mailto link — not primary CTA.

**Acceptance criteria**

- [ ] No primary package CTA opens raw mailto on marketing or workspace packages page
- [ ] Stripe test mode checkout completes; webhook creates `grant_service_orders` + `grant_intakes`
- [ ] Success URL documented in `GRANT_PACKAGES.md` works in production

#### 2.2 Deploy pending catalog UI (launchpad)

| File | Status |
|------|--------|
| `src/components/grantpilot/GrantCatalog.tsx` | Commit + deploy |
| `src/pages/GrantPilot.tsx` | Already switched from `GrantDiscovery` locally |
| `src/pages/GrantDetail.tsx` | Commit + deploy |
| `supabase/migrations/20260524140000_import_rtm_canada_grants.sql` | Confirm applied on kajwp (217 rows ✓) |

**Acceptance criteria**

- [ ] Production `/grants` shows full searchable catalog (not only 3-card Featured Programs)
- [ ] `/grants/:id` detail pages load for imported IDs (e.g. `fed-001`)

#### 2.3 Consolidate Vercel deployments

Follow **Option 2** in [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md):

1. Import `stellar-business-os` under **Lughoper45** Vercel team
2. Point `grants.rtmbusinessdirectory.com` to unified project
3. Disable duplicate `jothans-projects` grants project
4. Align env vars per [PLATFORM.md](./PLATFORM.md)

**Acceptance criteria**

- [ ] `git push` by Lughoper45 deploys grants without empty Jothan commit
- [ ] `VITE_SUPABASE_*` identical across directory, membership, grants Vercel projects

#### 2.4 Remove legacy mock artifacts

| File | Action |
|------|--------|
| `src/components/GrantsSection.tsx` | **Delete** (unused — not imported in `App.tsx` or `Index.tsx`) |
| `src/components/grantpilot/GrantDiscovery.tsx` | Remove after catalog deploy, or keep only as thin wrapper calling `fetchRecommendedGrants` for homepage teaser if needed |

**Acceptance criteria**

- [ ] `rg "mockBusinesses|GrantsSection"` shows no grant UI using hardcoded fake programs
- [ ] Homepage grant CTAs point to `/grants` (real catalog)

#### 2.5 Lead alert webhook (checklist + intakes)

| Piece | Detail |
|-------|--------|
| **Option A** | Extend `grant-checklist-lead` — already emails team if `RESEND_API_KEY` set; verify production |
| **Option B** | Supabase Database Webhook → edge function → Slack/Discord webhook URL secret |
| **Option C** | Daily cron edge function: `status = 'new'` leads older than 24h → digest email |

**Acceptance criteria**

- [ ] New checklist lead triggers team notification within 5 minutes
- [ ] Admin `/admin/grants` shows lead without manual SQL

---

## Priority matrix (sprint)

| Task | Effort | Impact | Owner repo | Week |
|------|--------|--------|------------|------|
| Grant disclaimer component | Low | **Max** | launchpad + stellar | 1 |
| Replace placeholder legal pages | Medium | **Max** | launchpad | 1 |
| Rename match scores + tooltips | Low | High | both explanations both repos | 1 |
| Official URL buttons in catalog | Low | High | launchpad | 1 |
| Reply to 4 checklist leads | Low | High | Ops | 1 |
| Marketing → Stripe handoff | Medium | **Max** | launchpad + stellar | 2 |
| Deploy `GrantCatalog` + detail | Low | High | launchpad | 2 |
| Vercel consolidation | Medium | High | Infra | 2 |
| Delete `GrantsSection` mock | Low | Medium | launchpad | 2 |
| Lead alert verification / webhook | Low–Med | Medium | launchpad | 2 |

---

## Weeks 3–4 — Auth & copy honesty

### 3.1 Cross-subdomain sign-in

| Task | Detail |
|------|--------|
| Membership dashboard | **Open grant workspace** always uses `getGrantsWorkspaceUrl(session, returnPath)` with package query when applicable |
| Grants `/auth` | Show one-line explanation: sessions are per site until first connect |
| Optional | Post-login redirect preserves `?package=` through handoff |

**Acceptance criteria**

- [ ] Member logged in on membership can reach package checkout on grants in ≤2 clicks without re-entering password

### 3.2 Marketing copy audit

| Current | Replace with |
|---------|----------------|
| "Up to $30,000 or more" (headline) | "Explore Canadian programs — amounts vary by program" + examples from catalog |
| "Verified programs" | "Sourced from official program listings" |
| "Get Funding" checklist. "Prepare your application" |

Files: `GrantPilot.tsx` (both repos), meta tags in `Helmet`, flyer alt text.

### 3.3 Trust footer block (all grant surfaces)

Physical address, phone, link to About + Contact, link to official program disclaimer PDF if created.

---

## Weeks 5–6 — Intake hub & revenue completion

Aligns with [GRANT_INTAKE_HUB_PLAN.md](./GRANT_INTAKE_HUB_PLAN.md) Phases 2–4.

| Milestone | Exit criteria |
|-----------|---------------|
| **Post-payment intake** | Webhook creates intake; user lands on `/grants/intake/:grantId?checkout=success` |
| **Readiness modal live** | `grant-intake-assistant` `analyze_readiness` used in production UI |
| **Step collector** | Answers persist; score updates on save |
| **Document upload** | Storage bucket + RLS; status `uploaded` |
| **Admin intakes tab** | Ops can move status without SQL |
| **Application Assistant** | `generate_draft` with disclaimer; advisor review only |

**Acceptance criteria**

- [ ] Paid Maple / True North / Northern Star order → intake row → advisor sees it in admin
- [ ] No copy implies RTM auto-submits to government portals

---

## Phase 3+ — Growth & compliance (backlog)

| Item | Notes |
|------|-------|
| **Counsel-reviewed policies** | Replace draft legal text with signed-off version |
| **PIPEDA / privacy request flow** | Email + admin export/delete procedure |
| **Organization schema** | JSON-LD on main domain for RTM entity |
| **security.txt** | `/.well-known/security.txt` with contact |
| **Resend domain auth** | SPF/DKIM for `noreply@rtmbusinessdirectory.com` |
| **SEO** | `/grants` indexable; canonical URLs; sitemap entry |
| **Stripe catalog prices** | Move from inline `price_data` to Product/Price IDs per `GRANT_PACKAGES.md` |
| **Advisor SLA dashboard** | Package → response time from `GRANT_INTAKE_HUB_PLAN.md` |

---

## Implementation map (files by repo)

### launchpad-canada-ai (`rtmbusinessdirectory.com`)

```
src/components/grantpilot/
  GrantAdvisoryDisclaimer.tsx     ← NEW (Week 1)
  GrantCatalog.tsx                ← DEPLOY (Week 2)
  GrantDiscovery.tsx              ← REMOVE or deprecate (Week 2)
src/pages/
  GrantPilot.tsx                  ← disclaimer, checkout URLs, copy (Week 1–2)
  GrantDetail.tsx                 ← disclaimer, official link, score labels (Week 1)
  ContentPage.tsx                 ← privacy, terms, cookies (Week 1)
src/lib/
  grantPackages.ts                ← getPackageCheckoutUrl (Week 2)
src/components/
  GrantsSection.tsx               ← DELETE (Week 2)
supabase/functions/
  grant-checklist-lead/           ← verify Resend + alerts (Week 2)
```

### stellar-business-os (`grants.rtmbusinessdirectory.com`)

```
src/pages/
  GrantPackages.tsx               ← Stripe primary CTA, ?package= (Week 2)
  GrantPilot.tsx                  ← disclaimer, score labels (Week 1)
  GrantDetail.tsx                 ← same (Week 1)
  GrantIntake.tsx                 ← post-checkout landing (Week 5–6)
src/components/grantpilot/
  ApplyForMeModal.tsx             ← score labels (Week 1)
  GrantMarketplace.tsx            ← score labels (Week 1)
```

---

## Definition of done (6-week program)

**Trust**

- [ ] Automated scan of `/grants` finds disclaimer + legal links + no placeholder legal text
- [ ] Gemini-style footprint review would still note low domain authority (expected) but not classify as phishing

**Funnel**

- [ ] Package purchase path measurable in Stripe dashboard from marketing referrers
- [ ] `grant_service_orders` rows correlate with marketing CTAs

**Product**

- [ ] 217-grant catalog searchable on production marketing site
- [ ] Match UI consistently labeled as estimate

**Ops**

- [ ] Checklist lead SLA: auto-reply immediate; human follow-up within 2 business days
- [ ] Admin grants tabs: leads, applications, intakes all usable

**Deploy**

- [ ] Single Vercel owner; no author-mismatch deploy blocks

---

## Suggested execution order (day-by-day)

| Day | Focus |
|-----|-------|
| **D1** | Disclaimer component + mount on launchpad `/grants` and detail |
| **D2** | Draft privacy/terms/cookies; remove placeholder copy |
| **D3** | Score labels + tooltips + official URL buttons in `GrantCatalog` |
| **D4** | Send 4 checklist emails; verify Resend on production |
| **D5** | Port disclaimer + labels to stellar; deploy grants app |
| **D6** | `getPackageCheckoutUrl`; update marketing package buttons |
| **D7** | Wire `GrantPackages.tsx` to Stripe; test webhook in staging |
| **D8** | Commit/deploy catalog; delete `GrantsSection` |
| **D9** | Vercel consolidation (Option 2) |
| **D10** | End-to-end test: checklist → member → package → intake row |
| **D11–14** | Auth handoff polish + marketing copy audit |
| **Wk 5–6** | Intake hub Phase 2–4 per existing plan |

---

## Metrics to track

| Metric | Source | Target (30 days post-sprint) |
|--------|--------|------------------------------|
| Checklist → member conversion | `grant_checklist_leads` + `profiles` | Baseline + improve |
| Package checkout starts | Stripe + `grant_service_orders` | >0/week from marketing URL |
| Checkout completion rate | Stripe | >60% |
| Time to first advisor contact | Admin lead status | <2 business days |
| Grant catalog load errors | Frontend error boundary / Supabase logs | <1% sessions |
| Deploy success rate | Vercel | 100% on Lughoper45 push |

---

## What we are explicitly not doing

- Pretending to be a government portal or using `.gc.ca` styling deceptively
- Labeling heuristic scores as official eligibility
- Auto-submitting applications to government systems without user action
- Collecting SIN/SSN/banking details in marketing lead forms
- Blocking legitimate security research — publish `security.txt` instead

---

## Next decision (pick one to start implementation)

1. **Disclaimer + legal draft** — ship trust UI this week (fastest scanner impact)  
2. **Marketing → Stripe wiring** — ship revenue loop (highest business impact)  
3. **Vercel consolidation** — unblock all other deploys (highest eng velocity impact)

Recommended order: **1 → 3 → 2** if deploy is currently blocked; **1 → 2 → 3** if deploys work today.
