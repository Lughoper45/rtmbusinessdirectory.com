# Grow My Business — Strategic Brainstorm & Proposal

**Status:** Brainstorm / decision doc  
**Last updated:** 2026-05-25  
**Context:** Homepage pillar #3 (`ThreePathSection` → `/business-support`) is placeholder copy only. Pillars #1 (Directory) and #2 (Grants) are substantially built.  
**Goal:** Define a **credible, monetizable, automatable** third pillar that helps Canadian SMEs get visible, sell, and operate digitally — and positions RTM for **recognition** as a private sector partner supporting Canadian business (not as a government agency).

**Related stack today:**

| Asset | Status |
|-------|--------|
| Directory + claim outreach | Built ([DIRECTORY_LISTING_OUTREACH_AUTOMATION_PLAN.md](./DIRECTORY_LISTING_OUTREACH_AUTOMATION_PLAN.md)) |
| Grants + GrantPilot | Built ([GRANT_INTAKE_HUB_PLAN.md](../GRANT_INTAKE_HUB_PLAN.md)) |
| LaunchBot / `directory-assistant` | Live |
| CRM + ops (`crm_contacts`, `/admin/ops`) | Schema + admin MVP |
| `/business-support` | Static ContentPage — **no product** |
| Membership $100/yr | Live |

---

## 1. Executive summary — what pillar #3 should be

**Working name:** **RTM Business Growth Hub** (product) · **“Grow with RTM”** (marketing)

**One-line promise (honest):**

> RTM helps Canadian businesses become **findable, contactable, and ready to sell** online — with directory presence, AI-assisted customer engagement, and optional done-for-you digital services.

**What it is NOT:**

- Not a government program or fund administrator  
- Not a guarantee of grants, loans, or revenue  
- Not “we submit everything for you” without owner consent (same trust line as grants)

**What makes it distinct from pillar #1 and #2:**

| Pillar | Job to be done |
|--------|----------------|
| **Find a Business** | Demand side — consumers find SMEs |
| **Access Grants** | Capital / programs — funding readiness |
| **Grow My Business** | Supply side — SME **visibility + revenue operations** |

Pillar #3 closes the loop: businesses you list and grant-advise should **convert traffic into leads and sales**.

---

## 2. Problem we solve (Canada-specific)

Canadian SMEs repeatedly hit the same walls:

1. **Invisible online** — no Google Business Profile, weak directory presence, inconsistent NAP (name/address/phone)  
2. **No lead capture** — website is brochure-only; DMs and WhatsApp go unanswered  
3. **Tool sprawl** — separate CRM, email, social, booking — nothing connected  
4. **Can’t afford agency retainers** — $3k–10k/mo Toronto rates exclude main street  
5. **Grant confusion** — they need growth *and* funding; RTM already owns grant trust  

RTM’s unfair advantage: **10,000+ listing intent**, membership base, grant funnel, and automation already built for outreach + CRM.

---

## 3. Proposed service catalog (brainstorm tiers)

Organize as **packages** (Stripe) + **à la carte** (quote). Mirror grant packaging psychology: clear outcomes, member discount.

### 3.1 — Visibility & local presence (fastest ROI)

| Service | Deliverable | Automation level |
|---------|-------------|------------------|
| **RTM Verified Listing** | Claim + complete profile (already building) | High |
| **Google Business Profile setup** | GBP create/claim checklist + advisor verify | Medium (human GBP access) |
| **NAP sync** | Name, address, phone consistent on RTM + exports | High |
| **Social starter kit** | 4 posts/mo from `social_post_queue` (built) | High (HITL approve) |
| **“Found online” audit** | PDF score: directory, GBP, web, reviews | AI + template |

**Starter package idea:** **Maple Visibility** — $299 list / $149 member — profile + GBP guide + 30-day social queue.

### 3.2 — Digital marketing & demand gen

