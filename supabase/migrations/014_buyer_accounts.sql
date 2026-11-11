-- 014_buyer_accounts.sql
-- Buyer account claiming and Somewhere integration
-- Extension D: portable buyer account

-- ─── buyer_claim_tokens ───────────────────────────────────────────────────────
-- Short-lived token that verifies a buyer owns a provisional profile before linking
-- their auth account. The plaintext token is never stored; only the SHA-256 hash.
-- Agents (or server jobs) create these; buyers consume them.

CREATE TABLE IF NOT EXISTS buyer_claim_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id  UUID NOT NULL REFERENCES buyer_subjects(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT buyer_claim_tokens_hash_unique UNIQUE (token_hash)
);

ALTER TABLE buyer_claim_tokens ENABLE ROW LEVEL SECURITY;
-- No agent or buyer SELECT policy — accessed exclusively via admin client (server-only)

-- ─── somewhere_connections ────────────────────────────────────────────────────
-- Records explicit, purpose-specific consent for Somewhere integration.
-- Intentionally separate from profile_shares (agency grants) — different table,
-- different consent flow. No agency_id column by design.

CREATE TABLE IF NOT EXISTS somewhere_connections (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id           UUID NOT NULL REFERENCES buyer_subjects(id) ON DELETE CASCADE,
  purposes             TEXT[] NOT NULL DEFAULT '{}',
  status               TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  consent_recorded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_somewhere_connections'
  ) THEN
    CREATE TRIGGER set_updated_at_somewhere_connections
      BEFORE UPDATE ON somewhere_connections
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE somewhere_connections ENABLE ROW LEVEL SECURITY;

-- A claimed buyer can read and revoke their own Somewhere connections
DROP POLICY IF EXISTS buyers_read_somewhere_connections ON somewhere_connections;
CREATE POLICY buyers_read_somewhere_connections ON somewhere_connections
  FOR SELECT
  USING (
    subject_id IN (
      SELECT id FROM buyer_subjects
      WHERE claimed_auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS buyers_update_somewhere_connections ON somewhere_connections;
CREATE POLICY buyers_update_somewhere_connections ON somewhere_connections
  FOR UPDATE
  USING (
    subject_id IN (
      SELECT id FROM buyer_subjects
      WHERE claimed_auth_user_id = auth.uid()
    )
  );

-- ─── RLS additions to existing tables ────────────────────────────────────────

-- Claimed buyers can read their own profile_shares
DROP POLICY IF EXISTS buyers_read_profile_shares ON profile_shares;
CREATE POLICY buyers_read_profile_shares ON profile_shares
  FOR SELECT
  USING (
    profile_id IN (
      SELECT hp.id
      FROM home_profiles hp
      JOIN agency_buyers ab ON hp.agency_buyer_id = ab.id
      JOIN buyer_subjects bs ON ab.subject_id = bs.id
      WHERE bs.claimed_auth_user_id = auth.uid()
    )
  );

-- Claimed buyers can update (revoke) their own profile_shares
DROP POLICY IF EXISTS buyers_update_profile_shares ON profile_shares;
CREATE POLICY buyers_update_profile_shares ON profile_shares
  FOR UPDATE
  USING (
    profile_id IN (
      SELECT hp.id
      FROM home_profiles hp
      JOIN agency_buyers ab ON hp.agency_buyer_id = ab.id
      JOIN buyer_subjects bs ON ab.subject_id = bs.id
      WHERE bs.claimed_auth_user_id = auth.uid()
    )
  );

-- Claimed buyers can read audit events for their shares
DROP POLICY IF EXISTS buyers_read_share_events ON profile_share_events;
CREATE POLICY buyers_read_share_events ON profile_share_events
  FOR SELECT
  USING (
    share_id IN (
      SELECT ps.id
      FROM profile_shares ps
      JOIN home_profiles hp ON ps.profile_id = hp.id
      JOIN agency_buyers ab ON hp.agency_buyer_id = ab.id
      JOIN buyer_subjects bs ON ab.subject_id = bs.id
      WHERE bs.claimed_auth_user_id = auth.uid()
    )
  );
