import { logger } from "@/lib/logger";
import { generateRequestId } from "@/lib/logger/requestId";
import { Timer } from "@/lib/monitoring/performance";

// Only import Sentry if DSN is configured — avoids noise in dev without Sentry
const SENTRY_DSN = process.env.SENTRY_DSN;

// ── HOF wrapper for Next.js App Router route handlers ────────────────────────
//
// Usage:
//   export const GET = withApiLogger("GET /api/admin/vendors", async (req) => { ... });

type RouteHandler = (req: Request, ctx: unknown) => Response | Promise<Response>;

export function withApiLogger(route: string, handler: RouteHandler): RouteHandler {
  return async (req: Request, ctx: unknown) => {
    const requestId = generateRequestId();
    const timer = new Timer();

    logger.info("api.request", { requestId, route, method: req.method });

    try {
      const response = await handler(req, ctx);
      const durationMs = timer.elapsedMs();

      logger.info("api.response", {
        requestId,
        route,
        method: req.method,
        statusCode: response.status,
        durationMs,
      });

      if (durationMs > 2000) {
        logger.warn("api.slow_request", {
          requestId,
          route,
          method: req.method,
          durationMs,
        });
      }

      const headers = new Headers(response.headers);
      headers.set("x-request-id", requestId);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      const durationMs = timer.elapsedMs();
      logger.error("api.unhandled_error", {
        requestId,
        route,
        method: req.method,
        durationMs,
        err,
      });

      // Report to Sentry if configured
      if (SENTRY_DSN) {
        void import("@sentry/nextjs").then((Sentry) => {
          Sentry.withScope((scope) => {
            scope.setTag("route", route);
            scope.setExtra("requestId", requestId);
            Sentry.captureException(err);
          });
        });
      }

      throw err;
    }
  };
}

// ── Lightweight per-request context (for routes not using the HOF) ───────────
//
// Usage:
//   export async function POST(req: Request) {
//     const ctx = createRequestContext(req, "POST /api/quotes");
//     ctx.log("quote.created", { quoteId });
//     ...
//   }

export interface RequestContext {
  requestId: string;
  log: (event: string, meta?: Record<string, unknown>) => void;
  logError: (event: string, err: unknown, meta?: Record<string, unknown>) => void;
  elapsedMs: () => number;
}

export function createRequestContext(req: Request, route: string): RequestContext {
  const requestId = generateRequestId();
  const timer = new Timer();

  logger.info("api.request", { requestId, route, method: req.method });

  return {
    requestId,
    log: (event, meta) =>
      logger.info(event, { requestId, route, method: req.method, ...meta }),
    logError: (event, err, meta) =>
      logger.error(event, { requestId, route, method: req.method, err, ...meta }),
    elapsedMs: () => timer.elapsedMs(),
  };
}
