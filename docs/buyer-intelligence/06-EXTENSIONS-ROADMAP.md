# 06 — Extensions: demand intelligence, feedback and matched-property outreach

These three additions form a coherent future loop:

**Discover preferences → approve home brief → evaluate listings → view and respond → refresh buyer understanding → identify aggregate active demand → help agency win relevant instructions → recommend new listings.**

They are **not required for the initial agency-led demo**, but data hooks should be designed now. At launch, do not build a full campaign engine, marketplace or vendor CRM.

## Extension 1 — Buyer Demand Radar: win more seller instructions

**Priority:** P2 after enough active profiles exist. **Commercial hypothesis:** aggregated evidence of real, current buyer demand can help an estate agent approach potential sellers or strengthen a valuation/pitch.

### Example output

> “12 active, recently verified buyers in the agency's database are seeking period-style, 3+ bedroom properties in a broadly defined Tunbridge Wells search area, within an asking-price range compatible with this example home. Seven have indicated a strong preference for a private garden.”

This must never be represented as 12 guaranteed purchasers, qualified offers or a valuation prediction.

### User stories

- As a branch manager, I can see common **non-sensitive housing preferences** among active buyers, such as bedrooms, broad budget band, area and property type.
- As a valuer, I can produce an honest demand summary suitable for use in a seller appointment.
- As an agency, I can understand a supply gap (“many interested buyers, few suitable listings”) if listing data exists and is reliable.
- As a buyer, my individual preferences or identity are not disclosed through the aggregate.

### Data inputs and safeguards

- Include only buyer profiles shared with this **specific agency**, with appropriate permission and a defined lawful basis for the aggregate use; review notice/agreements for vendor pitch use.
- Define “active”: agency-confirmed search status and a verified/reconfirmed profile updated within a configurable freshness period (initial proposal **90 days**; test with agencies).
- Deduplicate by verified buyer/household to avoid the same buyer counting twice. Joint searches count once.
- Limit dimensions to housing-market characteristics; do not infer protected traits, household composition, health or other sensitive attributes for seller targeting.
- Proposed privacy gate: suppress any displayed cohort below **10 distinct active buyer searches**, plus suppression of small cross-filters and complementary groups. This is a **design starting point, not a guarantee of anonymity**; evaluate local density, re-identification and differencing risk before release.
- Never show exact addresses, names, transcripts, individual match scores or quotes in vendor-facing summaries.
- Prevent “change one filter, discover one person's preferences” through rate limits, coarse bands, minimum cohort thresholds and query differencing safeguards.
- Don't pool buyer demand across agencies without a separately justified agreement and purpose.

### MVP of this extension (later)

- Agency demand dashboard: popular attribute groups by broad area, price bracket, bedrooms, style, garden.
- “Create a seller demand snapshot” from coarse, safe filters with counts and freshness.
- Seller pitch preview with plain-English explanation, disclaimer and source timestamp.
- Supply-gap insight only after the agency has trustworthy listing inventory.

### Acceptance

- 0–9 eligible searches (initial proposed threshold) never produce a seller-facing count or disclosive filtered breakdown.
- One person cannot be recovered by differencing adjacent queries.
- Revoked grants or inactive buyers stop contributing to fresh aggregate snapshots under the defined processing policy.
- Every number can be traced internally to a reproducible deduplicated snapshot, without exposing member identities to the seller.
- An exported snapshot includes calculation date, area/band definition and “indications of demand, not offers” disclaimer.

### Commercial value

Potentially stronger upsell than a better registration form because it supports **listing acquisition**, not just buyer servicing. But its accuracy and usefulness depend on profile scale and freshness. Validate separately in real valuation appointments.

---

## Extension 2 — Post-viewing feedback portal

**Priority:** P1, likely the smallest useful extension after core fit/brief.

### User experience

After a viewing, the agent can send a scoped, short-lived link. The buyer receives a friendly two-minute flow, optionally voice or text, with concise structured questions:

1. What stood out positively?
2. What didn't work, or what concerns you?
3. Could you see yourselves living here? (Yes / Maybe / No)
4. What would you change or compromise on?
5. Interested in a second viewing or discussing next steps? (optional)

