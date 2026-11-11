# Buyer Intelligence — Implementation Plan

## Overview

Agency-led SaaS that gives estate agents a structured, privacy-preserving view of each buyer's preferences and helps buyers articulate their requirements through a guided conversation. The system separates agency-owned operational data from buyer-owned preference profiles, with explicit sharing grants mediating cross-boundary access.

---

## Route map and major components

| Route | Screen | Key components |
|---|---|---|
| `/(agency)/buyers` | A — Agent workspace | `AgencyShell`, `BuyerCard`, `PropertyEvalCard` |
| `/(agency)/buyers/[agencyBuyerId]` | E — Buyer profile | `AgencyBuyerProfile`, `TrustBadge`, `EvidenceDisclosure` |
| `/(agency)/buyers/[agencyBuyerId]/matches/[propertyId]` | F — Property fit | `FitBreakdown`, `PropertyFactCard` |
| `/(agency)/viewing-briefs/[briefId]` | G — Viewing brief | `ViewingBriefDocument`, `PrintToolbar` |
| `/invite/[token]` | B — Invitation | `BuyerInvitation` |
| `/brief/[opaqueId]/conversation` | C — Conversation | `ConversationThread`, `VoiceComposer`, `EmergingBrief` |
| `/brief/[opaqueId]/review` | D — Home brief | `PreferenceEditor`, `HomeBriefSummary`, `SharingReview` |

---

## Data/service boundaries and actor permissions

### Ownership model

- **Buyer-owned**: `home_profiles`, `home_profile_versions`, `profile_preferences`, `profile_evidence`
  — never readable by agency without an active `profile_shares` grant
- **Agency-owned**: `agency_buyers.private_notes`, `property_analyses`, `viewing_briefs`
  — scoped to tenant; never enter buyer's portable profile
- **Shared boundary**: `profile_shares` + `profile_share_events`
  — approved version + selected scopes only; existence/count of withheld items must not leak

### Actor permission matrix

| Actor | Can read | Can write | Notes |
|---|---|---|---|
| Buyer | Own `home_profile`, `profile_preferences`, `profile_evidence` | Same | Via opaque session token |
| Agent | `agency_buyers` (own tenant), `profile_shares` grants | `agency_buyers`, `property_analyses`, `viewing_briefs` | Requires agency membership |
| Server action | All within verified actor context | Same | Must verify: actor type + agency_id + record relationship + active grant + version |

All server actions must verify: actor type → agency_id membership → record relationship → active grant → version.

---

## Migration order

1. `agencies`, `agency_memberships`
2. `buyer_subjects`, `buyer_contact_points`, `buyer_invitations`, `buyer_sessions`
3. `home_profiles`, `home_profile_versions`, `profile_preferences`, `profile_evidence`
4. `profile_shares`, `profile_share_events`, `agency_buyers`
5. `properties`, `property_facts`, `property_fact_sources`
6. `property_analyses`, `viewing_briefs`
7. `audit_events`
8. Seed: Hartfield & Rowe / Sophie Lane / Maya+James Reid / Amara Osei / Larkfield House / 4 Ashgrove Place / Flat 3 Calverley Court (fixed UUIDs in `seed/demo.ts`)

---

## Library choices and rationale

| Library | Rationale |
|---|---|
| Next.js 16 App Router | Specified; server components suit tenant-isolation access checks; async params enforced by type system |
| Tailwind v4 (CSS-only config) | Already installed; `@theme inline` block bridges BI tokens to shadcn semantic vars |
| shadcn/ui | Accessible primitives; Radix under the hood; copy-owned so no shadcn version lock |
| Motion for React (`motion`) | Specified; replaces `framer-motion`; React 19 compatible; used for composer morph, visual card collapse, orb states |
| Supabase (`@supabase/supabase-js` + `@supabase/ssr`) | Postgres + Auth + Storage + RLS; `@supabase/ssr` for cookie-based session in App Router |
| Zod | Runtime contracts for preference values, API payloads, extraction results |
| Vitest + @testing-library/react | Fast unit/component testing; jsdom environment; compatible with Turbopack (separate config) |
| Playwright | E2E browser tests; M8 full regression suite |

---

## Design tokens

Warm off-white background (`#faf9f5`), white surfaces, muted sage accent (`#607b6b`), soft apricot callout (`#f2e6d8`), dark ink text (`#202923`), low-contrast border (`#e3e7e0`). Instrument Serif for editorial moments (buyer brief hero, viewing pack title); Geist for UI.

Tokens are declared as `--bi-*` custom properties in `globals.css` and mapped into shadcn's semantic `--background`, `--foreground`, `--primary`, etc. vars so all shadcn components automatically adopt the brand palette.

---

## First vertical slice strategy (M1 target)

Build all 7 screens navigable with in-memory demo seed (no real auth/DB). Each screen renders correct layout, typography, color tokens, and seeded fictional data clearly marked `[Demo]`. No silent fake success states — buttons either work or carry a visible "not yet implemented" label.

M1 exit criterion: can navigate the full flow —
`agency workspace → buyer invitation → conversation → home brief → buyer profile → property fit → viewing brief`

