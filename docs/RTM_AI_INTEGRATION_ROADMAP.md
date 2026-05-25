# RTM Global Canada — AI Integration

**Product:** RTM Business Directory · `launchpad-canada-ai`  
**Supabase project:** `kajwpmyloxaqeciyndwf`  
**Document type:** AI Feature Specification + Implementation Roadmap  
**Version:** 1.0 · May 2026  
**Status:** Implemented in `launchpad-canada-ai` — deploy edge functions + secrets to activate

> **Related:** [GRANT_INTAKE_HUB_PLAN.md](../GRANT_INTAKE_HUB_PLAN.md) covers grant intake data model, edge function actions, and GrantPilot UI flows. This document covers **all AI surfaces** and the unified OpenRouter architecture. **Grant platform agent tasks (trust, funnel, deploy):** [GRANT_PLATFORM_AGENT_WORKPLAN.md](./GRANT_PLATFORM_AGENT_WORKPLAN.md).

---

## 1 — Executive summary

RTM Business Directory is a multi-product Canadian business platform built on a Vite/React frontend with Supabase as the backend. The platform currently includes three AI touchpoints — a homepage chat assistant, a grant intake assistant, and a business listing AI — **none of which are fully connected to a live AI provider** end-to-end.

This document defines the current state of each AI surface, identifies the gaps between what exists in the codebase and what the platform needs to deliver, and provides a prioritised implementation roadmap with concrete tasks, ownership, and acceptance criteria.

| AI surface | Current state | Provider | Priority |
|------------|---------------|----------|----------|
| Homepage chat bot | ⚠ Mock only — hardcoded responses | None (`setTimeout`) | **P1 — HIGH** |
| Grant intake assistant | ⚠ Backend built — no frontend call | OpenRouter ✓ | **P2 — HIGH** |
| Business listing AI | ⚠ Functional via separate provider | Lovable API | **P3 — MEDIUM** |

### Core decision

**All AI features should route through a single OpenRouter API key held in Supabase Edge Function secrets.** The React frontend never calls OpenRouter directly. One provider, one secret, one validation script — this is the target architecture.

---

## 2 — Current state: what actually exists

### 2.1 Homepage chat bot (`AIChatAssistant.tsx`)

The floating chat widget on the homepage is a fully-built UI component that simulates an AI assistant using hardcoded keyword matching and a `setTimeout` delay. It does not call any backend or AI provider.

| Attribute | Detail |
|-----------|--------|
| File | `src/components/AIChatAssistant.tsx` |
| Backend | None — mock `setTimeout` + keyword rules |
| OpenRouter | Not connected |
| Data access | None — no Supabase queries to `grants` or businesses tables |
| Conversation | State kept in React but never sent to a model |
| Voice | Mic / ElevenLabs UI is present but entirely stubbed |
| Auth | No auth check — accessible to all visitors |

### 2.2 Grant intake assistant (`grant-intake-assistant`)

This is the most complete AI implementation in the codebase. An OpenRouter client is fully built in the shared edge function library and the grant intake edge function wires it for structured draft generation. **However, the frontend has no code that calls this function.**

| Attribute | Detail |
|-----------|--------|
| Edge function | `supabase/functions/grant-intake-assistant` |
| Shared client | `supabase/functions/_shared/openrouter.ts` ✓ Built |
| OpenRouter | Connected for `generate_draft` action only |
| Actions | `analyze_readiness` / `generate_draft` / `list_missing` |
| Auth required | Yes — requires logged-in user + `intake_id` |
| Frontend call | **Missing** — no `supabase.functions.invoke()` anywhere in `src/` |
| Rate limiting | 12 draft generations per hour per intake |
| Secret status | `OPENROUTER_API_KEY` must be set in Supabase project secrets — **unconfirmed** |

### 2.3 Business listing AI (`generate-business-description` / `analyze-website`)

Two edge functions exist for AI-assisted business listing creation. These use the Lovable API rather than OpenRouter, and are functionally operational. They are a lower priority than the homepage bot and grant intake frontend, but should eventually be consolidated onto OpenRouter for consistency.

| Attribute | Detail |
|-----------|--------|
| Edge functions | `generate-business-description` / `analyze-website` |
| Provider | Lovable API (`LOVABLE_API_KEY`) |
| Status | Functional — lowest priority for migration |
| Migration path | Replace `LOVABLE_API_KEY` calls with `openRouterChat()` from `_shared/openrouter.ts` |

---

## 3 — Gap analysis

The following table maps every identified gap between the current codebase and the target state. Gaps are numbered for reference in the implementation tasks.

