# Grant OS — Information Architecture & UX Strategy

**Status:** Proposed (canonical target)  
**Last updated:** 2026-05-24  
**Scope:** `stellar-business-os` (Grant OS / GrantPilot) + cross-links from `launchpad-canada-ai`  
**Related:** [GRANT_PLATFORM_ROADMAP.md](../GRANT_PLATFORM_ROADMAP.md) · [GRANT_INTAKE_HUB_PLAN.md](../GRANT_INTAKE_HUB_PLAN.md) · stellar `docs/DASHBOARD_RESTORE.md`

---

## Executive summary

Grant OS today mixes **three different jobs** under overlapping names (“Business OS”, “workspace”, “dashboard”, “feed”, “LaunchPad”). Users cannot tell where they should land after login, and **the same label “Quick actions” means different things on different pages**.

**Target model (three surfaces):**

| Surface | Job | Post-login? | Primary question it answers |
|---------|-----|-------------|-----------------------------|
| **Marketing** | Acquire & explain | No (or teaser) | “What is RTM grant advisory?” |
| **Grant Feed** | Discover & act on grants | **Yes — default home** | “What grants matter to me right now?” |
| **Grant Dashboard** | Business tools & ops | Optional second home | “What else should I run in my business?” |

**Rule:** After sign-in on the grants app, **landing = Feed**, not the tools dashboard. The tools dashboard is a **sibling destination**, reachable in one click — not the first screen.

---

## What you asked for (interpreted)

1. **Landing base vs dashboard** — The product incorrectly treats “Business OS” (`/`) as the signed-in home in some flows, while Auth defaults to `/grants`. These must not compete; **Feed wins as post-login landing** on `grants.rtmbusinessdirectory.com`.

2. **Feed stays landing after login** — Members open the app and immediately see **all grants**: applications in flight, recommended programs, pipeline, catalog/discovery — not a marketing hero or a tools sidebar.

3. **Grant Dashboard = services/tools** — Quick actions (Analytics, Compliance, Market research, Reports), Insights preview, Priority alerts (license renewal, tax filing), and future ops modules live on a **dedicated dashboard surface**, not buried inside the feed or duplicated with different labels.

---

## Current state — inconsistency inventory

### A. Competing “homes” after login

| Flow | Destination today | Expected |
|------|-------------------|----------|
| `Auth.tsx` default return | `/grants` | Feed ✓ |
| Onboarding complete | `/` (Business OS) | Feed ✗ |
| Service request complete | `/` | Feed ✗ |
| `DASHBOARD_RESTORE.md` intent | `/` after sign-in | Conflicts with Auth |
| `grants.rtmbusinessdirectory.com/` | Redirect → `/grants` | Feed ✓ |
| Main host `/` (if used) | Business OS | Unclear product split |

**Impact:** Members sometimes land on tools, sometimes on grants, depending on which door they entered.

### B. Two “Quick actions” panels (same name, different purpose)

| Location | Actions | Purpose |
|----------|---------|---------|
| `AISidebar.tsx` on `/` | Find grants, Analytics, Find customers, Compliance, Market research, Reports | **Business tools** (+ Insights preview label) |
| `GrantFeedQuickActions.tsx` on `/grants` | Advisor packages, Browse grants, Profile, Business OS, Find new grant | **Grant workflow shortcuts** |

**Impact:** “Quick actions” is ambiguous. Analytics/Compliance never appear on the feed; grant packages never appear on the tools dashboard.

### C. Vocabulary overload

| Term used in UI/docs | Actually means |
|----------------------|----------------|
| Business OS | Tools dashboard at `/` |
| Funding workspace / grant workspace | Grant Feed at `/grants` |
| Dashboard | `/dashboard` → `/` (stellar) OR membership app OR launchpad `/dashboard` |
| Feed | GrantPilot member sections |
| LaunchPad / LaunchPad Canada | CommandBar branding on tools page |
| Grant OS | Not a defined route — informal |

**Impact:** Support, docs, and AI (LaunchBot) give conflicting navigation advice.

### D. Shell fragmentation

- **Feed** (`GrantPilot.tsx`): own header, no `AISidebar`, no `CommandBar`.
- **Tools** (`Index.tsx`): full shell with sidebar + priority alerts.
- **Bridge:** “Business OS” link in feed quick actions; “Grants” in sidebar.

