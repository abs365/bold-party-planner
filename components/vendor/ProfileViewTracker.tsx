"use client";

import { useEffect } from "react";

export function ProfileViewTracker({ vendorId }: { vendorId: string }) {
  useEffect(() => {
    fetch("/api/vendor/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vendor_id: vendorId }),
    }).catch(() => {});
  }, [vendorId]);

  return null;
}
