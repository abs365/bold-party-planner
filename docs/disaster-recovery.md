# Bold Party Planner — Disaster Recovery

**Version:** 1.0

Recovery timing expectations are estimates based on self-hosted Supabase + Vercel architecture.

---

## Recovery Order (Critical Path)

When multiple systems fail simultaneously, restore in this order:

1. **Auth** — users can't log in without it; everything depends on it
2. **Database** — RLS, profiles, vendors, bookings
3. **Application** (Vercel deployment)
4. **Storage** — media and documents
5. **Email (Resend)** — notifications; platform works without it
6. **Analytics/Audit** — non-blocking; no functional impact

---

## 1. Supabase Outage

**Symptoms:** `GET /api/health` returns `database: "error"`. All database reads return errors. Users can't log in.

**Diagnosis:**
1. Check https://status.supabase.com for active incidents
2. Check Supabase Dashboard → Project → health tab

**If Supabase project is paused (free tier):**
1. Open Supabase Dashboard → Project Settings → General
2. Click "Restore project"
3. Wait 2–5 minutes for restart
4. Verify `GET /api/health`

**If Supabase has a regional outage:**
- Nothing to do except wait and monitor https://status.supabase.com
- Expected recovery: minutes to hours (outside our control)
- Consider: display a maintenance page via Vercel Edge Config or a static page redirect

**Validation checklist:**
- [ ] `GET /api/health` returns `database: "ok"`
- [ ] Login works for a demo user
- [ ] Vendor browse page loads

**Expected recovery time:** 2–60 minutes (project pause) / Supabase ETA (regional outage)

---

## 2. Auth Failure

**Symptoms:** "Invalid login credentials" for known good accounts, "Database error saving new user" on registration, sessions not persisting.

**Type A — GoTrue trigger failure:**

