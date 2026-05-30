# ELBOLD — GitHub Actions CI/CD

## Overview

The CI pipeline is defined in `.github/workflows/ci.yml`. It runs on every push
to `main`, `develop`, and `release/**` branches, and on every pull request targeting
`main` or `develop`.

### Pipeline Structure

```
push / PR
   │
   ▼
┌──────────────────────────────┐
│  build (all pushes + PRs)    │  ~8–12 min
│                              │
│  1. npm ci                   │
│  2. tsc --noEmit             │
│  3. npm run lint             │
│  4. npm test                 │
│  5. npm run build            │
│  6. upload .next/ artifact   │
└──────────────┬───────────────┘
               │ needs: build
               │ only on: push→main, PR→main
               ▼
┌──────────────────────────────┐
│  e2e                         │  ~15–25 min
│                              │
│  1. npm ci                   │
│  2. playwright install       │
│  3. download .next/ artifact │
│  4. npm run test:e2e         │
│     (via `npm start`)        │
│  5. upload HTML report       │
│  6. upload traces (failure)  │
└──────────────────────────────┘
```

### Blocking rules

| Failure | Blocks merge? |
|---|---|
| TypeScript error | ✓ (build job) |
| Lint error | ✓ (build job) |
| Production build failure | ✓ (build job) |
| Playwright test failure | ✓ (e2e job, PRs to main only) |

---

## Required GitHub Secrets

Add these in: **GitHub → Repository → Settings → Secrets and variables → Actions**

### Critical (CI will fail without these)

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (`https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin operations) |
| `ADMIN_EMAILS` | Comma-separated admin emails (e.g. `admin@elbold.com`) |

### Required for build to succeed

| Secret | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key for emails |
| `OPENAI_API_KEY` | OpenAI API key for Smart Planner/Concierge |

### Optional (build succeeds without these, features degrade)

| Secret | Description |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Public URL (defaults to `https://elbold.com`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error tracking |
| `SENTRY_DSN` | Sentry DSN for server-side error tracking |
| `SENTRY_ORG` | Sentry org slug (for source map upload) |
| `SENTRY_PROJECT` | Sentry project slug (for source map upload) |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (for source map upload in CI) |
| `CRON_SECRET` | Bearer token for cron job endpoints |

---

## How E2E Tests Work in CI

### Server mode

In CI (`CI=true`), Playwright starts **`npm start`** (the production server) rather
than `npm run dev` (Turbopack dev). This means:

- The `.next/` build artifact from Job 1 is reused — no recompilation
- Server startup takes ~5 seconds instead of ~3 minutes
- Behaviour matches the production deployment more closely

This is controlled in `playwright.config.ts`:
```typescript
command: process.env.CI ? "npm start" : "npm run dev"
```

### Demo data

`tests/global.setup.ts` runs before any test and:

1. **Creates demo users** — POSTs to `/api/auth/create-demo-users` with the demo secret.
   Creates 9 fixed-UUID users (5 vendors, 3 customers, 1 admin) in Supabase GoTrue.
   Idempotent — safe to re-run.

2. **Seeds E2E data** — POSTs to `/api/dev/seed-e2e` with the seed secret.
   Wipes and re-inserts all fixture data (packages, events, bookings, quotes, etc.).
   Uses fixed UUIDs so it is fully deterministic.

3. **Warms pages** — GETs all major routes. In production mode this is instant (no
   compilation). In dev mode this triggers Turbopack compilation.

### The seed endpoint in CI

`/api/dev/seed-e2e` normally blocks when `NODE_ENV === "production"`. In CI this
guard is bypassed when `CI === "true"`:

```typescript
if (process.env.NODE_ENV === "production" && !process.env.CI) {
  return NextResponse.json({ error: "Not available in production" }, { status: 403 });
}
```

This means the endpoint is available during CI E2E runs but blocked on real Vercel
production deployments (where `CI` is not set).

### Shared Supabase project

CI tests run against the **shared development Supabase project** (the same one used
locally). This means:

- Real GoTrue authentication is tested
- Real database queries are executed
- Real RLS policies are enforced

**Concurrency caveat:** If two CI runs target the same branch simultaneously, their
seed operations may transiently interfere. The `concurrency: cancel-in-progress: true`
setting prevents this for the same ref, but two different PRs could still conflict.
For a small team this is acceptable. For larger teams, use a per-PR Supabase branch
or Supabase preview environments.

---

## Playwright Test Report

After every E2E run (pass or fail), an HTML report is uploaded as a GitHub Actions
artifact named `playwright-report-<sha>`.

**To view:**
1. Go to the Actions tab on GitHub
2. Click the workflow run
3. Download `playwright-report-<sha>` from the Artifacts section
4. Open `index.html` in a browser

On failure, `playwright-results-<sha>` also contains:
- Trace files (open with `npx playwright show-trace trace.zip`)
- Screenshots
- Videos (if captured)

---

## Running CI Locally

To replicate what CI does, run these commands in order:

```bash
# 1. Clean install (mirrors npm ci)
rm -rf node_modules
npm ci

# 2. Type check
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Unit tests (placeholder)
npm test

# 5. Production build
npm run build

# 6. E2E tests against production build
CI=true npm run test:e2e
```

Or just run `npm run test:e2e` normally (uses `npm run dev` locally).

---

## Adding Unit Tests

The `npm test` command currently prints a placeholder message. To add unit tests:

1. Install a test runner: `npm install --save-dev vitest @vitest/ui`
2. Update `package.json`:
   ```json
   "test": "vitest run"
   ```
3. Add test files: `lib/__tests__/`, `components/__tests__/`, etc.

The CI pipeline will automatically pick them up — no workflow changes needed.

---

## Workflow Triggers Reference

| Event | build job | e2e job |
|---|---|---|
| Push to `main` | ✓ | ✓ |
| Push to `develop` | ✓ | ✗ |
| Push to `release/**` | ✓ | ✗ |
| PR → `main` | ✓ | ✓ |
| PR → `develop` | ✓ | ✗ |

To run E2E on `develop` PRs as well, add `github.base_ref == 'develop'` to the
`e2e` job `if:` condition in `.github/workflows/ci.yml`.
