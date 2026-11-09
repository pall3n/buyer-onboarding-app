# Pilot Readiness Report

**Date:** 2026-11-09  
**Milestone:** M8 — Pilot Hardening  
**Status:** Ready for restricted pilot (see Pre-launch checklist below)

---

## Security issues resolved

All HIGH-severity cross-tenant isolation gaps identified in the M8 audit have been fixed.

| Severity | Issue | Status |
|---|---|---|
| HIGH | `runAnalysisAction` silently failed — server-to-server fetch without cookies | **Fixed** — now calls `runAndPersistAnalysis()` directly |
| HIGH | `GET /api/analysis` had no ownership check on `agencyBuyerId` | **Fixed** — adds `.eq('agency_id', agent.agencyId)` after auth |
| HIGH | `loadViewingBrief` queried by `id` only, any agent could read any brief | **Fixed** — added `agencyId` parameter with `.eq('agency_id', agencyId)` |
| HIGH | `loadBriefIdForBuyerAndProperty` had no agency scope | **Fixed** — added `agencyId` parameter |
| HIGH | `PropertyFitPage` discarded `requireAgentAuth()` return value | **Fixed** — `agent` captured, `agencyId` threaded to all sub-queries |
| MEDIUM | Privacy statement contradicted actual behavior | **Fixed** — now accurately describes transcript storage |
| MEDIUM | No startup env validation — missing vars failed silently | **Fixed** — `src/lib/env.ts` with Zod schema; fails at module load |
| MEDIUM | No rate limit on `POST /api/conversation` | **Fixed** — 20 turns/session/minute; returns 429 |
| LOW | Duplicate `logAuditEvent` implementations | **Fixed** — `src/lib/db/index.ts` is canonical; conversation routes updated |

---

## Privacy statement

`src/components/buyer/BuyerInvitation.tsx` previously read:
> "We don't store recordings."

Updated to:
> "Voice audio is not stored. Conversation transcripts are saved to build your profile."

This accurately reflects the system's behavior: audio is never persisted, but `conversation_turns` rows are written for every exchange.

---

## Test coverage

| Suite | Count | Status |
|---|---|---|
| Unit — matching engine | 48 | Passing |
| Unit — viewing brief generator | 6 | Passing |
| Unit — other features | ~49 | Passing |
| **Total unit** | **~103** | **All passing** |
| E2E — demo navigation | 2 | Requires dev server |
| E2E — demo property fit (Screen F) | 4 | Requires dev server |
| E2E — demo viewing brief (Screen G) | 9 | Requires dev server |
| **Total E2E** | **15** | **Demo paths only** |

**Deferred E2E coverage:** The full authenticated flow (invite → conversation → approve → agent → brief) requires seeded test users in Supabase. This is the highest-priority post-pilot engineering task.

---

## Known deferred items

These are intentionally deferred for pilot; none blocks a restricted launch with 1–2 agencies.

| Item | Reason deferred |
|---|---|
| Inline brief editing (Section G zone edits) | Requires real-time collaborative editing or optimistic locking; out of scope for MVP |
| PDF export | Needs a headless Chrome / print-to-PDF service (e.g. Puppeteer or Gotenberg); browser print works |
| Share brief with colleague | Requires short-lived share tokens and a viewer-only page |
| Authenticated E2E test suite | Needs seeded Supabase test users and a CI-safe env |
| `src/lib/observability/index.ts` deletion | File is dead code (no callers remain) but kept to avoid an unnecessary diff; safe to delete post-pilot |
| AI-generated prose in viewing brief | `generateBrief()` is deterministic; upgrading to Claude-generated prose is an M9 option |

---

## Architecture summary

```
Buyer invitation
  └─ /brief/[opaqueId]/conversation (voice or text)
       └─ POST /api/conversation → appendTurn → extractAndPersist
            └─ profile_versions / profile_preferences (Supabase)

Agent: approve preferences → run analysis
  └─ runAndPersistAnalysis (matching/index.ts)
       └─ property_analyses (Supabase)

Agent: create viewing brief
  └─ createBrief (viewing-briefs/index.ts)
       └─ viewing_briefs (Supabase)
            └─ Screen G — printable brief with private notes
```

All DB writes use the admin client (bypasses RLS). All agent-facing queries include an `agency_id` scope guard. Buyer-facing routes use buyer session cookies.

---

## Pre-launch checklist

Before serving real users, verify:

- [ ] **Environment variables** set in production: `SUPABASE_URL`, `SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `OPENAI_API_KEY`
- [ ] **Database migrations** applied in order (001–009 at minimum; check `supabase/migrations/`)
- [ ] **RLS policies** reviewed — confirm `viewing_briefs`, `property_analyses`, `profile_preferences` have SELECT-only policies for agents; writes go via service role
- [ ] **Supabase Auth** configured: email link sign-in enabled for agents; buyer invitation flow uses `buyer_sessions` table (no Supabase auth required for buyers)
- [ ] **Domain** configured in Supabase auth `redirect_urls` whitelist
- [ ] **OpenAI Realtime API** quota confirmed for the pilot agency's expected call volume
- [ ] **Pilot agency** seeded: at least one `agencies` row, one agent user, one `agency_buyers` row with a live invitation
- [ ] **Demo paths** tested end-to-end in production build: `/viewing-briefs/demo-brief-larkfield`, `/buyers/demo-buyer-maya/matches/demo-prop-larkfield`
- [ ] **Print layout** tested in Chrome: private notes hidden, no-print elements hidden, page breaks clean
- [ ] **Rate limit** verified: >20 rapid conversation turns returns 429

---

## Post-pilot engineering priorities

1. Authenticated E2E test suite (seed Supabase test users in CI)
2. AI-generated prose in `generateBrief()` — upgrade `buyerSnapshot` and `whyItMaySuit` to Claude-generated copy
3. PDF export via headless Chrome
4. Brief sharing (short-lived view tokens)
5. Multi-property brief comparison view
