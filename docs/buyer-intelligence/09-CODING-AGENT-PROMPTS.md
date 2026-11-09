# 09 — Copy-paste prompts for coding agents

## How to use these prompts

Place this handoff folder in the coding workspace under `docs/buyer-intelligence/` (or provide the files explicitly) together with the **original Claude Design HTML as visual reference only**, if available. The nine screenshot references are in `reference/screens/`.

Send **Master instruction** once to the primary coding agent, then the relevant phase prompt. Each phase deliberately ends at an acceptance checkpoint. Use test output to decide when to progress; do not ask one agent to build the entire system from a single vague instruction.

If your agent is working in an already-existing repo, it must inspect the repo before deciding where code belongs. If it is a fresh repo, it may scaffold a new Next.js app.

---

## MASTER INSTRUCTION — persistent project context

```text
We are building “Buyer Intelligence”, an agency-led SaaS for estate agents. It lets a buyer complete a natural AI-assisted voice, text and visual onboarding conversation, review their own home brief, explicitly approve what to share with the inviting agency, then lets the negotiator understand the buyer, compare properties with evidence and prepare personalised viewing briefs.

The future architecture must allow buyer-owned portable profiles and per-agency sharing, but do NOT implement a full consumer product, CRM or marketplace for the MVP.

Read all files in docs/buyer-intelligence/, especially README.md, 01-PRODUCT-BRIEF.md, 02-DESIGN-IMPLEMENTATION-BRIEF.md, 03-PRDS-CORE.md, 04-ARCHITECTURE-AND-DATA.md, 05-AI-VOICE-AND-MATCHING.md, 07-DELIVERY-PLAN.md and 08-ACCEPTANCE-AND-EVALUATION.md. Inspect the nine reference screenshots before touching UI. The uploaded Claude Design HTML is a VISUAL REFERENCE ONLY; do not copy/transplant its implementation, scripts or bundled CSS. Use TypeScript, Next.js, Tailwind, shadcn/ui, Motion for React and a suitable database layer (proposed Supabase).

Critical product rules:
1. Agency tenant data and buyer-owned home-profile data are distinct; agency notes must never enter the portable profile.
2. Agency reads only explicit approved profile versions and shared evidence; private drafts and even the existence of withheld items must not leak.
3. Unknown/unselected is unknown, never a dislike or negative match.
4. Hard conflicts take priority over soft matching; property and local claims need sources and verification state.
5. Buyer can complete the entire experience by text, without granting microphone access.
6. Do not store raw voice recordings by default; any recording/transcript retention claims must match implementation.
7. Every button/CTA should work or be clearly marked as out of scope; no silent mock success states.
8. Keep the app minimal and elegant. Prefer shadcn primitives, inline editable states, coherent component APIs, accessible focus behavior and restrained morphing transitions over excessive dialogs.
9. Use the fictional Hartfield & Rowe / Sophie Lane / Maya & James Reid / Amara Osei / Larkfield House / 4 Ashgrove Place data, clearly marked as demo.
10. Do not implement future vendor demand intelligence, automated outreach or consumer account switching until explicitly asked.

Working method:
- Inspect the existing repo and scripts first.
- State an implementation plan and any assumptions in your response; proceed with the phase unless genuinely blocked.
- Implement only the named phase in coherent modules with runtime validation and tests.
- Run available typecheck, lint, tests and build, fixing failures.
- Report files changed, migrations, actual tested behavior, limitations, and commands/results.
- Do not leave fake production controls, secrets, unauthorised reads or ignored errors.
```

---

## PROMPT 0 — Inspect, scaffold and propose technical contracts ✅ Done

```text
Start Milestone M0. Inspect the repository; do not assume it is empty. Read the Buyer Intelligence handoff. Review all nine screenshots and their design-screen mapping. Identify existing packages, routing, auth, migrations and test setup.

If the repo is empty, scaffold a current supported Next.js TypeScript App Router project with Tailwind, shadcn/ui, Motion for React, linting, Vitest and Playwright. Prefer conventional packages and a straightforward folder structure; verify exact dependencies using installed package manager and current docs as needed.

Write a short IMPLEMENTATION_PLAN.md containing:
- route map and major components,
- data/service boundaries, actor permissions and migration order,
- recommended library choices and why,
- design tokens/components from supplied images,
- first vertical slice strategy,
- key risks and any genuine blockers.

Initialize the CSS token/theme foundation close to the screenshots. No AI integration yet. Add test/typecheck/build scripts if missing. Run them and report results. Stop after M0.

Do not copy generated HTML. Do not include embedded font files.
```