| Service | Deliverable |
|---------|-------------|
| **Local SEO basics** | Title/meta, local keywords, RTM + site structure |
| **Meta / Google ads setup** | Account + 1 campaign build (client pays ad spend) |
| **Email nurture** | Resend sequences (reuse ops dispatcher patterns) |
| **Review generation** | Post-visit SMS/email ask (CASL-compliant) |
| **Seasonal campaigns** | World Cup, provincial themes (tie to existing hub) |

**Growth package idea:** **True North Digital** — $999 list / $499 member — SEO audit + 3-month email nurture + ads setup fee.

### 3.3 — Website & app development

| Tier | Scope | Notes |
|------|-------|-------|
| **Launch page** | 1-page Vite/Wordpress on RTM subdomain or custom domain | Template + AI copy |
| **Business site** | 5–7 pages, booking CTA, CRM hook | Partner dev or internal |
| **Web app / portal** | Member dashboard extensions, intake, inventory | Reuse Supabase kajwp |
| **Maintenance** | $99–199/mo hosting + updates | Recurring revenue |

**Positioning:** “Built on RTM stack” — same auth, same CRM — not random WordPress silo.

### 3.4 — Sales systems & CRM (connects to your ops build)

| Component | RTM implementation |
|-----------|-------------------|
| **Unified CRM** | `crm_contacts` (built) — extend pipelines for `growth_lead` |
| **Lead inbox** | Web form → `service_requests` / CRM (exists) |
| **Pipeline boards** | `/admin/ops` Kanban (planned) |
| **Quotes & proposals** | AI draft (HITL) → PDF / Stripe payment link |
| **Appointment booking** | Cal.com / Calendly embed or native |
| **Membership upsell** | Auto rules: claimed listing → growth nurture |

**Package idea:** **Sales Ready CRM** — $499 setup + $79/mo — CRM configured, 2 automations, WhatsApp handoff doc.

### 3.5 — AI & messaging automation

| Channel | Product |
|---------|---------|
| **Website chat** | LaunchBot + `directory-assistant` (live) — extend with **business-specific** bot per claimed listing |
| **WhatsApp Business API** | Official Cloud API — template messages, lead capture → CRM |
| **SMS (optional)** | Twilio — appointment reminders, Canada CASL |
| **Email AI copilot** | Admin suggest-reply (planned `ops-ai-assistant`) |

**WhatsApp bot flow (brainstorm):**

```
Customer messages business WhatsApp
  → Bot: hours, location, services, link to RTM profile
  → Capture: name + need → crm_contacts
  → Human takeover button for owner
  → Optional: book call / pay deposit (Stripe link)
```

**Package idea:** **AI Front Desk** — $199/mo — website bot + WhatsApp + CRM sync (setup $399).

### 3.6 — Advisory & “full stack” (high touch)

| Service | Model |
|---------|-------|
| Dedicated growth advisor | Monthly retainer — human |
| Fractional CMO blocks | 10h/mo |
| Grant + growth bundle | Maple Checklist + Visibility package |
| Export / B2B readiness | Tie to grants + digital |

---

## 4. Product architecture — how it fits RTM today

```mermaid
flowchart TB
  subgraph pillar1 [Pillar 1 — Directory]
    DIR[10k listings]
    CLAIM[Claim + enrich]
  end

  subgraph pillar2 [Pillar 2 — Grants]
    GR[GrantPilot]
    INTAKE[Intake hub]
  end

  subgraph pillar3 [Pillar 3 — Grow NEW]
    HUB[/grow or /business-support]
    AUDIT[Visibility audit]
    MKT[Marketing automations]
    CRM[CRM + WhatsApp + AI desk]
    DEV[Web / app studio]
  end

  subgraph shared [Shared kajwp platform]
    AUTH[One RTM account]
    CRMDB[crm_contacts]
    OPS[ops-dispatcher]
    AI[OpenRouter edge]
    STRIPE[Stripe packages]
  end

  pillar1 --> pillar3
  pillar2 --> pillar3
  pillar3 --> shared
  CLAIM --> CRMDB
```

