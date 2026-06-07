-- Migration 039c: Add missing RLS policies for phone_otp_codes
--
-- Root cause: Migration 038 created phone_otp_codes with RLS enabled but only
-- added a SELECT policy. INSERT and UPDATE were blocked by default, causing the
-- OTP send endpoint to return 500 even when using createAdminClient().
--
-- The route runs in the context of an authenticated user's session (JWT role =
-- "authenticated"). PostgreSQL requires an explicit INSERT/UPDATE policy for
-- that role — service_role bypass only applies when the service_role JWT is the
-- Bearer token, which is not the case when SSR reads the user's session cookie.

-- Allow authenticated users to insert OTP codes for themselves only
CREATE POLICY "phone_otp_owner_insert" ON phone_otp_codes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own OTP codes (mark used / invalidate)
CREATE POLICY "phone_otp_owner_update" ON phone_otp_codes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Explicit grants so PostgREST can access the table for authenticated + service_role
GRANT SELECT, INSERT, UPDATE ON phone_otp_codes TO authenticated;
GRANT ALL ON phone_otp_codes TO service_role;

NOTIFY pgrst, 'reload schema';
