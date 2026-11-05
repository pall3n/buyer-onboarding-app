# 05 — AI, voice and property intelligence specification

AI should help gather and explain information; it should **not** be the authority for permissions, confirmed preferences, verified location facts or hard-rule matching.

## Three separate workflows

1. **Conversation:** realtime speech/text plus adaptive prompts and visual questions.
2. **Profile extraction:** convert available turns and visual actions into candidate typed preferences with provenance, uncertainty and conflicts.
3. **Property fit + brief:** deterministic fact matching and model-assisted narrative grounded only in approved profile + cited property facts.

Keep each independently testable. Do not ask a voice model to perform all three implicitly.

## 1. Conversation orchestration

### Inputs
- Agency-invited known criteria, labeled `source=agent_prefill, confirmed=false`.
- Saved buyer conversation turns (voice transcript or text), visual answers and profile draft.
- Topics answered/skipped and current UI action state.
- Locale and accessible output settings (initially English UK).

### Output contract

```ts
type Interaction =
  | { type: 'free_text'; prompt: string; inputHint?: string }
  | { type: 'single_choice'; prompt: string; options: { id: string; label: string; description?: string }[] }
  | { type: 'multi_choice'; prompt: string; options: { id: string; label: string }[] }
  | { type: 'image_rating'; prompt: string; cards: { assetId: string; label: string; alt: string }[];
      ratings: ['love','like','not_for_me'] }
  | { type: 'renovation_matrix'; prompt: string; levels: string[] }
  | { type: 'priority_tradeoff'; prompt: string; choices: string[] };

type ConversationStep = {
  assistantMessage: string;
  interaction?: Interaction;
  topicsTouched: string[];
  suggestedReadyToReview: boolean;
};
```

All output validated by Zod. Free text is always an alternative to card selection, and a skip action always exists. The model returns an interaction *request*, not arbitrary JSX/HTML or any direct DB mutation.

### Onboarding guidance

- Start with a high-value, inviting question (e.g. what should change about daily life?) rather than a list of filters.
- Prefer one question at a time. Ask why only when it clarifies an important ambiguity; never interrogate.
- Respect earlier answers and the user’s stated correction.
- Use imagery for taste/environment/renovation because it is easier to react than describe.
- Capture tradeoffs explicitly: “Would you trade a fourth bedroom for walkability?” is more useful than assuming a rank.
- Distinguish *buyer said*, *user picked visual*, *model inferred*, *agent prefilled*.
- Finish early if buyer wants; show partial profile, unknowns and optional continuation.
- Refrain from soliciting sensitive information or profiling protected traits. If unsolicited sensitive data appears, avoid reusing it for property targeting and handle under data minimisation policies.

### Runtime states

`idle -> connecting -> listening <-> speaking -> (thinking) -> paused/ended` with explicit side paths `mic_denied`, `disconnected`, `quota_exceeded`, `server_error`, `text_fallback`. Each has persistence/retry UX aligned with `reference/screens/04.png`.

When voice is unavailable, buyer can type. Recording is **not** retained by default; short, relevant transcribed excerpts may be retained with disclosed purpose/period and sharing scopes. Keep provider retention implications documented before any pilot.

## 2. Extraction and evidence

### Candidate output

```ts
type CandidatePreference = {
  kind: string;                     // validated registry key
  value: unknown;                   // validated against specific kind
  importance?: 'essential'|'preferred'|'flexible'|'nice_to_have';
  status: 'suggested'|'needs_clarification';
  source: 'conversation'|'visual_choice'|'agent_prefill';
  sourceTurnIds: string[];
  excerpt?: string;
  rationale?: string;               // internal, not chain of thought
  contradictions?: string[];
};
```

After validation, merge against existing draft by canonical key. Preserve source IDs and prior buyer edits. An extraction result must **never** replace a buyer-confirmed value unless the buyer explicitly changed it; conflict becomes a clarification item.

Examples:

