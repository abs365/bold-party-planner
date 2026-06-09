# Investor Readiness Report
**Version:** 1.0 | **Date:** 2026-06-09 | **Sprint:** Operational Validation & Investor Readiness

---

## Executive Summary

Elbold is a UK event marketplace at a functional pre-revenue stage. The core infrastructure is production-grade, the financial model is built and tested, and data governance is sound. The primary gaps are: no live revenue, weak access control (email-list RBAC), and an unresolved refund bug. These are manageable at seed stage but must be disclosed.

**Overall stage:** Seed / Pre-Revenue. Ready for investor conversation with full disclosure.

---

## 1. Dimension Scores (0–10)

### 1.1 Vision: 7/10

| Evidence | Score |
|----------|-------|
| Clear problem: UK event vendors have no quality marketplace | ✓ |
| Revenue model defined: 10% platform fee on completed bookings | ✓ |
| Competitive positioning: quality-gated, not volume-driven | ✓ |
| TAM evidence: UK events industry (weddings alone = £10bn+ annually) | ✓ |
| Vision not yet tested with real revenue | Gap |
| No customer/vendor interview data on record | Gap |

**Commentary:** The vision is coherent and grounded in a real market. The 10/90 fee split is vendor-friendly and positions Elbold as a partner, not a toll booth. The gap is evidence: no customer discovery documents, no competitor analysis deeper than internal notes.

---

### 1.2 Marketplace Model: 7/10

| Evidence | Score |
|----------|-------|
| Both sides of marketplace functional (vendor + customer flows) | ✓ |
| Stripe integration: payment intents, webhooks, idempotency | ✓ |
| 10/90 split implemented and verified in code | ✓ |
| platform_stats view confirmed reconciled | ✓ |
| No live transactions yet | Gap |
| Stripe Connect (direct vendor payouts) not yet implemented | Gap |

**Commentary:** The model is real — money can flow, split, and be tracked. The absence of Stripe Connect means vendor payouts are currently manual or delayed. This is acceptable at pre-revenue stage but is a required build before scale.

---

### 1.3 Vendor Acquisition: 6/10

| Evidence | Score |
|----------|-------|
| Application flow: 3-step form, validates all required fields | ✓ |
| Application hardening complete (phone required, bio minimum, URL validation) | ✓ |
| Vendor lifecycle state machine: applied → under_review → approved → verified → live | ✓ |
| Admin email alert on new application | ✓ |
| Zero vendors recruited at time of this report | Gap |
| No vendor outreach plan executed | Gap |
| Resend domain unverified — emails may land in spam | Gap |

**Commentary:** The infrastructure to acquire and activate vendors is built and hardened. What is missing is execution: no vendors have been recruited and activated through the full flow. This is the most important operational gap to close before investor meetings that include traction discussion.

---

### 1.4 Vendor Activation: 5/10

| Evidence | Score |
|----------|-------|
| Lifecycle state machine migrated (046) | ✓ |
| DB trigger: status change auto-advances lifecycle_state | ✓ |
| Approval email fires on admin approval | ✓ |
| Vendor dashboard: shows status and profile completion prompts | ✓ |
| No vendor has completed the full lifecycle end-to-end | Gap |
| Profile completion flow (photos, packages, pricing) not fully tested | Gap |
| lifecycle_state = 'live' requires manual admin action currently | Gap |

**Commentary:** The state machine is correct. What hasn't been validated is whether a vendor, after receiving the approval email, can complete their profile and go live without requiring admin intervention. This needs one real vendor to run the full flow.

---

### 1.5 Governance: 5/10

