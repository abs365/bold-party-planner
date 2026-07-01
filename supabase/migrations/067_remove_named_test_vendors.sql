-- Migration 067: Remove test vendor listings (Tinms, Mastaly, Baptist, Ballet)
--
-- UK Expansion Readiness cleanup (2026-07-01). These 4 vendor BUSINESS LISTINGS
-- are removed. Their underlying login accounts are deliberately preserved:
--   - "Ballet" (blue2gtv@gmail.com) is the founder's own account
--   - "Mastaly" (mastalyinfo@gmail.com) is a real contact earmarked for a
--     future admin-role grant
--   - "Tinms" (boldeventplanner@gmail.com) / "Baptist" (alawal543@yahoo.com)
--     use real personal emails, not confirmed disposable
-- A first draft of this migration attempted to delete all 4 owner accounts and
-- was correctly blocked by the admin_roles_granted_by_fkey constraint on
-- Ballet's account before anything committed (DO block is one transaction —
-- the whole thing rolled back, verified with no partial deletion). Revised
-- scope below: delete the vendor listings and their vendor-only data; delete
-- the one clearly-disposable demo customer account
-- (phase53.customer@elbold.demo / "Sarah Mitchell"); touch no other person.

DO $$
DECLARE
  v_vendor_ids  uuid[] := ARRAY[
    'ce87d98d-e334-4427-98be-a1e58a13e18b', -- Tinms
    'db6756f2-4417-4813-a0fd-1cf5b2bc6e2b', -- Mastaly
    'cfe5733a-805e-4a90-a5f0-b0d8d3185d9d', -- Baptist
    '07574580-0a35-4a1b-a3fc-d17b86cd3a21'  -- Ballet
  ]::uuid[];
  v_demo_customer_id uuid := '1aee222c-641b-435b-a57a-eb4f083c7066'; -- phase53.customer@elbold.demo
  v_event_ids   uuid[];
  v_booking_ids uuid[];
  v_count       integer;
