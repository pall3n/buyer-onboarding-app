-- 005_properties.sql
-- Properties, property facts, and fact sources

-- ─── properties ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS properties (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  address_line1   TEXT NOT NULL,
  address_line2   TEXT,
  postcode        TEXT NOT NULL,
  asking_price    INTEGER NOT NULL DEFAULT 0, -- pence
  status          TEXT NOT NULL DEFAULT 'active',
  revision        INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_properties'
  ) THEN
    CREATE TRIGGER set_updated_at_properties
      BEFORE UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Agents can read properties for their agency
DROP POLICY IF EXISTS agents_read_properties ON properties;
CREATE POLICY agents_read_properties ON properties
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ─── property_facts ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_facts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id         UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  category            TEXT NOT NULL,
  key                 TEXT NOT NULL,
  typed_value         JSONB NOT NULL DEFAULT '{}',
  verification_state  TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_state IN ('verified', 'unverified', 'needs_check')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_property_facts'
  ) THEN
    CREATE TRIGGER set_updated_at_property_facts
      BEFORE UPDATE ON property_facts
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE property_facts ENABLE ROW LEVEL SECURITY;

-- Agents can read property_facts for their agency (via property join)
DROP POLICY IF EXISTS agents_read_property_facts ON property_facts;
CREATE POLICY agents_read_property_facts ON property_facts
  FOR SELECT
  USING (
    property_id IN (
      SELECT p.id
      FROM properties p
      JOIN agency_memberships am ON am.agency_id = p.agency_id
      WHERE am.user_id = auth.uid()
        AND am.status = 'active'
    )
  );

-- ─── property_fact_sources ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_fact_sources (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_id       UUID NOT NULL REFERENCES property_facts(id) ON DELETE CASCADE,
  kind          TEXT NOT NULL,
  url           TEXT,
  note          TEXT,
  retrieved_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE property_fact_sources ENABLE ROW LEVEL SECURITY;

-- Agents can read property_fact_sources (via property_facts join)
DROP POLICY IF EXISTS agents_read_property_fact_sources ON property_fact_sources;
CREATE POLICY agents_read_property_fact_sources ON property_fact_sources
  FOR SELECT
  USING (
    fact_id IN (
      SELECT pf.id
      FROM property_facts pf
      JOIN properties p ON p.id = pf.property_id
      JOIN agency_memberships am ON am.agency_id = p.agency_id
      WHERE am.user_id = auth.uid()
        AND am.status = 'active'
    )
  );
