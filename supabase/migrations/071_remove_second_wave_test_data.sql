-- Migration 071: Remove second wave of test/demo data found during the
-- Commercial Readiness Sprint's live Production Reality Audit (2026-07-02).
--
-- Confirmed by direct production query, not by name-pattern-matching alone
-- (per the established caution from migration 067, where a first draft
-- nearly deleted a real person's account). All 9 records below were
-- explicitly reviewed by the founder before this migration was written:
--
-- Vendors (synthetic @elbold.demo domain - bulk-seeded, sequential profile
-- IDs a0000001/a0000003/a0000004):
--   - "T.L" (james.bennett@elbold.demo)
--   - "Spice & Grace Catering" (ravi.patel@elbold.demo)
--   - "Charlotte DJ Services" (charlotte.hughes@elbold.demo)
-- Vendors (self-labeled internal test accounts, elbold.com company domain):
--   - "REV TEST Photography" (rev-test-vendor@elbold.com)
-- Vendors (real-looking personal/business emails, but confirmed by founder
-- to be test signups, not real prospective vendors):
--   - "Smoke Test1" (talenthubconnectai@gmail.com)
--   - "LJ Test Vendor" (elizabeth-johnson@hotmail.co.uk)
-- Customers:
--   - ratelimit-test@test.com (no full_name set)
--   - "REV TEST Customer" (rev-test-customer@elbold.com)
--   - "Smoke Test Contact" (smoke@test.com)
--
-- Underlying auth.users accounts ARE removed for all 9 (unlike migration
-- 067) - the founder explicitly confirmed all 9 are test signups, not real
-- people whose account should be preserved.

DO $$
DECLARE
  v_vendor_ids uuid[] := ARRAY[
    'e77b7762-ccb5-4c62-a0ff-f1d065db178b', -- T.L
    '1001cd97-7ab0-4cde-9044-41f10104fcd3', -- Spice & Grace Catering
    '85d1f72e-63f5-40f9-9ee3-f725813a01cc', -- Charlotte DJ Services
    '84c3d9ae-208e-4265-b60b-561b34a7f103', -- REV TEST Photography
    'fa09f856-f898-43bf-9a15-d92f768a9e06', -- Smoke Test1
    '344df48f-07fe-4f08-9c51-2f160a00c589'  -- LJ Test Vendor
  ]::uuid[];
  v_vendor_profile_ids uuid[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001', -- james.bennett@elbold.demo
    'a0000003-0000-0000-0000-000000000003', -- ravi.patel@elbold.demo
    'a0000004-0000-0000-0000-000000000004', -- charlotte.hughes@elbold.demo
    'd631e70f-bf23-41b3-be6e-b004023c2d48', -- rev-test-vendor@elbold.com
    '5cb26aad-c23e-4958-945d-43e02d761586', -- talenthubconnectai@gmail.com
    '8108cec3-45b0-4f26-aeec-632489a2e661'  -- elizabeth-johnson@hotmail.co.uk
  ]::uuid[];
  v_customer_profile_ids uuid[] := ARRAY[
    '9cc75555-75b6-4e97-a974-7960a3dc9cfd', -- ratelimit-test@test.com
    '725addf7-1cfc-4c93-9db2-0f2c76622244', -- rev-test-customer@elbold.com
    '428c69e3-f8f1-4b93-a553-a39e8c162052'  -- smoke@test.com
  ]::uuid[];
  v_all_profile_ids uuid[];
  v_event_ids   uuid[];
  v_booking_ids uuid[];
  v_count       integer;
BEGIN

  v_all_profile_ids := v_vendor_profile_ids || v_customer_profile_ids;

  SELECT array_agg(id) INTO v_event_ids FROM events WHERE customer_id = ANY(v_customer_profile_ids);

  SELECT array_agg(id) INTO v_booking_ids
  FROM bookings
  WHERE customer_id = ANY(v_customer_profile_ids) OR vendor_id = ANY(v_vendor_ids);

  RAISE NOTICE '[071] vendors=%, customers=%, events=%, bookings=%',
    array_length(v_vendor_ids,1), array_length(v_customer_profile_ids,1),
    COALESCE(array_length(v_event_ids,1),0), COALESCE(array_length(v_booking_ids,1),0);

  -- PHASE 1 — disputes + financial ledger (found via FK violation on first
  -- run against production - not present in migration 067's target rows)
  IF v_booking_ids IS NOT NULL THEN
    DELETE FROM disputes WHERE booking_id = ANY(v_booking_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] disputes (booking_id) deleted: %', v_count;
  END IF;
  DELETE FROM disputes WHERE raised_by = ANY(v_all_profile_ids) OR resolved_by = ANY(v_all_profile_ids);

  BEGIN
    DELETE FROM financial_ledger WHERE vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] financial_ledger deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- PHASE 2 — bookings
  IF v_booking_ids IS NOT NULL THEN
    DELETE FROM bookings WHERE id = ANY(v_booking_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] bookings deleted: %', v_count;
  END IF;

  -- PHASE 3 — events (customers only — vendors have no direct event link)
  IF v_event_ids IS NOT NULL THEN
    BEGIN
      DELETE FROM checklist_progress WHERE event_id = ANY(v_event_ids);
    EXCEPTION WHEN undefined_table THEN NULL; END;
  END IF;
  DELETE FROM events WHERE customer_id = ANY(v_customer_profile_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] events deleted: %', v_count;

  -- PHASE 4 — quotes
  DELETE FROM quotes WHERE customer_id = ANY(v_customer_profile_ids) OR vendor_id = ANY(v_vendor_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] quotes deleted: %', v_count;

  -- PHASE 5 — reviews
  DELETE FROM reviews WHERE customer_id = ANY(v_customer_profile_ids) OR vendor_id = ANY(v_vendor_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] reviews deleted: %', v_count;

  -- PHASE 6 — messaging
  BEGIN
    DELETE FROM messages WHERE sender_id = ANY(v_all_profile_ids)
      OR thread_id IN (SELECT id FROM message_threads WHERE customer_id = ANY(v_customer_profile_ids) OR vendor_id = ANY(v_vendor_ids));
    DELETE FROM message_threads WHERE customer_id = ANY(v_customer_profile_ids) OR vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] message_threads deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN RAISE NOTICE '[071] messages/message_threads not found — skipped'; END;

  BEGIN
    DELETE FROM smart_chat_history WHERE user_id = ANY(v_all_profile_ids);
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- PHASE 7 — saved vendors / notifications / analytics events
  BEGIN
    DELETE FROM saved_vendors WHERE customer_id = ANY(v_customer_profile_ids) OR vendor_id = ANY(v_vendor_ids);
  EXCEPTION WHEN undefined_table THEN NULL; END;

  DELETE FROM notifications WHERE user_id = ANY(v_all_profile_ids);

  BEGIN
    DELETE FROM analytics_events WHERE user_id = ANY(v_all_profile_ids);
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- PHASE 8 — vendor sub-tables + subscriptions + the vendor listings themselves
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

  DELETE FROM vendor_subscriptions WHERE vendor_id = ANY(v_vendor_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] vendor_subscriptions deleted: %', v_count;

  BEGIN DELETE FROM vendor_analytics WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM vendor_daily_stats WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM vendor_reputation_snapshots WHERE vendor_id = ANY(v_vendor_ids); EXCEPTION WHEN undefined_table THEN NULL; END;

  DELETE FROM vendor_onboarding WHERE vendor_id = ANY(v_vendor_ids);
  DELETE FROM vendor_availability WHERE vendor_id = ANY(v_vendor_ids);
  DELETE FROM vendor_packages WHERE vendor_id = ANY(v_vendor_ids);
  DELETE FROM vendor_media WHERE vendor_id = ANY(v_vendor_ids);

  DELETE FROM vendors WHERE id = ANY(v_vendor_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] vendors deleted: %', v_count;

  -- PHASE 9 — profiles + auth for all 9 (unlike 067, all underlying accounts
  -- are removed here — confirmed by the founder to be test signups)
  DELETE FROM profiles WHERE id = ANY(v_all_profile_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] profiles deleted: %', v_count;

  DELETE FROM auth.mfa_amr_claims WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = ANY(v_all_profile_ids));
  DELETE FROM auth.sessions WHERE user_id = ANY(v_all_profile_ids);
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid = ANY(v_all_profile_ids);
  DELETE FROM auth.mfa_factors WHERE user_id = ANY(v_all_profile_ids);
  DELETE FROM auth.identities WHERE user_id = ANY(v_all_profile_ids);

  BEGIN DELETE FROM auth.one_time_tokens WHERE user_id::text = ANY(SELECT unnest(v_all_profile_ids)::text); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM auth.audit_log_entries WHERE actor_id = ANY(SELECT unnest(v_all_profile_ids)::text); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM auth.flow_state WHERE user_id::text = ANY(SELECT unnest(v_all_profile_ids)::text); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;

  DELETE FROM auth.users WHERE id = ANY(v_all_profile_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT; RAISE NOTICE '[071] auth.users deleted: %', v_count;

  RAISE NOTICE '[071] Done.';

END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────
SELECT 'vendor listings remaining (should be 0)' AS check_name, COUNT(*) AS n
FROM vendors WHERE id IN (
  'e77b7762-ccb5-4c62-a0ff-f1d065db178b','1001cd97-7ab0-4cde-9044-41f10104fcd3',
  '85d1f72e-63f5-40f9-9ee3-f725813a01cc','84c3d9ae-208e-4265-b60b-561b34a7f103',
  'fa09f856-f898-43bf-9a15-d92f768a9e06','344df48f-07fe-4f08-9c51-2f160a00c589'
)
UNION ALL
SELECT 'profiles remaining (should be 0)', COUNT(*)
FROM profiles WHERE id IN (
  'a0000001-0000-0000-0000-000000000001','a0000003-0000-0000-0000-000000000003',
  'a0000004-0000-0000-0000-000000000004','d631e70f-bf23-41b3-be6e-b004023c2d48',
  '5cb26aad-c23e-4958-945d-43e02d761586','8108cec3-45b0-4f26-aeec-632489a2e661',
  '9cc75555-75b6-4e97-a974-7960a3dc9cfd','725addf7-1cfc-4c93-9db2-0f2c76622244',
  '428c69e3-f8f1-4b93-a553-a39e8c162052'
)
UNION ALL
SELECT 'auth.users remaining (should be 0)', COUNT(*)
FROM auth.users WHERE id IN (
  'a0000001-0000-0000-0000-000000000001','a0000003-0000-0000-0000-000000000003',
  'a0000004-0000-0000-0000-000000000004','d631e70f-bf23-41b3-be6e-b004023c2d48',
  '5cb26aad-c23e-4958-945d-43e02d761586','8108cec3-45b0-4f26-aeec-632489a2e661',
  '9cc75555-75b6-4e97-a974-7960a3dc9cfd','725addf7-1cfc-4c93-9db2-0f2c76622244',
  '428c69e3-f8f1-4b93-a553-a39e8c162052'
);
