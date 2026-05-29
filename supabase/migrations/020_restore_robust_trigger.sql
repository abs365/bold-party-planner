-- Migration 020: Restore robust handle_new_user trigger
--
-- Migration 017 overwrote the robust version from 010 with a stripped-down
-- version that has two critical omissions:
--
--   1. Missing SET search_path = public, auth
--      GoTrue sets search_path = auth on its connections. Without an explicit
--      override, `INSERT INTO profiles` resolves to auth.profiles (non-existent)
--      and raises "relation profiles does not exist". This propagates through
--      GoTrue as "Database error creating new user".
--
--   2. Missing EXCEPTION WHEN OTHERS handler
--      Any trigger failure (schema, NOT NULL, CHECK) becomes a hard error that
--      rolls back the auth.users INSERT and blocks user creation entirely.
--      The 010 handler caught these, emitted a WARNING, and let auth proceed.
--
-- This migration restores the full 010 implementation verbatim, plus explicitly
-- updates role on conflict so createUser with a changed role always wins.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    -- COALESCE guards against OAuth flows that insert before email is verified
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    -- Validate against allowed values; unmapped strings fall back to 'customer'
    CASE
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
             IN ('customer', 'vendor', 'admin')
      THEN COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
      ELSE 'customer'
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email     = COALESCE(EXCLUDED.email,     public.profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    role      = EXCLUDED.role;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Never let a profile-insert failure block auth signup.
  -- The user gets an account; the create-demo-users route upserts the
  -- profile explicitly as a belt-and-suspenders step anyway.
  RAISE WARNING 'handle_new_user failed for user %: % (SQLSTATE: %)',
    NEW.id, SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, auth;

-- Recreate the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

NOTIFY pgrst, 'reload schema';
