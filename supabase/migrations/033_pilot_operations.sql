-- Migration 033: Pilot Vendor Programme operations
-- pilot_vendors: lightweight CRM for pre-registration outreach tracking
-- pilot_feedback: vendor and customer satisfaction feedback
-- Apply in Supabase Dashboard -> SQL Editor

-- ── 1. Pilot Vendor CRM ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pilot_vendors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name     TEXT NOT NULL,
  category          TEXT,
  contact_name      TEXT,
  phone             TEXT,
  email             TEXT,
  instagram         TEXT,
  facebook          TEXT,
  website           TEXT,
  acquisition_source TEXT,   -- instagram_dm | email | referral | cold_call | event | other
  status            TEXT NOT NULL DEFAULT 'prospect'
    CHECK (status IN (
      'prospect',    -- identified but not contacted
      'contacted',   -- outreach sent
      'interested',  -- responded positively
      'registered',  -- signed up on platform
      'approved',    -- admin approved vendor profile
      'verified',    -- Level 2+ document verification
      'active',      -- has received or submitted a quote
      'lost'         -- declined or unresponsive
    )),
  notes             TEXT,
  vendor_id         UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  contacted_at      TIMESTAMPTZ,
  registered_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pilot_vendors_status_idx ON public.pilot_vendors(status);
CREATE INDEX IF NOT EXISTS pilot_vendors_category_idx ON public.pilot_vendors(category);
CREATE INDEX IF NOT EXISTS pilot_vendors_vendor_id_idx ON public.pilot_vendors(vendor_id);

-- Admin-only via service role — no RLS policies needed (createAdminClient bypasses RLS)
ALTER TABLE public.pilot_vendors ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_pilot_vendor_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pilot_vendors_updated_at ON public.pilot_vendors;
CREATE TRIGGER pilot_vendors_updated_at
  BEFORE UPDATE ON public.pilot_vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_pilot_vendor_updated_at();


-- ── 2. Pilot Feedback ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pilot_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('vendor', 'customer')),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Vendor questions (1-5 scale)
  q_onboarding     SMALLINT CHECK (q_onboarding BETWEEN 1 AND 5),
  q_verification   SMALLINT CHECK (q_verification BETWEEN 1 AND 5),
  q_quoting        SMALLINT CHECK (q_quoting BETWEEN 1 AND 5),
  q_recommend      SMALLINT CHECK (q_recommend BETWEEN 1 AND 5),
  missing_features TEXT,

  -- Customer questions (1-5 scale)
  q_finding_vendors SMALLINT CHECK (q_finding_vendors BETWEEN 1 AND 5),
  q_requesting      SMALLINT CHECK (q_requesting BETWEEN 1 AND 5),
  q_comparing       SMALLINT CHECK (q_comparing BETWEEN 1 AND 5),
  q_trust           SMALLINT CHECK (q_trust BETWEEN 1 AND 5),
  q_use_again       SMALLINT CHECK (q_use_again BETWEEN 1 AND 5),

  additional_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS pilot_feedback_type_idx ON public.pilot_feedback(type);
CREATE INDEX IF NOT EXISTS pilot_feedback_user_idx ON public.pilot_feedback(user_id);

ALTER TABLE public.pilot_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can submit feedback (one per type, enforced in app layer)
DROP POLICY IF EXISTS "pilot_feedback_insert" ON public.pilot_feedback;
CREATE POLICY "pilot_feedback_insert" ON public.pilot_feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own feedback
DROP POLICY IF EXISTS "pilot_feedback_own_read" ON public.pilot_feedback;
CREATE POLICY "pilot_feedback_own_read" ON public.pilot_feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin reads all (via service role — no explicit policy needed)

NOTIFY pgrst, 'reload schema';
