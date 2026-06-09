# ELBOLD Trust Readiness Report

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 10
**Reviewer:** Sprint assessment based on codebase, audit findings, and operational state

---

## Purpose

Assess ELBOLD's readiness to onboard vendors, conduct a soft launch, and move toward public launch. Every conclusion is based on evidence from the codebase, migrations, and operational findings from this sprint.

---

## Scoring Dimensions

| Dimension | Score (1–10) | Assessment |
|---|---|---|
| Confidentiality | 7 | Good |
| Integrity | 6 | Needs attention |
| Accessibility | 8 | Good |
| Governance | 5 | Requires action |
| Customer Protection | 7 | Good |
| Vendor Protection | 6 | Improving |
| Financial Controls | 8 | Strong |
| Operational Readiness | 6 | Needs attention |

**Overall Score: 6.6 / 10**

---

## Dimension Assessments

### Confidentiality — 7/10

**What is working:**
- All vendor storage buckets are private (`vendor-images`, `vendor-videos`, `verification-documents`)
- Row-Level Security (RLS) is implemented across all tables
- Authentication is handled by Supabase (JWT-based, industry standard)
- Sensitive API routes require authentication
- Admin access restricted by email whitelist

**Gaps:**
- No formal data retention policy (how long customer data is kept)
- No explicit GDPR deletion flow tested end-to-end
- No encryption at rest for personally identifiable information beyond Supabase defaults
- Migration 025 adds GDPR infrastructure but untested in production

**Evidence:**
- `supabase/migrations/025_gdpr_and_production.sql` — GDPR foundations in place
- `app/api/account/route.ts` — delete account endpoint exists
- All storage policies reviewed in migration 029, 037, 044

---

### Integrity — 6/10

**What is working:**
- Stripe webhook idempotency implemented (INSERT with unique constraint on `stripe_events.id`)
- Financial ledger tracks all payment events
- Audit logs created for all admin actions
- Quote acceptance guard: prevents booking on null `event_id`

**Gaps identified in this sprint:**
- `platform_stats` view was missing `rejected_vendors` and `suspended_vendors` counts — **FIXED in migration 046**
- `AdminVendorTable` stats bar hid reconciliation gap — **FIXED in this sprint**
- No automated integrity check runs regularly (only surfaced in UI after this sprint)
- Remaining `void` calls inside `issueRefundForCancellation` (see BUG-002 notes) — booking payment_status + audit + emails still fire-and-forget post-refund

**Evidence:**
- `app/api/payments/webhook/route.ts` — idempotent INSERT, confirmed working
- `docs/Vendor_Data_Integrity_Audit.md` — root cause analysis and fix
- Project memory: BUG-002 Phase 2 still open (void calls in issueRefundForCancellation)

---

### Accessibility — 8/10

**What is working:**
- Full responsive design, iPad-first tested
- Support page at /support with FAQs and contact channels
- Clear error states and empty states on all major screens
- Customer and vendor onboarding journeys are documented
- Help Centre at /help with 12+ FAQs

**Gaps:**
- No formal accessibility (WCAG 2.1 AA) audit performed
- No screen reader testing
- Keyboard navigation not tested
- Colour contrast not audited against WCAG standards

---

### Governance — 5/10

**What was wrong:**
- Vendors could access full dashboard and create packages BEFORE approval — **FIXED in this sprint**
- No vendor lifecycle states beyond pending/approved/rejected/suspended — **FIXED: lifecycle_state column added**
- Admin had no lifecycle advancement controls — **FIXED: buttons added to admin UI**
- No role-based access control for admin team — **DESIGNED in docs/RBAC_Architecture.md (not yet implemented)**

**What is now in place:**
- `lifecycle_state` column: applied, under_review, approved, profile_setup, verified, live, rejected, suspended
- Package creation blocked for pending vendors
- Admin can advance vendors through lifecycle stages
- All admin actions produce audit log entries

**Remaining gaps:**
- RBAC not implemented (single-role admin model remains)
- No formal vendor contract or terms of service acceptance at application
- Vendor suspension does not immediately invalidate active bookings

---

### Customer Protection — 7/10

**What is working:**
- Deposits held by Stripe (customer never pays vendor directly through ELBOLD)
- Refund automation: `issueRefundForCancellation()` in place
- Cancellation policy documented at /our-commitments
- Dispute system in place (disputes table + admin view)
- Booking confirmation emails sent on payment
- Verified vendor badges (Level 2/3/4) show trust tier

**Gaps:**
- Refund function has remaining void calls (booking update + emails fire-and-forget after refund) — BUG-002 Phase 2
- No formal customer dispute resolution SLA displayed
- No insurance/consumer protection statement for high-value bookings
- No two-factor authentication for customer accounts

---

### Vendor Protection — 6/10

**What is working:**
- Vendor bank details stored securely (vendor_bank_details table, service role only)
- Vendor receives email on all key lifecycle events
- Vendor can cancel bookings with defined terms
- Vendor sees their commission transparency in dashboard
- Vendor payout tracked in admin payout queue

**Gaps:**
- Payouts are fully manual — no timeline commitment displayed to vendor
- No vendor dispute escalation path (dispute is customer-initiated only)
- No vendor agreement / terms signed at application
- `lifecycle_state = 'live'` currently has no customer-facing impact (browse still shows all approved vendors)

---

### Financial Controls — 8/10

**What is working:**
- Stripe live keys confirmed in production
- Webhook registered and delivering events
- Financial ledger records all payment events
- Idempotency protection on webhook processing
- Admin finance dashboard with GMV, commission, MRR tracking
- Reconciliation queries documented in `docs/Revenue_Reconciliation_Runbook.md`
- Stripe key validation: rejects invalid prefixes (catches `mk_` and other invalid formats)

