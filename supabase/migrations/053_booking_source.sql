-- Migration 053: Add booking_source attribution column to bookings
-- Additive only — no constraint changes to existing columns.
-- Default 'elbold_marketplace' ensures all existing rows remain correctly attributed.
-- booking_source is immutable after a booking is confirmed (enforced at application layer).

ALTER TABLE bookings
  ADD COLUMN booking_source TEXT NOT NULL DEFAULT 'elbold_marketplace'
    CHECK (booking_source IN (
      'elbold_marketplace',
      'instagram',
      'facebook',
      'tiktok',
      'whatsapp',
      'referral',
      'existing_customer',
      'direct',
      'other'
    ));

CREATE INDEX idx_bookings_booking_source ON bookings(booking_source);

-- Verify: all existing rows have the default applied.
-- SELECT COUNT(*) FROM bookings WHERE booking_source != 'elbold_marketplace';
-- Expected result: 0
