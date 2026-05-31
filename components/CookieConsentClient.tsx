"use client";

import dynamic from "next/dynamic";

// Load CookieConsent with ssr:false so it is never server-rendered.
// This eliminates the hydration mismatch that would otherwise occur when the
// component's useState initialiser reads localStorage (undefined on the server).
const CookieConsentLazy = dynamic(
  () => import("./CookieConsent").then((m) => ({ default: m.CookieConsent })),
  { ssr: false }
);

export function CookieConsentClient() {
  return <CookieConsentLazy />;
}