**Gaps:**
- Vendor payouts are fully manual (acceptable at current scale, migrate to Stripe Connect at £10k GMV)
- No automated daily reconciliation check
- booking payment update + ledger event are not in a DB transaction (race condition risk under high concurrency — low risk at current scale)

**Evidence:**
- Live production smoke test passed: `pi_3Tg8sL6lIKzSGzKL11qTibsO` GBP 1.00 charged, webhook fired, ledger updated
- `docs/Stripe_Operations_Guide.md` written for founder operations

---

### Operational Readiness — 6/10

**What is working:**
- Production deployed at https://www.elbold.com
- Sentry error tracking active
- Rate limiting on all public endpoints
- Cron jobs registered: governance (03:00), verification-check (04:00), reminders (08:00 UTC)
- Launch monitoring checklist exists
- Admin operations command centre at /admin/operations

**Gaps:**
- Migration 046 not yet applied (this sprint's DB changes pending)
- No automated test suite running in CI (Playwright tests exist but not confirmed running post-deployment)
- Email delivery unconfirmed (Resend DKIM/SPF not verified in production — flagged since Phase 28A)
- No incident response runbook
- No on-call process defined

---

## Final Recommendations

### Vendor Recruitment
**Recommendation: GO WITH CAUTION**

**Evidence:**
- Application pipeline is solid: form → DB → email → admin queue
- Lifecycle governance now in place (migration 046 must be applied first)
- Package creation is now blocked for pending vendors
- Admin can advance vendors through lifecycle stages

**Conditions:**
1. Apply migration 046 in Supabase Dashboard
2. Verify Resend domain (SPF/DKIM) — email delivery is critical for trust
3. Confirm `ADMIN_EMAILS` env var set in Vercel
4. Review each application within 24 hours
5. Do not exceed 25 vendors until RBAC is implemented

---

### Soft Launch (10 Vendors, Real Customers)
**Recommendation: GO WITH CAUTION**

**Evidence:**
- Payment flow tested end-to-end (live GBP 1.00 transaction completed)
- Booking lifecycle working: quote → accept → pay → confirm → complete/cancel
- Refund automation in place (BUG-002 Phase 2 void calls still exist — low frequency risk)
- Auth confirmation flow now provides clear success messaging
- Trust pages, vendor standards, and commitment pages all live

**Conditions:**
1. Complete Full System Test Report (docs/Full_System_Test_Report.md) — all PASS
2. Apply migration 046
3. Fix BUG-002 Phase 2 (void calls in issueRefundForCancellation)
4. Verify at least 3 vendors have lifecycle_state = 'live'
5. Test customer deposit payment with Stripe test card (CJ-07)
6. Confirm refund works end-to-end (CJ-08)

---

### Public Launch
**Recommendation: NO GO**

**Evidence for NO GO:**
- RBAC not implemented (all admin in single role — investor risk)
- Vendor lifecycle governance newly added but untested in production
- Migration 046 not applied
- Full system test not completed
- No WCAG accessibility audit
- Manual payout process not scalable beyond 20 vendors
- No formal vendor agreement/terms signed at application
- BUG-002 Phase 2 unresolved

**Required before Public Launch:**
1. RBAC implemented and tested (docs/RBAC_Architecture.md)
2. Migration 046 applied and verified
3. Full system test report — all PASS, no BLOCKERs
4. Stripe Connect implemented (before £10k GMV)
5. Vendor agreement/terms signed at application
6. Accessibility audit (WCAG 2.1 AA)
7. Incident response runbook written
8. At least 10 real completed bookings with verified reviews

---

## Sprint Completion Checklist

| Deliverable | Status |
|---|---|
| Migration 046 (platform_stats fix + lifecycle + portfolio links) | Written — APPLY IN SUPABASE |
| AdminVendorTable: 6-stat bar + integrity alert | DONE |
| Package creation guard for non-approved vendors | DONE |
| Lifecycle advancement controls in admin UI | DONE |
| lifecycle_state column + trigger | In migration 046 |
| /confirmed success page (auth confirmation) | DONE |
| Auth callback updated for pending vendors | DONE |
| Portfolio links multi-field in vendor apply form | DONE |
| portfolio_links in apply API | DONE |
| portfolio_links backfill in migration | In migration 046 |
| docs/Vendor_Data_Integrity_Audit.md | DONE |
| docs/Vendor_Application_Pipeline_Report.md | DONE |
| docs/Vendor_Lifecycle_Governance.md | DONE |
| docs/Auth_Confirmation_Audit.md | DONE |
| docs/Quote_Transparency_Design.md | DONE |
| docs/RBAC_Architecture.md | DONE |
| docs/Full_System_Test_Report.md | DONE |
| docs/Stripe_Operations_Guide.md | DONE |
| docs/ELBOLD_Trust_Readiness_Report.md | THIS FILE |

---

## Immediate Actions for Founder (in order)

1. **Apply migration 046** in Supabase Dashboard SQL Editor
2. **Verify Resend domain** — add SPF/DKIM records to elbold.com DNS
3. **Confirm `ADMIN_EMAILS`** is set correctly in Vercel production
4. **Confirm Supabase redirect URL** `https://www.elbold.com/api/auth/callback` is registered
5. **Fix BUG-002 Phase 2** — convert void calls to await in `issueRefundForCancellation`
6. **Complete Full_System_Test_Report.md** — manually test all journeys
7. **Advance existing approved vendors** through lifecycle states in /admin/vendors
