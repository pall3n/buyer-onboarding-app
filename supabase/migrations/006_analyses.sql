-- 006_analyses.sql
-- Property analyses and viewing briefs

-- ─── property_analyses ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_analyses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id           UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  property_id         UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agency_buyer_id     UUID NOT NULL REFERENCES agency_buyers(id) ON DELETE CASCADE,
  profile_version_id  UUID NOT NULL REFERENCES home_profile_versions(id) ON DELETE CASCADE,
  property_revision   INTEGER NOT NULL,
  verdict             TEXT NOT NULL CHECK (verdict IN ('strong_fit', 'potential', 'conflict', 'check_before_viewing')),
  result_json         JSONB NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_property_analyses'
  ) THEN
    CREATE TRIGGER set_updated_at_property_analyses
      BEFORE UPDATE ON property_analyses
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE property_analyses ENABLE ROW LEVEL SECURITY;

-- Agents can read analyses for their agency
DROP POLICY IF EXISTS agents_read_property_analyses ON property_analyses;
CREATE POLICY agents_read_property_analyses ON property_analyses
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );

-- ─── viewing_briefs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS viewing_briefs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id       UUID NOT NULL REFERENCES property_analyses(id) ON DELETE CASCADE,
  agency_id         UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  draft_json        JSONB NOT NULL DEFAULT '{}',
  notes_private     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_viewing_briefs'
  ) THEN
    CREATE TRIGGER set_updated_at_viewing_briefs
      BEFORE UPDATE ON viewing_briefs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE viewing_briefs ENABLE ROW LEVEL SECURITY;

-- Agents can read viewing_briefs for their agency
DROP POLICY IF EXISTS agents_read_viewing_briefs ON viewing_briefs;
CREATE POLICY agents_read_viewing_briefs ON viewing_briefs
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
