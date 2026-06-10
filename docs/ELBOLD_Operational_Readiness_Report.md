# ELBOLD Operational Readiness Report
**Version:** 1.0 | **Date:** 2026-06-09 | **Sprint:** Operational Excellence
**Standard:** Evidence-based verdicts only. No assumptions. No speculation.

---

## Final Verdict: GO WITH CONDITIONS

ELBOLD is operationally ready for soft launch with the following conditions satisfied. All conditions can be resolved within one working day. No condition requires a code deployment.

---

## Conditions for Soft Launch

| # | Condition | Action Required | Effort |
|---|-----------|----------------|--------|
| C1 | Fix SPF record | Cloudflare DNS: edit TXT @ to include both M365 and Resend | 5 min |
| C2 | Add bounce CNAME | Cloudflare DNS: add `bounces` CNAME from Resend dashboard | 5 min |
| C3 | Confirm Resend domain verified | Resend dashboard: verify `elbold.com` shows green "Verified" | 2 min |
| C4 | Confirm ADMIN_EMAILS in Vercel | Vercel dashboard: verify ADMIN_EMAILS env var is set | 2 min |
| C5 | Issue manual refund `pi_3T...` | Stripe dashboard: issue pre-BUG-002 refund | 5 min |
| C6 | Define platform fee rate | Code or platform_config: set fee rate before first live transaction | 30 min |

**None of these require a code change (except C6). All six can be resolved by the operator in under one hour.**

---

## Part 1: Technical Infrastructure

### 1.1 Next.js Application

**Status: PASS**

| Component | Evidence | Verdict |
|-----------|----------|---------|
| Build | TypeScript strict mode, 0 errors | PASS |
| Deployment | Vercel production deployment live | PASS |
| Auth | Supabase session-based auth operational | PASS |
| Route protection | `proxy.ts` protecting all `/admin`, `/vendor/*`, `/dashboard` routes | PASS |
| API | All vendor, customer, admin, payment API routes confirmed | PASS |

### 1.2 Database

**Status: PASS**

| Component | Evidence | Verdict |
|-----------|----------|---------|
| Connection | Supabase project `vibqrgswyineyxmsrtsh` — live queries executed | PASS |
| Schema | Migrations 001–046 applied | PASS |
| RLS | Row-level security configured on all sensitive tables | PASS |
| Status constraint | `vendors.status` CHECK ensures pending/approved/rejected/suspended only | PASS |
| Lifecycle trigger | `trg_sync_vendor_lifecycle` enforcing state transitions | PASS |
| Reconciliation | approved(2)+pending(7)+rejected(0)+suspended(3)=12=total_vendors | PASS |
| Lifecycle consistency | All 12 vendor lifecycle_states match their status values | PASS |

### 1.3 Stripe Payments

**Status: PASS**

| Component | Evidence | Verdict |
|-----------|----------|---------|
| Mode | Live mode (`sk_live_*` key confirmed in Vercel) | PASS |
| Payment intent | £0.50 test payment processed and recorded | PASS |
| Webhook | `STRIPE_WEBHOOK_SECRET` set in Vercel | PASS (assumed — env var confirmed set) |
| Idempotency | `stripe_events.id` unique constraint prevents duplicate processing | PASS |
| Refund flow | BUG-002 (void bug) CLOSED | PASS |
| Platform fee | Fee rate NOT YET DEFINED | CONDITION C6 |

### 1.4 Email Infrastructure

**Status: CONDITIONAL**

| Component | Evidence | Verdict |
|-----------|----------|---------|
| DKIM | `resend._domainkey.elbold.com` TXT confirmed | PASS |
| DMARC | `v=DMARC1; p=quarantine; rua=admin@elbold.com` confirmed | PASS |
| M365 mailboxes | support@, legal@, urgent@, disputes@elbold.com active | PASS |
| SPF | Missing — M365+Resend not in unified SPF record | CONDITION C1 |
| Bounce CNAME | `bounces.elbold.com` NXDOMAIN | CONDITION C2 |
| Resend verified | Cannot confirm from this environment | CONDITION C3 |
| M365 DKIM | selector1/selector2 not configured | KNOWN GAP (not a blocker) |

