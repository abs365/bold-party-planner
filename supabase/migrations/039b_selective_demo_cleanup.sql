-- Migration 039B: Selective demo data cleanup
--
-- Pre-flight audit (scripts/audit-pre-039b.mjs) confirmed the following scope:
--
-- SUSPENDED (not deleted) — active real customer journeys detected:
--   Bennett Visuals      c7fabdd5-049b-4952-9606-de0a06cea3f6
--   Spice & Grace        1001cd97-7ab0-4cde-9044-41f10104fcd3
--   Charlotte DJ Svcs    85d1f72e-63f5-40f9-9ee3-f725813a01cc
--
--   Real customer preserved: lawloni4@gmail.com ("tossy")
--     - event:   b8ac3f4b-523c-4d40-91ba-a50af15f3e57  "20 years anniversary"
--     - booking: afa6429e-ab39-445f-8517-20a4fd837f69  (Bennett Visuals)
--     - booking: 593b55d8-135b-49df-b04a-13545c0d837b  (Spice & Grace)
--     - quote:   41af8508-afcb-49ff-803e-feba919ff9a7  (Bennett Visuals)
--     - quote:   cf89e84f-83cf-4592-9c30-430571516f46  (Spice & Grace)
--     - quote:   cc736b36-1f9c-43c3-93c3-2437a1a60eba  (Charlotte DJ)
--
-- DELETED — no real customer engagement:
--   sofia.martinez@elbold.demo  a0000002  -> Sofia Blooms (pending decorator)
--   marcus.thompson@elbold.demo a0000005  -> Marcus Events Decor (suspended decorator)
--   emily.carter@elbold.demo    b0000001  -> demo customer + 3 events + 2 bookings + 1 review + 2 quotes
--   oliver.webb@elbold.demo     b0000002  -> demo customer + 2 events + 1 booking  + 1 review + 1 quote
--   priya.singh@elbold.demo     b0000003  -> demo customer + 3 events + 1 booking  + 1 review + 2 quotes
--   admin@elbold.demo           c0000099  -> demo admin account (no vendor/events)
--
-- RETAINED (profile kept; vendor suspended; see T.L note below):
--   james.bennett@elbold.demo   a0000001  -> must stay as Bennett Visuals owner
--   ravi.patel@elbold.demo      a0000003  -> must stay as Spice & Grace owner
--   charlotte.hughes@elbold.demo a0000004 -> must stay as Charlotte DJ owner
--
-- T.L VENDOR (e77b7762-ccb5-4c62-a0ff-f1d065db178b):
--   A second vendor application ("T.L", other, Essex, pending) was submitted on
--   2026-06-01 through the james.bennett@elbold.demo demo account. This account
--   already had Bennett Visuals. T.L has no media, bookings, or reviews.
--   Root cause: likely manual testing of the vendor application flow reusing a
--   logged-in demo session. Since james.bennett's profile is retained for Bennett
--   Visuals, T.L is also retained. Admin action recommended: reject or delete T.L
--   via the Admin Vendor Management panel once tossy's journey is resolved.
--
-- CASCADE chain confirmed in 001_initial.sql:
--   auth.users -> profiles (CASCADE) -> vendors (CASCADE) ->
--   vendor_media, vendor_packages, vendor_verifications, vendor_availability (CASCADE)
--   events -> bookings -> payments, messages, disputes (CASCADE)
--   reviews (CASCADE from customer_id and vendor_id)
--   quotes (CASCADE from event_id and vendor_id)

DO $$
DECLARE
  -- Demo vendor profiles to RETAIN (owner of suspended vendors with live customer data)
  retain_profile_ids UUID[] := ARRAY[
    'a0000001-0000-0000-0000-000000000001'::UUID,  -- james.bennett@elbold.demo
    'a0000003-0000-0000-0000-000000000003'::UUID,  -- ravi.patel@elbold.demo
    'a0000004-0000-0000-0000-000000000004'::UUID   -- charlotte.hughes@elbold.demo
  ];

  -- Vendors to SUSPEND (not delete) — real customer tossy has active quotes/bookings
  suspend_vendor_ids UUID[] := ARRAY[
    'c7fabdd5-049b-4952-9606-de0a06cea3f6'::UUID,  -- Bennett Visuals
    '1001cd97-7ab0-4cde-9044-41f10104fcd3'::UUID,  -- Spice & Grace Catering
    '85d1f72e-63f5-40f9-9ee3-f725813a01cc'::UUID   -- Charlotte DJ Services
  ];

  -- Demo accounts safe to DELETE (pre-flight audit confirmed no real customer engagement)
  delete_profile_ids UUID[] := ARRAY[
    'a0000002-0000-0000-0000-000000000002'::UUID,  -- sofia.martinez@elbold.demo
    'a0000005-0000-0000-0000-000000000005'::UUID,  -- marcus.thompson@elbold.demo
    'b0000001-0000-0000-0000-000000000001'::UUID,  -- emily.carter@elbold.demo
    'b0000002-0000-0000-0000-000000000002'::UUID,  -- oliver.webb@elbold.demo
    'b0000003-0000-0000-0000-000000000003'::UUID,  -- priya.singh@elbold.demo
    'c0000099-0000-0000-0000-000000000099'::UUID   -- admin@elbold.demo
  ];

  v_vendor_count   INT;
  v_profile_count  INT;
  v_media_count    INT;
  v_event_count    INT;
  v_booking_count  INT;
  v_review_count   INT;
  v_quote_count    INT;

