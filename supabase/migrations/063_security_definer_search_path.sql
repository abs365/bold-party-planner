-- ── Migration 063: P1b — SECURITY DEFINER search_path hardening ──────────────
-- Phase 70D.5D — Security Remediation
-- Date: 2026-06-24
-- Risk: Low — function bodies identical to current live versions
-- Route impact: None (Option A — search_path only; no REVOKE, no route changes)
--
-- Finding addressed:
--   SDF-001/SDF-002 (HIGH) — 8 SECURITY DEFINER functions without SET search_path.
--   Without an explicit search_path, the function inherits the caller's search_path,
--   opening a path for schema injection attacks.
--
-- Functions already correctly hardened (NOT included here):
--   handle_new_user()       — migration 020: SET search_path = public, auth ✓
--   update_vendor_rating()  — migration 054: SET search_path = public ✓
--
-- Each function body below is reproduced verbatim from its canonical migration source.

-- ── 1. notify_user ────────────────────────────────────────────────────────────
-- Source: 001_initial.sql
-- Called by: bookings, reviews, quotes, cron/reminders, webhook routes via supabase.rpc()
-- Risk note: publicly callable via PostgREST RPC by any authenticated user.
--   SET search_path prevents schema injection. Full RPC access redesign is deferred
--   to a future phase (Option B, not approved for 70D.5D).

CREATE OR REPLACE FUNCTION notify_user(
  p_user_id UUID,
  p_title   TEXT,
  p_message TEXT,
  p_type    TEXT,
  p_link    TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$;

-- ── 2. increment_vendor_profile_views ─────────────────────────────────────────
-- Source: 004_phase4.sql
-- Called by: app/api/vendor/track-view/route.ts via createAdminClient() (service role)
-- Risk note: publicly callable via PostgREST RPC by any authenticated user.

CREATE OR REPLACE FUNCTION increment_vendor_profile_views(p_vendor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendors SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = p_vendor_id;
  INSERT INTO vendor_analytics (vendor_id, event_type) VALUES (p_vendor_id, 'profile_view');
END;
$$;

-- ── 3. seed_checklist_from_plan ───────────────────────────────────────────────
-- Source: 036_fix_checklist_trigger.sql (canonical — replaces 002 version)
-- Called by: trigger seed_checklist_on_event AFTER INSERT OR UPDATE OF ai_plan ON events

CREATE OR REPLACE FUNCTION seed_checklist_from_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cat    JSONB;
  v_item TEXT;
BEGIN
  IF NEW.ai_plan IS NOT NULL AND NEW.ai_plan->'checklist' IS NOT NULL THEN
    FOR cat IN SELECT * FROM jsonb_array_elements(NEW.ai_plan->'checklist') LOOP
      FOR v_item IN SELECT * FROM jsonb_array_elements_text(cat->'items') LOOP
        INSERT INTO checklist_progress (event_id, category, item, completed)
        VALUES (NEW.id, cat->>'category', v_item, FALSE)
        ON CONFLICT (event_id, category, item) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 4. auto_create_payout ─────────────────────────────────────────────────────
-- Source: 002_phase2.sql
-- Called by: trigger auto_payout_on_payment AFTER UPDATE ON bookings

CREATE OR REPLACE FUNCTION auto_create_payout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.payment_status = 'fully_paid' AND OLD.payment_status != 'fully_paid' THEN
    INSERT INTO vendor_payouts (vendor_id, booking_id, amount, status)
    VALUES (NEW.vendor_id, NEW.id, NEW.vendor_payout, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 5. check_review_allowed ───────────────────────────────────────────────────
-- Source: 002_phase2.sql
-- Called by: trigger enforce_review_rules BEFORE INSERT ON reviews

CREATE OR REPLACE FUNCTION check_review_allowed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE id = NEW.booking_id
      AND customer_id = NEW.customer_id
      AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Reviews can only be submitted after the booking is completed';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 6. auto_create_contract ───────────────────────────────────────────────────
-- Source: 003_phase3.sql
-- Called by: trigger create_contract_on_accept AFTER UPDATE ON bookings
-- Note: condition includes (OLD.status IS NULL OR ...) to handle initial insert path

CREATE OR REPLACE FUNCTION auto_create_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    INSERT INTO contracts (
      booking_id, customer_id, vendor_id, terms, cancellation_policy, refund_policy
    )
    VALUES (
      NEW.id,
      NEW.customer_id,
      NEW.vendor_id,
      'This booking agreement is between the customer and the vendor listed above. The vendor agrees to provide the services described in the selected package on the agreed event date. The customer agrees to make payment as per the agreed schedule: 30% deposit to confirm, 70% balance due 7 days before the event.',
      'Cancellations made 14 or more days before the event: 100% deposit refund. Cancellations 7-13 days before the event: 50% deposit refund. Cancellations fewer than 7 days before the event: deposit is non-refundable. Cancellations on the day: full invoice amount may be charged.',
      'Refunds are processed within 5-10 business days after approval. Platform commission (10%) is non-refundable in all cases. Refund requests must be submitted within 48 hours of the event. Disputes must be raised through the platform dispute system.'
    )
    ON CONFLICT (booking_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 7. mark_quote_converted ───────────────────────────────────────────────────
-- Source: 003_phase3.sql
-- Called by: trigger quote_converted_trigger AFTER UPDATE OF converted_booking_id ON quotes

CREATE OR REPLACE FUNCTION mark_quote_converted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.converted_booking_id IS NOT NULL THEN
    UPDATE quotes SET status = 'converted' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- ── 8. expire_old_quotes ──────────────────────────────────────────────────────
-- Source: 003_phase3.sql
-- Called by: cron job or admin route (RETURNS void, not a trigger function)

CREATE OR REPLACE FUNCTION expire_old_quotes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE quotes
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$;

NOTIFY pgrst, 'reload schema';
