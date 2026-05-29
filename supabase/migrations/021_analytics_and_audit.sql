-- ============================================================
-- 021_analytics_and_audit.sql
-- Analytics events table + audit_logs enhancements
-- ============================================================

-- ── 1. analytics_events table ─────────────────────────────────────────────────
-- Privacy-aware in-DB analytics. All writes go through service role.
-- No PII stored directly — use user_id FK and properties JSONB.

CREATE TABLE IF NOT EXISTS analytics_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event       TEXT        NOT NULL,
  user_id     UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  properties  JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type    ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_event_user    ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_created ON analytics_events(created_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- No direct client access — all writes go through service role (lib/analytics)
CREATE POLICY "analytics_service_only"
  ON analytics_events FOR ALL
  USING (false);

GRANT SELECT, INSERT ON analytics_events TO service_role;

-- ── 2. audit_logs enhancements ────────────────────────────────────────────────
-- Extend the existing table (from 004_phase4.sql) with richer columns.

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_role     TEXT CHECK (actor_role IN ('admin','vendor','customer','system'));

-- Indexes for admin audit search
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created    ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON audit_logs(entity_type, entity_id);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role reads/writes audit logs
DROP POLICY IF EXISTS "audit_service_only" ON audit_logs;
CREATE POLICY "audit_service_only"
  ON audit_logs FOR ALL
  USING (false);

GRANT SELECT, INSERT ON audit_logs TO service_role;

-- ── 3. Notify PostgREST to reload schema ──────────────────────────────────────
NOTIFY pgrst, 'reload schema';