### Recommended URL structure

| Path | Purpose |
|------|---------|
| `/grow` | Main hub (replace weak `/business-support`) |
| `/grow/visibility` | Listing + GBP + social |
| `/grow/digital-marketing` | SEO, ads, email |
| `/grow/ai-desk` | Chatbot + WhatsApp |
| `/grow/crm` | Sales system offering |
| `/grow/studio` | Web/app dev |
| `/grow/audit` | Free lead magnet — visibility score |
| `/pricing` | Add third column: Growth packages |

Redirect: `/business-support` → `/grow`.

### Data model extensions (lightweight)

```sql
-- growth_service_catalog (package definitions)
-- growth_orders (Stripe → fulfillment like grant_service_orders)
-- growth_projects (delivery tracker for dev/marketing)
-- business_growth_profiles (GBP url, whatsapp_number, bot_config jsonb)
```

Reuse `service_requests` short-term; split when SKUs stabilize.

---

## 5. Government recognition — realistic pathways (brainstorm)

**Critical:** RTM remains a **private** platform. Recognition means **partnership, certification, or program delivery** — not looking like `.gc.ca` or implying government endorsement.

### 5.1 — Narrative that resonates with government stakeholders

Frame RTM as:

> **National SME digital adoption infrastructure** — directory as discovery layer, grants as capital layer, growth hub as **execution layer** for visibility and sales.

Metrics governments care about:

- Businesses listed and **claimed** (verified operators)  
- Jobs supported (owner-reported, survey)  
- Digital tool adoption (GBP, CRM, WhatsApp, AI bot enabled)  
- Regional coverage (province/ city breakdown)  
- Bilingual service capacity (EN/FR)  
- Underrepresented founders (women, Indigenous, newcomer tags — voluntary self-ID)

**Publish an annual RTM Impact Report** (PDF) — even 6 pages — with audited-style counts from Supabase. This is what gets meetings.

### 5.2 — Concrete recognition channels (prioritized)

| Channel | What RTM does | Effort | Payoff |
|---------|---------------|--------|--------|
| **ISED / SME policy engagement** | Respond to consultations; join roundtables as private sector | Low–Med | Visibility |
| **Regional development agencies** | FedDev Ontario, ACOA, WD, etc. — propose pilot: “500 SMEs digitized in 12 months” | Med | Funding + logo use |
| **Chambers of Commerce** | White-label growth hub for members; co-branded webinars | Med | Trust + leads |
| **CFIB / BDC referral partner** | Listed as digital resource (not competitor to BDC lending) | Med | Credibility |
| **Canada Digital Adoption Program successors** | Watch for CDAP-like grants; apply as **approved vendor** when RFPs open | High | Revenue spike |
| **Provincial small business centres** | Ontario BSBC etc. — workshop partner | Med | Local pipeline |
| **Export Development Canada ecosystem** | Export-ready digital kits for pillar 3 | Med | Brand |
| **Certifications** | CGLCC, WBE Canada supplier diversity; ISO 27001 later for enterprise | Med | Procurement |
| **Academic / NGO** | Ryerson DMZ-style reports, immigrant entrepreneur orgs | Low | Stories |

### 5.3 — “Recognition package” RTM should prepare (90 days)

1. **Impact dashboard** (admin): claimed listings, bots deployed, campaigns sent, provinces served  
2. **Case studies** (10): grant + growth combined wins — with disclaimers  
3. **French mirror** of `/grow` key pages (federal bilingual expectation)  
4. **Accessibility** statement (WCAG path) — government partners check this  
5. **Privacy / AI transparency** page — how LaunchBot and WhatsApp use data  
6. **Letter of support template** for members to cite RTM in their own grant apps (not RTM guaranteeing anything)

### 5.4 — What to avoid

- Logos or colours that mimic Government of Canada  
- “Government approved platform” language  
- Applying for grants **as if RTM were an SME program administrator**  
- Auto-submitting businesses to government portals  