| # | Surface | Gap description | Impact | Pri |
|---|---------|-----------------|--------|-----|
| G1 | Homepage bot | No edge function exists for the directory chat bot — the UI calls nothing | Homepage AI is non-functional for all users; brand promise broken | P1 |
| G2 | Homepage bot | `AIChatAssistant.tsx` uses `setTimeout` mock — no real API call | Chatbot never improves, gives wrong/stale answers | P1 |
| G3 | Homepage bot | Bot has no access to grants or businesses data — answers are fabricated strings | Cannot correctly answer “what grants am I eligible for” or “find me a plumber in Toronto” | P1 |
| G4 | Homepage bot | No conversation history is sent to any model — each reply is stateless | Multi-turn conversations are impossible | P1 |
| G5 | Grant intake | Frontend has no `supabase.functions.invoke()` call to `grant-intake-assistant` | Grant application AI features are invisible to users despite backend being built | P2 |
| G6 | Grant intake | `OPENROUTER_API_KEY` may not be set in Supabase project secrets | `grant-intake-assistant` returns HTTP 503 for all requests if secret is missing | P2 |
| G7 | Homepage bot | No rate limiting on the anonymous chat path | Risk of API cost overrun from bot traffic or abuse | P2 |
| G8 | Listing AI | `generate-business-description` and `analyze-website` use `LOVABLE_API_KEY`, not OpenRouter | Two separate AI providers to maintain, monitor, and pay for | P3 |
| G9 | Homepage bot | Voice / ElevenLabs UI is stubbed — no backend connection | Misleading UI element suggests voice feature that does not work | P3 |

---

## 4 — Target architecture

The goal is a single, consistent AI architecture across all three surfaces. OpenRouter is the sole AI provider. All API keys live in Supabase Edge Function secrets. The React frontend never touches an API key.

```
React Frontend                    Supabase Edge Functions              OpenRouter API
─────────────────                 ─────────────────────────            ──────────────
AIChatAssistant.tsx      ──►      directory-assistant (NEW)    ──►     OPENROUTER_API_KEY
GrantPilot UI            ──►      grant-intake-assistant ✓     ──►     (secret)
Listing Wizard           ──►      _shared/openrouter.ts ✓
         │                        generate-business-description (P3)
         │                        analyze-website (P3)
         └── supabase.functions.invoke() — no API keys in browser
```

### 4.1 New edge function: `directory-assistant`

A new Supabase edge function is required to power the homepage chat bot. This is the most critical missing piece.

| Design decision | Recommendation |
|-----------------|----------------|
| Function name | `supabase/functions/directory-assistant` |
| Reuse | Import `openRouterChat` from `_shared/openrouter.ts` — do not duplicate the client |
| Auth | Optional JWT: anonymous users get basic answers; signed-in members get richer context (grants matched to their profile) |
| Rate limiting | 20 messages/hour anonymous by IP · 50 messages/hour authenticated |
| CORS | Use `_shared/cors.ts` — already lists directory + grants origins |
| JWT config | `verify_jwt = false` in `config.toml` — validate JWT inside function if present |
| Data grounding | **Phase 1:** static context about RTM. **Phase 2:** query top N grants/businesses from Supabase matching user message and inject as context block |
| Conversation | Accept `messages` array (last 12 turns). Map to `{ role, content }` pairs before sending to OpenRouter |

### 4.2 System prompt — `directory-assistant`

The system prompt defines what the bot knows and what it will not do. **This must be set in the edge function, not the frontend.**

```
You are the RTM Directory Assistant for RTM Global Canada (rtmbusinessdirectory.com).
You help Canadian business owners and consumers with: finding local businesses, understanding RTM membership benefits, navigating Canadian grant programs, and getting started with listing a business on RTM.

Always direct users to /grants for detailed grant guidance, to /membership for membership sign-up, and to the listing wizard for business listings.

Do not: fabricate eligibility determinations, provide legal or financial advice, or make up grant amounts or deadlines. If unsure, recommend the user speak with an RTM grant advisor.

Keep responses concise and practical. You are talking to busy small business owners.
```

---

## 5 — Implementation roadmap

Tasks are ordered by priority. **P1** tasks are blockers — the platform's AI promise cannot be delivered without them. **P2** tasks unlock the grant intake workflow. **P3** tasks improve consistency and reduce technical debt.

### P1 — Critical · Homepage bot · Resolves: G1, G2, G3, G4

#### Task 1.1 — Create `directory-assistant` edge function

- [ ] Create `supabase/functions/directory-assistant/index.ts`
- [ ] Import `openRouterChat` from `../_shared/openrouter.ts`
- [ ] Import CORS helpers from `../_shared/cors.ts`
- [ ] Handle `OPTIONS` preflight request
- [ ] Accept request body: `{ messages: [{ role, content }], sessionId? }`
- [ ] Optionally decode JWT if present — do not require it
- [ ] Validate message array: max 12 turns, max 500 chars per message
- [ ] Prepend system prompt (see Section 4.2)
- [ ] Call `openRouterChat({ messages, maxTokens, temperature })`
- [ ] Return `{ reply: string, model: string }`
- [ ] Add `[functions.directory-assistant] verify_jwt = false` to `supabase/config.toml`

