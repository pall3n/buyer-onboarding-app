-- 003_profiles.sql
-- Home profiles, versions, preferences, and evidence

-- ─── home_profiles ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS home_profiles (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id                  UUID NOT NULL REFERENCES buyer_subjects(id) ON DELETE CASCADE,
  current_private_version_id  UUID, -- FK added deferred below
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_home_profiles'
  ) THEN
    CREATE TRIGGER set_updated_at_home_profiles
      BEFORE UPDATE ON home_profiles
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE home_profiles ENABLE ROW LEVEL SECURITY;
-- No agent read policy — access mediated by profile_shares in migration 004

-- ─── home_profile_versions ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS home_profile_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES home_profiles(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'superseded')),
  approved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT home_profile_versions_profile_version_unique UNIQUE (profile_id, version_number)
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_home_profile_versions'
  ) THEN
    CREATE TRIGGER set_updated_at_home_profile_versions
      BEFORE UPDATE ON home_profile_versions
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE home_profile_versions ENABLE ROW LEVEL SECURITY;
-- No agent read policy

-- Deferred FK: home_profiles.current_private_version_id → home_profile_versions(id)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'home_profiles_current_version_fk'
  ) THEN
    ALTER TABLE home_profiles
      ADD CONSTRAINT home_profiles_current_version_fk
      FOREIGN KEY (current_private_version_id)
      REFERENCES home_profile_versions(id)
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ─── profile_preferences ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_preferences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id      UUID NOT NULL REFERENCES home_profile_versions(id) ON DELETE CASCADE,
  category        TEXT NOT NULL,
  key             TEXT NOT NULL,
  typed_value     JSONB NOT NULL DEFAULT '{}',
  priority        TEXT NOT NULL DEFAULT 'unknown' CHECK (priority IN ('essential', 'preferred', 'flexible', 'unknown')),
  confirmation    TEXT NOT NULL DEFAULT 'unconfirmed' CHECK (confirmation IN ('confirmed', 'suggested', 'unconfirmed')),
  source          TEXT,
  source_turn_id  UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profile_preferences'
  ) THEN
    CREATE TRIGGER set_updated_at_profile_preferences
      BEFORE UPDATE ON profile_preferences
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE profile_preferences ENABLE ROW LEVEL SECURITY;
-- No agent read policy

-- ─── profile_evidence ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profile_evidence (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id  UUID NOT NULL REFERENCES home_profile_versions(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  content     TEXT NOT NULL,
  shareable   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_profile_evidence'
  ) THEN
    CREATE TRIGGER set_updated_at_profile_evidence
      BEFORE UPDATE ON profile_evidence
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

ALTER TABLE profile_evidence ENABLE ROW LEVEL SECURITY;
-- No agent read policy
