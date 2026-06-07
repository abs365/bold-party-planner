-- Migration 039d: Add missing RLS policies for vendor_verifications
--
-- Root cause: Migration 004 enabled RLS on vendor_verifications with a SELECT-only
-- policy ("Vendors read own verifications"). No INSERT or UPDATE policies were
-- created, so any authenticated user's attempt to submit a verification via
-- POST /api/vendor/verification returns a 500 (RLS violation on upsert).
--
-- This is identical in pattern to the phone_otp_codes issue fixed in 039c:
-- createClient() in a user session context sends the user JWT (role=authenticated)
-- as Bearer token. PostgreSQL enforces RLS against that role, and without an
-- INSERT/UPDATE policy the upsert is blocked.
--
-- Confirmed: vendor_verifications has 0 rows in production — all submissions
-- have been silently failing since the verification system launched.
--
-- verification_activity_log has the same gap: only a SELECT policy exists.
-- The activity log insert in the route does not check its own error, so it has
-- been failing silently too. Added an INSERT policy to fix that.

-- ── vendor_verifications ────────────────────────────────────────────────────

-- Vendors may insert a verification record for their own vendor profile
CREATE POLICY "vendor_own_verifications_insert" ON vendor_verifications
  FOR INSERT TO authenticated
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Vendors may update (resubmit) their own pending/rejected verification records
CREATE POLICY "vendor_own_verifications_update" ON vendor_verifications
  FOR UPDATE TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- Admins may read all verification records (needed for admin review panel)
CREATE POLICY "admin_all_verifications_select" ON vendor_verifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins may update (approve/reject) any verification record
CREATE POLICY "admin_all_verifications_update" ON vendor_verifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── verification_activity_log ────────────────────────────────────────────────

-- Vendors and system processes may insert activity log entries for their vendor
CREATE POLICY "vendor_own_activity_insert" ON verification_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
    OR actor_type = 'system'
  );

-- Admins may insert activity log entries for any vendor
CREATE POLICY "admin_all_activity_insert" ON verification_activity_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins may read all activity log entries
CREATE POLICY "admin_all_activity_select" ON verification_activity_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Explicit grants (PostgREST requires GRANT even when RLS allows)
GRANT SELECT, INSERT, UPDATE ON vendor_verifications TO authenticated;
GRANT ALL ON vendor_verifications TO service_role;

GRANT SELECT, INSERT ON verification_activity_log TO authenticated;
GRANT ALL ON verification_activity_log TO service_role;

NOTIFY pgrst, 'reload schema';
