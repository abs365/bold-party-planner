-- Migration 019: Force-cleanup corrupted demo auth rows (full dependency-safe version)
--
-- Problem: auth rows contain invalid bcrypt hashes from direct seed inserts. GoTrue
-- cannot parse them (deleteUser → "Database error loading user"), so direct SQL is
-- required. Earlier attempt failed because DELETE FROM auth.users cascaded to profiles,
-- which was blocked by bookings.customer_id FK (NO CASCADE).
--
-- Strategy: walk the entire FK graph for demo users, deleting/nulling in strict
-- leaf-to-root order so every constraint is satisfied before the parent row is touched.
--
-- Runs as the postgres role. NO session_replication_role. Plain DELETEs only.
-- Tables from migrations 011-016 may not exist in all environments — those blocks
-- use EXCEPTION WHEN undefined_table so the script never aborts on a missing table.
--
-- APPLY ONCE in Supabase Dashboard → SQL Editor.
-- After success: POST /api/auth/create-demo-users, then re-run seed.sql.

DO $$
DECLARE
  v_user_ids    uuid[];   -- demo auth.users.id values
  v_vendor_ids  uuid[];   -- vendors.id where user_id ∈ v_user_ids
  v_event_ids   uuid[];   -- events.id where customer_id ∈ v_user_ids
  v_booking_ids uuid[];   -- bookings.id where customer or vendor is demo
  v_count       integer;