## PROMPT 1 — Build visual shell and seeded demo screens ✅ Done

```text
Implement M1, the design foundation and navigable vertical slice, using 02-DESIGN-IMPLEMENTATION-BRIEF.md and supplied screen PNGs as visual reference.

Build:
- Agency layout/sidebar and Buyers dashboard (empty and populated),
- buyer invitation mobile page,
- desktop and mobile conversation layouts, voice dock as a UI state machine but no remote voice yet,
- home brief view and inline preference-edit UI,
- agent buyer profile, property-fit screen and printable viewing-brief layout,
- demo navigation between all screens using stable typed seed fixtures.

Use shadcn/ui and Tailwind primitives. Compose reusable components; no giant page files. Add responsive behavior, semantic HTML, keyboard focus and sensible reduced-motion handling. Use Motion for React only for purposeful type↔voice composer, visual-choice and inline-evidence transitions.

UI copy must match its actual functionality: if “Send”, “PDF” or “Share” isn't implemented, do not present a clickable action that falsely claims success; mark as future or omit. Demo scenario must remain labelled fictional.

Do NOT add realtime AI, integrations, payment, listing scraping or demand insight. Add basic component/smoke tests and screenshots if available. Verify all navigation. Report fidelity gaps vs screenshots. Stop after M1.
```

## PROMPT 2 — Auth, tenant isolation and secure invitation flow ✅ Done

```text
Implement M2 from PRD-01 and architecture spec. Add Supabase/Postgres migrations (or adapt existing backend) for agencies, agency memberships, provisional buyer subjects, invitations, sessions, agency-buyer links and audit. Set up server-side auth and tenant checks.

Build real invite creation, copy/expiry/revoke, status progression and safe public invite landing. Persist original agency-prefill separately as unconfirmed suggestions. Buyer enters an invitation-scoped session without needing an account; returning on a new device requires verified recovery or a safe explicit limitation.

Use unpredictable hashed invitation tokens, HttpOnly session cookies, server-side authorization, RLS defence in depth, validation and rate limits. Never treat URL buyer/session IDs as authority. Agents can see invitation status but not unpublished buyer draft data.

Tests: invalid/revoked/expired invites, agency A cannot see agency B, no leaked buyer identity via errors, stale session and invite replay checks. Run migration/check/test/build. Stop after M2.
```

## PROMPT 3 — Typed conversation with visual choices and persistence ✅ Done

```text
Implement M3, a fully usable text-first conversation engine. Use PRD-02 and the supplied conversation designs.

Include topic progression, typed responses, dynamic choice cards (location, visual property/garden styles, renovation tolerance, trade-off ranking), skip/edit, lightweight private “brief taking shape” rail and safe checkpoint persistence. Use schema-validated interaction descriptors, not model-generated HTML. To keep tests deterministic, start with a predictable scripted question strategy and an adapter for later AI responses.

Important: unselected renovations are UNKNOWN; only explicit “not for me” becomes negative. Previously supplied agent prefill is labelled unconfirmed. The entire journey must work without voice. Add keyboard and mobile tests, session continuity/reload tests and typed fixture outcomes.

No agent can read provisional profile data before approval. Don't implement outbound email, voice or the future extensions. Stop after M3.
```

## PROMPT 4 — Structured extraction, buyer review, versions and sharing ✅ Done

```text
Implement M4 using PRD-03, architecture and AI/extraction spec. Create a discriminated, Zod-validated preference registry with real type-safe value models; retain source turn/visual references and confidence/confirmation status. Implement an extraction adapter that supports deterministic seeded data first and a model call behind a server-only interface if configured.

Buyer home brief must render the actual draft, allow inline changes, importance edits, remove/correct, inspect important evidence, and approve only selected sections/evidence for the inviting agency. Approval creates an immutable version and an explicit agency share. Later edits form an unpublished new draft. Implement revocation of future access with accurate user wording.

Ensure buyer edits supersede machine suggestions; do not allow candidate extraction to overwrite confirmed values. No hidden data leaks, including private-field counts. Implement share audit events.

Tests: unauthorised draft reads, section-level sharing, unpublished edit isolation, v1/v2 snapshot stability, revocation, extraction conflict handling, and retry without data loss. Stop after M4.
```