The result is a useful, concise summary for the agency. Buyer may explicitly approve suggested edits to their reusable home brief. Agent notes and buyer responses remain separately attributed.

### Requirements

- Create one feedback invitation bound to agency, buyer, viewed property and viewing event.
- Prevent arbitrary feedback links from exposing buyer identity or another agency's data.
- Store original structured answers, an agent-facing summary and optional buyer-approved preference change suggestions.
- No automatic profile mutations from feedback without buyer review and approval.
- Agent can identify common objections to a property without conflating them with definitive property facts.
- Future seller reporting needs separate suitability, lawful basis, aggregation and redaction review.

### Acceptance

- Responses remain tied to the correct property and viewing.
- A negative reaction to a specific property (e.g. “too exposed”) does not automatically become a global dislike of all homes in the neighbourhood.
- A buyer can skip any question and control subsequent sharing/use.
- Any feedback-derived preference change requires approval and creates a new profile version.

### Data model to add later

`viewings`, `feedback_invites`, `viewing_feedback`, `feedback_preference_candidates` with agency/subject/property/version links and lifecycle states.

---

## Extension 3 — New listing match and outreach

**Priority:** P2; launch **agent-review recommendations** before fully automatic sending.

### Why it matters

A new property arrives and the agent sees: “These six buyers appear relevant, with reasons and major caveats.” It can then generate a *human-reviewed* personalised message that references real preferences, not an AI spam blast.

### Workflow

1. Agent adds/imports a new listing.
2. Deterministic constraint matching builds eligible candidate set (active, agency-authorised, no decisive hard conflicts).
3. AI explains relevance and known compromises for each candidate.
4. System checks communication channel permissions, opt-outs, record freshness and contact rules.
5. Agent reviews recipients, per-buyer copy and claims before sending.
6. Record sent time, message version, listing version, agent approver and unsubscribe events.
7. Responses and viewing feedback later inform candidate preference suggestions, subject to buyer approval.

### Requirements

- Explicit contact preferences and marketing permissions, not inferred from consent to share a home brief.
- Correctly distinguish service communications from marketing; UK PECR/GDPR review before sending email/SMS/WhatsApp.
- Strict suppression: opted-out, stale, closed/inactive, duplicate, already-contacted or buyer-withdrawn profiles.
- Rate limits, per-agency budgets and recipient-level deduplication.
- No invented location benefits, renovation claims or artificial urgency.
- Prevent embarrassing messages about a property already rejected, especially if rejection was a confirmed dealbreaker.
- Audit approver, source match, send status, errors and reply-handling.

### Later rollout sequence

`Agent shortlist` → `Review one personalised draft` → `Batch review` → `Rules-based automation only for trusted, low-risk use cases with explicit permissions`.

### Acceptance

- Same buyer-property pair is not messaged repeatedly without an intentional new reason.
- Agent must approve before early pilots send any message.
- Revoked share or outreach opt-out suppresses future campaign sends.
- Every message can be traced to listing facts and buyer-approved preferences.

---

## Extension 4 — Buyer-owned portable profiles and Somewhere

**Priority:** P2, architecture P0.

- Buyer claims provisional identity after verified login.
- Buyer manages approved versions and agency-specific grants, with no default cross-agency disclosure.
- Optional connection to Somewhere is independent of agency grants and requires purpose-specific permissions.
- Somewhere may contribute *property and location intelligence*, while Buyer Intelligence retains the preference/source-of-truth distinction.
- Do not automatically share agency notes, private communications, viewing briefs or confidential CRM information.
- Treat buyer-facing “ownership” as UX control/portability, not a blanket legal assertion overriding UK controller/processor obligations.

## Recommended release order

1. **MVP:** buyer discovery → approved brief → agent intelligence → fit → viewing brief.
2. **Next:** lightweight post-viewing feedback and buyer-confirmed updates (closes learning loop).
3. **Then:** matching shortlist and human-reviewed relevant property outreach.
4. **After sufficient data:** buyer-demand aggregate snapshots to improve seller pitch.
5. **Independent strategic track:** portable consumer account and optional Somewhere connection.

The order of 3 and 4 should be validated against agency demand. An agency with many active buyers could value demand intelligence sooner, but building it without enough accurate data yields meaningless dashboards and privacy risk.