BEGIN

  -- ── Collect demo IDs ────────────────────────────────────────────────────────
  SELECT array_agg(id) INTO v_user_ids
  FROM auth.users WHERE email LIKE '%@boldparty.demo';

  IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
    RAISE NOTICE '[019] No demo rows found in auth.users — already clean.';
    RETURN;
  END IF;

  SELECT array_agg(id) INTO v_vendor_ids
  FROM vendors WHERE user_id = ANY(v_user_ids);

  SELECT array_agg(id) INTO v_event_ids
  FROM events WHERE customer_id = ANY(v_user_ids);

  SELECT array_agg(id) INTO v_booking_ids
  FROM bookings
  WHERE customer_id = ANY(v_user_ids)
     OR (v_vendor_ids IS NOT NULL AND vendor_id = ANY(v_vendor_ids));

  RAISE NOTICE '[019] demo users=%, vendors=%, events=%, bookings=%',
    array_length(v_user_ids,1),
    COALESCE(array_length(v_vendor_ids,1),0),
    COALESCE(array_length(v_event_ids,1),0),
    COALESCE(array_length(v_booking_ids,1),0);


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 1 — Break FK blockers on bookings (disputes has booking_id NO CASCADE)
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_booking_ids IS NOT NULL THEN
    DELETE FROM disputes WHERE booking_id = ANY(v_booking_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] disputes (booking_id)    deleted: %', v_count;
  END IF;

  -- raised_by / resolved_by → profiles NO CASCADE (also catch non-booking disputes)
  DELETE FROM disputes
  WHERE raised_by = ANY(v_user_ids) OR resolved_by = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] disputes (by user_id)    deleted: %', v_count;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 2 — Delete bookings (cascades: contracts, payments, reviews, invoices)
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_booking_ids IS NOT NULL THEN
    DELETE FROM bookings WHERE id = ANY(v_booking_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] bookings                 deleted: % (→ contracts/payments/reviews/invoices cascade)', v_count;
  END IF;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 3 — Events and event-linked data
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_event_ids IS NOT NULL THEN
    DELETE FROM checklist_progress WHERE event_id = ANY(v_event_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] checklist_progress       deleted: %', v_count;
  END IF;

  DELETE FROM events WHERE customer_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] events                   deleted: %', v_count;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 4 — Quotes and quote sub-tables
  -- (CASCADE from profiles + vendors, but explicit before profile delete)
  -- ════════════════════════════════════════════════════════════════════════════

  DELETE FROM quotes WHERE customer_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] quotes (customer)        deleted: %', v_count;

  IF v_vendor_ids IS NOT NULL THEN
    DELETE FROM quotes WHERE vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] quotes (vendor)          deleted: %', v_count;
  END IF;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 5 — Messaging
  -- ════════════════════════════════════════════════════════════════════════════

  -- messages.sender_id → profiles CASCADE; thread_id → message_threads CASCADE
  -- Delete messages first so message_threads delete doesn't leave orphaned messages
  BEGIN
    DELETE FROM messages WHERE sender_id = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] messages                 deleted: %', v_count;

    DELETE FROM message_threads WHERE customer_id = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] message_threads (cust)   deleted: %', v_count;

    IF v_vendor_ids IS NOT NULL THEN
      DELETE FROM message_threads WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] message_threads (vendor) deleted: %', v_count;
    END IF;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[019] messages/message_threads not found — skipped';
  END;

  BEGIN
    DELETE FROM smart_chat_history WHERE user_id = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] smart_chat_history       deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[019] smart_chat_history not found — skipped';
  END;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 6 — Saved vendors and invitations (migration 011)
  -- ════════════════════════════════════════════════════════════════════════════

  BEGIN
    DELETE FROM saved_vendors WHERE customer_id = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] saved_vendors            deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[019] saved_vendors not found — skipped';
  END;

  BEGIN
    DELETE FROM event_invitations WHERE sender_id = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] event_invitations        deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[019] event_invitations not found — skipped';
  END;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 7 — Notifications (CASCADE from profiles, but explicit)
  -- ════════════════════════════════════════════════════════════════════════════

  DELETE FROM notifications WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] notifications            deleted: %', v_count;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 8 — Vendor sub-tables (all CASCADE from vendors; explicit for safety)
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_vendor_ids IS NOT NULL THEN

    -- admin_alerts (migration 016)
    BEGIN
      DELETE FROM admin_alerts WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] admin_alerts             deleted: %', v_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE '[019] admin_alerts not found — skipped';
    END;

    -- verification sub-tables (migration 013)
    BEGIN
      DELETE FROM verification_documents   WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] verification_documents   deleted: %', v_count;

      DELETE FROM verification_activity_log WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] verification_activity_log deleted: %', v_count;

      DELETE FROM vendor_verifications WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] vendor_verifications     deleted: %', v_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE '[019] vendor_verifications tables not found — skipped';
    END;

    -- lead_routing_log (migration 011)
    BEGIN
      DELETE FROM lead_routing_log WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] lead_routing_log         deleted: %', v_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE '[019] lead_routing_log not found — skipped';
    END;

    DELETE FROM vendor_payouts       WHERE vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendor_payouts           deleted: %', v_count;

    BEGIN
      DELETE FROM payout_requests WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] payout_requests          deleted: %', v_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE '[019] payout_requests not found — skipped';
    END;

    BEGIN
      DELETE FROM vendor_subscriptions WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] vendor_subscriptions     deleted: %', v_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE '[019] vendor_subscriptions not found — skipped';
    END;

    BEGIN
      DELETE FROM vendor_analytics WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] vendor_analytics         deleted: %', v_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE '[019] vendor_analytics not found — skipped';
    END;

    BEGIN
      DELETE FROM vendor_daily_stats WHERE vendor_id = ANY(v_vendor_ids);
      GET DIAGNOSTICS v_count = ROW_COUNT;
      RAISE NOTICE '[019] vendor_daily_stats       deleted: %', v_count;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE '[019] vendor_daily_stats not found — skipped';
    END;

    DELETE FROM vendor_onboarding    WHERE vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendor_onboarding        deleted: %', v_count;

    DELETE FROM vendor_availability  WHERE vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendor_availability      deleted: %', v_count;

    DELETE FROM vendor_packages      WHERE vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendor_packages          deleted: %', v_count;

    DELETE FROM vendor_media         WHERE vendor_id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendor_media             deleted: %', v_count;

    DELETE FROM vendors WHERE id = ANY(v_vendor_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendors                  deleted: %', v_count;

  END IF;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 9 — NULL out auth.users FKs on non-demo rows
  -- (content_reports, platform_announcements, vendor_media.moderated_by may
  --  reference demo user IDs from other vendors' data — must be cleared before
  --  auth.users deletion, migration 012 tables)
  -- ════════════════════════════════════════════════════════════════════════════

  BEGIN
    -- vendor_media for non-demo vendors moderated by a demo user
    UPDATE vendor_media SET moderated_by = NULL
    WHERE moderated_by = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendor_media moderated_by nulled: %', v_count;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    RAISE NOTICE '[019] vendor_media.moderated_by not applicable — skipped';
  END;

  BEGIN
    UPDATE platform_announcements SET created_by = NULL
    WHERE created_by = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] platform_announcements created_by nulled: %', v_count;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    RAISE NOTICE '[019] platform_announcements.created_by not applicable — skipped';
  END;

  BEGIN
    DELETE FROM content_reports
    WHERE reporter_id = ANY(v_user_ids) OR resolved_by = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] content_reports          deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[019] content_reports not found — skipped';
  END;

  -- verification_activity_log rows where actor is a demo user but vendor is not demo
  BEGIN
    UPDATE verification_activity_log SET actor_id = NULL
    WHERE actor_id = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] verification_activity_log actor_id nulled: %', v_count;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    RAISE NOTICE '[019] verification_activity_log.actor_id not applicable — skipped';
  END;

  -- vendor_verifications.reviewer_id → profiles NO CASCADE
  -- NULL it for any remaining rows (non-demo vendors reviewed by demo admin)
  BEGIN
    UPDATE vendor_verifications SET reviewer_id = NULL
    WHERE reviewer_id = ANY(v_user_ids);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] vendor_verifications reviewer_id nulled: %', v_count;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    RAISE NOTICE '[019] vendor_verifications.reviewer_id not applicable — skipped';
  END;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 10 — Profiles
  -- ════════════════════════════════════════════════════════════════════════════

  DELETE FROM profiles WHERE id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] profiles                 deleted: %', v_count;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 11 — Auth sub-tables (delete before auth.users to avoid FK issues)
  -- ════════════════════════════════════════════════════════════════════════════

  DELETE FROM auth.mfa_amr_claims
  WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = ANY(v_user_ids));
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] auth.mfa_amr_claims      deleted: %', v_count;

  DELETE FROM auth.sessions WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] auth.sessions            deleted: %', v_count;

  -- user_id is VARCHAR in auth.refresh_tokens — cast to uuid for comparison
  DELETE FROM auth.refresh_tokens WHERE user_id::uuid = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] auth.refresh_tokens      deleted: %', v_count;

  DELETE FROM auth.mfa_factors WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] auth.mfa_factors         deleted: %', v_count;

  DELETE FROM auth.identities WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] auth.identities          deleted: %', v_count;

  -- user_id type varies by GoTrue version — cast both sides to text
  BEGIN
    DELETE FROM auth.one_time_tokens WHERE user_id::text = ANY(v_user_ids::text[]);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] auth.one_time_tokens    deleted: %', v_count;
  EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE '[019] auth.one_time_tokens not present — skipped';
  END;

  -- actor_id is text/varchar — cast array to text[]
  BEGIN
    DELETE FROM auth.audit_log_entries WHERE actor_id = ANY(v_user_ids::text[]);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] auth.audit_log_entries  deleted: %', v_count;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    RAISE NOTICE '[019] auth.audit_log_entries skipped';
  END;

  -- user_id type varies by GoTrue version
  BEGIN
    DELETE FROM auth.flow_state WHERE user_id::text = ANY(v_user_ids::text[]);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '[019] auth.flow_state         deleted: %', v_count;
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    RAISE NOTICE '[019] auth.flow_state skipped';
  END;


  -- ════════════════════════════════════════════════════════════════════════════
  -- PHASE 12 — auth.users (everything that referenced it is gone)
  -- ════════════════════════════════════════════════════════════════════════════

  DELETE FROM auth.users WHERE id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '[019] auth.users               deleted: %', v_count;

  RAISE NOTICE '[019] Done. Run POST /api/auth/create-demo-users then seed.sql.';

END;
$$;


-- ── Verification: all counts must be 0 ─────────────────────────────────────
SELECT 'auth.users'        AS table_name, COUNT(*) AS remaining_demo_rows
FROM auth.users WHERE email LIKE '%@boldparty.demo'
UNION ALL
SELECT 'auth.identities',    COUNT(*)
FROM auth.identities WHERE identity_data->>'email' LIKE '%@boldparty.demo'
UNION ALL
SELECT 'auth.refresh_tokens (orphaned)', COUNT(*)
FROM auth.refresh_tokens WHERE user_id::uuid NOT IN (SELECT id FROM auth.users)
UNION ALL
SELECT 'profiles',           COUNT(*)
FROM profiles WHERE email LIKE '%@boldparty.demo'
UNION ALL
SELECT 'vendors',            COUNT(*)
FROM vendors WHERE user_id NOT IN (SELECT id FROM profiles)
UNION ALL
SELECT 'bookings (orphaned)', COUNT(*)
FROM bookings WHERE customer_id NOT IN (SELECT id FROM profiles);