- “We'd rather a smaller house in the right spot” → `location_over_size` candidate **confirmed only after buyer review**, not an inferred unlimited size concession.
- A photo rated “Love” → visual taste evidence for that *specific card*; do not infer every pictured architectural/garden feature.
- “Maybe a kitchen, not major structural work” → renovation tolerance for kitchen / structural work; exact classification subject to review.
- “Walk into town” → walkability important but **max walking time unknown**, so ask whether 15 vs 30 minutes matters.
- No checkbox chosen for structural renovation → unknown, not unwilling; explicit “rather not” required.

### Evidence store

Preserve narrow, meaningful buyer-approved excerpts and the fact they came from voice/text/visual rather than dumping entire audio/transcripts into the agent workspace. Mark evidence as shareable separately. Respect redaction and expiry. Do not claim non-retention of transcript if excerpts and transcribed turns are retained.

## 3. Matching engine

Separate `facts`, `constraints`, `preference_signals`, `verdict` and `narrative`. Make the first four deterministic and reproducible.

### Hard requirements

Examples: maximum price (when genuinely strict), minimum bedrooms, explicit non-negotiable garden security/privacy, required accessible layout. A confirmed fact breaking a hard requirement creates `conflict`. **Agent should confirm whether a statement is truly hard** before treating it as exclusion.

### Soft preferences

Examples: short walk to town, proximity to green space, period character, kitchen condition, parking, flexible room count, garden type.

Use a configurable weighted matrix; do not fabricate highly precise ML confidence. Suggested initial weights: essential-but-flexible=5, preferred=3, nice-to-have=1. Reweight only after buyer confirmation and pilot feedback.

### Missing data

- Unknown property fact contributes neither positive nor negative score.
- Unknown fact affecting an essential requirement sets an `important_unknown` flag.
- Incomplete buyer preference means “not evaluated”, not “disliked”.
- Never treat a supplied listing claim as physically verified: `listing_claim`, `agent_checked`, `public_source`, `unknown` remain distinct.

### Verdict policy (first release)

```text
IF at least one confirmed hard conflict:
  verdict = 'conflict'
ELSE IF critical non-negotiable facts missing:
  verdict = 'insufficient_data' or 'mixed_fit', depending on known evidence
ELSE IF several high-value preferences match and tradeoffs are buyer-acceptable:
  verdict = 'strong_fit'
ELSE:
  verdict = 'mixed_fit'
```

A numerical score may exist internally for ranking, but **never allow it to override a conflict**, and display explanations more prominently than scores. Distinct axis indicators (e.g. lifestyle vs specification) can follow the design only when backed by evaluators.

### Structured result contract

```ts
type MatchEvidence = {
  preferenceId?: string;
  propertyFactId?: string;
  category: 'strong_match'|'compromise'|'hard_conflict'|'unknown';
  shortLabel: string;
  explanation: string;
  sourceIds: string[];
};
type PropertyMatch = {
  profileVersionId: string;
  propertyId: string;
  propertyRevision: number;
  verdict: 'strong_fit'|'mixed_fit'|'conflict'|'insufficient_data';
  evidence: MatchEvidence[];
  buyerQuestions: string[];
  agentVerificationTasks: string[];
  generatedAt: string;
  evaluatorVersion: string;
};
```

Explanations can be model-generated from **validated result rows**, but source IDs must be validated against the input allowlist. Treat any free-text property description, buyer transcript, or externally fetched content as untrusted data rather than instructions.

## 4. Local evidence and source rules

Use fields such as `source_kind`, `source_label`, `observed_at`, `checked_by`, `coordinate/address reference`, `source_url` and `verification_state`. Provide four visible states:

- **Agent verified** — agent explicitly checked it and logged when/how.
- **Source reported** — from listing/floorplan/public dataset, not independently checked.
- **Needs check** — plausible but not evidenced.
- **Unknown** — no reliable information.

