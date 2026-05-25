-- ═══════════════════════════════════════════════════════
-- Phase 7: Production Readiness & Launch Hardening
-- ═══════════════════════════════════════════════════════

-- ── Admin / Moderation Improvements ─────────────────────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS admin_notes       TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_demo           BOOLEAN     DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS flagged_at        TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS last_active_at    TIMESTAMPTZ;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS report_count      INTEGER     DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at      TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS hidden            BOOLEAN     DEFAULT false;

-- ── Soft Delete for Media ─────────────────────────────────────────────────────
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- ── Error & Monitoring Logging ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS error_logs (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  level         TEXT        DEFAULT 'error'
                            CHECK (level IN ('info','warn','error','critical')),
  context       TEXT        NOT NULL,        -- e.g. 'api/uploads', 'webhook'
  message       TEXT        NOT NULL,
  details       JSONB       DEFAULT '{}',
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  request_path  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Platform Analytics Events ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_events (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type    TEXT        NOT NULL,        -- 'page_view', 'booking_started', etc.
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id     UUID        REFERENCES vendors(id) ON DELETE SET NULL,
  properties    JSONB       DEFAULT '{}',
  session_id    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Vendor Payout Requests ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payout_requests (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id     UUID        REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  amount        NUMERIC(10,2) NOT NULL,
  status        TEXT        DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','paid','rejected')),
  bank_details  JSONB       DEFAULT '{}',
  admin_notes   TEXT,
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  processed_at  TIMESTAMPTZ
);

-- ── Platform Settings ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key           TEXT        PRIMARY KEY,
  value         TEXT        NOT NULL,
  description   TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_commission_rate', '0.10',   'Platform commission on bookings (10%)'),
  ('max_upload_size_mb',       '100',    'Maximum file upload size in megabytes'),
  ('vendor_approval_sla_hours','48',     'Target SLA for vendor approval in hours'),
  ('min_booking_notice_hours', '24',     'Minimum hours notice required for bookings'),
  ('deposit_percentage',       '0.30',   'Required deposit as fraction of total (30%)')
ON CONFLICT (key) DO NOTHING;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE error_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- error_logs: service role only (no public access)
CREATE POLICY "no_public_error_logs" ON error_logs FOR ALL USING (false);

-- platform_events: users can insert their own, read nothing
CREATE POLICY "users_insert_platform_events" ON platform_events
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "no_public_read_events" ON platform_events FOR SELECT USING (false);

-- payout_requests: vendors read/insert their own
DROP POLICY IF EXISTS "vendors_own_payouts" ON payout_requests;
CREATE POLICY "vendors_own_payouts" ON payout_requests
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

-- platform_settings: public read
DROP POLICY IF EXISTS "public_read_settings" ON platform_settings;
CREATE POLICY "public_read_settings" ON platform_settings FOR SELECT USING (true);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_error_logs_created      ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_context      ON error_logs(context, level);
CREATE INDEX IF NOT EXISTS idx_platform_events_type    ON platform_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_vendor  ON platform_events(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_vendor  ON payout_requests(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_media_active     ON vendor_media(vendor_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_hidden          ON reviews(vendor_id) WHERE hidden = false;