```sql
-- Verify the trigger exists and is correct
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

If the trigger is missing or wrong: run `supabase/migrations/020_restore_robust_trigger.sql` in the Supabase Dashboard → SQL Editor.

**Type B — Session not persisting:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct in Vercel
- Check `proxy.ts` is not throwing errors (check Sentry / Vercel function logs)
- Verify `@supabase/ssr` cookie handling is intact

**Type C — Demo user auth broken:**
- See `docs/runbooks.md` → Runbook 1: Demo User Reset

**Validation checklist:**
- [ ] Log in as a known demo user succeeds
- [ ] New test account registration creates a `profiles` row
- [ ] `auth.users` and `profiles` counts match

**Expected recovery time:** 5–15 minutes

---

## 3. Storage Outage

**Symptoms:** Vendor media images return 403 or 404. Uploads fail. Verification documents can't be retrieved.

**Diagnosis:**
1. Check `GET /api/health` → `storage: "error"` or `"degraded"`
2. Check Supabase Dashboard → Storage → bucket status
3. Check https://status.supabase.com for storage incidents

**If bucket exists but files are inaccessible:**
```sql
-- Check recent upload records
SELECT id, url, created_at FROM vendor_media ORDER BY created_at DESC LIMIT 10;
```
- Try accessing one URL directly in browser
- If URL returns 404, file was uploaded to DB but storage write failed (partial failure)

**If bucket policies are wrong:**
1. Supabase Dashboard → Storage → vendor-media → Policies
2. `vendor-media` must be: public read, authenticated write
3. `verification-documents` must be: private, signed URL access only

**For missing verification documents:**
- The document must be re-uploaded by the vendor
- Admin can remove the `verification_documents` DB record to allow re-upload

**Validation checklist:**
- [ ] `GET /api/health` returns `storage: "ok"`
- [ ] A vendor's cover image loads in the browser
- [ ] A verification document signed URL is generated

**Expected recovery time:** 5–30 minutes (config issues) / Supabase ETA (outage)

---

## 4. Broken Migration

**Symptoms:** After applying a migration, page routes return 500, queries fail with "column X does not exist" or "relation X does not exist".

**Immediate steps:**
1. Do not apply any further migrations
2. Check Sentry for the exact error — note the table/column name
3. Check Supabase Dashboard → Table Editor or SQL Editor to verify schema state

**Recovery approach — forward-only fix:**

Migrations are forward-only. Never manually restore a backup unless data loss is otherwise unavoidable.

1. Write a corrective migration that undoes the breaking change:
   ```sql
   -- Example: if migration added a NOT NULL column that broke inserts
   ALTER TABLE bookings ALTER COLUMN new_column DROP NOT NULL;
   -- or
   ALTER TABLE bookings DROP COLUMN IF EXISTS new_column;
   ```
2. Apply the corrective migration via Supabase Dashboard → SQL Editor
3. Run `NOTIFY pgrst, 'reload schema';`
4. Verify `GET /api/health`
5. Deploy a fixed application version if any code referenced the broken schema

**If migration corrupted data (not just schema):**
1. Stop all writes to the affected table immediately (use Vercel rollback to previous app version)
2. Assess data loss scope via SQL:
   ```sql
   -- Audit recent changes
   SELECT * FROM audit_logs WHERE entity_type = 'affected_table' ORDER BY created_at DESC LIMIT 50;
   ```
3. Restore affected rows from Supabase automated backup if available (Dashboard → Backups)
4. Write corrective SQL to patch any remaining inconsistencies

**Validation checklist:**
- [ ] `GET /api/health` returns `database: "ok"`
- [ ] Affected table queries return correct results
- [ ] No new Sentry errors for the affected routes

**Expected recovery time:** 15–60 minutes

---

## 5. Corrupted Seed Data

**Symptoms:** Playwright E2E tests failing due to unexpected data state. Demo users behaving unexpectedly. Marketplace showing unexpected data.

**Note:** Seed data and production data are separate concerns. "Corrupted seed data" only affects demo/test scenarios, not real user data.

**Recovery steps:**

1. Reset demo auth:
   ```bash
   # Run in Supabase Dashboard → SQL Editor
   # File: supabase/migrations/019_force_demo_auth_cleanup.sql
   ```

2. Recreate demo users:
   ```bash
   curl -X POST https://your-app.vercel.app/api/auth/create-demo-users \
     -H "Content-Type: application/json" \
     -d '{"secret":"BOLD_PARTY_DEMO_2026"}'
   ```

3. Re-seed E2E data:
   ```bash
   curl -X POST http://localhost:3000/api/dev/seed-e2e \
     -H "Content-Type: application/json" \
     -d '{"secret":"BOLD_PARTY_SEED_2026"}'
   ```

**Validation checklist:**
- [ ] Can log in as `james.bennett@boldparty.demo` / `BoldPartyDemo2026!`
- [ ] Marketplace shows 5 vendors
- [ ] Admin dashboard shows expected stats
- [ ] Playwright global.setup passes

**Expected recovery time:** 5–10 minutes

---

## 6. Failed Deployment

**Symptoms:** Vercel deployment failed or succeeded but introduced a regression. Current production is broken.

**Immediate rollback:**
1. Vercel Dashboard → Project → Deployments
2. Find the last successful deployment (green checkmark before the incident)
3. Click "..." → **Promote to Production**
4. Wait ~2 minutes for switchover
5. Verify `GET /api/health`

**Preventing redeployment of the broken build:**
- The broken commit is still in git — do not trigger CI again from main until the fix is ready
- Either revert the commit: `git revert <sha>` and push, or push a fix commit

**If deployment is stuck or queued:**
1. Vercel Dashboard → Deployments → cancel the stuck deployment
2. Re-trigger from the known-good commit

**Validation checklist:**
- [ ] Vercel shows previous deployment as "Production"
- [ ] `GET /api/health` returns OK
- [ ] Login works
- [ ] Affected page/feature works correctly

**Expected recovery time:** 3–5 minutes (rollback) + time to identify and push the fix

---

## 7. Environment Variable Loss

**Symptoms:** Deployment succeeded but features are broken. Auth fails, payments fail, emails not sending. `GET /api/health` returns `environment: "error"`.

**Diagnosis:**
1. Check `GET /api/health` → look for `environment: "error"` or missing var name
2. Check Vercel Dashboard → Project → Settings → Environment Variables
3. Look for recently deleted or renamed variables

**Recovery:**
1. Re-add the missing environment variable in Vercel Dashboard
2. Redeploy (a new deployment is required for env var changes to take effect — Vercel does not hot-reload env vars)
3. Verify `GET /api/health` after deployment

**Required environment variables (minimum viable):**

| Variable | Impact if missing |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All DB/auth calls fail |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All DB/auth calls fail |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations fail |
| `STRIPE_SECRET_KEY` | Payments fail |
| `STRIPE_WEBHOOK_SECRET` | Webhook validation fails |
| `RESEND_API_KEY` | Emails not sent |
| `OPENAI_API_KEY` | AI features fail |
| `ADMIN_EMAILS` | Admin login blocked |
| `CRON_SECRET` | Cron jobs blocked |

**Validation checklist:**
- [ ] `GET /api/health` returns `environment: "ok"`
- [ ] Login works
- [ ] Test a payment flow on staging before re-enabling production

**Expected recovery time:** 5–15 minutes (if variable values are known)

> **Keep a secure offline record of all production environment variable values.**
> Vercel does not allow reading back secret values after initial save.

---

## 8. Accidental Production Writes

**Symptoms:** Real user data modified or deleted unintentionally via a script, migration error, or SQL run against the wrong project.

**Immediate steps:**
1. Stop the source of writes immediately (kill the script, disconnect the client)
2. Assess scope: what data was affected, how many rows, which tables

**Assessment queries:**
```sql
-- Check audit_logs for recent admin actions
SELECT action, entity_type, entity_id, actor_id, ip_address, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;

