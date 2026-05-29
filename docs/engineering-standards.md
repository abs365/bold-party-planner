# Bold Party Planner — Engineering Standards

**Version:** 1.0

Bold Party Planner is operational marketplace infrastructure, not a prototype. All engineering decisions must reflect that maturity.

---

## Change Management Rules

### Required gates before merging to `main`

Every pull request targeting `main` must pass all of the following. CI enforces most of these automatically:

| Gate | Enforced by | Required for |
|---|---|---|
| TypeScript passes (`tsc --noEmit`) | CI — build job | All changes |
| Lint passes (`npm run lint`) | CI — build job | All changes |
| Production build passes | CI — build job | All changes |
| Playwright E2E passes | CI — e2e job | All changes |
| Migration reviewed | Manual | Any DB schema change |
| Rollback considered | Manual | Any DB schema change, major feature |
| Observability considered | Manual | Any new API route or data mutation |

### Migration review checklist

Before applying any migration to staging or production:

- [ ] Migration tested on local or staging Supabase first
- [ ] Migration is idempotent (uses `IF NOT EXISTS`, `IF EXISTS`, `DO $$ ... END $$` guards)
- [ ] Forward-only by design — if the migration is hard to reverse, document the reversal SQL
- [ ] RLS policies reviewed for new tables
- [ ] `NOTIFY pgrst, 'reload schema';` included if PostgREST schema cache must refresh
- [ ] Backup created in Supabase Dashboard before applying to production (paid plan)
- [ ] No direct column drops on tables with active traffic without a multi-phase plan

### Rollback consideration

For every significant change, answer before merging:
- Can the Vercel deployment be rolled back independently of the DB change?
- If the migration is applied and the deploy is rolled back, does the old code still work with the new schema?
- If the deploy succeeds but introduces a regression, what is the rollback path?

### Observability consideration

For every new API route or mutation:
- Is the route wrapped with `withApiLogger()` or using `createRequestContext()`?
- Are critical outcomes (booking created, payment failed, vendor approved) explicitly logged?
- Is the route covered by a Sentry-captured error boundary?
- Will admin actions write to `audit_logs`?

---

## Operational Safety Principles

### Observability

- All server-side mutations must produce log output (via `logger.info` or `logger.error`)
- All admin actions must write to `audit_logs`
- All API errors must be captured by Sentry
- No silent swallowing of errors in critical paths (payments, auth, bookings)

### Auditability

- The `audit_logs` table is the source of truth for all admin actions
- Audit log writes use the service role client — RLS cannot block them
- Include `actor_id`, `action`, `entity_type`, `entity_id`, `ip_address`, `metadata` in every audit entry
- Never delete audit log rows

### Rollback safety

- Prefer additive changes over destructive ones (add columns before dropping old ones)
- Use multi-phase migrations for breaking schema changes:
  1. Phase 1: add new column (nullable), deploy app that writes to both
  2. Phase 2: backfill, add NOT NULL constraint, deploy app that reads new column only
  3. Phase 3: drop old column
- Always take a Supabase snapshot before applying destructive migrations

### Deterministic behavior

- Seed data uses fixed UUIDs — no random IDs in test fixtures
- E2E tests are idempotent — global.setup wipes and re-inserts before each run
- No `Math.random()` or `Date.now()` in business logic that must be reproducible

### Fail-safe behavior

- When an optional operation fails (analytics event, email notification), swallow and log; never throw to the user
- When a required operation fails (booking confirmation, payment), surface the error clearly and log it
- Rate limits and auth guards fail closed (deny access when the check itself errors, not open)

### Avoid

- **Hidden side effects** — functions that silently mutate state beyond their stated purpose
- **Silent destructive actions** — deletes, status changes, or data overwrites without logging
- **Untracked mutations** — writes that don't appear in audit_logs or Sentry
- **Direct production-only logic** — code that behaves differently in production without explicit environmental reason

---

## Code Quality Standards

### TypeScript

- Strict mode (`"strict": true` in tsconfig) — no `any` without explicit justification
- All function parameters and return types must be inferable or explicitly typed
- No `@ts-ignore` or `@ts-expect-error` in new code without a comment explaining why

### Error handling

- At system boundaries (API routes, webhook handlers), catch and handle errors explicitly
- Within internal functions, let errors propagate — don't catch what you can't handle
- Use typed error returns (`{ data, error }`) from Supabase — always check `error` before using `data`

### Database

- Follow all rules in `docs/performance-guidelines.md`
- All mutations go through RLS-enforced clients unless admin operations (which use `createAdminClient()`)
- New tables need RLS policies in the same migration that creates the table

### Security

- Never trust client-supplied user IDs or role claims — always derive from `supabase.auth.getUser()`
- Never expose service role key to client-side code
- Validate and sanitize all user-supplied content before DB writes
- Use parameterized queries only — Supabase JS client handles this automatically

---

## Release Cadence

### Branch strategy

| Branch | Purpose | CI |
|---|---|---|
| `main` | Production-ready code | Full CI + E2E |
| `develop` | Integration branch | Build + lint only |
| `feature/*` | Individual features | Build + lint on PR to develop |
| `release/*` | Release candidates | Build + lint |
| `hotfix/*` | Production fixes | Full CI + E2E on PR to main |

### Deployment flow

```
feature/* → PR → develop → PR → main → Vercel auto-deploy to production
hotfix/*  → PR → main (direct) → Vercel auto-deploy
```

Migrations are deployed separately via Supabase Dashboard. They must be applied **before** the application code that depends on them is deployed.

### Deployment freeze rules

See `docs/incident-response.md` → Deployment Freeze Rules.

---

## Production Experimentation Policy

**No direct production experimentation.**

- Do not test new features by deploying to production and monitoring for errors
- Test on local or staging first
- For high-risk changes (new payment flows, auth changes, schema changes), require staging validation before production

**What is acceptable:**
- Incremental feature rollout with Vercel preview deployments
- A/B testing using feature flags (not yet implemented — document when added)
- Monitoring newly deployed features closely in the first 30 minutes post-deploy

---

## Long-Term Platform Operations

### Multi-admin team readiness

- All admin actions are auditable in `audit_logs` — the table supports `actor_id`
- Role-based guards (`requireAdmin()`) are in place for all admin routes
- Admin email list (`ADMIN_EMAILS`) is an env var — expandable without code changes

### Staging workflow (future)

When team size grows:
- Create a dedicated staging Vercel environment (currently preview deployments serve this role)
- Create a dedicated staging Supabase project
- Automate migration application to staging before production via CI

### Production release cadence (target)

- Weekly release window: Friday deploys are discouraged (no-one to monitor weekend)
- Preferred deploy time: Tuesday–Thursday, business hours
- Migration deploys: always off-peak, always preceded by a Supabase backup

### Operational metrics to track (future)

When monitoring is extended:
- Booking creation success rate (target > 99%)
- Auth success rate (target > 99.5%)
- Median API response time (target < 200ms)
- P95 vendor profile load time (target < 1s)
- Upload success rate (target > 98%)
- Sentry error rate (target: 0 unhandled exceptions/hour baseline)

### Vendor support tooling (future)

As real vendor volume grows:
- Admin support inbox for vendor disputes
- Ticket tracking integration (Linear or similar)
- Vendor performance dashboards
- Automated payout tracking and reconciliation
