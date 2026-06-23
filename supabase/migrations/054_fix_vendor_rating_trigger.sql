-- ── Migration 054: Fix vendor rating trigger — SECURITY DEFINER ──────────────
--
-- Root cause: update_vendor_rating() ran as SECURITY INVOKER (default).
-- When a customer inserts a review, the trigger fires as the customer role.
-- vendors_own_write RLS policy blocks UPDATE vendors WHERE user_id = auth.uid()
-- because the customer ≠ vendor owner → UPDATE silently affects 0 rows.
--
-- Fix: SECURITY DEFINER makes the function run as its owner (postgres/supabase),
-- bypassing RLS for the internal UPDATE. search_path is hardened to 'public'
-- to prevent search_path injection attacks.
--
-- After applying this migration:
-- 1. Backfill existing reviews so vendor ratings are recalculated correctly.
-- 2. Verify via: SELECT id, rating, review_count FROM vendors WHERE review_count > 0;

CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    rating                = ROUND(v_avg, 2),
    review_count          = v_count,
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

-- Trigger definition is correct — no change needed.
-- Fires AFTER INSERT OR UPDATE OF rating, moderation_status OR DELETE on reviews.

-- Backfill: recalculate ratings for all vendors that already have reviews
-- (catches any vendors where the trigger previously silently failed)
DO $$
DECLARE
  v RECORD;
  v_avg   NUMERIC;
  v_count INTEGER;
  v_vc    INTEGER;
BEGIN
  FOR v IN SELECT DISTINCT vendor_id FROM reviews LOOP
    SELECT
      COALESCE(AVG(rating)::NUMERIC, 0),
      COUNT(*)
    INTO v_avg, v_count
    FROM reviews
    WHERE vendor_id = v.vendor_id
      AND moderation_status = 'approved';

    SELECT COUNT(*) INTO v_vc
    FROM reviews
    WHERE vendor_id = v.vendor_id
      AND moderation_status = 'approved'
      AND is_verified = TRUE;

    UPDATE vendors
    SET
      rating                = ROUND(v_avg, 2),
      review_count          = v_count,
      verified_review_count = v_vc
    WHERE id = v.vendor_id;
  END LOOP;
END;
$$;