### 1.5 Access Control

**Status: PASS WITH DOCUMENTED GAPS**

| Component | Evidence | Verdict |
|-----------|----------|---------|
| Admin gate | Email whitelist enforced at proxy + API level | PASS |
| Vendor auth | `requireVendor()` enforces session + vendor record | PASS |
| Customer auth | `requireAuth()` enforces session | PASS |
| Write API guards | Package POST checks `status=approved` | PASS |
| Pending vendor write access | Pending vendors blocked at API level for write operations | PASS |
| Pending vendor UI routing | Pending vendors can reach vendor pages (UX gap, not security) | GAP RG-001 |
| `requireVendor()` status check | Does not check status — delegates to API | GAP RG-001 |

---

## Part 2: Operational State

### 2.1 Platform Data (live, 2026-06-09)

| Metric | Value |
|--------|-------|
| Total vendors | 12 |
| Approved vendors | 2 |
| Pending vendors | 7 (in application pipeline) |
| Suspended vendors | 3 |
| Rejected vendors | 0 |
| Total customers | 6 |
| Total bookings | 6 |
| Completed bookings | 0 |
| Total revenue | £0.50 (Stripe live) |
| Total GMV | £0 (no completed bookings) |
| Pending quotes | 4 |
| Avg vendor rating | 4.8 |
| Open disputes | 0 |

**Reconciliation:** approved(2)+pending(7)+rejected(0)+suspended(3)=12=total — VERIFIED

### 2.2 Vendor Journey

**Status: CONDITIONAL PASS** — See `Vendor_Journey_Validation_Report.md`

All critical path steps are operational. Two low-severity gaps (email fire-and-forget, pending vendor UI routing). No blockers.

### 2.3 Customer Journey

**Status: CONDITIONAL PASS** — See `Customer_Journey_Validation_Report.md`

All critical path steps are operational. Stripe live payment working. No completed transactions yet (expected at pre-launch stage). No blockers.

---

## Part 3: Legal & Compliance

### 3.1 Company

**Status: PASS**

| Item | Evidence | Verdict |
|------|----------|---------|
| UK incorporation | ELBOLD EVENTS LTD — Companies House | PASS |
| Registered office | Confirmed | PASS |
| Company number | Confirmed and consistent in codebase | PASS |
| Business email domain | elbold.com — M365 active | PASS |

### 3.2 Terms & Privacy

**Status: PASS**

| Item | Evidence | Verdict |
|------|----------|---------|
| Terms of service | Present in codebase, linked from footer | PASS |
| Privacy policy | Present in codebase, linked from footer | PASS |
| Cookie consent | In codebase | PASS |

---

## Part 4: Brand

**Status: PARTIAL** — See `Brand_Simplification_Audit.md`

| Area | Status |
|------|--------|
| Navbar wordmark | COMPLIANT — clean "ELBOLD" sans-serif |
| Footer wordmark | COMPLIANT |
| Browser favicon | COMPLIANT — "E" lettermark |
| Login / Signup / Forgot / Reset password pages | NON-COMPLIANT — crown+EB monogram |
| Dashboard sidebar | NON-COMPLIANT — crown+EB wordmark |

**Fix:** 2 changes, ~5 minutes total:
1. Overwrite `public/brand/elbold-mark.svg` with contents of `public/brand/elbold-favicon.svg`
2. Change `components/layout/DashboardLayout.tsx:165` from `elbold-wordmark-white.svg` to `elbold-logo-white.svg`

Brand non-compliance is a soft launch risk (first impression on auth pages). Recommend fixing before first real vendor or customer uses the live platform.

---

## Part 5: Document Registry

**Status: PASS**

| Metric | Value |
|--------|-------|
| Total documents | 113 |
| Categories | 16 |
| Index | `ELBOLD_Master_Document_Index.md` |
| Oldest document | Early sprint documents |
| Sprint documents (this sprint) | 9 |

All 113 documents are indexed and categorised in `ELBOLD_Master_Document_Index.md`.

---

## GO / NO-GO Matrix

