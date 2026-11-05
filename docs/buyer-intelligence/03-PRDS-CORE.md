# 03 — Core launch PRDs

**P0 = demo and pilot core; P1 = desirable after core is working; P2 = separate extension.** User stories are not permission to infer unsupported UI or technical behavior. Verify data authorization before shipping.

## PRD-01 — Agency workspace, onboarding and invitations (P0)

**Outcome:** a negotiator creates an invitation without changing their existing CRM, sees its state and opens only an approved buyer brief.

### Stories
- As Sophie, I can register a buyer name and contact channel, optionally provide known criteria and a personal invitation note.
- As Sophie, I can copy a secure invitation and share through an existing approved channel.
- As a buyer, I see who invited me, why I am here and what I will receive.
- As an agency staff member, I see buyers grouped by actionable state, not a generic form-submissions list.

### Workflow
1. Agent signs into their agency account and enters Buyers.
2. Agent creates invitation with name, contact, welcome note, optional structured prefill (budget, area, bedrooms), optionally expiry.
3. System stores agency and inviter IDs, issues random unguessable link token; stores only token hash server-side.
4. Buyer opens `/invite/[token]`, sees agency identity, personal note, privacy info and voice/text entry.
5. Buyer starts a separate session. Invitation becomes `started`.
6. When buyer approves sharing, the agency view becomes `shared`; agent can open profile. Before that, agent sees progress status but **no conversation or draft preferences**.
7. Agent can revoke invite, reissue a distinct link or mark archived. Expired links fail closed.

### Requirements
- `INV-01` Multi-tenant agency account and membership.
- `INV-02` Create, copy, expire, revoke, and inspect invitation status.
- `INV-03` Buyer prefill is identified as *supplied by agent*, not automatically confirmed by buyer; buyer can correct it.
- `INV-04` No permanent buyer account required on first visit.
- `INV-05` Server-side rate limiting on invitation creation, validation and redemption.
- `INV-06` Buyer display explains that the agency will receive only an approved version.
- `INV-07` Return access requires secure session continuity or verified email rather than publicly reusable session IDs.
- `INV-08` Dashboard supports empty, inviting, in-progress, review-pending and ready-to-read states.

### Acceptance
- Invalid/expired/revoked links show recovery state without leaking recipient data.
- One agency cannot enumerate or fetch another's invitations or profile data.
- Creating two invites for the same email never silently merges unrelated buyer identities.
- Switching the agency selected client-side cannot increase access.
- Invitations do not inadvertently send emails/SMS unless a configured, compliant send channel is implemented.

**P1:** agency templates, invitation emails, reminders, agency branding, CSV import.

---

## PRD-02 — Conversation, visual choices and session recovery (P0)

**Outcome:** buyer speaks, types and chooses visuals in a single continuity of understanding, with a useful first brief after ~4–6 minutes (target, not enforced timer).

### Stories
- I choose voice or typing on entry; neither is presented as second-rate.
- I can pause, switch modes and resume; I don't repeat information already supplied.
- When visual comparison is appropriate, I can respond via Love / Like / Not for me, or skip.
- I can challenge an assumption and see the candidate preference corrected.

### Topic coverage
`location`, `budget`, `beds`, `property type`, `outside space`, `walkability`, `green space`, `commute`, `local shops`, `architecture`, `interior taste`, `renovation`, `priority and tradeoffs`, `timeline`, `unknown questions`.

### Requirements
- `CONV-01` One conversation session with turns and actions for voice, text and visual input; separate `input_modality` from actual semantic content.
- `CONV-02` Onboarding engine tracks discussed/not discussed, answered, contradicted, confirmed and skipped topics.
- `CONV-03` Model proposes next question; UI may render `text_prompt`, `single_choice`, `multi_choice`, `image_rating`, `renovation_matrix`, `priority_tradeoff`; all require schema validation.
- `CONV-04` Do not ask again about agent prefill unless clarifying or confirming it.
- `CONV-05` Draft extraction is persisted at safe checkpoints and shown as *tentative* “things noted”.
- `CONV-06` Mic permission denied or realtime disconnect must offer “Continue by typing” with context retained.
- `CONV-07` Voice controls expose status `idle`, `connecting`, `listening`, `speaking`, `thinking`, `muted`, `disconnected`, `error`; are announced accessibly.
- `CONV-08` Allow skipping without negative inference. Unselected options mean unknown; explicitly “Not for me” means dislike.
- `CONV-09` Buyer can finish after partial coverage; unanswered fields remain unknown.
- `CONV-10` Protect from duplicate turns/tool calls and stale completion writing into the wrong session.
- `CONV-11` Voice model never writes confirmed preferences directly; extraction produces candidate changes for buyer review.

