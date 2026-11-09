-- 013_outreach.sql
-- Buyer outreach shortlist — human-reviewed only; no automatic sending.

-- ─── communication_preferences ────────────────────────────────────────────────
-- Agent-recorded contact consent per buyer.
-- Explicitly captured, not inferred from brief-sharing consent.

CREATE TABLE IF NOT EXISTS communication_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  agency_buyer_id   UUID NOT NULL REFERENCES agency_buyers(id) ON DELETE CASCADE,
  email_ok          BOOLEAN NOT NULL DEFAULT false,
  sms_ok            BOOLEAN NOT NULL DEFAULT false,
  -- outreach_opt_out: buyer has explicitly said "do not contact me about new listings".
  -- Distinct from email_ok/sms_ok=false, which may simply mean consent was never recorded.
  outreach_opt_out  BOOLEAN NOT NULL DEFAULT false,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id),
  UNIQUE (agency_id, agency_buyer_id)
);

ALTER TABLE communication_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_read_communication_preferences ON communication_preferences;
CREATE POLICY agents_read_communication_preferences ON communication_preferences
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ─── outreach_candidates ──────────────────────────────────────────────────────
-- One row per property × buyer pair in an agent-reviewed shortlist.
-- status=approved means agent has reviewed and approved for outreach.
-- status=dismissed means agent deliberately excluded.
-- No messages are sent from this table — approval records the agent's review only.

CREATE TABLE IF NOT EXISTS outreach_candidates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id        UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agency_buyer_id  UUID NOT NULL REFERENCES agency_buyers(id) ON DELETE CASCADE,
  analysis_id      UUID REFERENCES property_analyses(id) ON DELETE SET NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'dismissed')),
  eligibility      TEXT NOT NULL DEFAULT 'eligible'
                   CHECK (eligibility IN ('eligible', 'ineligible_no_profile', 'ineligible_stale', 'ineligible_conflicts', 'ineligible_opted_out')),
  has_hard_conflicts BOOLEAN NOT NULL DEFAULT false,
  conflict_labels  TEXT[] NOT NULL DEFAULT '{}',
  match_reasons    TEXT[] NOT NULL DEFAULT '{}',
  draft_message    TEXT,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  dismissed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agency_id, property_id, agency_buyer_id)
);

ALTER TABLE outreach_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_read_outreach_candidates ON outreach_candidates;
CREATE POLICY agents_read_outreach_candidates ON outreach_candidates
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
