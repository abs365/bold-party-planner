"use client";

import Link from "next/link";
import { Award, X } from "lucide-react";
import { useState } from "react";

const DISMISSED_KEY = "founding-vendor-banner-dismissed";

export function FoundingVendorBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(DISMISSED_KEY);
  });

  if (dismissed) return null;

  return (
    <div className="relative mb-6 rounded-2xl overflow-hidden border border-[#C9A84C]/30" style={{ background: "linear-gradient(135deg, #0d1b3e 0%, #162447 100%)" }}>
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.15)" }}>
          <Award size={20} style={{ color: "#C9A84C" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold" style={{ color: "#C9A84C" }}>Founding Vendor Programme</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold text-[#0d1b3e]" style={{ background: "#C9A84C" }}>ACTIVE</span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            You&apos;re one of Elbold&apos;s first vendors. You receive priority placement, the Founding Vendor badge, and early access to all new features.
          </p>
          <Link
            href="/founding-vendors"
            className="inline-flex items-center gap-1.5 text-sm font-semibold mt-3 hover:opacity-80 transition-opacity"
            style={{ color: "#C9A84C" }}
          >
            View programme details →
          </Link>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(DISMISSED_KEY, "1");
            setDismissed(true);
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X size={15} className="text-white/40" />
        </button>
      </div>
    </div>
  );
}
