-- Migration 045: Fix bookings status CHECK constraint
-- Problem: The code uses status='pending_payment' (set in app/api/quotes/[id]/route.ts:222
-- when a customer accepts a quote) but the original CHECK constraint in migration 001
-- does not include 'pending_payment'. This causes a 23514 CHECK violation on booking
-- creation, making the entire quote-accept → booking flow fail in production.
--
-- Fix: Drop and recreate the constraint to include 'pending_payment'.

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
    CHECK (status IN (
      'pending',
      'pending_payment',
      'accepted',
      'rejected',
      'confirmed',
      'completed',
      'cancelled',
      'disputed'
    ));
