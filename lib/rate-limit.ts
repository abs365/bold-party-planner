// Simple in-memory rate limiter for API routes.
// Suitable for single-instance deployments. For multi-instance (Vercel), swap
// the store for an Upstash Redis client using the same interface.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number;       // Max requests per window
  windowMs: number;    // Window size in milliseconds
  identifier: string;  // Usually IP address or user ID
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

export function rateLimit(options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, identifier } = options;
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;

  const entry = store.get(key) ?? { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  store.set(key, entry);

  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);
  const retryAfterSeconds = allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000);

  return { allowed, remaining, resetAt: entry.resetAt, retryAfterSeconds };
}

// Presets for common use cases
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
