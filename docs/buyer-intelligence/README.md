# Buyer Intelligence — coding-agent handoff

**Edition:** 0.3 · 30 October 2026  
**Status:** Implementation-ready specification with explicit assumptions; not a claim that the supplied prototype is production code.  
**Product:** agency-led conversational buyer intelligence for UK estate agencies, designed for future buyer-owned portable profiles.

## Start here

1. **`01-PRODUCT-BRIEF.md`** — goals, users, value proposition, MVP boundaries, commercial test, invariants.
2. **`02-DESIGN-IMPLEMENTATION-BRIEF.md`** — exact screen inventory, visual/interaction direction, shadcn components, responsive behavior and gaps in the supplied design.
3. **`03-PRDS-CORE.md`** — feature requirements, user stories, workflows and measurable acceptance criteria for launch.
4. **`04-ARCHITECTURE-AND-DATA.md`** — Next.js/Supabase architecture, multi-tenancy, identity, sharing, schema, state machines, security and audit.
5. **`05-AI-VOICE-AND-MATCHING.md`** — conversational orchestration, extraction contracts, matching engine, local evidence, prompt contracts, fallback modes and evaluations.
6. **`06-EXTENSIONS-ROADMAP.md`** — aggregated buyer demand to help win instructions, buyer viewing feedback, consented matched-property outreach and portability/Somewhere.
7. **`07-DELIVERY-PLAN.md`** — vertical slices, dependencies, demo vs paid-pilot gate, implementation priorities.
8. **`08-ACCEPTANCE-AND-EVALUATION.md`** — test cases, privacy/security gates, analytics, representative demo scenarios and pilot metrics.
9. **`09-CODING-AGENT-PROMPTS.md`** — copy-paste master and phase prompts, agent operating rules, checkpoints and verification.
10. **`10-DECISIONS-AND-RISKS.md`** — decisions already made, remaining assumptions, observed prototype inconsistencies and risks.

`reference/screens/00.png`–`08.png` contain the nine PNG exports supplied by the user, renamed only for predictable references. The original uploaded HTML is **for inspection/reference only** and is intentionally **not used as application code**. Refer to it alongside these screenshots if accessible to the coding agent.

## What comes from where

- **Observed design:** Nine supplied PNGs and readable UI contents from the uploaded Claude Design HTML, including Hartfield & Rowe, Sophie Lane, Maya and James Reid, Amara Osei, Larkfield House, 4 Ashgrove Place, the invitation, voice journey, approved home brief, buyer profile, property fit and viewing pack.
- **Agreed direction:** Earlier conversation establishing the agency-first/hybrid strategy, permissions, voice + typed chat, visual cards, preference profiles and explainable match/viewing brief.
- **New feature ideas:** Aggregated buyer demand for vendor prospecting, post-viewing feedback portal and automatic new-property outreach, supplied in the latest user request.
- **Proposed engineering choices:** Architecture, data fields, route shapes, success metrics, thresholds and delivery sequence in this handoff. These are **recommendations**, not features demonstrably implemented in the prototype.

## Non-negotiable constraints

- Do not rebuild the supplied HTML as the production application or copy its implementation. Re-create behavior in typed React, Tailwind and shadcn primitives based on the references.
- Keep buyer home profiles and agency relationship data separate. A buyer only shares an approved profile version; the agency cannot silently access drafts or later edits.
- Do not store or reveal a raw recording by default. If retaining a transcript/evidence, say exactly what is retained and for how long; no unsupported privacy promises.
- Unknown property attributes remain unknown. Unanswered visual choices remain unknown, not dislikes. Conflicts with true hard constraints override attractive lifestyle matches.
- The app must be useful without voice (keyboard-usable text conversation and visual choices), and without any integration into a third-party CRM.
- Mock data must be visibly fictional, and any walking time, footpath or local fact must be verifiable before being used in production outputs.
- New listing outreach is human-approved and permission-checked before automation is introduced; no unsolicited mass communication.

## Recommended first coding-agent request

Copy **Prompt 0: Repository foundation** in `09-CODING-AGENT-PROMPTS.md`, with this handoff folder and the supplied designs available in the repo. Have the agent first return its implementation plan, database migration proposal and unresolved assumptions; then execute Prompt 1.

## Demo success path

**Agency invites Maya → Maya chooses voice or typing → selects visual preferences → reviews/edits her home brief → approves sharing → Sophie sees an evidence-backed buyer profile → evaluates Larkfield House and 4 Ashgrove Place → prepares a personalised viewing brief.**

This is the core vertical slice. Any future roadmap feature must justify its inclusion against this end-to-end path.
