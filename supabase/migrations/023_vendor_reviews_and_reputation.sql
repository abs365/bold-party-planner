-- ── Migration 023: Vendor Reviews & Reputation System ───────────────────────
-- Extends reviews table with sub-ratings + moderation
-- Adds reputation columns to vendors
-- Creates review_reports and vendor_reputation_snapshots tables

-- ── 1. Extend reviews table ──────────────────────────────────────────────────

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS communication_rating   SMALLINT CHECK (communication_rating   BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS professionalism_rating SMALLINT CHECK (professionalism_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS punctuality_rating     SMALLINT CHECK (punctuality_rating     BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS quality_rating         SMALLINT CHECK (quality_rating         BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS value_rating           SMALLINT CHECK (value_rating           BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS moderation_status      TEXT NOT NULL DEFAULT 'approved'
                              CHECK (moderation_status IN ('approved','flagged','removed')),
  ADD COLUMN IF NOT EXISTS moderation_notes       TEXT,
  ADD COLUMN IF NOT EXISTS moderated_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderated_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified            BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS verified_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS response_at            TIMESTAMPTZ;

-- Index moderation queue
CREATE INDEX IF NOT EXISTS idx_reviews_moderation
  ON reviews (moderation_status, created_at DESC);

-- Index vendor reviews lookup (approved only)
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_approved
  ON reviews (vendor_id, moderation_status, created_at DESC);

-- ── 2. Extend vendors table ───────────────────────────────────────────────────

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS trust_tier             TEXT NOT NULL DEFAULT 'new'
                              CHECK (trust_tier IN ('new','trusted','top_rated','exceptional')),
  ADD COLUMN IF NOT EXISTS verified_review_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reputation_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repeat_customer_count  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dispute_count          INTEGER NOT NULL DEFAULT 0;

-- ── 3. review_reports table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id      UUID NOT NULL REFERENCES reviews(id)       ON DELETE CASCADE,
  reporter_id    UUID NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  reason         TEXT NOT NULL CHECK (reason IN (
                   'fake','spam','offensive','irrelevant','conflict_of_interest','other'
                 )),
  details        TEXT,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  resolved_by    UUID REFERENCES auth.users(id)             ON DELETE SET NULL,
  resolved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id, reporter_id)
);

CREATE INDEX IF NOT EXISTS idx_review_reports_open
  ON review_reports (status, created_at DESC) WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_review_reports_review
  ON review_reports (review_id);

-- ── 4. vendor_reputation_snapshots table ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendor_reputation_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id             UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  snapshot_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  reputation_score      NUMERIC(5,2) NOT NULL DEFAULT 0,
  trust_tier            TEXT NOT NULL DEFAULT 'new',
  avg_rating            NUMERIC(3,2),
  review_count          INTEGER NOT NULL DEFAULT 0,
  verified_review_count INTEGER NOT NULL DEFAULT 0,
  avg_communication     NUMERIC(3,2),
  avg_professionalism   NUMERIC(3,2),
  avg_punctuality       NUMERIC(3,2),
  avg_quality           NUMERIC(3,2),
  avg_value             NUMERIC(3,2),
  response_rate_pct     NUMERIC(5,2),
  repeat_customer_count INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_reputation_snapshots_vendor
  ON vendor_reputation_snapshots (vendor_id, snapshot_date DESC);

-- ── 5. Update rating trigger to filter by moderation_status ──────────────────

CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_avg    NUMERIC;
  v_count  INTEGER;
BEGIN
  SELECT
    COALESCE(AVG(rating)::NUMERIC, 0),
    COUNT(*)
  INTO v_avg, v_count
  FROM reviews
  WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    AND moderation_status = 'approved';

  UPDATE vendors
  SET
    rating               = ROUND(v_avg, 2),
    review_count         = v_count,
    verified_review_count = (
      SELECT COUNT(*) FROM reviews
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
        AND moderation_status = 'approved'
        AND is_verified = TRUE
    )
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Re-attach trigger so it fires on INSERT, UPDATE, and DELETE
DROP TRIGGER IF EXISTS after_review_insert ON reviews;

CREATE TRIGGER after_review_change
  AFTER INSERT OR UPDATE OF rating, moderation_status OR DELETE
  ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_rating();

-- ── 6. Set verified_at for existing approved reviews ─────────────────────────

UPDATE reviews
SET is_verified = TRUE,
    verified_at = created_at
WHERE verified_at IS NULL
  AND moderation_status = 'approved';

-- ── 7. RLS for review_reports ─────────────────────────────────────────────────

ALTER TABLE review_reports ENABLE ROW LEVEL SECURITY;

-- Customers can create one report per review
CREATE POLICY "customer_report_review"
  ON review_reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = auth.uid());

-- Customers can read their own reports
CREATE POLICY "customer_read_own_reports"
  ON review_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- Service role has full access (admin panel)
CREATE POLICY "service_full_access_review_reports"
  ON review_reports FOR ALL
  TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- ── 8. RLS for vendor_reputation_snapshots ────────────────────────────────────

ALTER TABLE vendor_reputation_snapshots ENABLE ROW LEVEL SECURITY;

-- Vendors can read their own snapshots
CREATE POLICY "vendor_read_own_snapshots"
  ON vendor_reputation_snapshots FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "service_full_access_snapshots"
  ON vendor_reputation_snapshots FOR ALL
  TO service_role
  USING (TRUE) WITH CHECK (TRUE);

-- ── 9. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON review_reports             TO authenticated;
GRANT SELECT                 ON vendor_reputation_snapshots TO authenticated;
GRANT ALL                    ON review_reports             TO service_role;
GRANT ALL                    ON vendor_reputation_snapshots TO service_role;
