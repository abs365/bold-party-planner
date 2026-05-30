import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Redis client (lazy-initialised on first request)
// ---------------------------------------------------------------------------

let redis: Redis | null = null;
// Cache Ratelimit instances keyed by "{limit}:{windowMs}" to avoid recreating
// them on every request. Identifiers are passed at call time, not baked in.
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis) return redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. " +
          "Rate limiting is DISABLED — all requests will be allowed."
      );
    }
    return null;
  }
  redis = new Redis({ url, token });
  return redis;
}

// Convert milliseconds to the string format @upstash/ratelimit expects.
function msToWindow(ms: number): `${number} ${"ms" | "s" | "m" | "h" | "d"}` {
  if (ms % 86_400_000 === 0) return `${ms / 86_400_000} d`;
  if (ms % 3_600_000  === 0) return `${ms / 3_600_000} h`;
  if (ms % 60_000     === 0) return `${ms / 60_000} m`;
  if (ms % 1_000      === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
}

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;
  const key = `${limit}:${windowMs}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(limit, msToWindow(windowMs)),
        prefix: "elbold:rl",
      }),
    );
  }
  return limiters.get(key)!;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  identifier: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;          // Unix ms timestamp
  retryAfterSeconds: number;
}

/**
 * Check a sliding-window rate limit against Upstash Redis.
 * Fails open (allowed: true) when UPSTASH env vars are not configured so that
 * local development and preview deployments without Redis still work.
 */
export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { limit, windowMs, identifier } = options;
  const now = Date.now();

  const limiter = getLimiter(limit, windowMs);
  if (!limiter) {
    return { allowed: true, remaining: limit, resetAt: now + windowMs, retryAfterSeconds: 0 };
  }

  const result = await limiter.limit(identifier);
  return {
    allowed:           result.success,
    remaining:         result.remaining,
    resetAt:           result.reset,
    retryAfterSeconds: result.success ? 0 : Math.ceil((result.reset - now) / 1000),
  };
}

// ---------------------------------------------------------------------------
// Presets — unchanged; callers spread these into RateLimitOptions
// ---------------------------------------------------------------------------

export const RATE_LIMITS = {
  /** AI/OpenAI routes — expensive, limit tightly */
  ai: { limit: 20, windowMs: 60_000 },
  /** Payment routes */
  payment: { limit: 10, windowMs: 60_000 },
  /** Auth routes (login/signup) */
  auth: { limit: 10, windowMs: 60_000 },
  /** Signup — stricter than auth to prevent account farming */
  signup: { limit: 5, windowMs: 15 * 60_000 },
  /** General API */
  api: { limit: 60, windowMs: 60_000 },
  /** Upload routes */
  upload: { limit: 20, windowMs: 60_000 },
  /** Messaging / enquiry routes */
  messaging: { limit: 30, windowMs: 60_000 },
  /** Review submission */
  review: { limit: 5, windowMs: 60 * 60_000 },
  /** Quote / booking request */
  quote: { limit: 10, windowMs: 60_000 },
  /** Admin API routes */
  admin: { limit: 120, windowMs: 60_000 },
  /** Stripe webhook ingest */
  webhook: { limit: 300, windowMs: 60_000 },
} as const;

export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}
