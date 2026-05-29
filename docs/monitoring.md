# Bold Party Planner — Monitoring & Alerting

**Version:** 1.0

---

## Current Monitoring Stack

| Layer | Tool | Coverage |
|---|---|---|
| Error tracking | Sentry (`@sentry/nextjs`) | Unhandled exceptions, client + server |
| API timing | `lib/monitoring/apiLogger.ts` | Request/response, duration, status code |
| Performance | `lib/monitoring/performance.ts` | Timer utility, `timeAsync()` helper |
| Audit trail | `lib/audit/index.ts` → `audit_logs` | All admin mutations |
| Analytics | `lib/analytics/index.ts` → `analytics_events` | User behavior events |
| Health check | `GET /api/health` | DB, auth, storage, env status |
| Structured logs | `lib/logger/index.ts` | JSON-structured, Vercel-parseable |

---

## Log Events Reference

### API layer (automatic via `withApiLogger`)

| Event | Level | Fields |
|---|---|---|
| `api.request` | info | requestId, route, method |
| `api.response` | info | requestId, route, method, statusCode, durationMs |
| `api.slow_request` | warn | requestId, route, method, durationMs (fires when > 2000ms) |
| `api.unhandled_error` | error | requestId, route, method, durationMs, err |

### Business events (manual, in route handlers)

These events must be logged by developers in route handlers. Use `logger.info()` or `ctx.log()`:

| Event pattern | When to log |
|---|---|
| `booking.created` | Booking confirmed |
| `booking.cancelled` | Booking cancelled by either party |
| `payment.initiated` | Stripe payment intent created |
| `payment.failed` | Stripe payment failed |
| `payment.completed` | Stripe webhook confirms payment |
| `quote.submitted` | Customer submits a quote request |
| `quote.responded` | Vendor responds to a quote |
| `vendor.approved` | Admin approves a vendor |
| `vendor.suspended` | Admin suspends a vendor |
| `upload.completed` | File uploaded to storage |
| `upload.failed` | File upload failed |
| `auth.login_failed` | Failed login attempt |
| `auth.locked_out` | Brute force lockout triggered |
| `verification.submitted` | Vendor submits verification docs |
| `verification.approved` | Admin approves verification |
| `verification.rejected` | Admin rejects verification |

---

## Warning Thresholds

| Condition | Threshold | Action |
|---|---|---|
| Slow API request | > 2000ms | `logger.warn("api.slow_request", ...)` — already implemented |
| High error rate | > 5 errors/minute in Sentry | Investigate, consider SEV-2 |
| Failed login rate | > 10/minute from same IP | Rate limiter already fires; log `auth.suspicious_login_rate` |
| Upload failure rate | > 3 consecutive failures | Investigate storage availability |
| Health check degraded | Any check returns `"degraded"` | Investigate within 30 minutes |
| Health check error | Any check returns `"error"` | SEV-1 or SEV-2 trigger |

---

## Critical Alert Triggers

These conditions should trigger immediate investigation:

| Condition | Likely cause | Response |
|---|---|---|
| `GET /api/health` returns 503 | DB, auth, or storage outage | See `docs/disaster-recovery.md` |
| Sentry: unhandled exception spike (> 10/minute) | Bad deploy, broken migration | Vercel rollback + investigate |
| Zero bookings created in 1 hour (peak hours) | Payment or booking flow broken | Manual smoke test of booking flow |
| Zero new vendor profiles loading | Vendor profile 500ing | Check Sentry for `app/vendors/[id]` errors |
| Auth success rate drops below 95% | GoTrue degradation or broken trigger | Check Supabase status + auth recovery runbook |

---

## Slow Query Detection

`withApiLogger` in `lib/monitoring/apiLogger.ts` logs `api.slow_request` for any request exceeding 2000ms.

For database-level slow queries, use Supabase Dashboard → Reports → Query Performance to identify slow PostgREST queries. In the future, consider adding explicit timing around Supabase calls for routes that are frequently slow:

```typescript
const { result: bookings, durationMs } = await timeAsync(() =>
  supabase.from("bookings").select("...").eq("vendor_id", vendorId)
);
if (durationMs > 500) {
  logger.warn("db.slow_query", { table: "bookings", durationMs, vendorId });
}
```

---

## Health Check Monitor

`GET /api/health` should be polled by an external uptime monitor (UptimeRobot, Better Uptime, or Vercel's built-in monitors).

**Expected healthy response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "checks": {
    "database": { "status": "ok", "latencyMs": 45 },
    "auth": { "status": "ok", "latencyMs": 32 },
    "storage": { "status": "ok", "latencyMs": 28 },
    "environment": { "status": "ok" }
  }
}
```

**Alert on:**
- HTTP status != 200
- `"status"` field != `"ok"`
- Response time > 5 seconds
- Any check field value != `"ok"`

---

## Sentry Configuration

Sentry is initialized via:
- `sentry.client.config.ts` — browser errors
- `sentry.server.config.ts` — Node.js server errors
- `sentry.edge.config.ts` — Edge runtime
- `instrumentation.ts` — Next.js startup hook

Source maps are uploaded to Sentry during production builds (requires `SENTRY_AUTH_TOKEN`). Without source maps, stack traces show minified code.

### Sentry alert rules (recommended)

Set up in Sentry Dashboard → Alerts → Create Alert Rule:

| Rule | Condition | Action |
|---|---|---|
| New issue | First occurrence of any new issue | Email notification |
| Error spike | > 10 events in 1 hour for any issue | Email + Slack notification |
| Regression | Resolved issue reoccurs | Email notification |

### Correlating Sentry with Vercel logs

Every API response includes an `x-request-id` header (set by `withApiLogger`). This header value is also logged as `requestId` in Vercel function logs.

To correlate a Sentry error with its Vercel log:
1. Find `requestId` in the Sentry event's extra data
2. In Vercel Dashboard → Logs, filter by `requestId: <value>`

---

## Audit Log Monitoring

The `audit_logs` table captures all admin mutations. Use it to:
- Investigate unexplained data changes
- Detect unauthorized admin access
- Reconstruct the sequence of actions that led to a bug or incident

```sql
-- Recent admin actions
SELECT actor_id, action, entity_type, entity_id, ip_address, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 50;

-- Suspicious: multiple destructive actions from the same IP
SELECT ip_address, COUNT(*) as action_count, MAX(created_at) as last_action
FROM audit_logs
WHERE action IN ('vendor.suspend', 'vendor.delete', 'booking.cancel')
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY action_count DESC;
```

---

## Future Monitoring Extensions

When platform traffic grows, add:

1. **Vercel Speed Insights** — real-user TTFB and LCP tracking per route
2. **`/api/vendor/analytics` caching** — `s-maxage=300` header (see `docs/performance-audit.md`)
3. **Booking funnel tracking** — analytics events for quote → booking conversion rate
4. **Vendor response time tracking** — average time from quote submission to vendor response
5. **Admin alert automation** — trigger `admin_alerts` rows for critical thresholds instead of requiring manual detection
6. **Upstash Redis rate limiter** — replace in-memory rate limiter with persistent cross-instance limiter