BEGIN

  SELECT array_agg(id) INTO v_event_ids FROM events WHERE customer_id = v_demo_customer_id;

  SELECT array_agg(id) INTO v_booking_ids
  FROM bookings
  WHERE customer_id = v_demo_customer_id OR vendor_id = ANY(v_vendor_ids);

  RAISE NOTICE '[067] vendors=%, demo_customer_events=%, bookings=%',
    array_length(v_vendor_ids,1), COALESCE(array_length(v_event_ids,1),0),
    COALESCE(array_length(v_booking_ids,1),0);

  -- PHASE 1 — disputes
  IF v_booking_ids IS NOT NULL THEN
    DELETE FROM disputes WHERE booking_id = ANY(v_booking_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] disputes (booking_id) deleted: %', v_count;
  END IF;
  DELETE FROM disputes WHERE raised_by = v_demo_customer_id OR resolved_by = v_demo_customer_id;

  -- PHASE 2 — bookings
  IF v_booking_ids IS NOT NULL THEN
    DELETE FROM bookings WHERE id = ANY(v_booking_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] bookings deleted: %', v_count;
  END IF;

  -- PHASE 3 — events (demo customer only — vendors have no direct event link)
  IF v_event_ids IS NOT NULL THEN
    BEGIN
      DELETE FROM checklist_progress WHERE event_id = ANY(v_event_ids);
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
  DELETE FROM events WHERE customer_id = v_demo_customer_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] events deleted: %', v_count;

  -- PHASE 4 — quotes (vendor_id covers lawloni4's quote to Ballet — only the
  -- quote row is removed; lawloni4's own account is never touched)
  DELETE FROM quotes WHERE customer_id = v_demo_customer_id OR vendor_id = ANY(v_vendor_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] quotes deleted: %', v_count;

  -- PHASE 5 — reviews
  DELETE FROM reviews WHERE customer_id = v_demo_customer_id OR vendor_id = ANY(v_vendor_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] reviews deleted: %', v_count;

  -- PHASE 6 — messaging
  BEGIN
    DELETE FROM messages WHERE sender_id = v_demo_customer_id
      OR thread_id IN (SELECT id FROM message_threads WHERE customer_id = v_demo_customer_id OR vendor_id = ANY(v_vendor_ids));
    DELETE FROM message_threads WHERE customer_id = v_demo_customer_id OR vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] message_threads deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN RAISE NOTICE '[067] messages/message_threads not found — skipped'; END;

  BEGIN
    DELETE FROM smart_chat_history WHERE user_id = v_demo_customer_id;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- PHASE 7 — saved vendors / notifications
  BEGIN
    DELETE FROM saved_vendors WHERE customer_id = v_demo_customer_id OR vendor_id = ANY(v_vendor_ids);
  EXCEPTION WHEN undefined_table THEN NULL; END;

  DELETE FROM notifications WHERE user_id = v_demo_customer_id;

  -- PHASE 8 — vendor sub-tables + the vendor listings themselves
  BEGIN
    DELETE FROM admin_alerts WHERE vendor_id = ANY(v_vendor_ids);
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM verification_documents WHERE vendor_id = ANY(v_vendor_ids);
    DELETE FROM verification_activity_log WHERE vendor_id = ANY(v_vendor_ids);
    DELETE FROM vendor_verifications WHERE vendor_id = ANY(v_vendor_ids);
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN DELETE FROM lead_routing_log WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM vendor_payouts WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM payout_requests WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM vendor_subscriptions WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM vendor_analytics WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM vendor_daily_stats WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM vendor_reputation_snapshots WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;

  DELETE FROM vendor_onboarding WHERE vendor_id = ANY(v_vendor_ids);
  DELETE FROM vendor_availability WHERE vendor_id = ANY(v_vendor_ids);
  DELETE FROM vendor_packages WHERE vendor_id = ANY(v_vendor_ids);
  DELETE FROM vendor_media WHERE vendor_id = ANY(v_vendor_ids);

  DELETE FROM vendors WHERE id = ANY(v_vendor_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] vendors deleted: %', v_count;

  -- PHASE 9 — profiles + auth for the demo customer ONLY
  -- (all 4 vendor-owner accounts are deliberately left untouched)
  DELETE FROM profiles WHERE id = v_demo_customer_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] demo customer profile deleted: %', v_count;

  DELETE FROM auth.mfa_amr_claims WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = v_demo_customer_id);
  DELETE FROM auth.sessions WHERE user_id = v_demo_customer_id;
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid = v_demo_customer_id;
  DELETE FROM auth.mfa_factors WHERE user_id = v_demo_customer_id;
  DELETE FROM auth.identities WHERE user_id = v_demo_customer_id;

  BEGIN DELETE FROM auth.one_time_tokens WHERE user_id::text = v_demo_customer_id::text; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM auth.audit_log_entries WHERE actor_id = v_demo_customer_id::text; EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM auth.flow_state WHERE user_id::text = v_demo_customer_id::text; EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;

  DELETE FROM auth.users WHERE id = v_demo_customer_id;
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[067] demo customer auth.users deleted: %', v_count;

  RAISE NOTICE '[067] Done.';

END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────
SELECT 'vendor listings remaining (should be 0)' AS check_name, COUNT(*) AS n
FROM vendors WHERE id IN (
  'ce87d98d-e334-4427-98be-a1e58a13e18b','db6756f2-4417-4813-a0fd-1cf5b2bc6e2b',
  'cfe5733a-805e-4a90-a5f0-b0d8d3185d9d','07574580-0a35-4a1b-a3fc-d17b86cd3a21'
)
UNION ALL
SELECT 'vendor owner accounts preserved (should be 4)', COUNT(*)
FROM auth.users WHERE id IN (
  'ea466762-a7f2-408f-b64e-77cef5070e34', -- Tinms owner
  '267127d7-bb5d-43a3-a5c6-fb9f0372e534', -- Mastaly owner
  '9baad2d3-b09a-4a6d-955b-afd7ece7101d', -- Baptist owner
  'af0c7d7c-89b9-4079-b130-cdfdd9d356f4'  -- Ballet owner (founder)
)
UNION ALL
SELECT 'demo customer remaining (should be 0)', COUNT(*)
FROM auth.users WHERE id = '1aee222c-641b-435b-a57a-eb4f083c7066'
UNION ALL
SELECT 'lawloni4 account preserved (should be 1)', COUNT(*)
FROM auth.users WHERE id = '791e0eef-498b-468b-9d64-96b56b63718c';
