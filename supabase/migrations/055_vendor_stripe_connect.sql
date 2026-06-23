-- Migration 055: Stripe Connect columns on vendors
-- All columns nullable — existing rows are unaffected.
-- stripe_connect_requirements is intentionally excluded (stored in vendor_connect_onboarding only).

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_connect_status      TEXT
    CHECK (stripe_connect_status IN ('pending','restricted','active','disabled')),
  ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_connect_onboarded_at      TIMESTAMPTZ;

-- Index for webhook lookups: account.updated -> find vendor by acct_xxx
CREATE INDEX IF NOT EXISTS idx_vendors_connect_account_id
  ON vendors(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

-- Trigger: prevent authenticated users from changing stripe_connect_account_id once set.
-- Service role bypasses RLS and this trigger is SECURITY INVOKER — BUT we use auth.role()
-- which returns 'service_role' for admin client calls, 'authenticated' for user sessions.
CREATE OR REPLACE FUNCTION protect_connect_account_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only block if the value is actually changing AND was already set
  IF OLD.stripe_connect_account_id IS NOT NULL
    AND OLD.stripe_connect_account_id IS DISTINCT FROM NEW.stripe_connect_account_id
    AND auth.role() = 'authenticated' THEN
    RAISE EXCEPTION
      'stripe_connect_account_id cannot be modified by authenticated users after it is set. '
      'This field is managed by the ELBOLD payments system.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_connect_account_id ON vendors;
CREATE TRIGGER trg_protect_connect_account_id
  BEFORE UPDATE ON vendors
  FOR EACH ROW
  EXECUTE FUNCTION protect_connect_account_id();
