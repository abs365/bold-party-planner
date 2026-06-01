-- Migration 031: Production-grade quote workflow
-- Extends quotes and quote_responses, adds quote_events audit table.
-- Status: APPLIED in Supabase (verified 2026-06-01)

-- ── 1. Extend quotes table ────────────────────────────────────────────────────

-- New customer-request fields
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS city          TEXT,
  ADD COLUMN IF NOT EXISTS notes         TEXT,
  ADD COLUMN IF NOT EXISTS category      TEXT;

-- Status transition timestamps
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS shortlisted_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS withdrawn_at    TIMESTAMPTZ;

-- Reason capture
ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS vendor_decline_reason    TEXT,
  ADD COLUMN IF NOT EXISTS customer_rejection_reason TEXT;

-- Expand status CHECK to include new lifecycle states
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_status_check;
ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_status_check
    CHECK (status IN (
      'pending',      -- customer sent request, vendor hasn't responded
      'responded',    -- vendor submitted a quote
      'viewed',       -- customer has opened the vendor's quote
      'shortlisted',  -- customer marked as favourite for comparison
      'accepted',     -- customer accepted this vendor's quote
      'rejected',     -- customer rejected this vendor's quote
      'expired',      -- past expires_at without response
      'withdrawn',    -- customer withdrew the request before vendor responded
      'converted',    -- booking created from accepted quote
      'declined'      -- vendor declined to quote (kept for backward compat)
    ));


-- ── 2. Extend quote_responses table ─────────────────────────────────────────

ALTER TABLE public.quote_responses
  ADD COLUMN IF NOT EXISTS title            TEXT,
  ADD COLUMN IF NOT EXISTS description      TEXT,
  ADD COLUMN IF NOT EXISTS services         TEXT[],
  ADD COLUMN IF NOT EXISTS terms            TEXT,
  ADD COLUMN IF NOT EXISTS duration_hours   NUMERIC CHECK (duration_hours > 0),
  ADD COLUMN IF NOT EXISTS withdrawal_reason TEXT;

-- vendor deposit is now explicit (not hardcoded to 30%)
-- deposit_amount column already exists; no change needed


-- ── 3. Create quote_events audit table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.quote_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id   UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  actor_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('customer', 'vendor', 'admin', 'system')),
  event_type TEXT NOT NULL,
  -- e.g. 'quote_created', 'lead_viewed', 'quote_submitted', 'quote_updated',
  --       'customer_viewed', 'shortlisted', 'accepted', 'rejected',
  --       'vendor_declined', 'withdrawn', 'expired', 'booking_created'
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quote_events_quote_id_idx ON public.quote_events(quote_id);
CREATE INDEX IF NOT EXISTS quote_events_created_at_idx ON public.quote_events(created_at DESC);

-- RLS
ALTER TABLE public.quote_events ENABLE ROW LEVEL SECURITY;

-- Customer reads events for own quotes
DROP POLICY IF EXISTS "quote_events_customer_read" ON public.quote_events;
CREATE POLICY "quote_events_customer_read" ON public.quote_events
  FOR SELECT TO authenticated
  USING (
    quote_id IN (
      SELECT id FROM public.quotes WHERE customer_id = auth.uid()
    )
  );

-- Vendor reads events for their quotes
DROP POLICY IF EXISTS "quote_events_vendor_read" ON public.quote_events;
CREATE POLICY "quote_events_vendor_read" ON public.quote_events
  FOR SELECT TO authenticated
  USING (
    quote_id IN (
      SELECT q.id
      FROM public.quotes q
      INNER JOIN public.vendors v ON v.id = q.vendor_id
      WHERE v.user_id = auth.uid()
    )
  );

-- Insert via service role only (all API routes use createAdminClient for audit inserts)
-- No RLS INSERT policy needed — service role bypasses RLS


-- ── 4. Indexes for comparison queries ───────────────────────────────────────

-- Customers often compare all quotes for the same event
CREATE INDEX IF NOT EXISTS quotes_event_customer_idx
  ON public.quotes(event_id, customer_id)
  WHERE event_id IS NOT NULL;

-- Quick lookup for status-based filtering in vendor lead inbox
CREATE INDEX IF NOT EXISTS quotes_vendor_status_idx
  ON public.quotes(vendor_id, status);

NOTIFY pgrst, 'reload schema';
