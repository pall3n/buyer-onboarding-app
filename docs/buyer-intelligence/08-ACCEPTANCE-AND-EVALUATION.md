# 08 — QA, evaluation and pilot checklist

## Functional E2E cases

| ID | Scenario | Expected |
|---|---|---|
| E2E-01 | Agency member creates invite and copies link | Scoped link works; invite saved with correct tenant and inviter |
| E2E-02 | Invited buyer enters by text, answers/visually selects, skips a topic | Draft saves; skipped is unknown |
| E2E-03 | Buyer edits “parking essential” → preferred and approves | Approved immutable version reflects preferred; agent sees correct status |
| E2E-04 | Buyer completes in voice, switches to type and returns | No duplicate turns, missing data or dead controls |
| E2E-05 | Buyer closes before approval | Agency sees status only; no private draft content |
| E2E-06 | Buyer approves selected profile fields | Agent sees only scope/approved version, correct evidence |
| E2E-07 | Buyer edits after sharing | Agent continues to see prior approved version until new approval |
| E2E-08 | Buyer revokes sharing | New profile reads under that grant denied; retained agency operational artifacts treated per policy |
| E2E-09 | Agent analyses Larkfield House | Lifestyle match + clear third-room/fence/side-passage caveats |
| E2E-10 | Agent analyses 4 Ashgrove Place | Overlooked garden causes hard conflict despite specification |
| E2E-11 | Agent creates and edits viewing brief | Saved private draft, version IDs, copy/print, accurate verified markers |
| E2E-12 | Buyer tries unusable invitation | Safe expiry/error with no recipient/tenant information leaked |
| E2E-13 | Agent has no buyers | Useful invitation empty state, not fake pending rows |

## Isolation and security cases

1. Agency A request for Agency B's buyer ID → 403/404; no object or metadata content.
2. User attempts to edit `agency_id`/`profile_version_id` in submitted JSON → server ignores or rejects unauthorized mutation.
3. Buyer with invitation to A uses guessed version of another buyer → denied.
4. Unshared private profile text, hidden-item **count**, or content cannot appear in agent summaries, model prompts, query results or client-bundled props.
5. RLS policies tested as ordinary agency member, buyer session and unauthenticated user; no broad public reads.
6. API secrets, private tokens, raw conversations and credentials absent from error logs and client bundles.
7. Replayed invite / expired cookie / revoked grant / rotated token cannot re-establish unauthorized access.
8. Prompt injection inside listing description cannot change output format, issue messages or elevate permissions.
9. Rate limits on invite minting, voice sessions, extraction, matching and send actions.
10. File uploads (if introduced) enforce type/size checks and do not become unrestricted public storage.

## AI evaluations

| Case | Test input | Pass condition |
|---|---|---|
| Missing data | No rear fence details | Remains unknown; check-before-viewing |
| Hard conflict | Explicit “no overlooked gardens” vs overlooked home | Verdict conflict and visible reason |
| Trade-off | Prefers 4 beds but accepts 3 for location | Explains acceptable space compromise, no false hard rejection |
| Skipped choices | No renovation choice | Unknown, not “will never renovate” |
| Buyer correction | Previously guessed parking essential, then set preferred | Latest reviewed value wins |
| Evidence fidelity | Supported quote from Maya | Exact permitted short excerpt, source reference and status |
| Withheld preference | Buyer excludes one section from share | Not present or alluded to in agency UI/evaluation |
| Local claims | Unverified footpath and travel time | Not represented as verified facts |
| Invalid model response | Schema violation, missing fields | Bounded retry, safe error, no partial corrupted profile |
| Cross-tenant context | Property from Agency B | Rejected before AI call and not exposed to prompt |

Require unit tests for deterministic rules; integration tests for extraction merge/versioning; representative fixture-based regression tests for AI-generated narrative. Do not base critical security on non-deterministic model tests.

## Accessibility

- Keyboard only: invite -> conversation -> image choices -> brief edit -> share; no inaccessible custom card selection.
- Visible focus rings, stable tab order, escaped modals/sheets and restored focus.
- Voice captions and text-only alternative; mic permissions are not mandatory.
- Reduced motion option; status changes announced without duplicate screen-reader spam.
- Sufficient contrast for sage/cream UI, particularly small caption text and active/selected buttons.
- Correct semantic headings, form names, disabled loading controls and non-color status labels.

## Telemetry and analytics (minimal and safe)

**Buyer:** `invite_opened`, `session_started`, `voice_selected`, `text_selected`, `visual_question_shown`, `visual_answered`, `topic_skipped`, `checkpoint_saved`, `brief_generated`, `brief_corrected`, `share_approved`, `share_revoked`.

**Agent:** `invite_created`, `buyer_profile_opened`, `evidence_expanded`, `analysis_created`, `viewing_brief_created`, `viewing_brief_printed`.

**Product health:** voice-connection failure rate, transcription latency, invalid extraction rate, retries, average AI cost per completed brief, average AI cost per analysis, crash rate, access-denial events.

Store only IDs, timestamps, durations, modality and safe metadata in analytics; never default to logging transcripts, personal preferences or full property addresses in third-party analytics.

## Pilot scorecard (initial targets, not benchmarks)

- At least 50% of starters complete and review a brief.
- At least 80% of reviewed briefs found useful by agents.
- At least 60% surface a new actionable preference.
- Agent opens the profile before a substantial fraction of real viewings (suggested minimum 50%).
- At least one agency agrees to pay and names budget/approval owner.
- No critical cross-tenant or consent/share security defects.
- Cost and failure-rate measured; targets tuned after first real sessions.

Include qualitative interviews: which insight changed the agent's actions, whether buyers found the questions helpful, and whether a matched-property message would feel useful or intrusive.

## Pre-pilot operational checklist

- [ ] UK privacy notice matches actual retention, model provider handling, processing and sharing.
- [ ] Agency customer terms and data processing roles reviewed with appropriate expertise.
- [ ] Return access, deletion/correction and grant revocation tested.
- [ ] Stored audio policy truthful (default no raw audio retention).
- [ ] Contractual third-party provider and data-transfer issues assessed where applicable.
- [ ] Private agent notes are excluded from buyer and exported formats.
- [ ] Fictional location claims replaced with verified facts or clearly marked as unverified.
- [ ] Backups, migrations, alerts, cost controls, retry rules and rate limits configured.
- [ ] Full E2E green in CI and manual mobile/browser smoke completed.
