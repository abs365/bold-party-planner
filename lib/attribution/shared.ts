// Master Growth OS Commercial Operating Upgrade — Wave 5 (FD-19 Option A).
// First-touch marketing attribution: which campaign/content/referrer
// produced a quote request. Deliberately minimal — first-touch only, not
// multi-touch, per the approved architecture's "prefer explainable over
// sophisticated" instruction. Safe to import from client or server code.

export const ATTRIBUTION_COOKIE = "bp_attribution";
export const ATTRIBUTION_WINDOW_DAYS = 30;

export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
}

function parseAttributionCookie(raw: string | null | undefined): AttributionData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AttributionData;
    return Object.keys(parsed).length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Reads the stored first-touch attribution cookie directly via
 * document.cookie. Client-side only — for server code use
 * lib/attribution/read.ts instead.
 */
export function getStoredAttributionClient(): AttributionData | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${ATTRIBUTION_COOKIE}=([^;]*)`)
  );
  return parseAttributionCookie(match ? decodeURIComponent(match[1]) : null);
}

export { parseAttributionCookie };