### Acceptance
- A text-only buyer can complete the full journey.
- Voice→text and text→voice switching retain at least prior persisted turns and visual answers, with no duplicate messages.
- On network drop, “last saved” reflects a real server checkpoint, not an assumption.
- Skipped renovation options do not become “rather not” or dealbreakers.
- Agent cannot access provisional preference data before share approval.

**P1:** voice language options, more sophisticated question ordering, import favorite-property links. **Not launch:** phone dial-out or AI outbound calls.

---

## PRD-03 — Generated home brief, review, versions and sharing (P0)

**Outcome:** a personal home brief is materially useful to the buyer and shares only reviewed data with the invited agency.

### Home brief sections (from supplied design)
1. In a nutshell.
2. My non-negotiables.
3. Things I'd love.
4. My ideal lifestyle.
5. Styles I'm drawn to / not for us.
6. Renovations I'd consider.
7. Where I can compromise.
8. What has not been clarified.
9. Share with Sophie at Hartfield & Rowe.

### Requirements
- `BRIEF-01` Candidate preferences have type, value, importance, status, source and evidence pointer.
- `BRIEF-02` User can correct/remove/reclassify candidate preferences inline; edits persist as first-class events.
- `BRIEF-03` `confirmed`, `suggested`, `unknown` semantics are explicit; the agent must not read suggestions as established facts.
- `BRIEF-04` Approval creates an immutable profile version and explicit `profile_share` for the named agency.
- `BRIEF-05` Only explicitly approved content and evidence scopes are visible to the agency. Unshared content must not leak via counts, “hidden item” banners, metadata or match explanations.
- `BRIEF-06` After approval, changes create a new private draft; they are not shared until separately approved.
- `BRIEF-07` Share UI explains what agency can see and how future access can be revoked, without overpromising erasure.
- `BRIEF-08` Returning user can edit after verified access; identity claiming deferred.
- `BRIEF-09` Summaries derive from current relevant version; a user edit takes precedence over AI draft extraction.
- `BRIEF-10` Keep a stable buyer subject ID separate from the agency relationship.

### Sharing states
`private_draft` → `ready_for_review` → `approved_version` → `shared_with_agency`; subsequent edits form `private_draft_v2`; share can be `revoked` without erasing a lawful independent agency record.

### Acceptance
- Agency access fails on draft profile and on revoked grant.
- Another agency cannot infer unshared profile sections.
- Edits after approval do not change what the agent saw until approval for the new version.
- All share actions are recorded in audit events and can be inspected.
- If profile generation fails, original saved answers remain accessible and retry is safe.

**P2:** buyer account, multiple agencies, per-agency share versions, a consumer “my search” portal.

---

## PRD-04 — Agent intelligence profile (P0)

**Outcome:** negotiator understands a buyer in under half a minute and can expand evidence and clarify ambiguities.

### Sections from design
- Status and one-paragraph home description.
- Budget, locations, bedrooms, timeline, parking, financing/moving position (only if voluntarily provided and shared).
- Top 3 priorities and dealbreakers.
- Lifestyle signals, taste, renovation flexibility and trade-offs.
- “In their words” excerpt links when shared.
- “Worth clarifying” questions.
- Recent approved changes.
- Agency-only notes and CTA to evaluate property.

