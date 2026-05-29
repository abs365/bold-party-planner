-- ── Migration 022: Vendor Governance System ─────────────────────────────────
--
-- Adds:
--   vendor_warnings     — persistent warning records for lifecycle governance
--   vendors.last_active_at  — for inactivity detection
--   vendors.suspicious_reason — human-readable flag reason
--
-- Run this in the Supabase Dashboard SQL editor.

-- ── Add missing vendors columns ───────────────────────────────────────────────

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS suspicious_reason TEXT;

-- ── vendor_warnings table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendor_warnings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id         UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  type              TEXT        NOT NULL
    CHECK (type IN (
      'low_response_rate', 'inactivity', 'excessive_cancellations',
      'dispute_frequency', 'moderation_flags', 'poor_reviews', 'custom'
    )),
  severity          TEXT        NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title             TEXT        NOT NULL,
  message           TEXT        NOT NULL,
  admin_notes       TEXT,
  auto_generated    BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved          BOOLEAN     NOT NULL DEFAULT FALSE,
  resolved_at       TIMESTAMPTZ,
  resolved_by       UUID        REFERENCES profiles(id),
  resolution_notes  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_warnings_vendor_id
  ON vendor_warnings (vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_warnings_unresolved
  ON vendor_warnings (vendor_id)
  WHERE resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendor_warnings_severity
  ON vendor_warnings (severity)
  WHERE resolved = FALSE;

CREATE INDEX IF NOT EXISTS idx_vendor_warnings_created
  ON vendor_warnings (created_at DESC);

-- Indexes for governance queries on vendors
CREATE INDEX IF NOT EXISTS idx_vendors_last_active
  ON vendors (last_active_at DESC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS idx_vendors_cancel_rate
  ON vendors (cancellation_rate)
  WHERE status = 'approved' AND cancellation_rate IS NOT NULL;

-- ── Row-level security ────────────────────────────────────────────────────────

ALTER TABLE vendor_warnings ENABLE ROW LEVEL SECURITY;

-- Vendors can read their own warnings (shows in governance widget)
CREATE POLICY "vendor_warnings_vendor_read"
  ON vendor_warnings FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Only service role (admin client) can insert/update/delete
CREATE POLICY "vendor_warnings_service_write"
  ON vendor_warnings FOR ALL
  USING (auth.role() = 'service_role');

-- ── Auto-update trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_vendor_warnings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendor_warnings_updated_at ON vendor_warnings;
CREATE TRIGGER trg_vendor_warnings_updated_at
  BEFORE UPDATE ON vendor_warnings
  FOR EACH ROW EXECUTE FUNCTION update_vendor_warnings_updated_at();

-- ── Grant service role access ─────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON vendor_warnings TO service_role;
GRANT SELECT ON vendor_warnings TO authenticated;
