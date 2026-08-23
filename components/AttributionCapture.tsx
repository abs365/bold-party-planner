"use client";

import { useEffect } from "react";
import {
  ATTRIBUTION_COOKIE,
  ATTRIBUTION_WINDOW_DAYS,
  type AttributionData,
} from "@/lib/attribution/shared";

const CONSENT_KEY = "bp_cookie_consent";
const CONSENT_CHANGED_EVENT = "bp-consent-changed";

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { choice?: string };
    return parsed.choice === "all";
  } catch {
    return false;
  }
}

function hasStoredAttribution(): boolean {
  return document.cookie.includes(`${ATTRIBUTION_COOKIE}=`);
}

function captureFirstTouch() {
  // First touch only — never overwrite an existing capture.
  if (hasStoredAttribution()) return;
  // Respects the site's existing consent policy (see components/CookieConsent.tsx
  // and app/cookies/page.tsx): "We only set these [analytics] cookies after
  // you have given explicit consent."
  if (!hasAnalyticsConsent()) return;

  const params = new URLSearchParams(window.location.search);
  const data: AttributionData = {};
  const utmSource = params.get("utm_source");
  const utmMedium = params.get("utm_medium");
  const utmCampaign = params.get("utm_campaign");
  const utmContent = params.get("utm_content");
  if (utmSource) data.utm_source = utmSource;
  if (utmMedium) data.utm_medium = utmMedium;
  if (utmCampaign) data.utm_campaign = utmCampaign;
  if (utmContent) data.utm_content = utmContent;
  if (document.referrer && !document.referrer.includes(window.location.hostname)) {
    data.referrer = document.referrer;
  }

  // Nothing worth capturing (direct traffic, no campaign params, no external referrer).
  if (Object.keys(data).length === 0) return;

  const maxAge = ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60;
  document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(
    JSON.stringify(data)
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Captures first-touch UTM/referrer attribution, consent-gated, for up to
 * ATTRIBUTION_WINDOW_DAYS. Runs on mount, and again whenever cookie consent
 * is granted after the fact (the common real-world case: a visitor arrives
 * via a campaign link, sees the consent banner immediately, and accepts a
 * moment later — this ensures that acceptance still captures the same-visit
 * UTM params rather than only ever capturing on a later visit).
 */
export function AttributionCapture() {
  useEffect(() => {
    captureFirstTouch();
    window.addEventListener(CONSENT_CHANGED_EVENT, captureFirstTouch);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, captureFirstTouch);
  }, []);

  return null;
}
