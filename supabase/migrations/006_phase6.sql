-- ═══════════════════════════════════════════════════════
-- Phase 6: Real-time Experience, Media & Vendor Growth
-- ═══════════════════════════════════════════════════════

-- ── Media Enhancements ───────────────────────────────────────────────────────
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS is_featured   BOOLEAN     DEFAULT false;
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS width          INTEGER;
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS height         INTEGER;
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS duration_secs  INTEGER;
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS alt_text       TEXT;
ALTER TABLE vendor_media ADD COLUMN IF NOT EXISTS tags           TEXT[]      DEFAULT '{}';

-- ── Vendor Insights ──────────────────────────────────────────────────────────
-- Aggregated daily KPIs for vendor dashboards
CREATE TABLE IF NOT EXISTS vendor_daily_stats (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id       UUID        REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
  date            DATE        NOT NULL,
  profile_views   INTEGER     DEFAULT 0,
  quote_requests  INTEGER     DEFAULT 0,
  bookings_made   INTEGER     DEFAULT 0,
  messages_received INTEGER   DEFAULT 0,
  revenue         NUMERIC(10,2) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (vendor_id, date)
);

-- ── Platform Announcements ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_announcements (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  title           TEXT        NOT NULL,
  body            TEXT        NOT NULL,
  type            TEXT        DEFAULT 'info'
                              CHECK (type IN ('info','success','warning','promotion')),
  target_role     TEXT        DEFAULT 'all'
                              CHECK (target_role IN ('all','customer','vendor','admin')),
  is_active       BOOLEAN     DEFAULT true,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Message Read Receipts ────────────────────────────────────────────────────
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- ── Notification Grouping ────────────────────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS group_key TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ;

-- ── Review Response Tracking ─────────────────────────────────────────────────
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS response_at TIMESTAMPTZ;

-- ── Vendor Performance View ──────────────────────────────────────────────────
CREATE OR REPLACE VIEW vendor_performance_summary AS
SELECT
  v.id                                                    AS vendor_id,
  v.business_name,
  v.category,
  v.city,
  v.rating,
  v.review_count,
  v.profile_views,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('confirmed','completed')) AS completed_bookings,
  COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'pending')                 AS pending_bookings,
  COALESCE(SUM(b.vendor_payout) FILTER (WHERE b.payment_status = 'fully_paid'), 0) AS total_earnings,
  COUNT(DISTINCT b.customer_id)                                             AS unique_customers,
  COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'responded')               AS quotes_responded,
  COUNT(DISTINCT q.id)                                                      AS total_quotes
FROM vendors v
LEFT JOIN bookings b ON b.vendor_id = v.id
LEFT JOIN quotes  q ON q.vendor_id  = v.id
GROUP BY v.id, v.business_name, v.category, v.city, v.rating, v.review_count, v.profile_views;

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE vendor_daily_stats     ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_own_daily_stats" ON vendor_daily_stats;
CREATE POLICY "vendors_own_daily_stats" ON vendor_daily_stats
  FOR ALL USING (vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "anyone_reads_announcements" ON platform_announcements;
CREATE POLICY "anyone_reads_announcements" ON platform_announcements
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_vendor_daily_stats_vid_date ON vendor_daily_stats(vendor_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread   ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_thread_created     ON messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_media_featured       ON vendor_media(vendor_id, is_featured) WHERE is_featured = true;
