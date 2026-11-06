-- 007_audit.sql
-- Append-only audit log

-- ─── audit_events ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type      TEXT NOT NULL,
  actor_id        UUID,
  agency_id       UUID REFERENCES agencies(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  target_type     TEXT,
  target_id       UUID,
  safe_metadata   JSONB NOT NULL DEFAULT '{}',
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_events_agency_id_idx ON audit_events (agency_id);
CREATE INDEX IF NOT EXISTS audit_events_actor_id_idx ON audit_events (actor_id);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Append-only: no UPDATE or DELETE policies
-- Agents can read audit events for their agency
DROP POLICY IF EXISTS agents_read_audit_events ON audit_events;
CREATE POLICY agents_read_audit_events ON audit_events
  FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id
      FROM agency_memberships
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
  );
