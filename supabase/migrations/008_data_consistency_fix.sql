-- ═══════════════════════════════════════════════════════
-- Migration 008: Data Consistency Fix
-- ═══════════════════════════════════════════════════════
--
-- Root cause: seed.sql (pre-fix) inserted vendor_media rows with type = 'photo'
-- and events rows with status = 'active'. Both values violate the CHECK constraints
-- defined in 001_initial.sql. This migration normalises any such rows that may
-- have been inserted before the seed file was corrected.
--
-- The DB schema (CHECK constraints, TypeScript types, Zod schemas, and API code)
-- were all already consistent — only the seed file was wrong.
--
-- Safe to run on production: UPDATE … WHERE … is idempotent; if no rows match
-- the old invalid values nothing changes.
-- ═══════════════════════════════════════════════════════

-- ── Fix 1: vendor_media.type ─────────────────────────────────────────────────
-- DB constraint (001_initial.sql): CHECK (type IN ('image', 'video'))
-- Seed bug: used 'photo' instead of 'image'.
-- Normalise any 'photo' rows to 'image'; catch any other non-standard values too.

UPDATE vendor_media
SET    type = 'image'
WHERE  type NOT IN ('image', 'video');

-- ── Fix 2: events.status ─────────────────────────────────────────────────────
-- DB constraint (001_initial.sql):
--   CHECK (status IN ('draft','planning','confirmed','completed','cancelled'))
-- Seed bug: used 'active' which is not a valid value.
-- Map 'active' → 'planning' (closest semantic equivalent).

UPDATE events
SET    status = 'planning'
WHERE  status = 'active';

-- ── Audit comment ─────────────────────────────────────────────────────────────
-- No schema changes required — constraints were correct from migration 001.
-- All enum definitions are already synchronised:
--
--   Table              Column          Allowed values                            Source
--   vendor_media       type            image, video                              001_initial.sql
--   vendors            status          pending, approved, rejected, suspended    001_initial.sql
--   events             status          draft, planning, confirmed, completed,    001_initial.sql
--                                      cancelled
--   bookings           status          pending, accepted, rejected, confirmed,   001_initial.sql
--                                      completed, cancelled, disputed
--   bookings           payment_status  pending, deposit_paid, fully_paid,        001_initial.sql
--                                      refunded, partially_refunded, failed
--   payments           type            deposit, full, refund                     001_initial.sql
--   payments           status          pending, succeeded, failed, cancelled     001_initial.sql
--   quotes             status          pending, responded, accepted, declined,   003_phase3.sql
--                                      expired, converted
--   quote_responses    status          pending, accepted, declined               003_phase3.sql
--   contracts          status          pending, customer_signed, both_signed,    003_phase3.sql
--                                      declined
--   vendor_subscriptions plan          free, pro, featured                       004_phase4.sql
--   vendor_subscriptions status        active, cancelled, past_due, trialing     004_phase4.sql
--   notifications      type            booking, payment, review, reminder,       001_initial.sql
--                                      system
--   notifications      priority        low, normal, high, urgent                 004_phase4.sql
--   disputes           status          open, investigating, resolved, closed     001_initial.sql
--   disputes           refund_status   pending, approved, denied, processed      003_phase3.sql
--   vendor_verifications type          identity, business, insurance, portfolio  004_phase4.sql
--   vendor_verifications status        pending, approved, rejected,              004_phase4.sql
--                                      not_submitted
--   guests             rsvp_status     pending, accepted, declined, tentative    005_phase5.sql
--   invitations        template        classic, elegant, playful, minimal,       005_phase5.sql
--                                      luxury
--   rsvp_responses     status          accepted, declined, tentative             005_phase5.sql
--   platform_announcements type        info, success, warning, promotion         006_phase6.sql
--   error_logs         level           info, warn, error, critical               007_phase7.sql
--   payout_requests    status          pending, processing, paid, rejected       007_phase7.sql