| Area | Verdict | Conditions |
|------|---------|-----------|
| Application build | GO | — |
| Database integrity | GO | — |
| Payment processing | GO | — |
| Refund integrity (BUG-002) | GO | — |
| Revenue reconciliation | GO | — |
| Admin access control | GO | — |
| Vendor journey | GO | Email delivery depends on SPF fix (C1) |
| Customer journey | GO | Email delivery depends on SPF fix (C1) |
| Email infrastructure | GO WITH CONDITIONS | C1 (SPF), C2 (bounce), C3 (Resend verify) |
| Platform fee | NO-GO | C6 — fee rate must be defined before live transactions |
| Brand (auth pages) | CAUTION | Not a blocker but a first-impression risk |
| ADMIN_EMAILS env var | GO WITH CONDITIONS | C4 — confirm not blank in Vercel |
| Pre-BUG-002 refund | NO-GO until actioned | C5 — manual Stripe refund required |
| Legal (incorporation) | GO | — |
| Legal (Terms/Privacy) | GO | — |
| Company data consistency | GO | — |
| Document registry | GO | — |

---

## Resolved vs Open Issues

### Resolved (this project)

| Issue | Resolution |
|-------|-----------|
| BUG-002: refund void bug | CLOSED — fix applied and verified |
| Platform stats reconciliation | VERIFIED — approved+pending+rejected+suspended=total |
| Dashboard integrity check | VERIFIED — admin UI live check passing |
| Lifecycle state consistency | VERIFIED — all 12 vendors correct |
| M365 email infrastructure | PASS — mailboxes active, MX configured |
| DKIM | PASS — public key in DNS, confirmed globally |
| DMARC | PASS — p=quarantine policy active |

### Open (not blocking soft launch except where noted)

| Issue | Severity | Blocks soft launch? |
|-------|----------|---------------------|
| SPF record incomplete | HIGH | YES — C1 (5 min fix) |
| Bounce CNAME missing | HIGH | YES — C2 (5 min fix) |
| Resend domain verify | MEDIUM | YES — C3 (2 min check) |
| ADMIN_EMAILS confirm | HIGH | YES — C4 (2 min check) |
| Manual refund `pi_3T...` | HIGH | YES — C5 (5 min in Stripe) |
| Platform fee undefined | HIGH | YES — C6 (30 min) |
| Brand auth pages (old crown mark) | LOW | No — caution only |
| M365 DKIM (selector1/2) | MEDIUM | No — Resend DKIM covers transactional |
| `requireVendor()` status check | LOW | No — API-level guards cover writes |
| Pending vendor UI routing | LOW | No — UX gap only |
| Fire-and-forget emails | LOW | No — operational risk only |

---

## Sprint Deliverables — All Produced

| Phase | Document | Status |
|-------|----------|--------|
| 1 | `Vendor_Journey_Validation_Report.md` | PRODUCED |
| 2 | `Customer_Journey_Validation_Report.md` | PRODUCED |
| 3 | `Dashboard_Reconciliation_Final_Report.md` | PRODUCED |
| 4 | `RBAC_Governance_Audit.md` | PRODUCED |
| 5 | `Quote_Transparency_Blueprint.md` | PRODUCED |
| 6 | `Investor_Readiness_Report_v2.md` | PRODUCED |
| 7 | `Brand_Simplification_Audit.md` | PRODUCED |
| 8 | `ELBOLD_Master_Document_Index.md` | PRODUCED |
| Final | `ELBOLD_Operational_Readiness_Report.md` | THIS FILE |

---

## Summary

ELBOLD is a functional marketplace with a live database, live Stripe payments, two approved vendors, six bookings, and corporate legal structure. The platform is not yet revenue-generating (£0.50 test transaction only).

Six conditions must be met before first real commercial transaction:
1. SPF record updated (5 min)
2. Bounce CNAME added (5 min)
3. Resend domain verified (2 min)
4. ADMIN_EMAILS confirmed (2 min)
5. Pre-BUG-002 refund issued (5 min)
6. Platform fee rate defined (30 min)

All six are non-deployment operational actions. When all six are complete, the verdict upgrades from **GO WITH CONDITIONS** to **GO**.
