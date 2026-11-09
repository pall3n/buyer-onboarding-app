-- 012_feedback.sql
-- Post-viewing feedback: viewings, scoped invite tokens, buyer responses

-- ─── viewings ─────────────────────────────────────────────────────────────────
-- Records that an agent took a buyer to view a property.
-- Denormalises property_id and agency_buyer_id from the analysis
-- so feedback lookups don't need a 3-table join.

CREATE TABLE IF NOT EXISTS viewings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id        UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  brief_id         UUID NOT NULL REFERENCES viewing_briefs(id) ON DELETE CASCADE,
  property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agency_buyer_id  UUID NOT NULL REFERENCES agency_buyers(id) ON DELETE CASCADE,
  viewing_date     DATE NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS viewings_brief_idx ON viewings (brief_id);
CREATE INDEX IF NOT EXISTS viewings_agency_buyer_idx ON viewings (agency_id, agency_buyer_id);

ALTER TABLE viewings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_read_viewings ON viewings;
CREATE POLICY agents_read_viewings ON viewings
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ─── feedback_invites ─────────────────────────────────────────────────────────
-- Short-lived scoped token sent to the buyer after a viewing.
-- Token hash only stored; raw token returned once at creation.

CREATE TABLE IF NOT EXISTS feedback_invites (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  viewing_id   UUID NOT NULL REFERENCES viewings(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'opened', 'completed', 'revoked')),
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS feedback_invites_viewing_idx ON feedback_invites (viewing_id);

ALTER TABLE feedback_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_read_feedback_invites ON feedback_invites;
CREATE POLICY agents_read_feedback_invites ON feedback_invites
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- ─── viewing_feedback ─────────────────────────────────────────────────────────
-- Buyer's structured responses to 5 questions (all nullable = skipped).
-- 1:1 with feedback_invite (UNIQUE on invite_id prevents replay).

CREATE TABLE IF NOT EXISTS viewing_feedback (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id      UUID NOT NULL UNIQUE REFERENCES feedback_invites(id) ON DELETE CASCADE,
  agency_id      UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Five questions, all nullable (buyer may skip any)
  positives      TEXT,
  concerns       TEXT,
  interest_level TEXT CHECK (interest_level IN ('yes', 'maybe', 'no') OR interest_level IS NULL),
  would_change   TEXT,
  next_steps     TEXT CHECK (
    next_steps IN ('second_viewing', 'discuss', 'not_right', 'undecided')
    OR next_steps IS NULL
  ),

  submitted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE viewing_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agents_read_viewing_feedback ON viewing_feedback;
CREATE POLICY agents_read_viewing_feedback ON viewing_feedback
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_memberships
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
