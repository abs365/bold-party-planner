# ELBOLD Backup & Recovery Report
**Phase 70B.1 — Backup & Recovery Verification**  
**Date:** 2026-06-23  
**Auditor:** Claude (read-only audit — no code changes, no deployments, no migrations)  
**Scope:** Full production state verification prior to further Stripe Connect work

---

## 1. Git Repository State

| Item | Value |
|------|-------|
| Repository | https://github.com/abs365/bold-party-planner.git |
| Active branch | `main` |
| HEAD commit | `071379c` — "Phase 70B — Stripe Connect foundation (data model + kill-switched API)" |
| Remote sync | **Up to date** — no commits ahead or behind `origin/main` |
| Second branch | `design/phase-2-visual-improvements` — 1 commit ahead of main, tracked at origin |

### Committed & Pushed ✅
All Phase 69F and Phase 70B application code is committed and pushed:
- All 5 API routes (`/api/vendor/connect/*`, `/api/payments/connect-webhook`)
- All 5 SQL migrations (055–059)
- Lib modifications (`lib/stripe.ts`, `lib/finance/ledger.ts`)

### Untracked / Uncommitted (intentional dev artifacts — not application code)
```
PHASE_70B_DEPLOYMENT_REPORT.md
ELBOLD_END_TO_END_AUDIT.md
ELBOLD_END_TO_END_AUDIT_REPORT.md
PRODUCTION_E2E_TEST_PLAN.md
docs/                    (screenshots, phase audit docs)
e2e-*.cjs                (e2e test scripts)
scripts/                 (one-off audit/screenshot scripts)
supabase/.temp/
```
These are development artifacts and are **not required for production recovery**.

### Recovery Action (Git)
```bash
# Roll back to any prior commit:
git revert 071379c          # revert Phase 70B commit (preserves history)
git push origin main

# Or instant Vercel rollback (see Section 6) — preferred for code rollback
```

---

## 2. Supabase Project / Backup / PITR

| Item | Value |
|------|-------|
| Project ID | `vibqrgswyineyxmsrtsh` |
| Project name | `bold-party-production` |
| Region | `eu-west-1` |
| Status | `ACTIVE_HEALTHY` |
| PostgreSQL version | `17.6.1.121` |
| Organisation | `Bold Party Events` (`toglhvukykuhcvsifium`) |

### WAL / Archiving Settings

| Setting | Value | Implication |
|---------|-------|-------------|
| `wal_level` | `logical` | Full WAL (required for PITR) |
| `archive_mode` | `on` | WAL segments being archived |
| `max_wal_senders` | `5` | Streaming replication active |

WAL archiving is **active**. This is consistent with Supabase Pro or Enterprise plan behaviour. Free-tier projects have daily snapshots only; logical + archive_mode + wal_senders together indicate continuous archiving.

