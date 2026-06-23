-- Migration 056: vendor_connect_onboarding
-- One row per onboarding attempt. A vendor may abandon and restart; each gets a new row.
-- The most recent row for a vendor_id represents the current onboarding state.

CREATE TABLE IF NOT EXISTS vendor_connect_onboarding (
  id                        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id                 UUID        NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  stripe_account_id         TEXT        NOT NULL,   -- mirrors vendors.stripe_connect_account_id
  onboarding_url            TEXT,                   -- Stripe AccountLink URL, expires in 5 minutes
  onboarding_url_expires_at TIMESTAMPTZ,
  refresh_url               TEXT        NOT NULL,   -- ELBOLD URL for expired link recovery
  return_url                TEXT        NOT NULL,   -- ELBOLD URL after onboarding completion
  status                    TEXT        NOT NULL DEFAULT 'created'
    CHECK (status IN ('created','link_generated','submitted','completed','failed')),
  requirements              JSONB,                  -- Stripe account.requirements snapshot (sensitive)
  failure_reason            TEXT,                   -- populated if status = 'failed'
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connect_onboarding_vendor_id
  ON vendor_connect_onboarding(vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connect_onboarding_stripe_account
  ON vendor_connect_onboarding(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_connect_onboarding_status
  ON vendor_connect_onboarding(status)
  WHERE status NOT IN ('completed','failed');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_connect_onboarding_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_connect_onboarding_updated_at
  BEFORE UPDATE ON vendor_connect_onboarding
  FOR EACH ROW EXECUTE FUNCTION update_connect_onboarding_updated_at();

-- RLS
ALTER TABLE vendor_connect_onboarding ENABLE ROW LEVEL SECURITY;

-- Vendor reads own onboarding records only
CREATE POLICY "connect_onboarding_vendor_select"
  ON vendor_connect_onboarding FOR SELECT
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );

-- No INSERT/UPDATE/DELETE policy for authenticated role.
-- All writes go through createAdminClient() (service role), which bypasses RLS.

-- Grants
GRANT SELECT ON vendor_connect_onboarding TO authenticated;
GRANT ALL    ON vendor_connect_onboarding TO service_role;

NOTIFY pgrst, 'reload schema';