Align with [GRANT_PLATFORM_ROADMAP.md](../GRANT_PLATFORM_ROADMAP.md) trust rules.

---

## 6. Brand & homepage alignment

### Update pillar #3 card (proposal)

| Today | Proposed |
|-------|----------|
| “Get AI-powered support, tools, and insights to scale faster” | “Get visible online, capture leads, and sell smarter — directory, AI desk, and digital services” |
| CTA: Get Support → `/business-support` | CTA: **Grow My Business** → `/grow` |

### Tagline options (brainstorm)

1. **“Be found. Be chosen. Be ready.”**  
2. **“Canada’s growth layer for main street business.”**  
3. **“From listing to leads — one RTM account.”**

### Sub-brand for government conversations

**RTM Canadian Business Enablement Program (CBEP)** — internal name for bundled pilot offers to agencies (not public-facing as “government program”).

---

## 7. Revenue model (brainstorm)

| Stream | Type | Example |
|--------|------|---------|
| Membership | Recurring | $100/yr (existing) — includes basic growth tools |
| Growth packages | One-time | Maple Visibility $149–299 |
| AI Front Desk | MRR | $199/mo |
| CRM + automations | MRR | $79–149/mo |
| Web studio | Project | $2k–15k |
| Ads management | Retainer + % spend | $500/mo + 15% |
| Grant + growth bundle | Bundle | 10% discount, higher LTV |
| Agency white-label | B2B2B | Chamber pays per seat |

**Member economics:** Same 50% discount pattern as grant packages — drives membership conversion from pillar #3.

---

## 8. Phased rollout (pragmatic)

### Phase 0 — Positioning (2 weeks, mostly content)

- [ ] Publish `/grow` hub with service grid + honest disclaimers  
- [ ] Redirect `/business-support`  
- [ ] Update `ThreePathSection` copy + CTA  
- [ ] Free **Visibility Score** lead form → `crm_contacts` + PDF email  
- [ ] Pricing page: add Growth column  

**Engineering:** Low — mostly pages + `service_requests` form.

### Phase 1 — Productized visibility (4–6 weeks)

Leverage **already built**:

- Listing claim + outreach ([listing automation](./DIRECTORY_LISTING_OUTREACH_AUTOMATION_PLAN.md))  
- Social queue publisher  
- Post-claim nurture emails  

Add:

- [ ] `growth_packages` in Stripe (like grant packages)  
- [ ] GBP setup playbook + checklist in dashboard  
- [ ] Owner dashboard widget: “Your visibility score”  

### Phase 2 — AI Front Desk (6–8 weeks)

- [ ] Per-business LaunchBot config (`business_growth_profiles.bot_config`)  
- [ ] WhatsApp Cloud API integration + CRM sync  
- [ ] `/admin/growth` fulfillment queue  

### Phase 3 — CRM & sales systems (8–10 weeks)

- [ ] Extend `/admin/ops` — pipelines, deals type `growth_*`  
- [ ] Proposal generator (AI HITL)  
- [ ] Calendly + Stripe payment links  

### Phase 4 — Web/app studio + government pilot (12+ weeks)

- [ ] Template storefront generator  
- [ ] FedDev / chamber pilot proposal submitted  
- [ ] Impact report v1  

---

## 9. MVP feature set (if we build only one sprint)

**“RTM Visibility & AI Desk Starter”** — single SKU:

Includes:

1. Claimed RTM profile optimization checklist  
2. 8 social posts (approved batch)  
3. Website LaunchBot tuned to business FAQ  
4. CRM contact capture from chat + form  
5. 30-min advisor call (human)  

Price: **$249 member / $449 list**  
Fulfillment: 80% automated via existing ops stack + 1 human call.

This makes pillar #3 **real** without building full agency.

---

## 10. Integration with existing automations

