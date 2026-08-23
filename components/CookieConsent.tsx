"use client";

import { useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

type ConsentChoice = "all" | "necessary" | null;

const STORAGE_KEY = "bp_cookie_consent";

// This component is loaded with { ssr: false } in app/layout.tsx.
// It is never server-rendered, so reading localStorage in the useState
// initialiser is safe. There is no SSR/client mismatch possible.
export function CookieConsent() {
  const [show, setShow] = useState<boolean>(() => {
    try { return !localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });

  function accept(choice: ConsentChoice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, at: Date.now() }));
    } catch { /* ignore */ }
    // Lets AttributionCapture react immediately if analytics consent was
    // just granted, rather than only capturing on a future visit.
    window.dispatchEvent(new Event("bp-consent-changed"));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-6 pointer-events-none"
    >
      {/* ── Mobile: slim single-row strip ── */}
      <div className="sm:hidden max-w-2xl mx-auto bg-gray-900 border border-white/10 rounded-xl shadow-2xl shadow-black/40 px-4 py-3 pointer-events-auto flex items-center gap-3">
        <Cookie className="w-4 h-4 text-brand-400 flex-shrink-0" />
        <p className="text-white/60 text-xs flex-1 min-w-0">
          We use cookies.{" "}
          <Link href="/cookies" className="text-brand-400 underline">Policy</Link>
        </p>
        <button
          onClick={() => accept("necessary")}
          className="text-xs text-white/50 hover:text-white/80 border border-white/15 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
        >
          Decline
        </button>
        <button
          onClick={() => accept("all")}
          className="text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-3 py-1.5 transition-colors flex-shrink-0"
        >
          Accept
        </button>
      </div>

      {/* ── Desktop: full card ── */}
      <div className="hidden sm:block max-w-2xl mx-auto bg-gray-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/40 p-5 pointer-events-auto">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold mb-1">We use cookies</p>
            <p className="text-white/55 text-xs leading-relaxed">
              We use essential cookies to keep the platform working and, with your consent, optional analytics cookies to improve your experience. We never use advertising cookies.{" "}
              <Link href="/cookies" className="text-brand-400 hover:text-brand-300 underline transition-colors">
                Cookie Policy
              </Link>
            </p>
          </div>
          <button
            onClick={() => accept("necessary")}
            className="flex-shrink-0 text-white/30 hover:text-white/60 transition-colors p-1"
            aria-label="Dismiss and accept necessary cookies only"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-4 justify-end">
          <button
            onClick={() => accept("necessary")}
            className="text-xs text-white/50 hover:text-white/80 border border-white/15 rounded-lg px-4 py-2 transition-colors"
          >
            Necessary only
          </button>
          <button
            onClick={() => accept("all")}
            className="text-xs font-semibold bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-2 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
