-- ── Migration 024: Subscription Infrastructure ───────────────────────────────
-- Adds subscription_plans (source of truth), extends vendor_subscriptions,
-- adds subscription_billing_events audit table, extends plan check constraints.

-- ── 1. subscription_plans — plan config source of truth ─────────────────────

CREATE TABLE IF NOT EXISTS subscription_plans (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  monthly_price    NUMERIC(10,2) NOT NULL DEFAULT 0,
  annual_price     NUMERIC(10,2) NOT NULL DEFAULT 0,
  features_json    JSONB NOT NULL DEFAULT '{}',
  visibility_boost INTEGER NOT NULL DEFAULT 0,  -- sort boost in marketplace ranking
  max_images       INTEGER NOT NULL DEFAULT 5,  -- -1 = unlimited
  max_packages     INTEGER NOT NULL DEFAULT 1,  -- -1 = unlimited
  analytics_tier   TEXT NOT NULL DEFAULT 'basic' CHECK (analytics_tier IN ('basic','standard','advanced')),
  featured_eligible          BOOLEAN NOT NULL DEFAULT FALSE,  -- can appear on homepage
  category_featured_eligible BOOLEAN NOT NULL DEFAULT FALSE,  -- can appear at top of category pages
  priority_support BOOLEAN NOT NULL DEFAULT FALSE,
  active           BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Seed plans ─────────────────────────────────────────────────────────────

INSERT INTO subscription_plans (slug, name, monthly_price, annual_price, visibility_boost, max_images, max_packages, analytics_tier, featured_eligible, category_featured_eligible, priority_support, sort_order, features_json) VALUES
(
  'free', 'Free', 0, 0, 0, 5, 1, 'basic', FALSE, FALSE, FALSE, 0,
  '{"tagline":"Get started at no cost","highlights":["Basic vendor profile","5 portfolio photos","1 service package","Standard search listing","Quote requests"]}'
),
(
  'pro', 'Pro', 29, 279, 3, 20, -1, 'standard', FALSE, FALSE, FALSE, 1,
  '{"tagline":"Grow your bookings","highlights":["Everything in Free","20 portfolio photos & videos","Unlimited service packages","Full analytics dashboard","+3 search ranking boost","Smart lead boosts","Pro badge on profile","Booking performance insights"]}'
),
(
  'premium', 'Premium', 79, 759, 6, 50, -1, 'advanced', TRUE, TRUE, FALSE, 2,
  '{"tagline":"Maximum visibility","highlights":["Everything in Pro","50 portfolio photos & videos","Featured listing on category pages","Homepage featured eligibility","Advanced analytics & insights","+6 search ranking boost","Premium badge on profile","Reputation trend reports"]}'
),
(
  'elite', 'Elite', 149, 1428, 10, -1, -1, 'advanced', TRUE, TRUE, TRUE, 3,
  '{"tagline":"Dominate your market","highlights":["Everything in Premium","Unlimited portfolio media","Homepage featured showcase","Maximum +10 search ranking boost","Business intelligence dashboard","Priority customer support","Quarterly business review","Custom profile enhancements"]}'
)
ON CONFLICT (slug) DO NOTHING;

-- ── 3. Extend vendor_subscriptions ───────────────────────────────────────────

ALTER TABLE vendor_subscriptions
  ADD COLUMN IF NOT EXISTS plan_id            UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS billing_cycle      TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
  ADD COLUMN IF NOT EXISTS stripe_price_id    TEXT,
  ADD COLUMN IF NOT EXISTS trial_ends_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER NOT NULL DEFAULT 0;

-- Backfill plan_id for existing rows
UPDATE vendor_subscriptions vs
SET plan_id = sp.id
FROM subscription_plans sp
WHERE sp.slug = vs.plan
  AND vs.plan_id IS NULL;

-- Extend plan check constraint to include premium + elite
ALTER TABLE vendor_subscriptions
  DROP CONSTRAINT IF EXISTS vendor_subscriptions_plan_check;
ALTER TABLE vendor_subscriptions
  ADD CONSTRAINT vendor_subscriptions_plan_check
  CHECK (plan IN ('free', 'pro', 'featured', 'premium', 'elite'));

-- ── 4. Extend vendors.subscription_plan check constraint ──────────────────────

ALTER TABLE vendors
  DROP CONSTRAINT IF EXISTS vendors_subscription_plan_check;
ALTER TABLE vendors
  ADD CONSTRAINT vendors_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'pro', 'featured', 'premium', 'elite'));

-- ── 5. subscription_billing_events — immutable audit log ─────────────────────

CREATE TABLE IF NOT EXISTS subscription_billing_events (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id              UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  vendor_subscription_id UUID REFERENCES vendor_subscriptions(id) ON DELETE SET NULL,
  stripe_event_id        TEXT,
  event_type             TEXT NOT NULL,
  plan_slug              TEXT,
  billing_cycle          TEXT,
  amount_gbp             NUMERIC(10,2),
  currency               TEXT DEFAULT 'gbp',
  stripe_invoice_id      TEXT,
  stripe_charge_id       TEXT,
  failure_reason         TEXT,
  metadata               JSONB DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_vendor
  ON subscription_billing_events (vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_events_type
  ON subscription_billing_events (event_type, created_at DESC);

-- ── 6. Indexes for subscription queries ──────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vendor_subs_plan
  ON vendor_subscriptions (plan, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_vendor_subs_expires
  ON vendor_subscriptions (current_period_end)
  WHERE status IN ('active', 'trialing');

CREATE INDEX IF NOT EXISTS idx_sub_plans_active
  ON subscription_plans (sort_order)
  WHERE active = TRUE;

-- ── 7. RLS for new tables ─────────────────────────────────────────────────────

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_subscription_plans"
  ON subscription_plans FOR SELECT USING (active = TRUE);
CREATE POLICY "service_full_access_plans"
  ON subscription_plans FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE subscription_billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendor_read_own_billing_events"
  ON subscription_billing_events FOR SELECT TO authenticated
  USING (
    vendor_id IN (SELECT id FROM vendors WHERE user_id = auth.uid())
  );
CREATE POLICY "service_full_access_billing_events"
  ON subscription_billing_events FOR ALL TO service_role USING (TRUE) WITH CHECK (TRUE);

-- ── 8. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT ON subscription_plans             TO authenticated;
GRANT SELECT ON subscription_billing_events    TO authenticated;
GRANT ALL    ON subscription_plans             TO service_role;
GRANT ALL    ON subscription_billing_events    TO service_role;

-- ── 9. Updated timestamp trigger ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_subscription_plans_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_subscription_plans_updated_at();
