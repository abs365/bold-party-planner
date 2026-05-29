import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {},
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
