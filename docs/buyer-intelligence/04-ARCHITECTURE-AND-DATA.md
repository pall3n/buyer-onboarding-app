# 04 — Technical architecture, data model and security

**Recommended stack, not dictated by exported HTML:** Next.js App Router + TypeScript, Tailwind CSS, shadcn/ui, Motion for React, Supabase Postgres/Auth/Storage, OpenAI Realtime for browser voice, ordinary model calls for structured extraction/briefing, Zod for runtime contracts, Vitest/unit and Playwright/E2E. Keep adapters small so voice/model provider can change.

## Architectural boundaries

```text
Browser (buyer invite session / authenticated agency workspace)
  -> Next.js route handlers / server actions (authorisation + validation)
       -> Agency & buyer session service
       -> Conversation orchestration (text / voice realtime)
       -> Candidate extraction + profile review/versioning
       -> Property facts + deterministic matching
       -> Narrative explanation + viewing brief drafting
       -> Notification dispatch (NOT launch default)
  -> Supabase Postgres / private storage / audit event log
```

**Never expose a Supabase service role or long-lived model API key to client code.** For voice, server issues narrowly scoped ephemeral connection credentials. Avoid authorising from route params, request body `agencyId`, or client-selected profile IDs. RLS is defence in depth; the server must also verify tenant and grant.

## Recommended repository shape

```text
src/
  app/
    (agency)/buyers/[agencyBuyerId]/...
    (agency)/properties/...
    invite/[token]/...
    brief/[opaqueId]/...
    api/realtime/session/route.ts
  components/
    ui/                         # standard shadcn primitives
    buyer/                      # invitation, chat, composer, review
    agency/                     # dashboard, intelligence, evaluation
    shared/                     # preference, trust, evidence, property
  features/
    invitations/                # validators, repository, service
    conversation/               # state, modality adapters, orchestration
    preferences/                # schemas, normalization, versioning
    sharing/                    # scoped grants and authorisation
    properties/                 # facts, sources, revisions
    matching/                   # hard rules, soft signals, explainability
    viewing-briefs/             # generation + editable draft
  lib/
    auth/                       # agency vs buyer actor resolution
    db/                         # query layer, migrations elsewhere
    ai/                         # model adapters, structured validation
    observability/             # safe metrics + error reporting
supabase/migrations/
seed/
tests/{unit,integration,e2e,security}/
docs/                          # copied handoff files
```

Prefer thin route handlers, server-only domain services, and type-safe repositories. An AI call must never bypass access rules or write directly to a globally visible table.

## Domain entities (proposed schema)

### Organisations and identity

| Table | Important columns | Key invariant |
|---|---|---|
| `agencies` | id, name, slug, branding, status | Tenant root |
| `agency_memberships` | id, agency_id, user_id, role, status | Membership verified on every agency call |
| `buyer_subjects` | id, created_at, claimed_auth_user_id nullable | Stable buyer identity; do not deduplicate solely by email |
| `buyer_contact_points` | id, subject_id, kind, value_encrypted, verified_at | Identity verification is explicit; contact details are not a lookup-based merge credential |
| `buyer_invitations` | id, agency_id, inviter_id, buyer_subject_id, token_hash, expiry, status, optional prefill | Token is random, opaque, limited, revocable |
| `buyer_sessions` | id, subject_id, invitation_id, state, last_saved_at, expires_at | Session ID is NOT bearer credential |

### Discovery and profile

