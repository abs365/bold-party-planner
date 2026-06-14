-- Migration 049: Add rejection_reason column to vendors table
-- The vendor apply route and admin approval flow reference this column
-- to store the reason when a vendor application is rejected, and to
-- clear it when a rejected vendor reapplies. Missing column was causing
-- a 500 error on every new vendor application (Phase 66B.2 trace).

ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
