-- Migration 016: Enable RLS on admin_alerts
--
-- admin_alerts was created in 014 without ENABLE ROW LEVEL SECURITY.
-- Any authenticated role could read/write it directly via the PostgREST API.
-- All legitimate access goes through the service role (admin page + /api/admin/alerts),
-- which bypasses RLS, so enabling it here does not break any existing functionality.

ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

-- No direct client access — admin API routes use service_role which bypasses RLS.
DROP POLICY IF EXISTS "admin_alerts_no_direct_access" ON admin_alerts;
CREATE POLICY "admin_alerts_no_direct_access"
  ON admin_alerts
  FOR ALL
  USING (false);

NOTIFY pgrst, 'reload schema';
