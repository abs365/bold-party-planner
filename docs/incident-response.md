# ELBOLD — Incident Response

**Version:** 1.0  
**Applies to:** All production incidents

---

## Severity Definitions

| Level | Name | Definition | Example |
|---|---|---|---|
| SEV-1 | Platform Outage | Complete inability to use the platform | Supabase down, all auth failing, Vercel deployment broken |
| SEV-2 | Major Feature Degradation | Core flow broken for all or most users | Bookings can't be created, payments failing, vendor profiles 500ing |
| SEV-3 | Isolated Feature Issue | Specific feature broken for subset of users | One dashboard widget erroring, upload failing for specific MIME type |
| SEV-4 | Cosmetic/Non-blocking | Visible defect with no functional impact | Layout misalignment, typo in copy, icon not rendering |

---

## Detection

Incidents are detected through one of:

1. **Sentry alert** — unhandled exception rate spike or new issue
2. **Health check failure** — `GET /api/health` returns non-200 or degraded checks
3. **User report** — direct report via support channel
4. **Vercel alert** — function error rate spike or deployment failure
5. **Supabase status** — `status.supabase.com` reports degraded service
6. **CI failure** — a previously passing test suite now fails on `main`

---

## Escalation Paths

```
Detection
   │
   ▼
Assess severity (SEV-1 through SEV-4)
   │
   ├── SEV-1 ──→ Immediate: halt all deploys, notify all stakeholders, begin recovery
   │             Target: Acknowledge in 15 min / Resolve in 60 min
   │
   ├── SEV-2 ──→ Urgent: halt deploys, notify stakeholders, assign owner
   │             Target: Acknowledge in 30 min / Resolve in 4 hours
   │
   ├── SEV-3 ──→ Normal: log issue, assign to next available cycle
   │             Target: Acknowledge in 2 hours / Resolve in 24 hours
   │
   └── SEV-4 ──→ Backlog: document and schedule
                 Target: Resolve in next release cycle
```

**Deployment freeze rules:**
- SEV-1: Freeze all deployments immediately. No new deploys until platform is restored and 30-minute soak period passes.
- SEV-2: Freeze all non-fix deployments. Only the hotfix for the incident may be deployed.
- SEV-3/SEV-4: No deploy freeze. Normal deployment process applies.

---

## Rollback Process

### Vercel Deployment Rollback

1. Log in to Vercel Dashboard → Project → Deployments
2. Find the last known-good deployment (prior to the incident)
3. Click the deployment → "..." menu → **Promote to Production**
4. Wait for deployment to complete (~2–3 minutes)
5. Verify `GET /api/health` returns `"status": "ok"`
6. Run smoke tests on critical paths (login, vendor browse, booking create)

### Database Rollback

Migrations cannot be automatically rolled back. For schema changes:

1. Write a reverse migration as a new numbered migration file
2. Apply it via Supabase Dashboard → SQL Editor
3. Run `NOTIFY pgrst, 'reload schema';` to reload PostgREST schema cache
4. Verify health check database status

For data corruption, see `docs/disaster-recovery.md` → Broken Migration.

---

## Communication Process

### During a SEV-1 or SEV-2 incident

**Internal:** Update stakeholders every 30 minutes with:
- Current status (investigating / identified / mitigating / resolved)
- Affected functionality
- Estimated resolution time (if known)
- Last action taken

**User-facing (if outage visible to users):**
- Add a status message to the platform if feasible
- Do not speculate on root cause publicly until RCA is complete

### Incident lifecycle states

| State | Meaning |
|---|---|
| Investigating | Incident confirmed, root cause unknown |
| Identified | Root cause found, fix in progress |
| Mitigating | Fix deployed, monitoring for stability |
| Resolved | Platform confirmed healthy, incident closed |

---

## Root Cause Analysis Workflow

After every SEV-1 and SEV-2 incident, complete an RCA within 48 hours.

**Steps:**

1. **Timeline reconstruction** — list each event with timestamp:
   - When did the issue begin?
   - When was it first detected?
   - What triggered it? (deploy, migration, config change, upstream failure)
   - When was each mitigation step taken?
   - When was it resolved?

2. **5-Whys analysis** — ask "why?" until you reach a systemic root cause, not a human error:
   - Why did the platform fail? → The migration dropped a column.
   - Why did the migration run in production? → No staging test was required.
   - Why was staging testing not required? → No change management rule existed.
   - Why did no such rule exist? → Engineering discipline was informal.
   - Root cause: No formal change management gate for migrations.

3. **Blast radius assessment** — which users were affected, for how long, what functionality was lost?

4. **Corrective actions** — one or more specific, assigned, time-bound fixes that prevent recurrence:
   - System fixes (code, config, monitoring)
   - Process fixes (new rules, checklists, runbooks)

---

## Postmortem Structure

Create a postmortem document for every SEV-1 and SEV-2 incident. Store in `docs/postmortems/YYYY-MM-DD-<slug>.md`.

```markdown
# Postmortem: <Brief incident title>

**Date:** YYYY-MM-DD  
**Severity:** SEV-X  
**Duration:** HH:MM (detection to resolution)  
**Author:**  
**Status:** Draft / Final

---

## Summary

One paragraph: what happened, why it happened, what the impact was.

---

## Timeline

| Time | Event |
|---|---|
| HH:MM | First user report / alert fired |
| HH:MM | Incident acknowledged |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Platform confirmed stable |
| HH:MM | Incident closed |

---

## Impact

- **Users affected:** estimate
- **Duration of impact:**
- **Features affected:**
- **Data loss:** Yes / No

---

## Root Cause

Detailed description of the technical root cause.

---

## Contributing Factors

What conditions allowed this to happen?

---

## What Went Well

---

## What Went Poorly

---

## Action Items

| Action | Owner | Due |
|---|---|---|
| | | |

---

## Lessons Learned
```

---

## Incident Log

| Date | Severity | Title | Duration | Status |
|---|---|---|---|---|
| — | — | — | — | No incidents yet |
