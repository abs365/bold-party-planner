# ELBOLD — Architecture Reference

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase GoTrue |
| Storage | Supabase Storage |
| Payments | Stripe |
| Email | Resend |
| AI | OpenAI gpt-4o-mini |
| Error Tracking | Sentry |
| Deployment | Vercel |

---

## Auth Architecture

### Session Flow
1. User signs in via Supabase GoTrue (`/api/auth/login` server action)
2. Supabase SSR sets `sb-*` cookies on the response
3. `proxy.ts` (Next.js Middleware) reads cookies on every request via `@supabase/ssr`
4. `proxy.ts` calls `supabase.auth.getUser()` to refresh the session token
5. Protected routes redirect to `/login` if no valid session

### Role Model
Three roles: `customer`, `vendor`, `admin`

- Role is stored in `profiles.role` (set by `handle_new_user` trigger on signup)
- Admin is determined by `ADMIN_EMAILS` env var (email-based check in proxy + API guards)
- Server-side guards: `lib/auth/guards.ts` — `requireAuth()`, `requireVendor()`, `requireAdmin()`
- All admin API routes use `requireAdmin()` which returns a `createAdminClient()` (service role, bypasses RLS)

### Session Refresh
`proxy.ts` calls `getUser()` on every page navigation. This refreshes the cookie before expiry. This is the standard Supabase SSR pattern.

---

## Database Architecture

### Schema Overview
- **021 migrations** applied in sequence (001 → 021)
- All tables have **Row Level Security (RLS)** enabled
- Admin operations use `createAdminClient()` (service role key, bypasses RLS)
- Customer/vendor operations use `createClient()` (anon key, RLS enforced)

### Key Tables
| Table | Owns | Notes |
|---|---|---|
| `profiles` | All users | FK to `auth.users`, role column |
| `vendors` | Vendor businesses | FK to `profiles.id` |
| `vendor_packages` | Service packages | FK to `vendors.id` |
| `vendor_media` | Photos/videos | FK to `vendors.id`, moderation fields |
| `events` | Customer events | FK to `profiles.id` |
| `quotes` | Quote requests | FK to `profiles`, `vendors`, `events` |
| `quote_responses` | Vendor responses | FK to `quotes`, `vendors` |
| `bookings` | Confirmed bookings | FK to `events`, `vendors`, `profiles` |
| `reviews` | Post-booking reviews | FK to `bookings` |
| `messages` / `message_threads` | In-app messaging | |
| `vendor_verifications` | Verification records | FK to `vendors` |
| `verification_documents` | Uploaded docs | FK to `vendor_verifications` |
| `audit_logs` | Immutable audit trail | Write-only via service role |
| `analytics_events` | Event analytics | Write-only via service role |
| `admin_alerts` | Admin notification queue | Service role only |
| `content_reports` | User reports | Reporter + service role |
| `notifications` | User notifications | Per-user RLS |

### RLS Strategy
- **Public data** (approved vendor profiles, packages): `SELECT` allowed for all authenticated users
- **Own data** (events, quotes, bookings): scoped to `auth.uid()` 
- **Admin data** (audit_logs, analytics_events, admin_alerts): `false` policy + service role bypass
- See `RLS_POLICY_MATRIX.md` for full audit

---

## API Architecture

### Route Structure
All API routes live in `app/api/`. Route handlers use Next.js App Router conventions.

### Guard Pattern
```typescript
// Standard guard usage in API routes
export async function GET(req: Request) {
  const ctx = await requireAdmin();
  if (!ctx) return unauthorized();
  // ctx.db = service-role Supabase client
}
```

### Logging Pattern
```typescript
// Optional: wrap handler for automatic request/response logging
export const POST = withApiLogger("POST /api/quotes", async (req) => {
  // handler body
});

// Or: use per-request context for granular logging
export async function POST(req: Request) {
  const ctx = createRequestContext(req, "POST /api/quotes");
  ctx.log("quote.creating", { vendorId });
  // ...
  ctx.log("quote.created", { quoteId, durationMs: ctx.elapsedMs() });
}
```

### Rate Limiting
All public-facing mutation endpoints use `lib/rate-limit.ts`. Auth endpoints additionally use `lib/security/bruteForce.ts` for lockout after 5 failed attempts.

---

## Storage Architecture

### Buckets
| Bucket | Access | Purpose |
|---|---|---|
| `vendor-media` | Public | Vendor photos/videos |
| `verification-documents` | Private | Identity/business docs |

### Upload Flow
1. Client POSTs to `/api/uploads` or `/api/verification/upload`
2. Server validates MIME type, file size, vendor ownership
3. Server uploads to Supabase Storage via admin client
4. URL/path stored in DB (`vendor_media.url` or `verification_documents.file_url`)
5. For private docs: `/api/verification/document?path=...` generates 1-hour signed URL

---

## Observability

### Logging
`lib/logger/index.ts` — structured logger. JSON output in production (Vercel parses it), human-readable in development.

```typescript
logger.info("booking.confirmed", { requestId, bookingId, vendorId, durationMs });
logger.error("payment.failed", { requestId, err, bookingId });
```

### Error Tracking
Sentry SDK (`@sentry/nextjs`). Configured via:
- `sentry.client.config.ts` — browser
- `sentry.server.config.ts` — Node.js server
- `sentry.edge.config.ts` — Edge runtime
- `instrumentation.ts` — Next.js startup hook

Requires `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` env vars.

### Analytics
`lib/analytics/index.ts` — fire-and-forget event tracking to `analytics_events` table. Failures are swallowed. Privacy-aware: no PII in properties, only user_id FK.

### Audit Logs
`lib/audit/index.ts` — immutable audit trail for all admin actions. Writes to `audit_logs` table via service role. All admin API routes should call `createAuditLog()`.

### Health Check
`GET /api/health` — returns JSON with DB, auth, and storage status. Returns 503 if critical checks fail. Used by uptime monitors and load balancers.

---

## Verification Flow

### Levels
- **Level 0** — Unverified (default)
- **Level 1** — Verified: email + phone + bio + city + packages + media (automatic)
- **Level 2** — Business Verified: category-specific documents approved by admin
- **Level 3** — Trusted Pro: 5+ completed jobs, 4.5+ rating, 80%+ response rate (automatic)
- **Level 4** — Premium Partner: admin-assigned

### Document Storage
Private bucket (`verification-documents`). Path: `verification/{vendorId}/{docType}/{filename}`. Served via signed URLs (`GET /api/verification/document`). Admins get unrestricted access; vendors scoped to their own prefix.

---

## Seeding (Development/Testing)

### Demo Users
9 canonical demo users seeded via `POST /api/auth/create-demo-users` (secret: `BOLD_PARTY_DEMO_2026`). Fixed UUIDs: a0000001-a0000005 (vendors), b0000001-b0000003 (customers), c0000099 (admin).

### E2E Seed Data
Deterministic marketplace data seeded via `POST /api/dev/seed-e2e` (secret: `BOLD_PARTY_SEED_2026`). Creates packages, media, events, quotes, bookings, verifications, etc. Called automatically by Playwright's `global.setup.ts`.