-- Check recent bookings for unexpected status changes
SELECT id, status, payment_status, updated_at
FROM bookings
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Check recently deleted vendors (if soft delete exists)
SELECT id, business_name, status, updated_at
FROM vendors
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

**Recovery options:**
1. **Manual reversal** — write corrective SQL to restore the affected rows to their previous state (use audit_logs as the source of truth for previous values if they were logged)
2. **Point-in-time restore** (Supabase paid plan) — restore DB to a snapshot before the incident; requires taking the platform offline during restore
3. **Partial restore** — extract affected rows from a Supabase backup, restore only those rows

**Validation checklist:**
- [ ] Affected users' data is restored to pre-incident state
- [ ] No active user sessions show stale data
- [ ] Audit log shows corrective action

**Expected recovery time:** 30 minutes to several hours depending on scope

---

## 9. Audit / Analytics Outage

**Symptoms:** `analytics_events` inserts failing, `audit_logs` inserts failing, admin audit trail not recording.

**Impact:** Audit and analytics failures are **non-blocking** — the platform continues to function. No user-facing features depend on them. However, audit gaps in `audit_logs` are a compliance concern.

**Diagnosis:**
```sql
-- Check if tables exist and have recent rows
SELECT COUNT(*), MAX(created_at) FROM audit_logs;
SELECT COUNT(*), MAX(created_at) FROM analytics_events;
```

**If tables don't exist:** Migration 021 has not been applied. Run `supabase/migrations/021_analytics_and_audit.sql`.

**If inserts are failing due to RLS:**
```sql
-- audit_logs and analytics_events must have RLS that allows service role inserts
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('audit_logs', 'analytics_events');
```

**If service role key is wrong or missing:**
- Check `SUPABASE_SERVICE_ROLE_KEY` in Vercel env vars
- `createAdminClient()` (which uses the service role) is what writes audit logs

**Audit gap note:** If audit logging was broken for a period, note the gap in `docs/incident-response.md` → Incident Log with a timestamp range.

**Validation checklist:**
- [ ] INSERT to `audit_logs` succeeds via SQL Editor with service role
- [ ] A test admin action (e.g., visit `/admin`) creates a new audit_log row
- [ ] `analytics_events` shows recent rows

**Expected recovery time:** 5–15 minutes

---

## Recovery Validation Checklist (Universal)

After any recovery action, confirm all of the following before declaring the incident resolved:

- [ ] `GET /api/health` returns `"status": "ok"` with all checks passing
- [ ] Login works as a customer, vendor, and admin (demo accounts)
- [ ] Vendor marketplace loads with vendors
- [ ] Vendor profile page loads
- [ ] Admin dashboard loads with stats
- [ ] No new Sentry errors for the last 5 minutes
- [ ] Vercel function error rate is back to baseline
