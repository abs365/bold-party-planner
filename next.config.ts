import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const csp = [
  "default-src 'self'",
  // Next.js requires 'unsafe-inline' for RSC hydration scripts.
  // Stripe.js must be loaded from js.stripe.com.
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
  // Tailwind and Next.js inject inline styles.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Images from Supabase Storage, Unsplash demo images, and data/blob URIs for uploads.
  "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://images.unsplash.com",
  // Fonts bundled via next/font land on 'self'; include gstatic as fallback.
  "font-src 'self' https://fonts.gstatic.com",
  // API calls: Supabase REST/Auth/Realtime (WebSocket), Stripe, Vercel Analytics.
  // Sentry browser events route through the /monitoring tunnel (same origin = 'self').
  "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://api.stripe.com https://q.stripe.com https://*.sentry.io https://vitals.vercel-insights.com https://www.google-analytics.com https://analytics.google.com",
  // Stripe Checkout and 3DS frames are served from stripe.com subdomains.
  "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
  // Service worker registered from same origin; blob: needed for dynamic worker creation.
  "worker-src 'self' blob:",
  // Block plugins and object embeds entirely.
  "object-src 'none'",
  // Prevent base-tag hijacking.
  "base-uri 'self'",
  // All form submissions must go to same origin; Stripe Checkout is a redirect, not a form POST.
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent the site from being embedded in any frame (clickjacking defence).
          { key: "X-Frame-Options",          value: "DENY" },
          // Stop browsers from MIME-sniffing the content-type.
          { key: "X-Content-Type-Options",   value: "nosniff" },
          // Send origin only; strip path/query from the Referer header on cross-origin requests.
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          // Disable camera, microphone, and geolocation APIs.
          { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy",  value: csp },
        ],
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    minimumCacheTTL: 3600,
    // Explicit breakpoints prevent Next.js generating too many variants
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256],
  },
  experimental: {
    serverActions: { bodySizeLimit: "100mb" },
  },
  compress: true,
};

export default withSentryConfig(nextConfig, {
  // Sentry project details — set via CI secrets or .env.local
  org:     process.env.SENTRY_ORG     ?? "",
  project: process.env.SENTRY_PROJECT ?? "elbold-events",

  // Auth token for source-map upload; omit and maps won't upload (safe)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Disable source map upload — the Sentry CLI lambda resolver conflicts with
  // Next.js App Router client-component pages under webpack. Error capture still
  // works fully; stack traces will be minified until this is re-enabled.
  sourcemaps: { disable: true },

  // Route Sentry events through a tunnel to avoid ad-blocker drops
  tunnelRoute: "/monitoring",

  // Don't print Sentry build output unless in CI
  silent: !process.env.CI,

  // Hide source maps from client bundle
  hideSourceMaps: true,

  // Suppress tree-shaking warnings
  disableLogger: true,

  // Automatically monitor Vercel cron jobs
  automaticVercelMonitors: true,
});
