-- Migration 066: Live Customer Experience data source (ESP 1.3B / Business Control Centre Wave 1)
--
-- Business Health's Customer Experience category needs sub-rating averages
-- (communication/professionalism/punctuality/quality/value). These live per-review
-- on `reviews` but were never aggregated onto `vendors` — only onto the
-- `vendor_reputation_snapshots` table, which has no writer in production (verified
-- by repo search; see BUSINESS_CONTROL_CENTRE_FINAL_ARCHITECTURE.md §2.1-2.2).
--
-- Fix: extend the existing update_vendor_rating() trigger (023 migration) — already
-- fires on every review insert/update/delete and already aggregates `reviews` for
-- `rating`/`review_count` — to also aggregate and store the 5 sub-rating averages.
-- Same trigger, same firing conditions, no new trigger object. Dashboard already
-- fetches the full vendor row, so this requires zero new read queries.

-- ── 1. Add columns ────────────────────────────────────────────────────────────

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS avg_communication   NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_professionalism NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_punctuality     NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_quality         NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS avg_value           NUMERIC(3,2);

-- ── 2. Extend the existing trigger function ──────────────────────────────────

CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_avg               NUMERIC;
  v_count             INTEGER;
  v_avg_communication   NUMERIC;
  v_avg_professionalism NUMERIC;
  v_avg_punctuality     NUMERIC;
  v_avg_quality         NUMERIC;
  v_avg_value           NUMERIC;
BEGIN
  SELECT
    COALESCE(AVG(rating)::NUMERIC, 0),
    COUNT(*),
    AVG(communication_rating),
    AVG(professionalism_rating),
    AVG(punctuality_rating),
    AVG(quality_rating),
    AVG(value_rating)
  INTO
    v_avg, v_count,
    v_avg_communication, v_avg_professionalism, v_avg_punctuality, v_avg_quality, v_avg_value
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
    ),
    avg_communication    = ROUND(v_avg_communication, 2),
    avg_professionalism  = ROUND(v_avg_professionalism, 2),
    avg_punctuality      = ROUND(v_avg_punctuality, 2),
    avg_quality          = ROUND(v_avg_quality, 2),
    avg_value            = ROUND(v_avg_value, 2)
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ── 3. One-time backfill for existing reviews ────────────────────────────────
-- Trigger only fires on future review changes — vendors with existing reviews
-- need their averages computed once, now.

UPDATE vendors v
SET
  avg_communication   = ROUND(r.avg_communication, 2),
  avg_professionalism = ROUND(r.avg_professionalism, 2),
  avg_punctuality     = ROUND(r.avg_punctuality, 2),
  avg_quality         = ROUND(r.avg_quality, 2),
  avg_value           = ROUND(r.avg_value, 2)
FROM (
  SELECT
    vendor_id,
    AVG(communication_rating)   AS avg_communication,
    AVG(professionalism_rating) AS avg_professionalism,
    AVG(punctuality_rating)     AS avg_punctuality,
    AVG(quality_rating)         AS avg_quality,
    AVG(value_rating)           AS avg_value
  FROM reviews
  WHERE moderation_status = 'approved'
  GROUP BY vendor_id
) r
WHERE v.id = r.vendor_id;

NOTIFY pgrst, 'reload schema';
