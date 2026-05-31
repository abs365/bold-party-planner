# ELBOLD — Production Health Checklist

**Version:** 1.0

Use this checklist before every production deployment and after every incident recovery.

---

## Pre-Deployment Checklist

Run through this before promoting any build to production.

### CI / Build

- [ ] All CI jobs pass on the target commit (GitHub Actions → green checkmark)
- [ ] TypeScript check passes (`tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Production build passes (`npm run build`)
- [ ] Playwright E2E tests pass (CI e2e job)

### Database

- [ ] All required migrations have been applied to production Supabase
  - Check: Supabase Dashboard → SQL Editor → `SELECT MAX(version) FROM schema_migrations;` (if tracked)
  - Or verify manually: each migration file in `supabase/migrations/` has been run
- [ ] `NOTIFY pgrst, 'reload schema';` has been sent after any schema change
- [ ] No pending migrations that the new application code depends on
- [ ] RLS policies for any new tables are in place

### Environment Variables

- [ ] All required env vars are present in Vercel → Project → Settings → Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` points to the production Supabase project
- [ ] `STRIPE_SECRET_KEY` is the **live** Stripe key (not `sk_test_`)
- [ ] `ADMIN_EMAILS` includes the production admin email(s)
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` are set
- [ ] `CRON_SECRET` is set and matches the Vercel cron configuration

### Observability

- [ ] Sentry project is healthy (no backlog of unresolved errors from prior deploy)
- [ ] `GET /api/health` returns `"status": "ok"` on the current production deployment
  ```bash
  curl https://elbold.com/api/health
  ```
- [ ] All health check components return `"ok"`:
  - [ ] `database`
  - [ ] `auth`
  - [ ] `storage`
  - [ ] `environment`

### Audit & Analytics

- [ ] `audit_logs` table exists and has recent rows (confirms migration 021 is applied)
- [ ] `analytics_events` table exists and has recent rows
- [ ] Test admin action creates an audit log row

### Seed Data Safety

- [ ] `CI` env var is NOT set in Vercel production environment
- [ ] Seed endpoints return 403 when called without the demo secret
- [ ] No `@elbold.demo` accounts present in production (these belong in dev/staging only)

---

## Post-Deployment Smoke Test

After every production deployment, manually verify the critical path:

### Public paths

- [ ] Homepage loads (`/`)
- [ ] Browse/marketplace loads (`/browse`) with vendors visible
- [ ] A vendor profile loads (`/vendors/<id>`)
- [ ] Login page loads (`/login`)

### Auth flow

- [ ] A test customer account can log in
- [ ] Redirected to `/dashboard` after login
- [ ] Session persists on page refresh

### Vendor flow

- [ ] Vendor can log in and see `/vendor/dashboard`
- [ ] Vendor dashboard shows bookings and stats
- [ ] Vendor profile page shows their media and packages

### Admin flow

- [ ] Admin can log in and see `/admin`
- [ ] Admin dashboard shows all KPI stats
- [ ] Vendor moderation queue loads

### Payments (staging only — not on production unless explicitly testing)

- [ ] Stripe test payment completes without error
- [ ] Booking status updates after Stripe webhook received

---

## Post-Incident Recovery Checklist

After any SEV-1 or SEV-2 incident is resolved:

- [ ] `GET /api/health` returns fully healthy
- [ ] Login works for customer, vendor, and admin roles
- [ ] The specific feature that failed is now working correctly
- [ ] No new Sentry errors in the last 10 minutes
- [ ] Vercel function error rate returned to baseline
- [ ] Any affected data has been restored or corrected
- [ ] Incident log updated in `docs/incident-response.md`
- [ ] Postmortem document created in `docs/postmortems/`
- [ ] Deployment freeze lifted (if applicable)
- [ ] Stakeholders notified of resolution

---

## Periodic Health Checks (Weekly)

Run weekly in production to catch slow degradation:

### Database

```sql
-- Vendor pipeline health
SELECT status, COUNT(*) FROM vendors GROUP BY status ORDER BY count DESC;

-- Booking pipeline health
SELECT status, COUNT(*) FROM bookings WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY status;

-- Recent auth activity (no red flags)
SELECT DATE(created_at), COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY 1;
```

### Storage

- [ ] `vendor-media` bucket is accessible (image loads in browser)
- [ ] `verification-documents` bucket is accessible (signed URL generates without error)
- [ ] No orphaned storage files (files in storage without a corresponding DB row — use the upload route's rollback logic as the check)

### Performance

- [ ] Check Vercel function execution time averages (Vercel Dashboard → Analytics)
- [ ] Review any `api.slow_request` warnings in Vercel logs (requests > 2000ms)
- [ ] Run Lighthouse on vendor browse and a vendor profile page

### Security

- [ ] Review Sentry for any new `auth.login_failed` spike
- [ ] Check audit_logs for any unusual admin action patterns
- [ ] Verify `ADMIN_EMAILS` still contains only intended admin accounts

---

## Launch Readiness Checklist (One-time)

Complete before going live with real users:

### Platform

- [ ] Stripe switched from test mode to live mode
- [ ] Stripe webhooks configured to production URL (`/api/webhooks/stripe`)
- [ ] Resend email domain verified for production domain
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL (`https://elbold.com`)
- [ ] Custom domain configured in Vercel

### Legal & compliance

- [ ] Terms of Service published at `/terms`
- [ ] Privacy Policy published at `/privacy`
- [ ] Cookie policy compliant with UK/GDPR requirements
- [ ] Refund and dispute policy published or communicated to vendors

### Support

- [ ] Support contact channel is live and monitored
- [ ] Admin team trained on moderation workflows (see `docs/support-operations.md`)
- [ ] Sentry alerts routed to admin team
- [ ] Uptime monitor configured for `GET /api/health`

### Content

- [ ] All demo/placeholder content removed from production
- [ ] At least 3–5 real approved vendor profiles present for browse page
- [ ] Homepage copy is final
- [ ] Email templates use the production sender domain