| Existing system | Growth pillar use |
|-----------------|-------------------|
| `listing-contact-enricher` | Top of funnel for unclaimed → growth upsell |
| `ops-dispatcher` | Growth nurture sequences (Day 1/7/30) |
| `crm_contacts` | Single customer view: grants + growth + directory |
| `directory-assistant` | Consumer-facing; per-business bot is clone pattern |
| `grant-checklist-lead` | Cross-sell: “Got grants; now get visible” email |
| Membership | Gate member pricing on growth SKUs |

**Cross-sell rule (automated):**

```
IF claim_status = 'claimed' AND no growth_order
  → email: Visibility Score + Maple Visibility offer
IF grant_service_orders.won AND no growth_order
  → email: “Funded project needs customers” → True North Digital
```

---

## 11. Competitive positioning (Canada)

| Competitor type | RTM differentiation |
|-----------------|---------------------|
| Yellow Pages / Yelp | RTM adds grants + AI + Canadian-first narrative |
| Agencies | RTM productized, cheaper, automated backbone |
| Shopify / Wix | RTM adds local discovery + CRM + grant path |
| HubSpot | RTM simpler, SME-priced, pre-wired to directory |
| BDC advisors | Partner, don’t compete — RTM executes digital |

---

## 12. Open questions for brainstorm (decide together)

1. **Brand:** “Grow with RTM” vs “RTM Digital” vs “Business Growth Hub”?  
2. **Delivery:** In-house team vs vetted Canadian freelancers vs hybrid?  
3. **WhatsApp:** Priority channel for your audience (many immigrant-owned SMEs)?  
4. **Web dev:** Build templates in-repo or partner with WordPress shop?  
5. **Government first:** Which province/agency to pitch first (Ontario FedDev? Alberta?)  
6. **French:** Full bilingual Phase 0 or Phase 2?  
7. **Pricing:** Undercut agencies 40% or premium “all-in-one with grants”?  
8. **Free tier:** Is Visibility Score free forever or gated behind email only?  
9. **Liability:** Service-level agreements for ads/SEO — how conservative?  
10. **World Cup 2026:** Bundle “event visibility” as limited SKU?

---

## 13. Recommended decisions (proposal defaults)

| Decision | Recommendation |
|----------|----------------|
| Product name | **RTM Business Growth Hub** (`/grow`) |
| MVP SKU | **Maple Visibility** + free **Visibility Score** |
| Tech reuse | Max reuse kajwp CRM + ops + social queue |
| WhatsApp | Phase 2 — high value, moderate complexity |
| Government path | Impact report + FedDev-style pilot proposal in Q3 2026 |
| Homepage CTA | Point pillar #3 to `/grow` not placeholder page |
| Trust | Same private-advisory disclaimer pattern as grants |

---

## 14. Next steps after brainstorm

| Step | Owner | Output |
|------|-------|--------|
| Approve service catalog tiers | Leadership | Final SKU list |
| Approve MVP vs Phase 1 scope | Product | Sprint plan |
| Copy + legal review | Ops + counsel | `/grow` pages |
| Stripe products | Eng | `growth_packages` like grants |
| Impact metrics spec | Ops | Supabase dashboard queries |
| Agency pilot letter | BD | 1-page PDF for chambers |

**Engineering ticket (when ready):** **GROW-001** — `/grow` hub page, Visibility Score form, `ThreePathSection` CTA update, `growth_service_requests` migration.

---

## 15. One-page elevator pitch (for government & partners)

> **RTM Business Directory** operates Canada’s connected SME platform: **discovery** (10,000+ business listings), **capital readiness** (217 grant programs + advisory packages), and **growth execution** (visibility, AI customer desk, CRM, and digital marketing). We measure success by verified business claims, digital tool adoption, and jobs supported — not by pretending to be government. We seek pilot partnerships with regional development agencies and business associations to digitize main street at national scale.

---

*Brainstorm doc — refine in working session. Link from [RTM_OPERATIONS_AUTOMATION_MASTER_PLAN.md](./RTM_OPERATIONS_AUTOMATION_MASTER_PLAN.md) when pillar #3 is approved.*
