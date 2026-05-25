-- ═══════════════════════════════════════════════════════════════
-- Migration 009: Schema Grants Fix
-- ═══════════════════════════════════════════════════════════════
--
-- Root cause: PostgREST throws "database error querying schema"
-- when the anon/authenticated roles lack GRANT USAGE on the public
-- schema. None of the earlier migrations included GRANT statements —
-- they only created tables, RLS, and triggers.
--
-- This migration:
--   1. Grants schema and table access to anon + authenticated roles
--   2. Secures automation_logs (no prior RLS) behind an admin-only policy
--   3. Notifies PostgREST to reload its schema cache
--
-- Safe to re-run: all statements are idempotent (IF NOT EXISTS /
-- OR REPLACE / DROP POLICY IF EXISTS).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Schema access ─────────────────────────────────────────────────────────
-- PostgREST MUST have USAGE on the schema to build its route table.
-- Without this, every request returns "database error querying schema".

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ── 2. Table grants ───────────────────────────────────────────────────────────
-- authenticated: full DML on all tables; RLS policies enforce row-level access.
-- anon: SELECT only on the subset of tables that have public-read RLS policies.
--       All other tables will be blocked by RLS even if the GRANT is present.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Public-readable tables (anon browsing: vendor discovery, public reviews)
GRANT SELECT ON
  vendors,
  vendor_media,
  vendor_packages,
  vendor_availability,
  reviews,
  profiles
TO anon;

-- ── 3. View grants ────────────────────────────────────────────────────────────
GRANT SELECT ON platform_stats TO authenticated;

-- ── 4. Default privileges for tables created in future migrations ─────────────
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO authenticated;

-- ── 5. Secure automation_logs (created in 003 without RLS) ───────────────────
ALTER TABLE IF EXISTS automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_logs_service_only" ON automation_logs;
CREATE POLICY "automation_logs_service_only" ON automation_logs
  FOR ALL
  USING (false); -- No direct client access; written via service_role only

-- ── 6. Notify PostgREST to rebuild its schema cache ──────────────────────────
-- After running this migration, PostgREST will reload within ~1 second.
-- If the error persists, restart the Supabase project from the dashboard.
NOTIFY pgrst, 'reload schema';