## PROMPT 5 — Realtime voice and resilient shared session ✅ Done

```text
Implement M5. Add a provider adapter for browser realtime voice (prefer the currently supported OpenAI Realtime WebRTC flow; verify SDK/API details in official documentation before coding). The server must issue short-lived scoped credentials; never ship long-lived secrets to browser.

Integrate voice into the SAME conversation state as typed turns and visual-choice actions. Implement states: idle, connecting, listening, thinking, speaking, muted, paused, mic denied, disconnected, quota/error. User can interrupt speech, pause, switch to text, resume, and review transcribed captions. Preserve saved context and prevent duplicate turn persistence.

Keep browser audio recording non-persistent by default, and document provider/transcript retention behavior. Add usable no-mic, no-permission, mid-speech disconnect and rate-limit fallback states. No calls to buyers by phone. Use mocked provider in tests, with optional real-voice manual smoke tests, plus cost/latency telemetry. Stop after M5.
```

## PROMPT 6 — Agent buyer intelligence and trust UI ✅ Done (property fit breakdown, evidence disclosures, open questions; full agency-editable notes deferred to M8)

```text
Implement M6, the agent buyer intelligence page using PRD-04 and screenshot 06. Data must come only from explicitly approved shared profile versions, not the raw buyer draft.

Build summary, budget/location/bedrooms/timing, priorities, dealbreakers, lifestyle, taste, renovation, trade-offs, clarifying questions, recent approved changes, and source evidence disclosures. Keep “Suggested” visually distinct from “Confirmed”. Implement agency-private notes with real persistence and tenant authorization. An agent “Correct this” action should initiate clarification or private notation; not overwrite buyer-owned confirmed data.

Implement appropriate responsive sidebar/rail and keyboard interactions. The design reference mentions a hidden item; never expose the existence/count of withheld preferences. Add security tests across tenants and scopes; visual/mobile tests. Stop after M6.
```

## PROMPT 7 — Deterministic property matching and explanations ✅ Done

```text
Implement M7a using PRD-05 and 05-AI-VOICE-AND-MATCHING.md. Add agency-scoped manual property records plus revisioned typed fact sources, verification flags and fictional seeded listings Larkfield House, 4 Ashgrove Place, Flat 3 Calverley Court.

Create a deterministic evaluator for confirmed hard requirements and explainable soft preferences. Results split into strong matches, potential compromises, hard conflicts, unknown check-before-viewing and suggested questions. Store the exact approved profile version and property revision used. Any narrative AI augmentation is an optional server-only formatter that may not change hard rule outputs or introduce new facts.

Ensure Ashgrove is a conflict because of overlooked garden, while Larkfield is a lifestyle match with unresolved security details. Do not fake walking times as verified live facts. Add thorough unit tests for budget, bedrooms, skipped values, contradictory preferences, stale versions, unverified sources and cross-tenant requests. Stop after M7a.
```

## PROMPT 8 — Viewing brief and print experience ✅ Done

```text
Implement M7b using PRD-06 and screenshot 08. From a saved, authorised analysis generate a viewing brief as an editable structured document with buyer snapshot, relevant features, three things to show, objections, local evidence, checks, questions and private agency notes. Include source and profile/property version metadata.

Match the supplied editorial visual style. Implement real copy and print with a dedicated print stylesheet, graceful page breaks and accessible edit states. Keep private notes out of buyer-facing exports. If PDF export or colleague sharing is not implemented, remove or clearly mark those controls instead of faking them.

Unknown footpaths, walk times and garden boundaries must be presented as needs-check, not verified. Show conflict warnings even if an agent intentionally produces a viewing brief. Persist edits and audit significant actions. Add export/private-note and version snapshot tests. Stop after M7b.
```