| Table | Important columns | Key invariant |
|---|---|---|
| `conversation_turns` | id, session_id, seq, actor, modality, payload_redacted, created_at | Data minimised; retention enforced |
| `visual_answers` | id, session_id, prompt_id, option_id, rating, answer_status | Skipped != disliked |
| `home_profiles` | id, subject_id, current_private_version_id | Owner independent of agency |
| `home_profile_versions` | id, profile_id, version_number, summary, status, created_by, approved_at, content_hash | Immutable once approved |
| `profile_preferences` | id, version_id, category, key, typed_value, priority, status, evidence_ref | Key-specific Zod schema; confirmed vs inferred |
| `profile_evidence` | id, version_id, preference_id, kind, excerpt, turn_ref, shareable | Only explicitly shared evidence is exposed |
| `profile_shares` | id, profile_id, agency_id, approved_version_id, status, scopes, granted_at, revoked_at | Agency reads ONLY grant-selected approved version and scopes |
| `profile_share_events` | id, share_id, actor, action, scope_snapshot, at | Audit for grants/revocations/updates |
| `agency_buyers` | id, agency_id, subject_id, owner_membership_id, status, private_notes | Agency operations not portable |

### Property and downstream

| Table | Important columns | Key invariant |
|---|---|---|
| `properties` | id, agency_id, title, address, asking_price, type, bedrooms, etc., revision, status | Initially manual/seeded per agency |
| `property_facts` | id, property_id, revision, key, typed_value, verification_state, last_verified_at | Each fact has source and confidence state |
| `property_fact_sources` | id, property_fact_id, kind, label, checked_by, checked_at, link nullable | No unsupported “verified” label |
| `property_analyses` | id, agency_id, agency_buyer_id, profile_version_id, property_id, property_revision, verdict, result_json, model_version | Result cannot silently drift when inputs change |
| `viewing_briefs` | id, agency_id, agency_buyer_id, analysis_id, draft_json, notes_private, status, created_by, updated_at | Separate printable/shared content from agency-only notes |
| `audit_events` | id, actor_type, actor_id, agency_id nullable, action, target_type, target_id, at, safe_metadata | Exclude transcript content / secrets |

**Later, not launch:** `viewings`, `viewing_feedback`, `buyer_outreach_preferences`, `outreach_candidates`, `outreach_deliveries`, `demand_aggregate_snapshots`, `buyer_external_connections`.

## Typed preference model

Avoid `value: unknown` throughout the domain: use it only at the parse boundary, then validate with discriminated Zod contracts.

```ts
type Importance = 'essential' | 'preferred' | 'flexible' | 'nice_to_have';
type Confirmation = 'confirmed' | 'suggested' | 'needs_clarification';
type EvidenceSource = 'conversation' | 'visual_choice' | 'buyer_edit' | 'agent_prefill';

type Budget = {
  kind: 'budget'; minGbp?: number; maxGbp?: number; flexibleAboveMax?: boolean;
};
type MinBedrooms = { kind: 'min_bedrooms'; count: number };
type WalkableTown = {
  kind: 'walkable_to_town'; maxMinutes?: number; preferenceText?: string;
};
type GardenPrivacy = {
  kind: 'garden_privacy'; value: 'private' | 'some_overlooking_ok' | 'no_preference';
};
type RenovationTolerance = {
  kind: 'renovation';
  level: 'cosmetic' | 'kitchen_bath' | 'reconfiguration' | 'structural' | 'full';
  sentiment: 'would_do' | 'maybe' | 'would_not';
};

type PreferenceValue = Budget | MinBedrooms | WalkableTown | GardenPrivacy | RenovationTolerance;

type StoredPreference = {
  id: string;
  value: PreferenceValue;
  importance: Importance;
  confirmation: Confirmation;
  evidenceIds: string[];
  source: EvidenceSource;
  confirmedAt?: string;
};
```

Expand unions when real use cases appear. Do not hard-code only the five sample kinds in the UI; use a registry mapping preference kind → Zod schema, form control, matching evaluator and display formatter. Keep free-text fallback while surfacing schema gaps for later refinement.

## Actor permissions

| Operation | Invited buyer session | Verified buyer account (future) | Agency member (authorised) | Agency B without share |
|---|---|---|---|---|
| See own conversation draft | Yes, scoped | Only when account claim/link verified | **No** | No |
| Edit own draft/preferences | Yes | Yes | No direct editing of buyer-owned data | No |
| Approve share | Yes (validated session) | Yes | No | No |
| Read shared profile version | Own | Own | **Yes, via active share and scope** | No |
| Read private unshared preferences | Own | Own | No | No |
| Read agency-private notes | No | No | Own agency, assigned role | No |
| Run matching | No initially | Future limited | Own agency plus active profile share | No |
| View other agency's analyses | No | No | No | No |
| Revoke future share | Yes, verified return | Yes | Agency may end relationship but not act as buyer | No |

