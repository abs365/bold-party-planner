// Tracks repeated failed auth attempts per identifier (IP or email).
// Uses the same in-memory store pattern as lib/rate-limit.ts.
// For multi-instance deployments, replace with Upstash Redis.

interface FailRecord {
  count: number;
  windowStart: number;
  lockedUntil: number | null;
}

const store = new Map<string, FailRecord>();

const MAX_FAILURES  = 5;
const WINDOW_MS     = 15 * 60 * 1000;   // 15 min sliding window
const LOCKOUT_MS    = 30 * 60 * 1000;   // 30 min lockout after MAX_FAILURES

// Prune expired records every 10 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, rec] of store) {
      if (rec.windowStart + WINDOW_MS < now && !rec.lockedUntil) store.delete(key);
      if (rec.lockedUntil && rec.lockedUntil < now) store.delete(key);
    }
  }, 10 * 60 * 1000);
}

export interface BruteForceStatus {
  isLocked: boolean;
  failureCount: number;
  retryAfterSeconds: number;
}

export function checkBruteForce(identifier: string): BruteForceStatus {
  const rec = store.get(identifier);
  if (!rec) return { isLocked: false, failureCount: 0, retryAfterSeconds: 0 };

  const now = Date.now();
  if (rec.lockedUntil && rec.lockedUntil > now) {
    return {
      isLocked: true,
      failureCount: rec.count,
      retryAfterSeconds: Math.ceil((rec.lockedUntil - now) / 1000),
    };
  }

  return { isLocked: false, failureCount: rec.count, retryAfterSeconds: 0 };
}

export function recordAuthFailure(identifier: string): BruteForceStatus {
  const now = Date.now();
  let rec = store.get(identifier);

  if (!rec || rec.windowStart + WINDOW_MS < now) {
    rec = { count: 0, windowStart: now, lockedUntil: null };
  }

  rec.count += 1;

  if (rec.count >= MAX_FAILURES) {
    rec.lockedUntil = now + LOCKOUT_MS;
  }

  store.set(identifier, rec);
  return checkBruteForce(identifier);
}

export function clearAuthFailures(identifier: string): void {
  store.delete(identifier);
}