| Evidence | Score |
|----------|-------|
| Admin panel: vendor management, status changes, review | ✓ |
| Email-list RBAC: only ADMIN_EMAILS addresses can access /admin/* | ✓ |
| Vendor lifecycle state machine with audit trail | ✓ |
| RBAC architecture designed (docs/RBAC_Architecture.md) | ✓ |
| Single email-list admin model — no role hierarchy | Gap |
| No audit log of admin actions | Gap |
| RBAC not implemented in code | Gap |
| ADMIN_EMAILS verification in Vercel pending confirmation | Gap |

**Commentary:** Governance is functional but brittle. The email-list model is adequate for a solo-founder operation. Before adding team members or showing to institutional investors, role-based access control must be implemented.

---

### 1.6 Financial Controls: 6/10

| Evidence | Score |
|----------|-------|
| Stripe live mode: PIIs, webhooks, signature verification | ✓ |
| Webhook idempotency: unique constraint on stripe_events.id | ✓ |
| Platform fee calculation: 10% applied at booking creation | ✓ |
| Revenue reconciliation: platform_stats view proven reconciled | ✓ |
| BUG-002: void calls in `issueRefundForCancellation` — silently fails | **GAP** |
| Manual refund pending: pi_3Tg8sL6lIKzSGzKL11qTibsO | **GAP** |
| No automated financial reporting or export | Gap |

**Commentary:** The Stripe integration is solid but BUG-002 is a material defect. Until fixed, any booking cancellation with a refund could leave the database in an inconsistent state (Stripe refund processed, but booking status not updated). This must be fixed before any live transactions are processed.

---

### 1.7 Data Integrity: 8/10

| Evidence | Score |
|----------|-------|
| TypeScript strict mode, 0 errors | ✓ |
| Supabase RLS configured | ✓ |
| Migration 046 applied and verified | ✓ |
| platform_stats reconciliation confirmed | ✓ |
| vendors.status CHECK constraint (DB-level integrity) | ✓ |
| Admin dashboard live integrity check (code-level) | ✓ |
| Backfill verified for existing vendor data | ✓ |
| No audit log table | Gap |
| No row-level change history | Gap |

**Commentary:** The strongest dimension. The combination of TypeScript strict mode, DB constraints, and application-level reconciliation checks gives high confidence in data accuracy.

---

### 1.8 Scalability: 7/10

| Evidence | Score |
|----------|-------|
| Next.js on Vercel: auto-scaling | ✓ |
| Supabase PostgreSQL: handles thousands of concurrent reads | ✓ |
| Stripe: handles unlimited payment volume | ✓ |
| Resend: handles transactional email at scale | ✓ |
| platform_stats is a VIEW (recomputes on every query — not cached) | Gap |
| No rate limit on admin endpoints | Gap |
| No CDN for vendor images | Gap |

**Commentary:** Infrastructure scales automatically. The only scaling concern at early stage is the platform_stats view — under high traffic, querying a live aggregate on every dashboard load adds unnecessary DB load. A materialized view or caching layer is a future optimization, not a current blocker.

---

### 1.9 Operations: 6/10

| Evidence | Score |
|----------|-------|
| Admin panel: vendor management, booking oversight | ✓ |
| Telegram alerts for operational events | ✓ |
| Structured logging with logger.info/warn | ✓ |
| Rate limiting on vendor apply endpoint | ✓ |
| No automated monitoring (Sentry, Datadog, etc.) | Gap |
| Incident response runbook: exists (docs/incident-response.md) | ✓ |
| Disaster recovery plan: exists (docs/disaster-recovery.md) | ✓ |
| No automated daily backup verification | Gap |

**Commentary:** Operations are founder-run. The Telegram alert integration is a genuine operational advantage for a solo operator. Monitoring tooling is absent — add Sentry (error tracking) before soft launch.

---

### 1.10 Customer Protection: 5/10

| Evidence | Score |
|----------|-------|
| Refund flow code exists | ✓ |
| Cancellation policy defined in code | ✓ |
| Secure checkout via Stripe (no card data touches Elbold servers) | ✓ |
| BUG-002: refund void calls — protection not reliably delivered | **GAP** |
| No dispute resolution process documented | Gap |
| No customer support contact mechanism on site | Gap |
| T&Cs / refund policy page: not confirmed present | Gap |

**Commentary:** Customer protection is the weakest dimension because BUG-002 directly affects refund reliability. A customer who books and then needs a refund may find the database doesn't reflect the refund they received via Stripe. This is a high-trust risk and a legal liability.

---

### 1.11 Vendor Protection: 6/10

| Evidence | Score |
|----------|-------|
| Application confirmation email | ✓ |
| Vendor dashboard: status visibility | ✓ |
| lifecycle_state machine: vendor can track where they are | ✓ |
| Rejection email with reason field | ✓ |
| No vendor terms of service | Gap |
| No dispute process for disputed bookings | Gap |
| Manual payout process (Stripe Connect not implemented) | Gap |

**Commentary:** Vendors are protected at the application stage. Payment protection relies on manual payout processes until Stripe Connect is implemented.

---

## 2. Dimension Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Vision | 7/10 | STRONG |
| Marketplace Model | 7/10 | STRONG |
| Vendor Acquisition | 6/10 | FUNCTIONAL — no live vendors yet |
| Vendor Activation | 5/10 | DESIGNED — untested E2E |
| Governance | 5/10 | FUNCTIONAL — RBAC gap |
| Financial Controls | 6/10 | GOOD — BUG-002 unresolved |
| Data Integrity | 8/10 | STRONG |
| Scalability | 7/10 | STRONG |
| Operations | 6/10 | FUNCTIONAL — no error monitoring |
| Customer Protection | 5/10 | FUNCTIONAL — BUG-002 risk |
| Vendor Protection | 6/10 | FUNCTIONAL — payout manual |
| **AVERAGE** | **6.3/10** | **PRE-REVENUE SEED STAGE** |

---

## 3. GO / NO-GO Verdicts

### Raising Investment: CONDITIONAL GO

**Conditions that must hold:**
1. BUG-002 disclosed to investors (not hidden)
2. Resend domain status disclosed
3. "No live revenue" stated clearly — do not imply traction that doesn't exist
4. Financial model (10/90 split, LTV/CAC projections) presented with realistic assumptions

**What plays well:**
- Production-grade infrastructure on day 1
- Strong data integrity story (TypeScript strict, reconciliation confirmed)
- Vendor-friendly model (90% payout, quality-gated)
- Founder has built the whole stack — low burn rate

---

### Vendor Recruitment: GO WITH CAUTION

**Conditions:**
1. Fix BUG-002 before processing any real bookings (vendor recruitment can start, but real bookings need the fix)
2. Verify ADMIN_EMAILS in Vercel — admin must receive new application alerts
3. Register Supabase redirect URL for production auth flow
4. Resend domain — verify SPF/DKIM/DMARC or emails land in spam

**Rationale:** The application flow is hardened, the admin review process works, and the vendor lifecycle machine is operational. Recruiting 10–20 founding vendors, reviewing applications, and activating the best ones is the right next step.

---

### Soft Launch (5–10 vetted vendors, invitation-only): CONDITIONAL GO

**Blockers to resolve first:**
1. **MUST:** Fix BUG-002 (refund void calls)
2. **MUST:** Verify Resend domain
3. **MUST:** Confirm ADMIN_EMAILS in Vercel
4. **MUST:** Register Supabase redirect URL
5. **RECOMMENDED:** Add Sentry error monitoring
6. **RECOMMENDED:** Manually refund pi_3Tg8sL6lIKzSGzKL11qTibsO in Stripe Dashboard

**Once above are resolved:** Soft launch with 5–10 invitation-only vendors and monitored bookings is viable.

---

### Public Launch: NO-GO

**Blockers:**
1. BUG-002 unresolved
2. RBAC not implemented (single email-list admin)
3. Stripe Connect not implemented (payouts are manual)
4. No error monitoring in production
5. No live transaction validation (end-to-end booking + payout + refund)
6. Customer support mechanism absent
7. T&Cs and refund policy pages not confirmed

**Target state for Public Launch:** All 7 blockers resolved + 1 successful real booking cycle completed.

---

## 4. Priority Action List for Investors

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | Fix BUG-002 (void calls in refund) | 30 min |
| 2 | Verify Resend domain (DKIM/SPF/DMARC) | 15 min in Resend dashboard |
| 3 | Confirm ADMIN_EMAILS in Vercel | 5 min |
| 4 | Register Supabase redirect URL | 5 min |
| 5 | Manually refund pi_3Tg8sL6lIKzSGzKL11qTibsO | 2 min |
| 6 | Recruit first 10 vendors | 1–2 weeks |
| 7 | Add Sentry error monitoring | 1 hour |
| 8 | Implement RBAC | 1–2 days |
| 9 | Implement Stripe Connect | 3–5 days |

---

**Status:** COMPLETE
