-- Migration 017: Fix handle_new_user trigger + add demo auth cleanup RPC
--
-- Two changes:
-- 1. handle_new_user: add ON CONFLICT DO NOTHING so recreating a user whose
--    profile already exists (from seed data) doesn't crash the trigger.
-- 2. purge_demo_auth_entries(): deletes corrupt seeded auth rows WITHOUT
--    cascading to profiles/vendors/events/bookings. Uses
--    session_replication_role='replica' to bypass FK trigger enforcement,
--    so app data is fully preserved while auth entries are wiped clean.

-- ── 1. Patch handle_new_user ────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. purge_demo_auth_entries() ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.purge_demo_auth_entries()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_demo_ids uuid[];
  v_deleted  integer := 0;
BEGIN
  -- Collect all demo user IDs currently in auth.users
  SELECT array_agg(id) INTO v_demo_ids
  FROM auth.users
  WHERE email LIKE '%@boldparty.demo';

  IF v_demo_ids IS NULL OR array_length(v_demo_ids, 1) = 0 THEN
    RETURN jsonb_build_object('deleted', 0, 'message', 'No demo auth entries found');
  END IF;

  -- Remove downstream auth rows first (these have no FK to app tables)
  DELETE FROM auth.mfa_amr_claims
  WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = ANY(v_demo_ids));

  DELETE FROM auth.sessions       WHERE user_id  = ANY(v_demo_ids);
  DELETE FROM auth.refresh_tokens WHERE user_id  = ANY(v_demo_ids);
  DELETE FROM auth.identities     WHERE user_id  = ANY(v_demo_ids);

  -- Delete from auth.users WITHOUT cascading to profiles/vendors/events.
  -- session_replication_role='replica' disables user-space trigger-based FK
  -- enforcement for this transaction, so ON DELETE CASCADE does not fire.
  -- All app rows (profiles, vendors, events, bookings) are preserved intact.
  SET LOCAL session_replication_role = 'replica';
  DELETE FROM auth.users WHERE id = ANY(v_demo_ids);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  -- replica mode resets automatically at transaction end; RESET is belt-and-suspenders
  RESET session_replication_role;

  RETURN jsonb_build_object(
    'deleted', v_deleted,
    'purged_ids', v_demo_ids
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purge_demo_auth_entries() TO service_role;
