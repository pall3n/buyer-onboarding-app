# 07 — Build order, dependencies and release gates

## Guiding principle: working vertical slices

Build the **end-to-end flow with seeded data** before integrating real speech or external property sources. A nice standalone UI is not a shippable milestone. Each slice should have navigation, real state, persistence where required, authorization and tests.

## Release definitions

- **Prototype/demo:** fully navigable, good UI fidelity, seeded fictional agency/properties, real or fallback scripted conversation, live property comparison against real typed data. No claim of production reliability.
- **Pilot-ready MVP:** real authentication, secure invitations and buyer return, real voice with text fallback, versioned sharing, tenant isolation, accessible states, monitoring, approved privacy policy/retention and operational limits.
- **Expansion:** viewing feedback, new-listing outreach, aggregate vendor demand, portable consumer account and Somewhere.

## Build sequence

| Milestone | Deliverable | Prerequisites | Exit criterion | Status |
|---|---|---|---|---|
| M0 — Review & setup | Design inventory, acceptance map, migrations proposal, repo scaffolding | Handoff + designs | Layout and data decisions documented, lint/test/build working | ✅ Done |
| M1 — UI shell and seeded vertical slice | Agent workspace + invitation UI + buyer onboarding stub + profile and property demo navigation | M0 | Can move through all designed screens with coherent seeded data | ✅ Done |
| M2 — Agency and invite persistence | Agency auth/membership, tokenized invites, safe buyer session | M1 | Can invite and resume without seeing private draft on agency side | ✅ Done |
| M3 — Typed conversation and visual answer flow | Topic engine, saved turns, image ratings, renovation and tradeoff questions | M2 | Text-only buyer can produce a draft profile | ✅ Done |
| M4 — Extraction and buyer review/share | Structured candidates, inline corrections, versions, scoped grant | M3 | Approved version appears to agency; private edits do not leak | ✅ Done |
| M5 — Voice experience | Live browser voice + caption state, switch to text, mic/connection errors | M3/M4 | Voice buyer can complete same flow; text fallback reliable | ✅ Done |
| M6 — Agent intelligence | Evidence disclosures, open questions, agency notes | M4 | Agent can review confirmed evidence only, within own tenant | ✅ Done — property matching engine delivers fit breakdown with source disclosures and open questions; full agency-editable notes not yet built |
| M7 — Property fit and viewing brief | Manual property facts, deterministic evaluator, grounded brief, print/copy | M4/M6 | Contrasting listings produce justified outcomes and a usable brief | ✅ Done — deterministic brief generator, 9-zone Screen G layout, create/open brief from Screen F, print/copy, private notes |
| M8 — Pilot hardening | Tests, analytics, privacy, costs, observability, deployment | M2–M7 | End-to-end tests + security gates pass; can invite real pilot users | ⬜ Pending |

### Why this order?

- Implement typed onboarding **before** voice orchestration, making accessibility and debugging much simpler.
- Create a genuine sharing boundary **before** exposing agent intelligence.
- Property evaluation must operate on **approved structured data**, not a free-form transcript.
- Local place ingestion, full CRM sync and vendor demand can wait until the initial agency workflow produces value.

## Agent workflow and handoffs

For every milestone:

1. Read `README.md`, `01-PRODUCT-BRIEF.md`, the relevant PRD, architecture, design references and latest decisions.
2. Inspect existing repo before creating files. Identify migrations and components already present.
3. Write a short implementation plan and list assumptions in the task output; proceed unless a decision is genuinely blocking or unsafe.
4. Implement only milestone scope, using shared components and schema validation.
5. Add tests, seed fixtures and useful loading/error/empty states.
6. Run typecheck, lint, tests and build; report exact commands/results.
7. Update docs describing what exists, what remains stubbed and any contract divergence.
8. Do not silently start the next milestone or implement P2 extensions.

## Milestone cut lines

### M1 (initial demo)

**Can fake:** agency sign-in via dev-only fixture, voice dialogue via scripted transcript, emails, property photos (illustrative), external travel times.  
**Cannot fake:** actual UI navigation, state updates, preference edits or actions advertised as live. All demo fakes must be visibly marked or confined to dev mode.

### M2–M4 (minimum real buyer trial)

**Required:** invite link protection, saved partial answers, text-only completion, valid draft extraction, user correction, explicit share approval, agency-scoped view. A buyer must be able to revoke future share access through a verified route.

### M5 (voice pilot)

**Required:** server-issued short-lived voice credentials, no long-lived secrets in browser, browser permission flows, interruption, disconnect recovery, quota caps, transcripts/retention policy accurate. Do not launch voice without a reliable text fallback.

### M6–M7 (agent payability demo)

**Required:** a 30-second readable profile, evidence and open questions, manual/seeded listing, stable match evaluation and copy/print brief. The match result must never fabricate a fact or suppress a hard conflict.

### M8 (real pilot)

**Required:** privacy and contractual review, verified return access, rate limits, audit, tenant breach tests, deletion/correction process, recording/provider data handling documentation, error tracking, safe costs, accessibility and E2E regression suite.

## MVP sample dataset

**Hartfield & Rowe / Sophie Lane:** Tunbridge Wells fictional independent agency.  
**Maya and James Reid:** £650k–£800k, 3+ bedrooms, walkability to town and countryside, character and secure private garden for Bramble, will trade some space for location, kitchen renovation acceptable.  
**Amara Osei:** £375k–£450k, 2 bedrooms, station access and natural light, no garden needed.  
**Larkfield House:** £725,000 Victorian semi, strong lifestyle fit, small third room; shared side passage and rear fence security **unknown**.  
**4 Ashgrove Place:** more specification, but overlooked garden conflicts with Reids' essential privacy preference.  
**Flat 3 Calverley Court:** suited to Amara in light/commute respects, service charge unknown.  
All listing addresses, details, routes, times and buyer identities in screenshots are **fictional demonstration data**.

Create deterministic seed data with fixed UUIDs so E2E screenshots and matching results remain stable. Avoid copying the HTML runtime or bundled fonts.

## Exit decision after pilot

**Continue** only if buyers complete, agents actually use profiles/viewing packs, underlying costs are sustainable, and someone agrees to pay. If response is “nice to have,” focus on whether the agent actually gains something measurable or whether the product needs to shift toward tighter integration with the existing CRM before broadening features.

## Effort planning

Previous planning estimate was 5–7 weeks of full-time-equivalent work for a capable engineer; treat this as **rough and unvalidated**, especially for live voice and privacy hardening. AI coding agents may speed up implementation but do not remove testing/integration cost. Milestone exit criteria matter more than promised calendar dates.