**Impact:** Tools feel disconnected; alerts and analytics are invisible while user is in grant flow (where they spend most time).

### E. Marketing vs member content on same URL (launchpad)

| URL | Signed out | Signed in |
|-----|----------|-----------|
| `rtmbusinessdirectory.com/grants` | Full marketing + catalog | Same page (no feed handoff) |
| `grants.rtmbusinessdirectory.com/grants` | Teaser / sign-in | Member feed |

**Impact:** Directory marketing site and Grant OS member experience are not clearly separated in user mental model.

### F. Mock vs real data on tools dashboard

- Priority alerts (license 7d, tax 14d) — **hardcoded** in `AISidebar.tsx`.
- Insights preview modals — **demo** data.
- Feed — **real** Supabase grants, applications, profile scores.

**Impact:** Dashboard feels like a prototype; feed feels like the real product — inverted trust if dashboard is shown first.

### G. launchpad `/dashboard` vs Grant OS

- `rtmbusinessdirectory.com/dashboard` — directory listings, deals, affiliate, link out to grants workspace.
- Grant OS tools — stellar `/` only.

**Impact:** Three different “dashboards” in the ecosystem (membership, directory, grant tools).

---

## Target architecture — Grant OS (stellar)

### Canonical routes (grants subdomain)

```
grants.rtmbusinessdirectory.com
├── /                    → Grant Feed (member home)     [redirect to /grants today — keep]
├── /grants              → Grant Feed (alias, canonical)
├── /grants/:id          → Grant detail
├── /grants/intake/:id   → Intake hub
├── /grants/packages     → Advisor packages / checkout
├── /dashboard           → Grant Dashboard (tools)      [NEW meaning — not redirect to /]
├── /auth, /onboarding   → Auth flows → return to Feed
└── /worldcup/*          → Separate hub (unchanged)
```

**Rename in UI (not necessarily URLs day one):**

| Old label | New label |
|-----------|-----------|
| Business OS | **Grant Dashboard** or **Business tools** |
| Grant workspace / funding workspace | **Grant Feed** |
| LaunchPad Canada (CommandBar) | **RTM Grant OS** |

### Surface 1 — Grant Feed (post-login landing)

**Route:** `/` and `/grants` (same component, single source of truth)

**Sections (top → bottom, member):**

1. Hero strip — name, membership badge, profile completion CTA  
2. **Your applications** — `ApplicationTracker`  
3. **Recommended for you** — profile-scored grants  
4. **Pipeline** — stages / readiness  
5. **Grant shortcuts** — rename from “Quick actions” → **Grant shortcuts** (packages, profile, browse catalog, start intake)  
6. **All grants** — searchable catalog (`GrantCatalog` / `#discovery`)  
7. Marketplace / achievements (optional, lower priority)

**Must NOT include on Feed:** Analytics modals, compliance checker, mock priority alerts, generic “business pulse”.

**Shell:** Lightweight top nav only:

- Logo → Feed  
- **Dashboard** → `/dashboard`  
- **LaunchBot**  
- Profile / sign out  

Optional: slim **alert strip** (max 1 real grant deadline from DB — not mock license/tax until wired).

### Surface 2 — Grant Dashboard (tools & services)

**Route:** `/dashboard` (repurpose; stop redirecting to `/`)

**Layout:** Keep proven `CommandBar` + `AISidebar` pattern from current `Index.tsx`.

**Sections:**

1. **Quick actions** (business tools only)  
   - Find grants → navigates to Feed  
   - Analytics  
   - Find customers  
   - Compliance  
   - Market research  
   - Reports  
   - Label block: **Insights preview** until data is live  

2. **Priority alerts** (real data pipeline)  
   - License renewal, tax filing, grant deadlines, intake stuck  
   - Phase 1: show grant-related alerts from Supabase; phase 2: compliance calendar  

3. **Summary cards**  
   - Profile completion, open intakes, applications count  
   - Link cards → Feed filtered views  

4. **Grants teaser** (not a feed duplicate)  
   - 3 top recommended grants + **Open Grant Feed →**  
   - Replace static `GrantsSection` mock with `fetchRecommendedGrants(limit: 3)`  

5. **World Cup / growth** widgets (secondary)

**Remove from dashboard:** Full catalog, full application tracker (link to feed instead).

### Surface 3 — Marketing (launchpad + unsigned stellar)