---

## Milestone plan

| Milestone | Deliverables | Status |
|---|---|---|
| **M0** | Scaffold, deps, theme tokens, route stubs, IMPLEMENTATION_PLAN.md | ✅ Done |
| **M1** | All 7 screens with demo seed, in-memory navigation, no auth | ✅ Done |
| **M2** | Supabase schema (migrations 1–8), RLS policies, seed script, auth + invitation flow | ✅ Done |
| **M3** | Auth: invitation flow, buyer session, agent sign-in via Supabase Auth | ✅ Done |
| **M4** | Conversation engine: text modality, preference extraction, emerging brief | ✅ Done |
| **M5** | Voice modality: WebRTC/Realtime, server-issued ephemeral token, waveform UI | ✅ Done |
| **M6** | Property matching: hard rules + soft signals, fit breakdown | ✅ Done |
| **M7** | Viewing brief generation and PDF/print export | ✅ Done |
| **M8** | E2E test suite, security review, performance audit, soft launch | ✅ Done |
| **Ext A** | Post-viewing feedback portal: invite token, buyer form, agent summary (Screen G) | ✅ Done |
| **Ext B** | Buyer shortlist for new listings: eligibility, draft message, human review (Screen H) | ✅ Done |
| **Ext C** | Buyer Demand Radar: aggregate demand snapshot, suppression gates, seller pitch (Screen I) | ✅ Done |
| **Ext D** | Portable buyer account: verified claim flow, grants dashboard, revocation, Somewhere isolation (Screens J/K) | ✅ Done |

---

## Key risks and genuine blockers

| Risk | Mitigation |
|---|---|
| Next.js 16 async params footgun | `async` on every page, `await props.params`; TypeScript catches sync access |
| shadcn + Tailwind v4 CSS var naming collision | BI tokens prefixed `--bi-*`; `@theme inline` maps selectively; shadcn semantic vars overridden in `:root` |
| Motion v11 + React 19 compatibility | Verify `motion` peer deps; use `LazyMotion` + `domAnimation` to reduce bundle |
| `@supabase/ssr` cookie handling with Next.js 16 proxy (not middleware) | Auth guard goes in `src/proxy.ts` exporting `proxy`; verify against docs before M2 |
| Vitest doesn't share Turbopack config | Separate `vitest.config.ts` with `@vitejs/plugin-react`; no Next.js plugin needed |
| Voice (M5) ephemeral credential pattern | OpenAI Realtime session token must be server-issued; never expose long-lived key to client |
| "Recordings transcribed then deleted" claim in design | Do not surface this copy until the pipeline demonstrably implements it |
| Buyer profile portability | All buyer data must be exportable and deletable independent of agency relationship |

---

## File structure

```
src/
  app/
    globals.css              ← BI theme tokens + shadcn vars
    layout.tsx               ← root layout (Geist + Instrument Serif fonts)
    page.tsx                 ← redirect → /buyers
    (agency)/
      layout.tsx             ← AgencyShell sidebar
      buyers/
        page.tsx             ← Screen A: Agent workspace dashboard
        [agencyBuyerId]/
          page.tsx           ← Screen E: Agent buyer profile
          matches/
            [propertyId]/
              page.tsx       ← Screen F: Property fit analysis
      properties/
        page.tsx             ← Properties list
      viewing-briefs/
        [briefId]/
          page.tsx           ← Screen G: Personalised viewing brief
      settings/
        page.tsx
    invite/
      [token]/
        page.tsx             ← Screen B: Buyer invitation (mobile)
    brief/
      [opaqueId]/
        conversation/
          page.tsx           ← Screen C: Live conversation
        review/
          page.tsx           ← Screen D: My home brief
        shared/
          page.tsx           ← Sharing confirmed state
  components/
    ui/                      ← shadcn primitives
    agency/
      AgencyShell.tsx        ← sidebar + nav layout
      BuyerCard.tsx          ← buyer list item
      PropertyEvalCard.tsx   ← fit result summary card
    buyer/
      BuyerInvitation.tsx    ← invitation landing
      ConversationThread.tsx ← message thread
      HomeBriefSummary.tsx   ← emerging brief sidebar
    shared/
      TrustBadge.tsx         ← Confirmed/Suggested/Unknown/Conflict
      DemoBanner.tsx         ← "[Demo data]" disclosure strip
  features/
    invitations/             ← validators, repo, service
    conversation/            ← state, modality adapters
    preferences/             ← schemas, Zod contracts
    sharing/                 ← grants and auth
    properties/              ← facts, sources
    matching/                ← hard rules, soft signals
    viewing-briefs/          ← generation, editable draft
  lib/
    auth/                    ← actor resolution
    db/                      ← query layer
    ai/                      ← model adapters
    observability/           ← safe metrics
supabase/
  migrations/                ← SQL files (authored in M2)
seed/
  demo.ts                    ← Hartfield & Rowe demo fixtures
tests/
  setup.ts
  unit/
  integration/
  e2e/
  security/
```
