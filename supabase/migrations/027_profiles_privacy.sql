-- Migration 027: Profiles Privacy Hardening
--
-- PROBLEM: profiles_public_read used USING (true) — any anonymous client
-- could SELECT * FROM profiles and retrieve every user's email and phone number.
-- Confirmed live: 13 rows including customer emails readable with anon key.
--
-- SOLUTION:
--   1. Drop the open policy.
--   2. Allow public access only for approved vendor profiles.
--   3. Allow authenticated users to read profiles in their interaction network
--      (bookings, quotes, message threads) — required for vendor ↔ customer
--      communication flows without touching application code.
--   4. Create a public_vendor_profiles view (Option A) exposing only safe
--      columns (id, full_name, avatar_url) for use by future direct queries.

-- ── 1. Drop the unrestricted policy ──────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;


-- ── 2. Anonymous-safe: approved vendor profiles only ─────────────────────────
-- Allows the vendor marketplace, browse, and /vendors/[id] pages to display
-- vendor names and avatars without exposing any customer data.
CREATE POLICY "profiles_approved_vendor_public" ON profiles
  FOR SELECT
  USING (
    id IN (SELECT user_id FROM vendors WHERE status = 'approved')
  );


-- ── 3. Authenticated interaction network ─────────────────────────────────────
-- Vendors need to read customer profiles for bookings, quotes, and messages.
-- Customers need to read vendor profiles for their own interactions.
-- This replaces the "read everything" behaviour for authenticated sessions
-- with a scoped network policy.
CREATE POLICY "profiles_interaction_network" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Own profile (covered by profiles_own too, but explicit here for clarity)
    auth.uid() = id

    OR

    -- Vendor reads customers who have bookings with them
    id IN (
      SELECT b.customer_id
      FROM bookings b
      INNER JOIN vendors v ON b.vendor_id = v.id
      WHERE v.user_id = auth.uid()
    )

    OR

    -- Vendor reads customers who have sent them quotes
    id IN (
      SELECT q.customer_id
      FROM quotes q
      INNER JOIN vendors v ON q.vendor_id = v.id
      WHERE v.user_id = auth.uid()
    )

    OR

    -- Vendor reads customers in their message threads
    id IN (
      SELECT mt.customer_id
      FROM message_threads mt
      INNER JOIN vendors v ON mt.vendor_id = v.id
      WHERE v.user_id = auth.uid()
    )

    OR

    -- Customer reads vendor profiles for their own interactions
    -- (covers approved vendors via profiles_approved_vendor_public already,
    --  but also handles pending/draft vendor states in early-stage interactions)
    id IN (
      SELECT v.user_id FROM vendors v
      WHERE v.id IN (
        SELECT vendor_id FROM bookings        WHERE customer_id = auth.uid()
        UNION ALL
        SELECT vendor_id FROM quotes          WHERE customer_id = auth.uid()
        UNION ALL
        SELECT vendor_id FROM message_threads WHERE customer_id = auth.uid()
      )
    )
  );


-- ── 4. Option A: safe public view ────────────────────────────────────────────
-- Exposes only id, full_name, and avatar_url for approved vendors.
-- Column-level protection at the database layer.
-- Query via: supabase.from("public_vendor_profiles").select("id,full_name,avatar_url")
CREATE OR REPLACE VIEW public_vendor_profiles AS
  SELECT
    p.id,
    p.full_name,
    p.avatar_url
  FROM profiles p
  INNER JOIN vendors v ON v.user_id = p.id
  WHERE v.status = 'approved';

GRANT SELECT ON public_vendor_profiles TO anon;
GRANT SELECT ON public_vendor_profiles TO authenticated;
