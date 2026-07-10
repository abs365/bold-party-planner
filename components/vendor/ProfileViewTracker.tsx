"use client";

import { useEffect } from "react";

// WP-C5 (REG-20): refParam carries the share-channel tag (share/qr/whatsapp/
// facebook/linkedin) from the page's own ?ref= query param, so a profile
// view can be attributed to the channel that drove it, not just counted.
export function ProfileViewTracker({ vendorId, refParam }: { vendorId: string; refParam?: string | null }) {
  useEffect(() => {
    fetch("/api/vendor/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendorId, ref: refParam ?? undefined }),
    }).catch(() => {});
  }, [vendorId, refParam]);

  return null;
}
