-- Migration 027: Add event_planner to vendor category CHECK constraint
-- Required by Phase 28B.5 — Event Planner Category Expansion
-- Status: APPLIED in Supabase (verified 2026-06-01)

DO $$
DECLARE
  v_constraint TEXT;
BEGIN
  SELECT conname INTO v_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.vendors'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%category%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.vendors DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_category_check CHECK (category IN (
    'dj','decorator','caterer','photographer','videographer','mc',
    'security','usher','makeup_artist','cake_maker','balloon_decorator',
    'lighting_stage','furniture_rental','marquee_rental','live_band',
    'luxury_services','transport','cleaner','event_staff','event_planner','other'
  ));

NOTIFY pgrst, 'reload schema';
