-- ELBOLD Trust, Governance & Operational Readiness Sprint
-- Phases 1, 3, 5: Data integrity, lifecycle governance, portfolio links

-- ─── 1. Fix platform_stats: add rejected + suspended counts ──────────────────
DROP VIEW IF EXISTS platform_stats;

CREATE VIEW platform_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles WHERE role = 'customer')                          AS total_customers,
  (SELECT COUNT(*) FROM vendors)                                                    AS total_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'approved')                          AS approved_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'pending')                           AS pending_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'rejected')                          AS rejected_vendors,
  (SELECT COUNT(*) FROM vendors WHERE status = 'suspended')                         AS suspended_vendors,
  (SELECT COUNT(*) FROM events)                                                     AS total_events,
  (SELECT COUNT(*) FROM bookings)                                                   AS total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE status = 'completed')                        AS completed_bookings,
  (SELECT COALESCE(SUM(commission_amount),0) FROM bookings WHERE payment_status IN ('deposit_paid','fully_paid')) AS total_revenue,
  (SELECT COALESCE(SUM(total_amount),0) FROM bookings WHERE payment_status = 'fully_paid') AS total_gmv,
  (SELECT COUNT(*) FROM disputes WHERE status = 'open')                             AS open_disputes,
  (SELECT COALESCE(AVG(rating), 0) FROM vendors WHERE status = 'approved' AND rating > 0) AS avg_vendor_rating,
  (SELECT COUNT(*) FROM quotes WHERE status = 'pending')                            AS pending_quotes,
  (SELECT COUNT(*) FROM message_threads)                                            AS total_message_threads;

GRANT SELECT ON platform_stats TO authenticated;

-- ─── 2. Vendor lifecycle state ────────────────────────────────────────────────
-- Represents the governed stage of a vendor's journey, independent of the
-- binary status field. Admin and automated triggers advance this state.

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS lifecycle_state TEXT
  NOT NULL DEFAULT 'applied'
  CHECK (lifecycle_state IN (
    'applied',       -- submitted application, email not yet confirmed or awaiting review start
    'under_review',  -- admin has opened and is actively reviewing the application
    'approved',      -- admin approved; vendor can build profile
    'profile_setup', -- vendor has completed bio + packages + media
    'verified',      -- admin has verified identity documents
    'live',          -- profile published; vendor receives enquiries and bookings
    'rejected',      -- application rejected
    'suspended'      -- account suspended
  ));

-- Back-fill existing rows so legacy data is consistent
UPDATE vendors SET lifecycle_state = 'approved'   WHERE status = 'approved'  AND lifecycle_state = 'applied';
UPDATE vendors SET lifecycle_state = 'rejected'   WHERE status = 'rejected'  AND lifecycle_state = 'applied';
UPDATE vendors SET lifecycle_state = 'suspended'  WHERE status = 'suspended' AND lifecycle_state = 'applied';
-- Rows with status='pending' remain lifecycle_state='applied' (correct default)

-- Trigger: keep lifecycle_state in sync when admin changes status via the PATCH API.
-- Only drives status-correlated transitions; finer states (profile_setup/verified/live)
-- are managed explicitly by the admin panel.
CREATE OR REPLACE FUNCTION sync_vendor_lifecycle_state()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'rejected' THEN
    NEW.lifecycle_state := 'rejected';
  ELSIF NEW.status = 'suspended' THEN
    NEW.lifecycle_state := 'suspended';
  ELSIF OLD.status = 'rejected' OR OLD.status = 'suspended' THEN
    -- Re-instated vendor: reset to applied so admin reviews again
    IF NEW.status = 'pending' THEN
      NEW.lifecycle_state := 'applied';
    ELSIF NEW.status = 'approved' THEN
      NEW.lifecycle_state := 'approved';
    END IF;
  ELSIF NEW.status = 'approved' AND NEW.lifecycle_state IN ('applied', 'under_review') THEN
    NEW.lifecycle_state := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_vendor_lifecycle ON vendors;
CREATE TRIGGER trg_sync_vendor_lifecycle
  BEFORE UPDATE OF status ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION sync_vendor_lifecycle_state();

CREATE INDEX IF NOT EXISTS idx_vendors_lifecycle_state ON vendors(lifecycle_state);

-- ─── 3. Vendor portfolio links ────────────────────────────────────────────────
-- Replaces the single instagram_url requirement with a typed link array.
-- Each element: { "type": "instagram", "url": "https://..." }
-- Supported types: website, instagram, facebook, tiktok, linkedin,
--                  google_business, behance, etsy, youtube, other

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS portfolio_links JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Back-fill: migrate existing instagram_url / website_url into portfolio_links
UPDATE vendors
SET portfolio_links = (
  COALESCE(
    CASE WHEN instagram_url IS NOT NULL AND instagram_url != '' THEN
      jsonb_build_array(jsonb_build_object('type', 'instagram', 'url', instagram_url))
    ELSE '[]'::jsonb END,
    '[]'::jsonb
  ) ||
  COALESCE(
    CASE WHEN website_url IS NOT NULL AND website_url != '' THEN
      jsonb_build_array(jsonb_build_object('type', 'website', 'url', website_url))
    ELSE '[]'::jsonb END,
    '[]'::jsonb
  )
)
WHERE (instagram_url IS NOT NULL AND instagram_url != '')
   OR (website_url IS NOT NULL AND website_url != '');
