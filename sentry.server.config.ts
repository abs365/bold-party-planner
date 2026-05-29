import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  debug: false,

  enabled:
    process.env.NODE_ENV === "production" ||
    process.env.SENTRY_DEBUG === "true",

  // Tag every event with the deployment environment
  environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",

  beforeSend(event) {
    // Scrub service role key if it somehow ends up in a Sentry payload
    if (event.extra) {
      for (const key of Object.keys(event.extra)) {
        const val = String(event.extra[key] ?? "");
        if (val.includes("service_role") || val.includes("eyJ")) {
          event.extra[key] = "[filtered]";
        }
      }
    }
    return event;
  },
});