## PROMPT 9 — Pilot hardening and regression suite ⬜ Pending

```text
Implement M8 guided by 08-ACCEPTANCE-AND-EVALUATION.md. Audit all server queries for actor/tenant/share/version authorization, including anonymous buyer flow and API endpoints. Add E2E for buyer invite → text/visual conversation → edit → approve → agent profile → Larkfield/Ashgrove comparison → printed brief.

Run unit/integration/E2E, security tests, accessibility checks and reduced-motion/mobile smoke. Add rate limits, provider quotas/cost alarms, safe logging, failure retry, environment validation and basic operational docs. Confirm every user-facing privacy/retention statement against actual implementation and flag any issue requiring specialist legal review before processing real buyer data.

Do not call the system production-ready if unresolved critical privacy or cross-tenant issues remain. Produce a pilot readiness report with test command results, known risks, configured quotas and precise next tasks. Stop after M8.
```

---

## EXTENSION PROMPT A — Viewing feedback (only after core pilot)

```text
Design and implement the smallest post-viewing feedback vertical slice from 06-EXTENSIONS-ROADMAP.md. First inspect buyer, agency, property, shared-version and permissions models. Add agency-created feedback invitations bound to one viewing and one buyer; short mobile form with optional voice/text, pros, objections, interest level and next steps.

Produce an agent-facing concise feedback summary and optional preference-change candidates. Do NOT automatically mutate the buyer's confirmed home brief; changes require buyer review and a new approved version. Tests must cover wrong buyer/property, expired link, replay, private notes and tenant isolation. No automatic marketing send. Stop with a demo and migration/test results.
```

## EXTENSION PROMPT B — Matched property recommendations (human-reviewed first)

```text
Using 06-EXTENSIONS-ROADMAP.md, build a new-listing buyer shortlist for one agency, with deterministic eligibility, explicit consent/communication preferences, hard conflicts, stale profiles, opt-outs and duplicate suppression. Show agents grounded “why matched” and a draft personalised message. No sending until an authenticated agent reviews and confirms each recipient/message, with audit and rate limits. Verify UK channel compliance obligations before enabling real communications; avoid any faux send state.

Test opt-outs, revoked grants, repeat sends, changed listing revision, privacy boundaries and property hallucination. Keep campaigns and automation out of scope initially.
```

## EXTENSION PROMPT C — Buyer Demand Radar (pilot behind feature flag)

```text
Prototype aggregate agency buyer-demand insight per 06-EXTENSIONS-ROADMAP.md, initially on fictional data only. Cohorts include only active deduplicated shared buyer searches with documented data-use permission and freshness; group by broad area, budget, bedrooms and general housing attributes. Do not reveal individual buyers, preferences, transcript excerpts or micro-cohorts. Start with a provisional minimum displayed count of 10 plus protections against iterative differencing; run a privacy-risk review before any live seller-facing use.

Build a clear, reproducible “seller demand snapshot” with timestamp, cohort definition, exclusion rules and disclaimer that these are indicators of preferences, not offers or guaranteed buyers. Test small cohorts, duplicate joint searches, revoked sharing, inactive buyers and filter differencing. Do not perform seller targeting or automatic vendor outreach.
```

## EXTENSION PROMPT D — Portable buyer account (future)

```text
Implement buyer account claiming and selective multi-agency sharing using the architecture already created. Verify the person claiming a provisional profile, do not merge based solely on email string. Provide a buyer-controlled grants dashboard with each agency and approved version, selective updates, access revocation and audit. Preserve each agency's own notes and evaluations as private. Somewhere integration is a separate, explicit consent flow and must not be coupled to estate-agent grants. Build cross-tenant and unshared-data leakage tests first.
```

---

## Final review prompt for any coding agent

```text
Review the work just implemented against the named milestone PRDs and supplied screenshots. List:
1. Actual working behavior, not merely UI controls.
2. Acceptance cases covered, with exact test commands and results.
3. Screens/flows that intentionally diverge from the reference and why.
4. Security/privacy constraints addressed and any unresolved issues.
5. Changed files and database migrations.
6. Outstanding issues and the smallest next vertical slice.

Fix material bugs identified in this review; do not silently implement unrelated future features.
```