### Requirements
- `AGENT-01` All buyer-facing facts are derived from the **approved shared version**, with evidence and status.
- `AGENT-02` Show clear status: confirmed, suggested/inferred, unknown, conflict.
- `AGENT-03` Expand an insight inline to the associated approved excerpt or visual selection.
- `AGENT-04` Add/edit agency-private notes, stored in agency-scoped table; must never appear in portable profile.
- `AGENT-05` “Ask Maya” can be initially implemented as **copy a suggested clarification**; direct send needs explicit channel/consent/confirmation.
- `AGENT-06` Highlight changes only between **approved versions accessible to this agency**.
- `AGENT-07` Only agency members assigned the relevant access rights may view agency notes.

### Acceptance
- Agent can find dealbreakers and top priorities quickly without transcript scanning.
- A “Suggested” character preference cannot be visually presented as confirmed.
- Private withheld fields leave zero trace in agent output, count and logs.
- Cross-agency data access attempts fail at the backend.

---

## PRD-05 — Property records and explainable fit (P0)

**Outcome:** compare a property against a buyer's approved preferences and show a defensible decision rather than a mysterious percentage.

### Requirements
- `FIT-01` Manually create / seed a structured property: status, source, asking price, bedroom count, layout, condition, garden/privacy/security, parking, areas, images, evidence and freshness.
- `FIT-02` Evaluate hard requirements deterministically: verified violations = conflict; missing data = unknown, not failure or success.
- `FIT-03` Soft preferences evaluated with transparent weighted signals and evidence; do not allow soft fit to override hard conflict.
- `FIT-04` Results grouped **Strong matches**, **Potential compromises**, **Conflicts with non-negotiables**, **Unknown: check before viewing**.
- `FIT-05` Summary verdict `strong_fit`, `mixed_fit`, `conflict`, `insufficient_data` based on explicit rules; do not show a confident “strong fit” when a high-impact unknown remains.
- `FIT-06` Each property fact cites source (listing, floorplan, agent verified site visit, public data) and, where relevant, verification date.
- `FIT-07` Evaluate against a stored approved profile version ID and property revision ID; cache/recreate if either changes.
- `FIT-08` Include questions to ask buyer or agent, not fabricated data.
- `FIT-09` Prototype scenario includes Larkfield House (strong lifestyle fit, smaller bedroom, garden boundary unknown) and 4 Ashgrove Place (more spec, hard garden privacy conflict).

### Acceptance
- Property outside non-negotiable budget or with a confirmed dealbreaker cannot be ranked strong even if 10 soft preferences match.
- Unknown fence height / shared passage remain unknown; no “verified secure garden” claim.
- Demonstrator local details are marked fictional; production local details require verified sources.
- “Send to buyer” is excluded unless a review and consented communication mechanism is implemented.

---

## PRD-06 — Personalised viewing brief (P0)

**Outcome:** the negotiator obtains an editable, concise, usable briefing for a real viewing.

### Requirements
- `VIEW-01` Create from a selected match result with explicit buyer and property version references.
- `VIEW-02` Include buyer snapshot, priorities, no-go criteria, why it may fit, **three things to show**, local evidence, potential objections, check-before-arrival, suggested questions and agency-private note area.
- `VIEW-03` Separate *verified*, *unverified* and *unknown* local facts; never promote unverified walking times or footpaths into confirmed talking points.
- `VIEW-04` Agent can edit all generated prose; no unsupported claims are silently added after edit.
- `VIEW-05` Preserve author/time/source versions and edits.
- `VIEW-06` Copy and print work in first MVP; PDF export/share only if built and reviewed.
- `VIEW-07` Private agent notes must be excluded from any buyer-shared artifact by default.
- `VIEW-08` Warnings remain visible when a viewing brief is generated despite hard conflict.

### Acceptance
- A brief remains reproducible after the original home profile is later edited.
- Print stylesheet produces readable pages, without app navigation.
- Unknown local claims are not presented as facts.
- Saving a note is confirmed only after successful server persistence.

---

## Shared release rules

- UI text must accurately represent product behavior; no fake “sent”, “saved” or “verified” statuses.
- All create/modify/delete operations require authenticated/scoped server authorization.
- All partial/failed states are designed, logged safely and have recovery paths.
- Completed flows must pass text-only accessibility, RLS/tenancy tests, profile version tests and deterministic fit tests before pilot.