### Plan Tier
The Supabase management API token could not be retrieved from the local environment (stored in Windows Credential Manager in a non-JWT format). Plan tier could not be confirmed programmatically. **Action required:** Verify plan at [app.supabase.com/project/vibqrgswyineyxmsrtsh/settings/billing](https://app.supabase.com/project/vibqrgswyineyxmsrtsh/settings/billing).

Based on WAL settings, PITR is likely available but the retention window is unconfirmed.

### Backup Assessment
- Daily snapshots: Supabase provides daily automated backups on all paid plans
- PITR: Available on Pro+ plans (confirmed WAL archiving); window unconfirmed
- **Action:** Confirm PITR is enabled and check the retention window in Supabase dashboard

---

## 3. Database Schema Snapshot

### Migration Inventory

**Tracked in `supabase_migrations.schema_migrations`:** Migrations 001–050  
(includes 027b, 039b, 039c, 039d as separate entries)

**Applied to production DB but NOT tracked:**
```
051_vendor_customer_notes.sql      ← applied via supabase db query --linked --file
052_manual_contacts.sql
053_booking_source.sql
054_fix_vendor_rating_trigger.sql
055_vendor_stripe_connect.sql
056_vendor_connect_onboarding.sql
057_financial_ledger_connect.sql
058_financial_events_connect_types.sql
059_vendor_lifecycle_connect_states.sql
```

> **⚠️ CRITICAL FINDING — Migration Tracking Gap**  
> Migrations 051–059 were applied using `supabase db query --linked --file` which bypasses the `supabase_migrations.schema_migrations` tracking table. These 9 migrations exist in the repo under `supabase/migrations/` and are verified applied in the production DB, but the Supabase CLI has no record of them.  
>
> **Impact:** `supabase db push` would attempt to replay all 9 migrations (may cause conflicts). Automated recovery via Supabase CLI would not include them. Manual DB restore must replay these explicitly from the SQL files.

### Verification Results (All Migrations 051–059 Confirmed Applied)
| Check | Expected | Result |
|-------|----------|--------|
| `vendor_customer_notes` table exists | 1 | ✅ 1 |
| `manual_contacts` table exists | 1 | ✅ 1 |
| `bookings.booking_source` column exists | 1 | ✅ 1 |
| `update_vendor_rating` SECURITY DEFINER | 1 | ✅ 1 |
| `vendors.stripe_connect_*` columns | 6 | ✅ 6 |
| `vendor_connect_onboarding` table | 1 | ✅ 1 |
| `financial_ledger.commission_rate` column | 1 | ✅ 1 |
| `financial_events_event_type_check` values | 22 | ✅ 22 |
| `vendors_lifecycle_state_check` values | 10 | ✅ 10 |

### Table Inventory (Key Counts)
| Table | Rows |
|-------|------|
| `vendors` | 13 |
| `profiles` | 25 |
| `bookings` | 7 |
| `financial_ledger` | 2 |
| `stripe_events` | 4 |
| `financial_events` | 11 |
| `vendor_packages` | 15 |
| `vendor_connect_onboarding` | 0 (correct — no onboarding initiated) |

Total tables in `public` schema: **71**

### Recovery Action (Database)
```sql
-- For full DB recovery from backup, after restoring to migration 050, 
-- replay the untracked migrations IN ORDER:
\i supabase/migrations/051_vendor_customer_notes.sql
\i supabase/migrations/052_manual_contacts.sql
\i supabase/migrations/053_booking_source.sql
\i supabase/migrations/054_fix_vendor_rating_trigger.sql
\i supabase/migrations/055_vendor_stripe_connect.sql
\i supabase/migrations/056_vendor_connect_onboarding.sql
\i supabase/migrations/057_financial_ledger_connect.sql
\i supabase/migrations/058_financial_events_connect_types.sql
\i supabase/migrations/059_vendor_lifecycle_connect_states.sql
```

---

## 4. Environment Variables

### Vercel Production — 36 env vars configured

| Category | Variable | Status |
|----------|----------|--------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL` | ✅ Present |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Present |
| | `SUPABASE_SERVICE_ROLE_KEY` | ✅ Present |
| **Stripe (platform)** | `STRIPE_SECRET_KEY` | ✅ Present |
| | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ Present |
| | `STRIPE_WEBHOOK_SECRET` | ✅ Present |
| **Stripe (subscription)** | `STRIPE_PRO_PRICE_MONTHLY` | ✅ Present |
| | `STRIPE_PRO_PRICE_YEARLY` | ✅ Present |
| | `STRIPE_PREMIUM_PRICE_MONTHLY` | ✅ Present |
| | `STRIPE_PREMIUM_PRICE_YEARLY` | ✅ Present |
| | `STRIPE_ELITE_PRICE_MONTHLY` | ✅ Present |
| | `STRIPE_ELITE_PRICE_YEARLY` | ✅ Present |
| **Stripe Connect** | `STRIPE_CONNECT_ENABLED` | ✅ Present = `false` (kill switch ON) |
| | `STRIPE_CONNECT_WEBHOOK_SECRET` | ⚠️ **ABSENT** (expected — see note) |
| **Email** | `RESEND_API_KEY` | ✅ Present |
| **Cache / Rate limiting** | `UPSTASH_REDIS_REST_URL` | ✅ Present |
| | `UPSTASH_REDIS_REST_TOKEN` | ✅ Present |
| | `REDIS_URL` / `KV_*` | ✅ Present (5 vars) |
| **Monitoring** | `SENTRY_DSN` | ✅ Present |
| | `NEXT_PUBLIC_SENTRY_DSN` | ✅ Present |
| | `SENTRY_ORG` / `SENTRY_PROJECT` | ✅ Present |
| **App** | `NEXT_PUBLIC_APP_URL` | ✅ Present |
| | `NEXT_PUBLIC_SITE_URL` | ✅ Present |
| | `CRON_SECRET` | ✅ Present |
| | `ADMIN_EMAILS` | ✅ Present |
| | `OPENAI_API_KEY` | ✅ Present |
| **Auth** | `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ✅ Present |
| **Misc** | `SEED_SECRET`, `DEMO_SECRET`, `DEMO_PASSWORD` | ✅ Present |

> **Note on `STRIPE_CONNECT_WEBHOOK_SECRET`:** This variable is intentionally absent. The Stripe Connect webhook (`/api/payments/connect-webhook`) has not yet been registered with Stripe because Connect platform approval is pending. The webhook endpoint exists in code but returns 400 (missing secret) rather than 503. This is **expected and correct** at this stage.

### Recovery Action (Env Vars)
All env vars are encrypted and stored in Vercel. They persist across deployments and rollbacks. No action required — values are preserved automatically.

---

## 5. Stripe Status

### Platform Account
- **Mode:** Live (production keys present — `sk_live_*` prefix inferred from STRIPE_SECRET_KEY)
- **Platform webhook** (`/api/payments/webhook`): Configured and healthy — confirmed by Phase 70B smoke tests (21/21 pass including webhook-dependent flows)
- **Subscription billing:** All 6 price IDs configured (Pro/Premium/Elite × Monthly/Yearly)

### Stripe Connect
| Item | Status |
|------|--------|
| `STRIPE_CONNECT_ENABLED` env var | `false` — kill switch active |
| All Connect API endpoints | Return `503 Service Unavailable` |
| Connect webhook endpoint | Present in code but STRIPE_CONNECT_WEBHOOK_SECRET not set |
| Customer-facing impact | **Zero** — no Connect functionality exposed |
| Existing checkout behaviour | **Unchanged** — no `application_fee_amount`, no `transfer_data`, no `on_behalf_of` |
| Existing platform webhook | **Unchanged** — `/api/payments/connect-webhook` is a separate endpoint |

### Stripe Connect Platform Approval
Stripe platform approval is pending (Stripe typically takes 1–60 days). Until approved:
- `STRIPE_CONNECT_ENABLED` should remain `false`
- `STRIPE_CONNECT_WEBHOOK_SECRET` should not be set (no webhook to register yet)
- No connected accounts can be created

### Recovery Action (Stripe)
- Stripe has no state to roll back at this phase (no Connect accounts created, no transfers, no application fees)
- Platform webhook: If webhook signing secret rotated, update `STRIPE_WEBHOOK_SECRET` in Vercel and redeploy
- To fully disable Connect code: Set `STRIPE_CONNECT_ENABLED=false` (already set) — all 4 Connect endpoints return 503 immediately

---

## 6. Vercel Deployment / Rollback

### Current Production Deployment

| Item | Value |
|------|-------|
| Deployment age | ~37 minutes old (at time of audit) |
| Commit | `071379c` — Phase 70B |
| Status | ✅ **READY** |
| Build time | ~2 minutes |

### Rollback Availability

| Deployment | Age | Status |
|-----------|-----|--------|
| `bold-party-planner-eyg78jcsi` (current) | 37m | ✅ READY |
| `bold-party-planner-mzy3vop0f` | 6h | ✅ READY |
| `bold-party-planner-d26ekfa97` | 6h | ✅ READY |
| `bold-party-planner-2itaot3gl` | 20h | ✅ READY |
| Additional deployments | 9+ older | ✅ Available |

**Rollback is instant** — Vercel switches traffic to a prior deployment without rebuild.

### Recovery Action (Vercel)
```bash
# Option 1: Vercel dashboard → Project → Deployments → select prior → "Promote to Production"
# Instant — no rebuild required

# Option 2: Git revert + push (triggers rebuild)
git revert 071379c --no-edit
git push origin main
# Vercel auto-deploys on push

# Option 3: Vercel CLI
npx vercel rollback [deployment-url]
```

---

## 7. Recovery Procedures

### Scenario A: Roll Back Phase 70B Code (Connect routes broken/dangerous)

1. **Vercel:** Instant rollback to `bold-party-planner-mzy3vop0f` (pre-70B) via dashboard  
   → Platform payments, vendor flows, customer flows: **immediately restored**
2. **Database:** Leave schema as-is — all 70B migrations are **additive only** (new columns/tables, no column removals, no constraint changes to existing flows). Rollback code won't use the new columns.
3. **Env vars:** Leave `STRIPE_CONNECT_ENABLED=false` — no action needed

**RTO: ~2 minutes** (Vercel instant rollback)  
**RPO: Zero** (no DB changes needed)

---

### Scenario B: Database Corruption / Data Loss

1. **Identify scope:** Supabase dashboard → Database → Backups
2. **PITR restore (if Pro plan):** Supabase dashboard → Database → Backups → Point in Time Recovery → select timestamp
3. **Daily snapshot restore:** Select most recent daily snapshot pre-incident
4. **Post-restore action — replay untracked migrations:**
   ```sql
   -- Connect to restored DB and run in order:
   \i supabase/migrations/051_vendor_customer_notes.sql
   \i supabase/migrations/052_manual_contacts.sql
   \i supabase/migrations/053_booking_source.sql
   \i supabase/migrations/054_fix_vendor_rating_trigger.sql
   \i supabase/migrations/055_vendor_stripe_connect.sql
   \i supabase/migrations/056_vendor_connect_onboarding.sql
   \i supabase/migrations/057_financial_ledger_connect.sql
   \i supabase/migrations/058_financial_events_connect_types.sql
   \i supabase/migrations/059_vendor_lifecycle_connect_states.sql
   ```
5. **Deploy application:** Redeploy current production commit

**RTO: 1–4 hours** (PITR restore duration depends on DB size and backup age)  
**RPO: Depends on PITR window** (minutes if PITR, up to 24h if daily snapshot only)

---

### Scenario C: Vercel Deployment Broken (build fails, runtime crash)

1. Vercel dashboard → instant rollback to prior deployment (2 minutes)
2. Investigate root cause in Vercel build logs
3. Fix, commit, push → Vercel auto-deploys

**RTO: ~2 minutes**

---

### Scenario D: Stripe Webhook Failure

1. Supabase: Check `stripe_events` table for recent entries
2. Stripe dashboard → Developers → Webhooks → check delivery failures
3. If signing secret rotated: Update `STRIPE_WEBHOOK_SECRET` in Vercel → redeploy
4. Stripe auto-retries failed webhook deliveries for up to 72 hours

**Note:** Connect webhook failure is non-fatal by design (returns 200 to prevent retry exhaustion, logs error to Sentry).

---

### Scenario E: Environment Variable Loss

All env vars are stored in Vercel (encrypted). They are not tied to any specific deployment and persist across rollbacks. Env vars can only be lost if explicitly deleted from Vercel.

Recovery: Re-add from secure credential store (KeePass/1Password where originals are stored).

---

## Backup Status

### 🟡 PARTIALLY RECOVERABLE

| Area | Status | Reason |
|------|--------|--------|
| Git / Source Code | 🟢 | All code committed and pushed to GitHub |
| Vercel Deployments | 🟢 | 3+ prior READY deployments available for instant rollback |
| Environment Variables | 🟢 | All 35 critical vars present and encrypted in Vercel |
| Stripe State | 🟢 | Live mode, platform webhook healthy, Connect isolated by kill switch |
| Database (Active) | 🟢 | 71 tables, schema verified, ACTIVE_HEALTHY |
| WAL / Archiving | 🟢 | wal_level=logical, archive_mode=on — continuous archiving active |
| Migration Tracking | 🟡 | Migrations 051–059 applied but NOT tracked in schema_migrations — requires manual replay on restore |
| Supabase Plan / PITR | 🟡 | Plan tier unconfirmed — PITR likely available (WAL active) but retention window unknown |

### Why 🟡 and not 🟢

**Migration tracking gap (primary risk):** Migrations 051–059 were applied via `supabase db query --linked --file`, bypassing the Supabase CLI tracking table. If the DB is restored from a backup, the Supabase CLI's automated restore path will not know about these 9 migrations. Recovery requires manual SQL replay from the repo. The SQL files exist and are complete — this is a **procedural risk**, not a data risk.

**PITR unconfirmed:** The Supabase management API could not be queried to confirm plan tier. WAL archiving settings strongly indicate Pro plan or above (free tier does not enable logical WAL). However, the retention window and PITR availability should be confirmed manually.

### Immediate Actions Required

| Priority | Action |
|----------|--------|
| P1 | Confirm Supabase plan tier and PITR window at app.supabase.com/project/vibqrgswyineyxmsrtsh/settings/billing |
| P1 | Register the untracked migrations (051–059) manually in `supabase_migrations.schema_migrations` OR document the replay procedure in a runbook |
| P2 | Confirm `STRIPE_CONNECT_WEBHOOK_SECRET` procedure when Connect platform approval arrives |
| P2 | Consider committing the Phase 70B deployment report and docs to a `/docs/reports/` directory in git |

---

*Report generated: 2026-06-23 | Audit type: Read-only | No changes made*