#### Task 1.2 — Implement rate limiting

- [ ] Use Supabase KV or in-memory map keyed by IP (`X-Forwarded-For` header)
- [ ] Anonymous: 20 requests/hour per IP — return HTTP 429 with `retryAfter` when exceeded
- [ ] Authenticated: 50 requests/hour per `user_id`
- [ ] Add `rate_limit_exceeded` handling to `src/lib/edgeFunctionErrors.ts`

#### Task 1.3 — Wire `AIChatAssistant.tsx` to the new edge function

- [ ] Remove the `setTimeout` mock block from `AIChatAssistant.tsx`
- [ ] Replace with:

  ```ts
  const { data, error } = await supabase.functions.invoke("directory-assistant", {
    body: {
      messages: messages
        .slice(-12)
        .map(({ role, content }) => ({ role, content })),
    },
  });
  ```

- [ ] Use `getEdgeFunctionErrorMessage` from `src/lib/edgeFunctionErrors.ts` for user-facing error display
- [ ] Map `data.reply` to the assistant message in component state
- [ ] Add loading state — disable input and show typing indicator while awaiting response
- [ ] Handle HTTP 429 gracefully: show “You've reached the message limit for now. Try again in an hour.”

#### Task 1.4 — Phase 1 grounding (static context)

- [ ] Add a static context block to the system prompt covering: RTM membership ($100/yr), grant workspace URL, listing wizard URL, key service categories in the directory
- [ ] This replaces the hardcoded keyword responses with accurate, maintainable information
- [ ] Phase 2 grounding (live Supabase data) is a separate task — do not block P1 on it

---

### P2 — High · Grant intake frontend · Resolves: G5, G6

#### Task 2.1 — Validate secret configuration

- [ ] Run: `OPENROUTER_API_KEY=sk-or-... node scripts/test-openrouter-model.mjs`
- [ ] If test passes: set `OPENROUTER_API_KEY` in Supabase → Project Settings → Edge Functions → Secrets
- [ ] Also set `OPENROUTER_MODEL` secret (e.g. `openai/gpt-oss-120b:free` or validated model from test script)
- [ ] Deploy: `supabase functions deploy grant-intake-assistant`
- [ ] Deploy: `supabase functions deploy directory-assistant` (from Task 1.1)
- [ ] Smoke test both from localhost — origins already in `cors.ts`

#### Task 2.2 — Wire GrantPilot frontend to `grant-intake-assistant`

> **Repo note:** GrantPilot intake UI lives in `stellar-business-os` (`grants.rtmbusinessdirectory.com`). Backend and migrations live in `launchpad-canada-ai`.

- [ ] Identify the GrantPilot intake UI component(s) in the stellar repo
- [ ] Add `supabase.functions.invoke("grant-intake-assistant", { body: { action: "analyze_readiness", intake_id } })` on intake form submission
- [ ] Add invoke call with `action: "generate_draft"` when user requests AI narrative drafting
- [ ] Add invoke call with `action: "list_missing"` to surface document gaps to the user
- [ ] Map responses to the relevant UI sections — readiness score, draft text, missing documents list
- [ ] Respect the 12 drafts/hour rate limit — show remaining count in UI

---

### P3 — Medium · Consolidation & enhancement · Resolves: G7, G8, G9

#### Task 3.1 — Migrate listing AI to OpenRouter

- [ ] Replace `LOVABLE_API_KEY` calls in `generate-business-description` with `openRouterChat()`
- [ ] Replace `LOVABLE_API_KEY` calls in `analyze-website` with `openRouterChat()`
- [ ] Remove `LOVABLE_API_KEY` from `.env.example` and Supabase secrets once migrated
- [ ] Test listing wizard AI features end-to-end after migration

#### Task 3.2 — Phase 2 bot grounding (live data)

- [ ] In `directory-assistant`, before calling `openRouterChat()`, run a Supabase query:
  - If message contains location keywords: query `public.businesses` for top 5 matching businesses
  - If message contains grant-related keywords: query `public.grants` for top 5 matching programs
- [ ] Format results as a context block and inject before the user message
- [ ] Keep context block under ~800 tokens to avoid inflating model costs

#### Task 3.3 — Resolve or remove voice UI stub

- [ ] **Decision required:** implement ElevenLabs voice or remove the mic button from `AIChatAssistant.tsx`
- [ ] If removing: delete the mic/voice UI elements — do not leave non-functional UI
- [ ] If implementing: create a separate `voice-assistant` edge function — do not block on this for P1/P2

