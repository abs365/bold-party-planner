-- Migration 032: Vendor bank details for manual payouts
-- Allows vendors to submit UK bank account details for manual payout processing.
-- Apply in Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.vendor_bank_details (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id      UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  account_name   TEXT NOT NULL,
  sort_code      TEXT NOT NULL CHECK (sort_code ~ '^\d{2}-?\d{2}-?\d{2}$'),
  account_number TEXT NOT NULL CHECK (length(account_number) BETWEEN 6 AND 8),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (vendor_id)
);

-- Only the vendor who owns it and admins (service role) can read
ALTER TABLE public.vendor_bank_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_details_vendor_own" ON public.vendor_bank_details;
CREATE POLICY "bank_details_vendor_own" ON public.vendor_bank_details
  FOR ALL TO authenticated
  USING (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendors WHERE user_id = auth.uid()
    )
  );

-- Trigger: keep updated_at current
CREATE OR REPLACE FUNCTION public.set_bank_details_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bank_details_updated_at ON public.vendor_bank_details;
CREATE TRIGGER bank_details_updated_at
  BEFORE UPDATE ON public.vendor_bank_details
  FOR EACH ROW EXECUTE FUNCTION public.set_bank_details_updated_at();

NOTIFY pgrst, 'reload schema';
