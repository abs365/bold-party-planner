-- Migration 042: Vendor Acquisition — vendor_leads table
-- Purpose: Internal tool for founder to research, score and contact potential vendors.
-- This table is admin-only. No public or vendor RLS exposure.

CREATE TABLE IF NOT EXISTS vendor_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name       text NOT NULL,
  category            text NOT NULL,
  location            text,
  city                text,
  region              text CHECK (region IN ('London', 'Kent', 'Essex', 'Other')),
  website             text,
  instagram           text,
  facebook            text,
  email               text,
  phone               text,
  google_maps_url     text,
  source              text,
  rating              numeric(3,1),
  review_count        integer DEFAULT 0,
  follower_count      integer DEFAULT 0,
  priority            text CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  lead_score          integer DEFAULT 0,
  status              text CHECK (status IN (
                        'new', 'researched', 'approved_for_outreach',
                        'outreach_sent', 'follow_up_due', 'interested',
                        'registered', 'rejected', 'not_suitable'
                      )) DEFAULT 'new',
  notes               text,
  last_contacted_at   timestamptz,
  next_follow_up_at   timestamptz,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_vendor_leads_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vendor_leads_updated_at
  BEFORE UPDATE ON vendor_leads
  FOR EACH ROW EXECUTE FUNCTION update_vendor_leads_updated_at();

-- RLS: admin-only (service role bypasses RLS, so this is belt-and-braces)
ALTER TABLE vendor_leads ENABLE ROW LEVEL SECURITY;

-- No public or authenticated access — admin API uses service role client
CREATE POLICY "vendor_leads_no_public_access"
  ON vendor_leads FOR ALL TO authenticated
  USING (false);

-- Indices for common filter/sort operations
CREATE INDEX IF NOT EXISTS vendor_leads_status_idx    ON vendor_leads (status);
CREATE INDEX IF NOT EXISTS vendor_leads_category_idx  ON vendor_leads (category);
CREATE INDEX IF NOT EXISTS vendor_leads_region_idx    ON vendor_leads (region);
CREATE INDEX IF NOT EXISTS vendor_leads_priority_idx  ON vendor_leads (priority);
CREATE INDEX IF NOT EXISTS vendor_leads_created_idx   ON vendor_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS vendor_leads_score_idx     ON vendor_leads (lead_score DESC);