| Host | Route | Role |
|------|-------|------|
| `rtmbusinessdirectory.com/grants` | Public marketing + catalog browse | SEO, checklist leads, package pricing |
| `grants…/grants` (signed out) | Sign-in / membership gate teaser | Hand off to Feed after auth |

**CTA consistency:** “Open Grant Feed” / “Sign in to your feed” — not “Open workspace” without explanation.

---

## Quick actions — split specification

Avoid one mixed grid. Use **two named blocks**:

### Grant shortcuts (on Feed only)

| Action | Behavior |
|--------|----------|
| Advisor packages | `/grants/packages` |
| Browse all grants | `#discovery` on feed |
| Complete / update profile | Profile wizard modal |
| Start new intake | Catalog → detail → intake |
| Open dashboard | `/dashboard` |

### Quick actions (on Dashboard only)

| Action | Behavior |
|--------|----------|
| Find grants | Navigate to Feed |
| Analytics | Modal → later real metrics |
| Find customers | Modal / directory integration |
| Compliance | Modal → checklist |
| Market research | Modal |
| Reports | Modal / export |

**LaunchBot** may suggest actions from **both** lists but must use the same IDs as the action registry.

---

## Priority alerts — data strategy

| Alert type | Source (target) | Surface |
|------------|-------------------|---------|
| Grant deadline approaching | `grants.deadline` + user saved/applied | Feed strip + Dashboard |
| Intake incomplete | `grant_intakes.readiness_score` | Feed + Dashboard |
| Package unpaid | `grant_service_orders` | Dashboard |
| License renewal | User profile / future compliance module | Dashboard only (when real) |
| Tax filing | Calendar integration (future) | Dashboard only (when real) |

**Until wired:** Show **“Insights preview”** badge on mock alerts; hide or demote mock license/tax items on Feed entirely.

---

## Cross-app map (full RTM)

```
┌─────────────────────────────────────────────────────────────────┐
│ rtmbusinessdirectory.com                                         │
│  /grants          → Marketing catalog (public)                   │
│  /dashboard       → Directory member hub (listings, deals)       │
│  /admin/grants    → Ops queue                                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ auth handoff
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ grants.rtmbusinessdirectory.com  (Grant OS)                      │
│  /grants          → Grant Feed (POST-LOGIN HOME)                 │
│  /dashboard       → Grant Dashboard (tools, alerts, insights)    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ membership gate
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ membership.rtmbusinessdirectory.com                              │
│  /dashboard       → Pay / referrals / aid (billing home)         │
└─────────────────────────────────────────────────────────────────┘
```

**Naming rule for support/docs:**

- **Membership dashboard** = billing  
- **Directory dashboard** = listings & deals (launchpad)  
- **Grant Feed** = grants home  
- **Grant Dashboard** = grant-adjacent business tools (stellar)

Never use bare “dashboard” without a qualifier.

---

## Auth & redirect canon

| Event | Redirect |
|-------|----------|
| Sign-in success (grants app) | `/grants` (Feed) |
| Onboarding complete | `/grants` (change from `/`) |
| Service request complete | `/grants` or `/dashboard` if request was business-tool typed |
| Package checkout success | `/grants/intake/:grantId?checkout=success` |
| Membership inactive | Membership activate with `returnUrl=/grants` |
| “Find grants” quick action (dashboard) | `/grants` |

Update `DASHBOARD_RESTORE.md` to reflect **Feed-first** landing; restore `/dashboard` as tools-only route.

---

## Implementation phases

### Phase 0 — Naming & docs (1–2 days, no breaking routes)

- [ ] Glossary in UI copy: Feed vs Dashboard tooltips  
- [ ] Rename “Quick actions” on feed → **Grant shortcuts**  
- [ ] Update LaunchBot prompts with Feed vs Dashboard destinations  
- [ ] Fix `DASHBOARD_RESTORE.md` + FAQ strings on both repos  
- [ ] Align onboarding/service-request redirects to `/grants`

**Files (stellar):** `GrantFeedQuickActions.tsx`, `GrantPilot.tsx`, `Auth.tsx`, `Onboarding.tsx`, `ServiceRequest.tsx`, `AISidebar.tsx` (nav label)

### Phase 1 — Route & shell alignment (3–5 days)

