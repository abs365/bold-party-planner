import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // In production, sample 10% of transactions; in dev, capture all
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Capture session replays on all errors; sample 10% of sessions
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs by default for privacy
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  // Never forward Sentry errors to the console in production
  debug: false,

  // Only send events in production unless SENTRY_DEBUG=true is set
  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.SENTRY_DEBUG === "true",

  beforeSend(event) {
    // Strip raw auth tokens if they leak into breadcrumbs/extra
    if (event.request?.cookies) event.request.cookies = {};
    return event;
  },
});
