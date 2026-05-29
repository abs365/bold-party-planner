# Bold Party Planner — Operational Runbooks

## Runbook Index

1. [Demo User Reset](#1-demo-user-reset)
2. [E2E Seed Reset](#2-e2e-seed-reset)
3. [Migration Rollout](#3-migration-rollout)
4. [Auth Recovery](#4-auth-recovery)
5. [Vendor Stuck in Pending](#5-vendor-stuck-in-pending)
6. [Sentry Alert Response](#6-sentry-alert-response)
7. [Health Check Failure](#7-health-check-failure)
8. [Database Emergency Access](#8-database-emergency-access)
9. [Rate Limit Incident](#9-rate-limit-incident)
10. [Storage Recovery](#10-storage-recovery)
11. [Local Development Setup](#11-local-development-setup)
12. [Staging Deploy](#12-staging-deploy)
13. [Production Deploy](#13-production-deploy)
14. [Migration Deploy Order](#14-migration-deploy-order)
15. [Rollback Procedures](#15-rollback-procedures)
16. [CI Troubleshooting](#16-ci-troubleshooting)
17. [Playwright Troubleshooting](#17-playwright-troubleshooting)
18. [Seed Troubleshooting](#18-seed-troubleshooting)
19. [Sentry Setup Troubleshooting](#19-sentry-setup-troubleshooting)

---

## 1. Demo User Reset

**When:** Demo users can't log in, passwords are wrong, or auth rows are corrupted.

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Run `supabase/migrations/019_force_demo_auth_cleanup.sql` — deletes all `*@boldparty.demo` rows from auth tables
3. Open the running app (dev or staging)
4. POST to `/api/auth/create-demo-users` with body `{ "secret": "BOLD_PARTY_DEMO_2026" }`
5. All 9 users return `"created"` or `"already_exists"` → success
6. POST to `/api/dev/seed-e2e` with body `{ "secret": "BOLD_PARTY_SEED_2026" }` to restore marketplace data

**Verify:** Log in as `james.bennett@boldparty.demo` / `BoldPartyDemo2026!`

---

## 2. E2E Seed Reset

**When:** Playwright tests failing due to missing/stale data; seed data manually modified.

**Steps:**
```bash
# Option A: via curl
curl -X POST http://localhost:3000/api/dev/seed-e2e \
  -H "Content-Type: application/json" \
  -d '{"secret":"BOLD_PARTY_SEED_2026"}'

# Option B: re-run global.setup
npx playwright test --global-setup
```

---

## 3. Migration Rollout

**When:** New migration needs to be applied.

**Steps:**
1. Test migration on a local/staging Supabase project first
2. Open Supabase Dashboard → SQL Editor
3. Paste and run the migration file content
4. Check for errors in the SQL output
5. Run `NOTIFY pgrst, 'reload schema';` if not included in the migration
6. Verify via `GET /api/health` — database check should return `"ok"`

**Rollback:** Migrations are generally irreversible (forward-only). For destructive migrations, always take a manual snapshot in Supabase Dashboard → Backups before applying.

**Migration order:** 001 → 021. Each migration includes `IF NOT EXISTS` / `IF EXISTS` guards for idempotency.

---

## 4. Auth Recovery

**Symptom:** Users can't log in. "Invalid login credentials" or "Database error creating new user".

**Diagnosis:**

```sql
-- Check if handle_new_user trigger is correct
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check trigger exists
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

**Fix for "Database error creating new user":**
- Root cause: `handle_new_user` trigger missing `SET search_path = public, auth`
- Run: `supabase/migrations/020_restore_robust_trigger.sql`

**Fix for wrong roles:**
- Run `create-demo-users` endpoint — Step 2 upserts correct roles

---

## 5. Vendor Stuck in Pending

**When:** A vendor applied but their status is stuck at `pending` and they can't see their dashboard data.

**Steps:**
1. Admin: go to `/admin/vendors`, search for the vendor
2. Click "Approve" or check their profile for issues
3. If the vendor is missing from the table entirely, check:
   ```sql
   SELECT id, business_name, status, user_id 
   FROM vendors 
   WHERE created_at > NOW() - INTERVAL '7 days'
   ORDER BY created_at DESC;
   ```
4. If vendor row exists but `status = 'pending'`, use admin UI to approve
5. If vendor row is missing, the apply form may have failed to insert — check Sentry for errors from the apply API route

---

## 6. Sentry Alert Response

**When:** Sentry fires an alert for an unhandled exception.

**Triage:**
1. Check Sentry for the full stack trace and request context
2. Look for `requestId` in the Sentry event — use this to correlate with Vercel logs
3. Check `userId` if present — identify affected user
4. Check Vercel logs: Dashboard → Project → Logs → filter by `x-request-id` header

**Common causes:**
| Error | Likely Cause | Fix |
|---|---|---|
| `relation "xyz" does not exist` | Migration not applied | Run the migration |
| `JWT expired` | Session cookie aged out | User needs to re-login |
| `Database error saving new user` | handle_new_user trigger | Run migration 020 |
| `Invalid API key` | Missing env var | Check Vercel environment variables |

---

## 7. Health Check Failure

**Endpoint:** `GET /api/health`

**Expected response (healthy):**
```json
{
  "status": "ok",
  "timestamp": "...",
  "checks": {
    "database": { "status": "ok", "latencyMs": 45 },
    "auth": { "status": "ok", "latencyMs": 32 },
    "storage": { "status": "ok", "latencyMs": 28 },
    "environment": { "status": "ok" }
  }
}
```

**If `database` is `"error"`:**
- Check Supabase Dashboard → Project health
- Check if Supabase project is paused (free tier pauses after 1 week inactive)
- Check `SUPABASE_SERVICE_ROLE_KEY` is valid

**If `auth` is `"degraded"`:**
- Supabase GoTrue service may be degraded
- Check https://status.supabase.com

**If `environment` is `"error"`:**
- A required env var is missing in the deployment
- Check Vercel → Project → Settings → Environment Variables

---

## 8. Database Emergency Access

**Direct SQL access (Supabase Dashboard):**
1. Log in to supabase.com → your project
2. SQL Editor → New query

**Useful diagnostic queries:**
```sql
-- Recent auth activity
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 20;

-- Vendor pipeline health
SELECT status, COUNT(*) as count 
FROM vendors 
GROUP BY status;

-- Recent bookings
SELECT b.id, b.status, b.payment_status, b.total_amount, b.created_at
FROM bookings b
ORDER BY b.created_at DESC
LIMIT 20;

-- Recent admin audit trail
SELECT action, entity_type, entity_id, ip_address, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 50;
```

---

## 9. Rate Limit Incident

**Symptom:** Legitimate users getting 429 responses.

**Current limits** (lib/rate-limit.ts):
| Endpoint type | Limit | Window |
|---|---|---|
| Auth | 10 req | 60s |
| AI | 20 req | 60s |
| Payment | 10 req | 60s |
| Upload | 20 req | 60s |
| General API | 60 req | 60s |

**Brute force lockout** (lib/security/bruteForce.ts):
- 5 failed login attempts → 30-minute lockout per IP/email
- Window: 15 minutes
- Auto-clears after lockout expires

**If a legitimate user is locked out:**
- Rate limiter is in-memory — it resets on server restart
- On Vercel: each function invocation may hit a different instance; memory is not shared
- For persistent cross-instance limits, upgrade to Upstash Redis (see lib/rate-limit.ts comment)

---

## 10. Storage Recovery

**If vendor media is missing:**
1. Check Supabase Storage → `vendor-media` bucket
2. Verify files exist at the expected paths
3. `vendor_media.url` stores the public URL — check it matches the bucket URL pattern

**If verification documents are inaccessible:**
1. Verification docs are in the private `verification-documents` bucket
2. Access via signed URL: `GET /api/verification/document?path=verification/{vendorId}/{type}/{filename}`
3. Signed URLs expire after 1 hour — regenerate by calling the endpoint again
4. If files are missing from storage but DB record exists, the document must be re-uploaded

**Manual signed URL generation (emergency):**
```javascript
// In Supabase JS client with service role
const { data } = await supabase.storage
  .from('verification-documents')
  .createSignedUrl('verification/vendor-id/passport.pdf', 3600);
```

---

## 11. Local Development Setup

**When:** New developer setting up the project, or after a clean machine rebuild.

**Steps:**

1. **Install Node.js 20** (matches CI) — use nvm or download from nodejs.org

2. **Clone the repo:**
   ```bash
   git clone <repo-url>
   cd bold-party-planner
   npm ci
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env.local` (if `.env.example` exists)
   - Or create `.env.local` with all required variables (see `docs/environments.md` → Required for local development)
   - Use the **dev/shared Supabase project** credentials — never production

4. **Create demo users:**
   ```bash
   npm run dev
   # In a separate terminal:
   curl -X POST http://localhost:3000/api/auth/create-demo-users \
     -H "Content-Type: application/json" \
     -d '{"secret":"BOLD_PARTY_DEMO_2026"}'
   ```

5. **Seed E2E data:**
   ```bash
   curl -X POST http://localhost:3000/api/dev/seed-e2e \
     -H "Content-Type: application/json" \
     -d '{"secret":"BOLD_PARTY_SEED_2026"}'
   ```

6. **Verify:**
   - `GET http://localhost:3000/api/health` returns all green
   - Log in as `james.bennett@boldparty.demo` / `BoldPartyDemo2026!`

**Verify:** App loads at `http://localhost:3000`, all health checks pass.

---

## 12. Staging Deploy

**When:** Validating a branch before merging to `main`, or testing migrations before production.

**Steps:**

1. Push your branch to GitHub — Vercel automatically creates a preview deployment for every branch push
2. Find the preview URL in GitHub → Pull Request → Vercel bot comment, or in Vercel Dashboard → Deployments
3. Confirm the preview deployment uses staging env vars (check Vercel → Project → Settings → Environment Variables scoped to "Preview")
4. Run the smoke test against the preview URL:
   - Health check: `GET https://<preview-url>.vercel.app/api/health`
   - Login, vendor browse, vendor profile
5. Run Playwright against the preview URL if needed:
   ```bash
   PLAYWRIGHT_BASE_URL=https://<preview-url>.vercel.app npm run test:e2e
   ```

**Note:** Preview deployments share the dev Supabase project by default. If using a dedicated staging Supabase project, set env vars in Vercel → Project → Settings → Environment Variables → scope to "Preview".

---

## 13. Production Deploy

**When:** Promoting tested code from `main` to production.

**Pre-deploy checklist:** Complete `docs/production-checklist.md` → Pre-Deployment Checklist before proceeding.

**Steps:**

1. Ensure all pending migrations have been applied to the production Supabase project (see Runbook 14)
2. Merge the PR to `main` (or push directly if using branch protection)
3. Vercel auto-deploys from `main` to production — monitor the deployment in Vercel Dashboard
4. Watch the deployment log for build errors (~3–5 minutes)
5. After deployment completes:
   - `GET https://boldparty.co.uk/api/health` — confirm all green
   - Run the smoke test (see `docs/production-checklist.md` → Post-Deployment Smoke Test)
6. Monitor Sentry for new errors in the first 30 minutes

**If the deployment fails:** Do not retry immediately. Check the Vercel build log, fix the root cause, then push a new commit.

**If the deployment succeeds but introduces a regression:** Roll back immediately (see Runbook 15).

---

## 14. Migration Deploy Order

**When:** A database migration needs to be applied alongside a code deployment.

**Critical rule:** Apply the migration **before** deploying the code that depends on it. Rolling back a schema change is harder than rolling back a deployment.

**Steps:**

1. **Take a snapshot** (Supabase Dashboard → Backups → Create manual backup on paid plan)
2. Open Supabase Dashboard → SQL Editor for the production project
3. Apply migrations in order, one at a time:
   - Paste the content of `supabase/migrations/NNN_*.sql`
   - Run it
   - Verify: no red error output, check the affected table in the Table Editor
4. Run `NOTIFY pgrst, 'reload schema';` if the migration adds tables, columns, or views
5. Verify the schema is correct before deploying the app:
   ```sql
   -- Confirm new column/table exists
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'affected_table';
   ```
6. Deploy the application (Runbook 13)

**Migration numbering:** `001` → `021` (as of Phase 21). Always apply sequentially — never skip a number.

**If a migration errors mid-run:**
- Do not re-run until you understand what partially applied
- Check which parts completed and write a corrective SQL patch
- See `docs/disaster-recovery.md` → Broken Migration

---

## 15. Rollback Procedures

### Vercel deployment rollback

1. Vercel Dashboard → Project → Deployments
2. Find the last known-good deployment (the one before the current production)
3. Click "..." → **Promote to Production**
4. Wait ~2 minutes
5. Verify `GET /api/health` + smoke test

**When to rollback vs fix-forward:**
- Rollback if: the current production is actively broken and a rollback restores functionality
- Fix-forward if: the issue is minor, a fix is ready within 30 minutes, and rollback would cause its own disruption

### Database rollback (schema)

There is no automated schema rollback. Write a reverse migration:

```sql
-- Example: undo adding a NOT NULL column
ALTER TABLE bookings ALTER COLUMN new_column DROP NOT NULL;
-- Or drop if you need to fully undo
ALTER TABLE bookings DROP COLUMN IF EXISTS new_column;
```

Apply via Supabase Dashboard → SQL Editor, then run `NOTIFY pgrst, 'reload schema';`.

### Data rollback (accidental writes)

See `docs/disaster-recovery.md` → Accidental Production Writes.

---

## 16. CI Troubleshooting

**When:** GitHub Actions CI is failing or behaving unexpectedly.

### Build job failures

| Symptom | Likely cause | Fix |
|---|---|---|
| TypeScript error in CI but not local | Different `tsconfig` or missing type declarations | Run `npx tsc --noEmit` locally with `NODE_ENV=production` |
| Build fails: "Module not found" | Missing import, wrong path, case-sensitivity (CI is Linux, local may be macOS) | Check exact import path case |
| Build fails: missing env var | Env var in CI secrets list but not passed to the step | Add to `.github/workflows/ci.yml` build step `env:` block |
| Lint fails | ESLint rule violation | Run `npm run lint` locally to see the exact error |

### E2E job failures

| Symptom | Likely cause | Fix |
|---|---|---|
| E2E job skipped | PR targets `develop` not `main` | Expected — E2E only runs on pushes/PRs to `main` |
| Seed endpoint 403 | `CI=true` not set or seed secret wrong | Verify CI env has `CI: "true"` and correct seed secret |
| Tests fail: "element not found" | Selector changed; test data not seeded | Check Playwright report artifact; re-run seed |
| Tests fail: "timeout waiting for page" | App didn't start in time | Check e2e job logs — `npm start` step should show server started |
| Download artifact fails | Build job failed or artifact not uploaded | Fix build job first; artifact is uploaded only on success |

### Viewing CI artifacts

1. GitHub → Actions → click the failed workflow run
2. Scroll to **Artifacts** at the bottom
3. Download `playwright-report-<sha>` → open `index.html`
4. On failure, download `playwright-results-<sha>` for traces and screenshots

---

## 17. Playwright Troubleshooting

**When:** E2E tests failing locally or in CI.

### Common issues

**Tests fail with "Cannot find element" or wrong content:**
1. Check if `data-testid` attribute is present in the component
2. Check if the page requires auth — global.setup must have run first
3. Run a single test in headed mode: `npx playwright test tests/vendor.spec.ts --headed`

**Tests fail with "net::ERR_CONNECTION_REFUSED":**
1. App is not running on the expected port
2. In local dev: `npm run dev` must be running first
3. In CI: `npm start` should auto-start in the Playwright config — check `playwright.config.ts` `webServer` block

**Global setup fails:**
1. Check that demo user endpoint is accessible: `GET http://localhost:3000/api/health`
2. Check that seed secret is correct in env
3. In CI: `CI=true` must be set for the seed endpoint to work in production build mode

**Tests pass locally but fail in CI:**
1. CI uses `npm start` (production build); local uses `npm run dev` (Turbopack)
2. Behavior differences: check for `"use client"` components that behave differently in SSR
3. Timing: CI may be slower — check if timeouts need increasing

**Running specific tests:**
```bash
# Single file
npx playwright test tests/vendor.spec.ts

# Single test by name
npx playwright test -g "vendor dashboard shows stats"

# With UI mode
npx playwright test --ui

# Show trace from previous run
npx playwright show-trace test-results/trace.zip
```

---

## 18. Seed Troubleshooting

**When:** Demo users or test data are in an unexpected state.

### Seed endpoint returns 403

Causes:
1. Wrong secret — verify `BOLD_PARTY_SEED_2026` matches the env var or hardcoded check
2. Running in production mode without `CI=true` — seed is blocked in production by default
3. Route not accessible — check the app is running and the endpoint exists

### Seed succeeds but data is wrong

Causes:
1. Previous seed run partially failed, leaving orphaned rows
2. FK constraints blocked some inserts (check the seed response body for errors)
3. The seed SQL has been updated but the route hasn't been redeployed

**Full reset:**
```bash
# 1. Run the seed — it deletes before inserting (idempotent)
curl -X POST http://localhost:3000/api/dev/seed-e2e \
  -H "Content-Type: application/json" \
  -d '{"secret":"BOLD_PARTY_SEED_2026"}'

# 2. If demo users are broken, reset auth first
# Run supabase/migrations/019_force_demo_auth_cleanup.sql in Supabase SQL Editor
# Then:
curl -X POST http://localhost:3000/api/auth/create-demo-users \
  -H "Content-Type: application/json" \
  -d '{"secret":"BOLD_PARTY_DEMO_2026"}'

# 3. Then re-run seed
```

### Seed creates duplicate key errors

The seed route deletes data before inserting using fixed UUIDs. If a delete fails silently, the subsequent insert hits a duplicate key constraint.

**Diagnosis:** Check the response body — the seed endpoint returns a JSON object with per-step results.

**Fix:** Manually delete the conflicting rows via Supabase SQL Editor:
```sql
-- Delete in reverse FK order
DELETE FROM reviews WHERE customer_id IN ('b0000001-...', 'b0000002-...', 'b0000003-...');
DELETE FROM bookings WHERE customer_id IN ('b0000001-...', 'b0000002-...', 'b0000003-...');
DELETE FROM quotes WHERE customer_id IN ('b0000001-...', 'b0000002-...', 'b0000003-...');
DELETE FROM events WHERE user_id IN ('b0000001-...', 'b0000002-...', 'b0000003-...');
```

---

## 19. Sentry Setup Troubleshooting

**When:** Sentry is not capturing errors, source maps are missing, or the tunnel isn't working.

### Errors not appearing in Sentry

1. Verify `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are set in the deployment environment
2. Check `sentry.server.config.ts` and `sentry.client.config.ts` for the DSN
3. In local dev: Sentry may be intentionally suppressed if DSN is not set — this is expected
4. Check browser network tab for requests to `/monitoring` (the tunnel route)

### Source maps not uploading

Source maps are uploaded during `npm run build` via the Sentry webpack plugin. Requires:
- `SENTRY_AUTH_TOKEN` set in CI (GitHub Actions secret)
- `SENTRY_ORG` and `SENTRY_PROJECT` set

**Check CI build logs** for `Sentry: uploading source maps` messages. If missing, the token or org/project config is wrong.

### Tunnel route blocked

The app routes Sentry events through `/monitoring` (configured via `tunnelRoute: "/monitoring"` in `next.config.ts`). This avoids ad-blocker drops.

If the `/monitoring` route returns 404: Sentry's Next.js SDK automatically creates this route — check if `withSentryConfig` is still wrapping `nextConfig` in `next.config.ts`.

### Testing Sentry manually

Trigger a test error in the browser console:
```javascript
// Will be captured by Sentry client config
throw new Error("Sentry test error");
```

Or via the Sentry SDK in a server route:
```typescript
import * as Sentry from "@sentry/nextjs";
Sentry.captureMessage("Sentry test message", "info");
```