BEGIN

  -- ── Safety guard: abort if any retained account is in the delete list ─────────
  IF EXISTS (
    SELECT 1 FROM unnest(retain_profile_ids) AS r(id)
    WHERE r.id = ANY(delete_profile_ids)
  ) THEN
    RAISE EXCEPTION 'Safety violation: retain_profile_ids and delete_profile_ids overlap. Aborting.';
  END IF;

  -- ── Safety guard: abort if tossy's bookings would be affected ────────────────
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE id IN (
      'afa6429e-ab39-445f-8517-20a4fd837f69',
      '593b55d8-135b-49df-b04a-13545c0d837b'
    )
    AND customer_id = ANY(delete_profile_ids)
  ) THEN
    RAISE EXCEPTION 'Safety violation: tossy bookings are linked to a profile marked for deletion. Aborting.';
  END IF;

  -- ── STEP 1: Suspend the 3 vendors with active real customer journeys ──────────
  -- Suspended vendors are hidden from public browse (RLS: status = approved OR owner)
  -- Their data (media, packages, verifications) is fully preserved.
  UPDATE vendors
  SET status = 'suspended'
  WHERE id = ANY(suspend_vendor_ids)
    AND status != 'suspended';  -- idempotent

  GET DIAGNOSTICS v_vendor_count = ROW_COUNT;
  RAISE NOTICE 'Step 1: Suspended % vendor(s)', v_vendor_count;

  -- ── STEP 2: Count records about to be deleted (for the report) ───────────────
  SELECT COUNT(*) INTO v_media_count   FROM vendor_media  WHERE vendor_id IN (
    SELECT id FROM vendors WHERE user_id = ANY(delete_profile_ids)
  );
  SELECT COUNT(*) INTO v_event_count   FROM events   WHERE customer_id = ANY(delete_profile_ids);
  SELECT COUNT(*) INTO v_booking_count FROM bookings WHERE customer_id = ANY(delete_profile_ids);
  SELECT COUNT(*) INTO v_review_count  FROM reviews  WHERE customer_id = ANY(delete_profile_ids)
                                                        OR vendor_id IN (
                                                          SELECT id FROM vendors WHERE user_id = ANY(delete_profile_ids)
                                                        );
  SELECT COUNT(*) INTO v_quote_count   FROM quotes   WHERE event_id IN (
    SELECT id FROM events WHERE customer_id = ANY(delete_profile_ids)
  ) OR vendor_id IN (
    SELECT id FROM vendors WHERE user_id = ANY(delete_profile_ids)
  );

  -- ── STEP 3: Remove RESTRICT-FK rows that block auth.users deletion ───────────
  --
  -- Tables with ON DELETE RESTRICT (no clause = default RESTRICT) referencing
  -- auth.users(id) directly. Must be cleared before DELETE FROM auth.users.
  --
  -- Audited 2026-06-05 against delete_profile_ids:
  --   content_reports.reporter_id  NOT NULL RESTRICT  → 1 row (emily.carter)
  --   content_reports.resolved_by  nullable RESTRICT  → 0 rows (nullify for safety)
  --   vendor_media.moderated_by    nullable RESTRICT  → 0 rows (nullify for safety)
  --   platform_announcements.created_by nullable RESTRICT → 0 rows (nullify for safety)
  --   verification_activity_log.actor_id nullable RESTRICT → 0 rows (nullify for safety)
  --
  -- All CASCADE / SET NULL FKs are handled automatically by PostgreSQL.

  DELETE FROM content_reports
    WHERE reporter_id = ANY(delete_profile_ids);

  UPDATE content_reports
    SET resolved_by = NULL
    WHERE resolved_by = ANY(delete_profile_ids);

  UPDATE vendor_media
    SET moderated_by = NULL
    WHERE moderated_by = ANY(delete_profile_ids);

  UPDATE platform_announcements
    SET created_by = NULL
    WHERE created_by = ANY(delete_profile_ids);

  UPDATE verification_activity_log
    SET actor_id = NULL
    WHERE actor_id = ANY(delete_profile_ids);

  -- ── STEP 4: Clean auth infrastructure (some Supabase versions do not cascade) ─
  -- auth.identities.user_id     → uuid            (direct comparison OK)
  -- auth.sessions.user_id       → uuid            (direct comparison OK)
  -- auth.refresh_tokens.user_id → character varying (must cast UUIDs to text)
  DELETE FROM auth.identities WHERE user_id = ANY(delete_profile_ids);
  DELETE FROM auth.sessions   WHERE user_id = ANY(delete_profile_ids);
  DELETE FROM auth.refresh_tokens
    WHERE user_id = ANY(SELECT unnest(delete_profile_ids)::text);

  -- MFA factors (Supabase >= 2.x) — user_id is uuid
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'mfa_factors'
  ) THEN
    DELETE FROM auth.mfa_factors WHERE user_id = ANY(delete_profile_ids);
  END IF;

  -- Phone OTP codes (migration 038)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'phone_otp_codes'
  ) THEN
    DELETE FROM phone_otp_codes WHERE user_id = ANY(delete_profile_ids);
  END IF;

  -- Smart chat history
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'smart_chat_history'
  ) THEN
    DELETE FROM smart_chat_history WHERE user_id = ANY(delete_profile_ids);
  END IF;

  -- Push subscriptions
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'push_subscriptions'
  ) THEN
    DELETE FROM push_subscriptions WHERE user_id = ANY(delete_profile_ids);
  END IF;

  -- ── STEP 5: Delete demo accounts — cascades to all child data ────────────────
  -- auth.users -> profiles -> vendors -> vendor_media, vendor_packages,
  -- vendor_verifications, events, bookings, reviews, quotes, checklist_items, etc.
  DELETE FROM auth.users WHERE id = ANY(delete_profile_ids);
  GET DIAGNOSTICS v_profile_count = ROW_COUNT;

  -- ── STEP 6: Final report ─────────────────────────────────────────────────────
  RAISE NOTICE '=== Migration 039B Complete ===';
  RAISE NOTICE '';
  RAISE NOTICE 'SUSPENDED (data preserved, hidden from search):';
  RAISE NOTICE '  % vendor(s): Bennett Visuals, Spice & Grace, Charlotte DJ Services', v_vendor_count;
  RAISE NOTICE '';
  RAISE NOTICE 'DELETED:';
  RAISE NOTICE '  % auth.users / profiles', v_profile_count;
  RAISE NOTICE '  % vendor_media records', v_media_count;
  RAISE NOTICE '  % events', v_event_count;
  RAISE NOTICE '  % bookings', v_booking_count;
  RAISE NOTICE '  % reviews', v_review_count;
  RAISE NOTICE '  % quotes', v_quote_count;
  RAISE NOTICE '  Vendors deleted via cascade: Sofia Blooms, Marcus Events Decor';
  RAISE NOTICE '';
  RAISE NOTICE 'RETAINED:';
  RAISE NOTICE '  3 demo vendor profiles (james.bennett, ravi.patel, charlotte.hughes)';
  RAISE NOTICE '  9 media records for suspended vendors';
  RAISE NOTICE '  2 bookings for lawloni4@gmail.com (tossy)';
  RAISE NOTICE '  3 quotes for lawloni4@gmail.com (tossy)';
  RAISE NOTICE '  1 real event: "20 years anniversary" (b8ac3f4b-...)';
  RAISE NOTICE '';
  RAISE NOTICE 'CUSTOMER JOURNEYS PRESERVED:';
  RAISE NOTICE '  lawloni4@gmail.com (tossy) - all active quotes and bookings intact';
  RAISE NOTICE '';
  RAISE NOTICE 'T.L VENDOR ACTION REQUIRED:';
  RAISE NOTICE '  Vendor "T.L" (e77b7762) linked to james.bennett@elbold.demo was retained.';
  RAISE NOTICE '  It has no media/bookings/reviews. Admin should reject/delete via panel.';
  RAISE NOTICE '  Root cause: vendor apply flow tested using an active demo session.';

END $$;