- [ ] `/dashboard` renders tools shell (`Index.tsx` content), **not** redirect to `/`  
- [ ] `/` on grants host → Feed (already via vercel redirect)  
- [ ] Shared `GrantOsNav` on Feed: Feed | Dashboard | LaunchBot  
- [ ] Dashboard sidebar: **Grant Feed** link replaces ambiguous “Grants”  
- [ ] Remove duplicate full catalog from dashboard; teaser only  

**Files:** `App.tsx`, `vercel.json`, new `GrantOsNav.tsx`, `Index.tsx` → rename page `GrantDashboard.tsx`

### Phase 2 — Quick actions & alerts hygiene (1 week)

- [ ] Split action configs: `grantShortcuts.ts` vs `dashboardQuickActions.ts`  
- [ ] Demote mock alerts on dashboard; add “preview” badge  
- [ ] Wire 1–2 **real** grant alerts (deadline, intake stuck) from Supabase  
- [ ] Feed: optional single real alert banner  

### Phase 3 — launchpad handoff (3–5 days)

- [ ] Signed-in user on `rtmbusinessdirectory.com/grants` → banner: “Continue in Grant Feed” → handoff URL  
- [ ] Directory `/dashboard` card: “Grant Feed” not “workspace”  
- [ ] Single `getGrantsFeedUrl()` helper shared pattern  

### Phase 4 — Insights production (backlog)

- [ ] Replace Analytics/Compliance modals with real data or hide behind feature flag  
- [ ] Compliance calendar + license renewal from profile  
- [ ] Unified notification center across Feed + Dashboard  

---

## Component ownership matrix

| Component | Feed | Dashboard | Marketing (launchpad) |
|-----------|------|-----------|------------------------|
| `GrantCatalog` | Full | Teaser (3) | Full public |
| `ApplicationTracker` | Yes | Link only | No |
| `RecommendedGrants` | Yes | Teaser | Optional |
| `GrantFeedQuickActions` | Renamed shortcuts | No | No |
| `AISidebar` quick actions | No | Yes | No |
| Priority alerts | Optional strip | Yes | No |
| `LaunchBotWidget` | Yes | Yes | Yes (launchpad) |
| `GrantAdvisoryDisclaimer` | Yes | Yes | Yes |

---

## Success metrics

| Metric | Baseline | Target (60 days) |
|--------|----------|------------------|
| Post-login landing on Feed | ~50% (split flows) | **>95%** |
| Time to first grant view after login | Unknown | **<10s** |
| Dashboard visits / MAU | Unknown | 20–40% (tools are optional, not forced) |
| Support tickets “where is my grants” | Qualitative | **↓ 50%** |
| Quick action click-through | Track by surface | Grant shortcuts ↑ on feed; tools ↑ on dashboard |

---

## Decisions required (pick before Phase 1 code)

1. **Dashboard URL:** Keep `/dashboard` for tools (recommended) vs new `/os` — `/dashboard` matches user language but collides with launchpad `/dashboard`. Mitigation: grants subdomain is isolated; directory uses full URL in links.

2. **Feed at `/` vs `/grants`:** Keep both aliases (recommended) or collapse to `/` only.

3. **Mock tools on dashboard:** Hide until real (trust-first) vs keep with “Preview” badge (demo-first).

4. **Unified shell on Feed:** Top nav only (recommended) vs mount collapsed AISidebar on feed too (heavier).

**Recommended defaults:** `/dashboard` for tools, Feed at `/grants` + `/`, preview badges on mock tools, top nav on feed.

---

## Immediate next steps (this week)

1. **Product sign-off** on this three-surface model (Feed = landing, Dashboard = tools).  
2. **Phase 0** copy changes in stellar — lowest risk, highest clarity.  
3. **Revert conflicting doc** `DASHBOARD_RESTORE.md` post-login section to Feed-first.  
4. **Track in** [GRANT_PLATFORM_ROADMAP.md](../GRANT_PLATFORM_ROADMAP.md) as “Grant OS IA” workstream parallel to trust/funnel sprints.

---

## Appendix — file reference (stellar)

| Concern | Path |
|---------|------|
| Feed page | `src/pages/GrantPilot.tsx` |
| Tools page | `src/pages/Index.tsx` |
| Sidebar + alerts | `src/components/AISidebar.tsx` |
| Feed shortcuts | `src/components/grantpilot/GrantFeedQuickActions.tsx` |
| Auth redirect | `src/pages/Auth.tsx` |
| Host redirects | `vercel.json` |
| Prior fix doc | `docs/DASHBOARD_RESTORE.md` |