Authorization checks are intersection of **actor identity + tenant membership + record relationship + grant scope + version**; all must pass. Do not leak metadata/counts for withheld fields.

## Invitation and buyer session trust model

- Store invitation token hash only, rotate on reissue, compare using a safe keyed lookup/constant-time approach where applicable.
- Use `HttpOnly`, `Secure`, `SameSite=Lax` (adjust for verified hosting context) cookies for buyer session. Add CSRF protection as appropriate to action type.
- Link open may establish a scoped, short-lived session; expiry and revoked invite checks still apply.
- Returning access after device change requires email verification or equivalent verified recovery. Do not infer subject equivalence from the same name/email string.
- Pre-filled buyer data supplied by agency is **unconfirmed** and distinguished from buyer-provided assertions.
- Two spouses can describe a joint search, but only one verified invite owner/controller is assumed at MVP. Don't make unverified second person a separate account without an explicit flow.

## Versions, grants, evidence

1. Conversation produces candidate `home_profile` draft.
2. Buyer reviews and edits; all changes persist to private version draft.
3. Approve creates immutable version N; share event binds agency to N and selected scopes.
4. Buyer edits again → private version N+1. Agent still sees N.
5. A subsequent explicit approval updates only relevant agency grant.
6. Revocation prevents subsequent reads through that share. Do not claim retroactive deletion of previously printed/shared documents or records independently lawfully retained by the agency.
7. Evidence excerpt is associated with preference and has its **own sharing flag**; do not expose a whole transcript to support one sentence.

For demo fidelity, a `Correct this` affordance on the agent page should create a clarification request or private annotation; it must not unilaterally mutate a buyer-confirmed profile.

## Server action/API contracts (illustrative)

```text
POST /api/agency/invitations                    -> inviteId, link (only for authorised agent)
GET  /api/buyer/invitations/[token]             -> safe invite details
POST /api/buyer/sessions                       -> session established securely
POST /api/buyer/sessions/[id]/turns             -> append typed/visual turn
POST /api/buyer/sessions/[id]/extract           -> draft candidates
POST /api/buyer/profiles/[id]/approve-and-share -> immutable version + grant
GET  /api/agency/buyers/[id]                   -> authorised approved version
POST /api/agency/properties/[id]/evaluate      -> stored deterministic + explanatory result
POST /api/agency/viewing-briefs                -> generated editable brief
POST /api/agency/viewing-briefs/[id]/notes     -> agency-private update
```

Implement with server actions if preferred. The URL shape is optional; the authorization and contracts are not. `api/buyer/sessions/[id]` must **not** treat `[id]` alone as authorization.

## Migrations, seed and operations

- SQL migrations reviewed and committed; never mutate schema manually in production without a migration.
- RLS policies must enforce `agency_id` on agency-owned records and active share relationships on profile reads. For anonymous buyer flows, prefer a carefully scoped server gateway rather than overly broad public RLS policies.
- Add indexes for `agency_id, status, updated_at` and `profile_id, version_number`; uniqueness on sensible scoped keys only.
- Include minimal fictional seed: Hartfield & Rowe / Sophie / Maya+James / Amara / Larkfield House / 4 Ashgrove Place / Flat 3 Calverley Court.
- Mask/contact-redact logs; sampling of voice transcripts or personal profile content is off by default.
- Define records retention by category before pilot: invitation/contact, raw audio (none by default), transcript/evidence, profile versions, analysis and audit. Suggested pilot-policy numbers require legal/customer approval, not copy-paste assumptions.
- Backups, access logging, request rate limits, idempotency keys, errors and resource quotas are pilot gates.
