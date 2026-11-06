-- 001_agencies.sql
-- Agencies, agency memberships, and RLS policies

-- Trigger function: auto-update updated_at column (reused across all tables)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── agencies ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agencies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  branding    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agencies_slug_unique UNIQUE (slug)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_agencies'
  ) THEN
    CREATE TRIGGER set_updated_at_agencies
      BEFORE UPDATE ON agencies
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ─── agency_memberships ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agency_memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'agent',
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT agency_memberships_unique UNIQUE (agency_id, user_id)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_agency_memberships'
  ) THEN
    CREATE TRIGGER set_updated_at_agency_memberships
      BEFORE UPDATE ON agency_memberships
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- ─── RLS policies (both tables exist by this point) ──────────────────────────

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Agents can read their own agency
DROP POLICY IF EXISTS agents_read_own_agency ON agencies;
CREATE POLICY agents_read_own_agency ON agencies
  FOR SELECT
  USING (
    id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

ALTER TABLE agency_memberships ENABLE ROW LEVEL SECURITY;

-- Agents can read their own memberships
DROP POLICY IF EXISTS agents_read_own_membership ON agency_memberships;
CREATE POLICY agents_read_own_membership ON agency_memberships
  FOR SELECT
  USING (user_id = auth.uid());
