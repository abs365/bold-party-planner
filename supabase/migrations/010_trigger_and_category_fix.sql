-- ═══════════════════════════════════════════════════════════════
-- Migration 010: Robust Auth Trigger + "other" Vendor Category
-- ═══════════════════════════════════════════════════════════════
--
-- PART A: Rewrite handle_new_user() trigger
--   Root cause of "Database error saving new user":
--   - Original trigger has no conflict handling (duplicate id fails)
--   - No exception guard (any DB error blocks signup entirely)
--   - Implicit schema reference (affected by search_path issues)
--   - No role validation (invalid metadata value fails CHECK)
--
-- PART B: Add 'other' category to vendors CHECK constraint
-- ═══════════════════════════════════════════════════════════════

-- ── PART A: Robust trigger ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    -- Email can be NULL in OAuth flows before email is verified
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Validate role against allowed values; default to 'customer'
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'customer') IN ('customer', 'vendor', 'admin')
      THEN COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
      ELSE 'customer'
    END
  )
  -- Retry-safe: if user attempts signup twice (e.g. after email confirm),
  -- update name/email rather than throwing a duplicate-key error.
  ON CONFLICT (id) DO UPDATE SET
    email     = COALESCE(EXCLUDED.email, public.profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log the failure but NEVER let it block the auth signup.
  -- The user gets an account; a background job or manual admin action
  -- can create the missing profile row later if needed.
  RAISE WARNING 'handle_new_user failed for user %: % (SQLSTATE: %)',
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public, auth;  -- explicit search_path prevents injection

-- Drop and recreate the trigger to pick up the new function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── PART B: Add 'other' to vendor category ────────────────────────────────────
-- Drop the old constraint (Postgres auto-names it vendors_category_check)
-- Use a DO block so we can look up the real constraint name safely.

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
    'luxury_services','transport','cleaner','event_staff','other'
  ));

-- Notify PostgREST of schema changes
NOTIFY pgrst, 'reload schema';