---

## 6 — Acceptance criteria

Each task is complete when the following criteria are met. QA sign-off required before merging to `main`.

| Task | Acceptance criteria |
|------|---------------------|
| **1.1** Create `directory-assistant` | Edge function deployed. Returns a non-mock response to a test POST. Anonymous request succeeds. No API key visible in browser network tab. |
| **1.2** Rate limiting | 20 anonymous requests from same IP succeed. 21st returns HTTP 429. Authenticated users get 50 request limit. |
| **1.3** Wire `AIChatAssistant` | Homepage chat bot sends message to edge function and displays real response. Loading state visible during request. Error message shown on failure. |
| **1.4** Static grounding | Bot correctly states RTM membership price, links to `/grants`, links to `/membership`, and recommends advisor for eligibility questions. |
| **2.1** Secret validation | `test-openrouter-model.mjs` returns success. Both edge functions return HTTP 200 on smoke test. |
| **2.2** Grant intake wired | Submitting a grant intake form triggers `analyze_readiness`. AI draft appears in the narrative field. Missing documents list populates. |
| **3.1** Listing AI migrated | `generate-business-description` returns a description using OpenRouter. `LOVABLE_API_KEY` removed from secrets. Listing wizard works end-to-end. |
| **3.2** Live data grounding | Asking “find me a plumber in Toronto” returns results from the businesses table. Asking about grants returns programs from the grants table. |

---

## 7 — Deploy checklist

Run this checklist in order before each production deployment.

| # | Checklist item |
|---|----------------|
| □ | `OPENROUTER_API_KEY` set in Supabase → Project Settings → Edge Functions → Secrets |
| □ | `OPENROUTER_MODEL` set (validated via `scripts/test-openrouter-model.mjs`) |
| □ | Run: `node scripts/test-openrouter-model.mjs` — confirm success before deploy |
| □ | `supabase functions deploy directory-assistant` |
| □ | `supabase functions deploy grant-intake-assistant` |
| □ | Smoke test `directory-assistant` from localhost (anonymous POST) |
| □ | Smoke test `directory-assistant` from localhost (authenticated POST) |
| □ | Smoke test `grant-intake-assistant` with `action: analyze_readiness` |
| □ | Confirm rate limiting returns HTTP 429 after limit exceeded |
| □ | Confirm no API key appears in browser network requests |
| □ | Confirm CORS allows `rtmbusinessdirectory.com` and `grants.rtmbusinessdirectory.com` |
| □ | Test chat bot on production homepage — real response, no mock |
| □ | Monitor OpenRouter usage dashboard for first 24 hours after deploy |

---

## 8 — Open decisions required

| # | Decision | Options / notes |
|---|----------|-----------------|
| **D1** | Which OpenRouter model for `directory-assistant`? | Cost-efficient: `meta-llama/llama-3.1-8b-instruct`. Quality: `anthropic/claude-sonnet-4-5`. Default in repo: `openai/gpt-oss-120b:free` (validated by test script). Recommend running test script and picking best free tier for P1. |
| **D2** | Anonymous chat: allow or require login? | Allowing anonymous increases engagement but raises abuse risk. **Recommend:** anonymous with strict rate limit for P1, optional auth for richer answers. |
| **D3** | Voice feature: implement or remove? | ElevenLabs integration requires a separate API key and edge function. **Recommend:** removing the stub UI in P1 and revisiting in a future sprint. |
| **D4** | Phase 2 grounding scope | How many grants/businesses to inject as context? Suggested: top 5 each, filtered by relevance score. Requires keyword match or vector similarity on Supabase. |
| **D5** | Listing AI migration timing | Lovable API is currently working. Migrate in P3 to reduce risk. No urgency unless `LOVABLE_API_KEY` costs become a concern. |

---

## 9 — Repo ownership matrix

| Work item | Primary repo | Notes |
|-----------|--------------|-------|
| `directory-assistant` edge function | `launchpad-canada-ai` | New function + `config.toml` entry |
| `AIChatAssistant.tsx` wiring | `launchpad-canada-ai` | Homepage lives here |
| `grant-intake-assistant` deploy + secrets | `launchpad-canada-ai` | Already implemented |
| GrantPilot intake UI invoke calls | `stellar-business-os` | Task 2.2 |
| Listing AI migration | `launchpad-canada-ai` | Tasks 3.1 |
| OpenRouter secrets | Supabase dashboard | Never in `.env` committed to git |

---

## 10 — Document history

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| v1.0 | May 2026 | Initial document — full audit, gap analysis, implementation roadmap | RTM Global Canada |

---

**Questions or changes to this document?**  
RTM Global Canada · info@rtmbusinessdirectory.com · +1 416 900 8728 · 640 Sentinel Road, North York, ON M3J 0B2
