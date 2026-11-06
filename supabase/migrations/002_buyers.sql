-- 002_buyers.sql
-- Buyer subjects, contact points, invitations, and sessions

-- ─── buyer_subjects ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyer_subjects (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claimed_auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  display_name         TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_buyer_subjects'
  ) THEN
    CREATE TRIGGER set_updated_at_buyer_subjects
      BEFORE UPDATE ON buyer_subjects
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE buyer_subjects ENABLE ROW LEVEL SECURITY;
-- No SELECT policy for agents — access mediated via profile_shares

-- ─── buyer_contact_points ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyer_contact_points (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id       UUID NOT NULL REFERENCES buyer_subjects(id) ON DELETE CASCADE,
  kind             TEXT NOT NULL CHECK (kind IN ('email', 'phone', 'sms')),
  value_encrypted  TEXT NOT NULL,
  verified_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_buyer_contact_points'
  ) THEN
    CREATE TRIGGER set_updated_at_buyer_contact_points
      BEFORE UPDATE ON buyer_contact_points
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE buyer_contact_points ENABLE ROW LEVEL SECURITY;
-- No agent read policy

-- ─── buyer_invitations ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyer_invitations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  inviter_id        UUID NOT NULL REFERENCES auth.users(id),
  buyer_subject_id  UUID REFERENCES buyer_subjects(id) ON DELETE SET NULL,
  token_hash        TEXT NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  display_name      TEXT NOT NULL,
  note              TEXT,
  prefill           JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT buyer_invitations_token_hash_unique UNIQUE (token_hash)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_buyer_invitations'
  ) THEN
    CREATE TRIGGER set_updated_at_buyer_invitations
      BEFORE UPDATE ON buyer_invitations
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE buyer_invitations ENABLE ROW LEVEL SECURITY;

-- Agents can SELECT invitations for their agency
DROP POLICY IF EXISTS agents_select_invitations ON buyer_invitations;
CREATE POLICY agents_select_invitations ON buyer_invitations
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Agents can INSERT invitations for their agency
DROP POLICY IF EXISTS agents_insert_invitations ON buyer_invitations;
CREATE POLICY agents_insert_invitations ON buyer_invitations
  FOR INSERT
  WITH CHECK (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Agents can UPDATE invitations for their agency
DROP POLICY IF EXISTS agents_update_invitations ON buyer_invitations;
CREATE POLICY agents_update_invitations ON buyer_invitations
  FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ─── buyer_sessions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buyer_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id     UUID NOT NULL REFERENCES buyer_subjects(id) ON DELETE CASCADE,
  invitation_id  UUID NOT NULL REFERENCES buyer_invitations(id) ON DELETE CASCADE,
  state          TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'completed', 'expired', 'abandoned')),
  last_saved_at  TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_buyer_sessions'
  ) THEN
    CREATE TRIGGER set_updated_at_buyer_sessions
      BEFORE UPDATE ON buyer_sessions
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE buyer_sessions ENABLE ROW LEVEL SECURITY;
-- No agent SELECT policy on buyer_sessions
