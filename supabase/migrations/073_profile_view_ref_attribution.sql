-- Migration 073: channel attribution on profile-view tracking (WP-C5, REG-20)
--
-- vendor_analytics.metadata (JSONB, migration 004) has existed unused since
-- the table was created. VendorSharePanel now tags each outbound share
-- channel distinctly (?ref=share|qr|whatsapp|facebook|linkedin) so a vendor
-- can find out whether a printed QR code is actually driving traffic,
-- separately from a WhatsApp or Facebook link - this migration is the last
-- step: capturing that value into the existing metadata column instead of
-- discarding it, via an optional second parameter with a default so every
-- existing call site (which passes only p_vendor_id) keeps working
-- unchanged.

CREATE OR REPLACE FUNCTION increment_vendor_profile_views(p_vendor_id UUID, p_ref TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE vendors SET profile_views = COALESCE(profile_views, 0) + 1 WHERE id = p_vendor_id;
  INSERT INTO vendor_analytics (vendor_id, event_type, metadata)
    VALUES (
      p_vendor_id,
      'profile_view',
      CASE WHEN p_ref IS NOT NULL THEN jsonb_build_object('ref', p_ref) ELSE '{}'::jsonb END
    );
END;
$$;
