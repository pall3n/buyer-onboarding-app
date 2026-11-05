# 10 — Decisions, open questions and risks

## Locked product decisions

- Agency-led distribution at launch; buyer home brief is portable **architecturally** and eventually buyer-owned in UX.
- The buyer opts into sharing a specific approved version with the inviting agency.
- Voice, typing and visual answers are first-class, interchangeable input types.
- Buyer and agency information remain separate; agency notes and analyses are private to that agency.
- Match explanations are evidence-backed; hard conflicts override soft fit.
- Use shadcn/ui/Tailwind/Motion for React and the supplied calm editorial visual direction.
- Start with manual/seeded listing facts, not a listings scraper or full CRM integration.
- Buyer-demand intelligence, post-viewing feedback and outbound new-property matching are extensions, not MVP prerequisites.

## Implementation defaults proposed by this handoff

- Next.js App Router + Supabase Postgres/Auth/Storage; model provider behind adapters.
- Browser realtime voice with short-lived credentials; text-first development to simplify tests.
- Fictional Hartfield & Rowe dataset to mirror designs.
- No raw audio storage by default; minimal approved excerpts as evidence.
- Copy/print first, PDF/sharing later.
- Proposed demand cohort privacy suppression initially 10; revisit via privacy review.
- Buyer profile changes are manually approved for sharing; no automatic propagation.

These are recommendations to confirm during implementation; they are **not evidenced as implemented** in the HTML.

## Gaps in the supplied design to resolve

| Gap / discrepancy | Resolution |
|---|---|
| Unselected renovation = “rather not” in desktop conversation copy | **Change to unknown** unless buyer explicitly rejects it |
| Invitation claims recordings transcribed then deleted | Display only if pipeline, provider settings and retention policy actually support claim |
| “Withdraw any time” suggests data can always be erased | Clarify revoked future access vs previously retained lawful agency records |
| Agent profile reveals that a buyer withheld one item | Remove even the fact/count of withheld items |
| “Verified” travel/footpath data are fictional | Demo labels; real product requires source verification |
| “Send to Maya” / “Send questions” / “PDF” etc. | Remove, disable visibly or build the real permissioned action; no faux success |
| Buyer corrections via agent “Correct this” | Clarification request, not agent editing the buyer-owned confirmed profile |
| Buyer identity shared across joint search | Start with one invited profile/controller; joint-account permissions are future design |
| Screens do not cover full state permutations | Add expired invites, denied mic, partial session, sharing-revoked, no property, mobile agent |

## Unresolved product questions, non-blocking defaults

1. **Who is buyer identity controller at launch?** Default a single invited participant owning a joint “home search”; do not silently create accounts for the named partner.
2. **Does an agency send an invite automatically?** Default copy link, no outbound messaging from platform in demo.
3. **How granular is approval?** Default section-level sharing scopes plus evidence toggle; consider per-field later. The supplied design suggests “choose what else to include.”
4. **What is the primary property import?** Manual and curated seeded properties first; CSV as P1.
5. **Does agent edit buyer preferences?** No; agency may add notes and ask for clarification, buyer approves their own profile.
6. **Are agency buyers assigned to one negotiator or shared within branch?** Default agency membership scope plus assignee; tighten if pilot requires.
7. **What exactly is a “verified” local fact?** Verification method and timestamp required, with an explicit source class.
8. **Which communications are transactional vs marketing?** Treat new-listing campaigns as separately permissioned until UK legal review.
9. **Will agents pay subscription or usage-based?** Validate directly; do not bake pricing assumptions into data model.
10. **Does Somewhere ever access buyer data?** Only via future purpose-specific buyer permission; never by default.

## Key risks and mitigations

| Risk | Why it matters | Mitigation / validation |
|---|---|---|
| Low willingness to pay | Agents already have CRM workflows; nice UX alone may not justify spend | Sell the viewing outcome, observe genuine use, ask for paid pilot |
| Voice aversion or unreliable audio | Buyers may avoid AI phone interaction | Equal text route, clear disclosure, seamless fallback, completion metrics |
| Buyer-profile accuracy | False certainty leads to irrelevant viewings | Buyer review, evidence, typed schema, corrections and unknown states |
| Privacy/data leakage | Personal preferences across agencies are sensitive | Scoped grants, immutable versions, tenant tests, data minimisation |
| AI hallucinated property/local facts | Real-world trust and property claims | Deterministic facts, provenance, “needs check”, verified source review |
| API voice costs | Revenue margin and DOS risk | Caps, quotas, model abstraction, budget alarms |
| Product scope creep | Buyer portal + CRM + property portal could become huge | Narrow E2E flow, P1/P2 gates |
| Vendor demand overclaims | Small samples can reveal individuals or overstate demand | Thresholds, coarse bins, freshness, honest disclaimers, human review |
| Outreach spam/compliance | Buyers may be annoyed; legal obligations | Separate consent/opt-out, send review, dedupe, caps, audit |
| Fragile design-to-code port | HTML export is a staged demonstration | Use screenshots as reference, implement typed data/components and tests |

## Definition of a good next agency meeting

Ask the negotiator to talk through their real applicant registration and viewing preparation. Then show **one complete buyer profile** and **one personalised viewing pack**, not a whole speculative platform. Ask what is missing, whether they would genuinely use it on Saturday, which systems need syncing, and whether they can trial it with real buyers under appropriate safeguards.