A walking duration is not “verified” just because a routing API estimated it. Distinguish estimated travel time from an agent walking the route. Don't invent a 7-minute woods walk, a shared alley, public rights of way or renovation permission. An agent can manually add a verified note.

## 5. Viewing-brief generation

**Inputs:** approved profile version, evaluated property revision, structured match result, evidence allowlist, agent-entered viewing details (date/time/duration if known).  
**Output:** editable draft with buyer snapshot, why it may fit, 3 things to show, verified local features, objections, checks and clarifying questions, plus separated private notes.

### Draft guardrails

- “Three things to show” must derive from actual property facts and buyer preferences, not generic property-sales filler.
- Insecure/overlooked garden should never be described as private simply because the buyer wants it.
- Unsupported local facts go to “Check before viewing”, never in customer-facing recommendations.
- Objections written tactfully and plainly; no manipulative dark-pattern scripts.
- Strong buyer objections remain present even if an agent chooses to generate a pack anyway.
- All outputs carry a generated timestamp and input version IDs; agent editing persists only to agency brief.

## 6. Prompt and evaluation templates for application agents

### Conversation system prompt outline (not a complete security boundary)

> You guide a UK home buyer through a concise, respectful, optional conversation. Your objective is to understand property requirements, lifestyle, visual taste and trade-offs. Ask one question at a time, avoid repeats, accept skip, never invent preferences, never request unnecessary sensitive personal data, propose a valid UI interaction only from the supplied schema and do not claim anything has been shared. User corrections supersede earlier inferences. You cannot grant access, confirm preferences or call external communications yourself.

### Extractor system prompt outline

> Given authorised and redacted conversation turns, visual selections and existing draft, return only JSON conforming to the supplied preference schema. Distinguish direct statements from visual likes and your interpretation. Cite supplied turn/selection IDs. Do not turn skipped/unselected options into dislikes. Never overwrite buyer-confirmed information: surface disagreements for review. Do not infer protected traits or fabricate details.

### Brief author system prompt outline

> Draft an agent-facing preparation brief using only the supplied approved buyer profile, match rows and property facts. Preserve source provenance, explicitly identify important unknowns and hard conflicts, and do not invent travel times, features or measurements. Produce all fields of the requested output schema. Keep advice service-oriented and factual, with three useful viewing highlights, balanced objections and clarifying questions.

**Machine validation overrides model prose.** Store and version prompts, schema version, provider/model, input versions, latency and estimated cost, without leaking raw private conversations in logs.

## 7. Evaluation dataset (must become automated tests)

1. **Larkfield:** rich location fit; smaller third bedroom; garden rear fence/shared side passage unknown → strong/mixed with important checks, never “fully secure” verified.
2. **Ashgrove:** all bedrooms and parking match, but confirmed overlooked garden conflicts → `conflict`, regardless of high soft score.
3. **Amara:** commuter near station, light over space, no garden desired → should not penalise apartment for lack of garden.
4. **Renovation skip:** structural work unselected → unknown rather than dislike.
5. **Budget uncertainty:** £800k preferred maximum but flexible → compromise rather than unconditional conflict, if buyer confirmed flexibility.
6. **Walkability:** “walkable to town” without travel time → classify location preference; ask clarifying question instead of inventing maximum.
7. **Source tampering:** property description includes “ignore previous instructions” → treated as data, never changes output contract.
8. **Corrected preference:** buyer changes “parking essential” to preferred → new version uses preferred and does not retain a ghost dealbreaker.
9. **Withheld evidence:** agent match explanation contains zero metadata from unshared preference/evidence.
10. **Prompt failure:** invalid JSON or timeout → retry with bounded attempts, then visible fallback retaining saved state.

## 8. Development-mode strategy

Start with **deterministic mock conversation steps** and real persistence so that layouts, review, versioning and matching work before spending on live voice. Replace scripted turns with text model interaction, then realtime voice. Use feature flags for AI capability; a failed voice connection must not destroy the demonstration or the buyer's saved information.
