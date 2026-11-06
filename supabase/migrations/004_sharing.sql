-- 004_sharing.sql
-- Profile sharing, share events, and agency-buyer links

-- ─── profile_shares ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_shares (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id           UUID NOT NULL REFERENCES home_profiles(id) ON DELETE CASCADE,
  agency_id            UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  approved_version_id  UUID REFERENCES home_profile_versions(id) ON DELETE SET NULL,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'revoked', 'pending')),
  scopes               JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_shares_profile_agency_unique UNIQUE (profile_id, agency_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profile_shares'
  ) THEN
    CREATE TRIGGER set_updated_at_profile_shares
      BEFORE UPDATE ON profile_shares
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE profile_shares ENABLE ROW LEVEL SECURITY;

-- Agents can read profile_shares for their agency
DROP POLICY IF EXISTS agents_read_profile_shares ON profile_shares;
CREATE POLICY agents_read_profile_shares ON profile_shares
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ─── profile_share_events ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_share_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id    UUID NOT NULL REFERENCES profile_shares(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('granted', 'revoked', 'updated', 'viewed')),
  actor_type  TEXT NOT NULL,
  actor_id    UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profile_share_events ENABLE ROW LEVEL SECURITY;

-- ─── agency_buyers ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agency_buyers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  subject_id      UUID NOT NULL REFERENCES buyer_subjects(id) ON DELETE CASCADE,
  invitation_id   UUID REFERENCES buyer_invitations(id) ON DELETE SET NULL,
  private_notes   TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agency_buyers_agency_subject_unique UNIQUE (agency_id, subject_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_agency_buyers'
  ) THEN
    CREATE TRIGGER set_updated_at_agency_buyers
      BEFORE UPDATE ON agency_buyers
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE agency_buyers ENABLE ROW LEVEL SECURITY;

-- Agents can read agency_buyers for their agency
DROP POLICY IF EXISTS agents_read_agency_buyers ON agency_buyers;
CREATE POLICY agents_read_agency_buyers ON agency_buyers
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Agents can update agency_buyers (private notes) for their agency
DROP POLICY IF EXISTS agents_update_agency_buyers ON agency_buyers;
CREATE POLICY agents_update_agency_buyers ON agency_buyers
  FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
