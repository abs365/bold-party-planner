-- Migration 030: Add custom_category_description to vendors
-- Stores the free-text description when a vendor selects category = 'other'.
-- Apply in Supabase Dashboard → SQL Editor before deploying.

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS custom_category_description TEXT;

-- Index so admins can quickly list vendors needing category review
CREATE INDEX IF NOT EXISTS vendors_custom_category_idx
  ON public.vendors (custom_category_description)
  WHERE custom_category_description IS NOT NULL;

NOTIFY pgrst, 'reload schema';
