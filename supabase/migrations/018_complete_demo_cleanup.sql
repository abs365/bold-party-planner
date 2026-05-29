-- Migration 018: Fix purge_demo_auth_entries() — remove session_replication_role
--
-- The 017 version used SET LOCAL session_replication_role = 'replica' to bypass
-- FK cascade when deleting from auth.users. This fails in Supabase even inside a
-- SECURITY DEFINER function because the privilege is not granted to the postgres
-- role in the managed environment. The failure causes a full transaction rollback,
-- leaving auth.users (and all sub-tables) completely untouched.
--
-- Fix: drop session_replication_role entirely. Let the FK cascade run:
--   auth.users → profiles → vendors → vendor_packages/media/bookings/etc.
--
-- IMPORTANT: This function is provided for manual SQL use only.
-- The create-demo-users API route uses admin.auth.admin.deleteUser() per user
-- instead (which also cascades correctly through GoTrue + PostgreSQL).
-- After calling this function manually, re-run seed.sql to restore app data.

CREATE OR REPLACE FUNCTION public.purge_demo_auth_entries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_demo_ids uuid[];
  v_sessions_deleted  integer := 0;
  v_tokens_deleted    integer := 0;
  v_identities_deleted integer := 0;
  v_users_deleted     integer := 0;
BEGIN
  SELECT array_agg(id) INTO v_demo_ids
  FROM auth.users
  WHERE email LIKE '%@boldparty.demo';

  IF v_demo_ids IS NULL OR array_length(v_demo_ids, 1) = 0 THEN
    RETURN jsonb_build_object('deleted', 0, 'message', 'No demo auth entries found');
  END IF;

  -- Clean up auth sub-tables first (they have no FK to app tables)
  DELETE FROM auth.mfa_amr_claims
  WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = ANY(v_demo_ids));

  DELETE FROM auth.sessions WHERE user_id = ANY(v_demo_ids);
  GET DIAGNOSTICS v_sessions_deleted = ROW_COUNT;

  DELETE FROM auth.refresh_tokens WHERE user_id = ANY(v_demo_ids);
  GET DIAGNOSTICS v_tokens_deleted = ROW_COUNT;

  DELETE FROM auth.identities WHERE user_id = ANY(v_demo_ids);
  GET DIAGNOSTICS v_identities_deleted = ROW_COUNT;

  -- Delete from auth.users — cascades to profiles → vendors → app data.
  -- This is intentional. Re-run seed.sql to restore demo app data afterward.
  DELETE FROM auth.users WHERE id = ANY(v_demo_ids);
  GET DIAGNOSTICS v_users_deleted = ROW_COUNT;

  RETURN jsonb_build_object(
    'users_deleted',      v_users_deleted,
    'sessions_deleted',   v_sessions_deleted,
    'tokens_deleted',     v_tokens_deleted,
    'identities_deleted', v_identities_deleted,
    'purged_ids',         v_demo_ids,
    'note', 'Profiles/vendors/events/bookings cascade-deleted. Re-run seed.sql to restore app data.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_demo_auth_entries() TO service_role;
