-- Migration 059: vendors.lifecycle_state -- add Connect states

ALTER TABLE vendors
  DROP CONSTRAINT IF EXISTS vendors_lifecycle_state_check;

ALTER TABLE vendors
  ADD CONSTRAINT vendors_lifecycle_state_check
  CHECK (lifecycle_state IN (
    -- existing
    'applied',
    'under_review',
    'approved',
    'profile_setup',
    'verified',
    'live',
    'rejected',
    'suspended',
    -- Phase 70B
    'connect_pending',   -- Connect onboarding initiated, not complete
    'payout_ready'       -- Connect active, payouts enabled
  ));
