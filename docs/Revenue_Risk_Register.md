# Revenue Risk Register
**ELBOLD Events — Financial Risk Assessment**
**Version 1.0 | June 2026 | Review: Monthly**

---

## Overview

This register documents all material risks to ELBOLD's revenue integrity, customer financial safety, and vendor trust. Each risk is rated on:

- **Severity**: Financial or reputational impact if the risk materialises (1–5)
- **Likelihood**: Probability of occurrence given current controls (1–5)
- **Risk Score**: Severity × Likelihood (1–25); scores ≥12 are flagged as HIGH priority
- **Owner**: The role responsible for monitoring and mitigation

**Update cadence:** Review after every significant incident, and monthly during the reconciliation run.

---

## Risk Table

### Section 1 — Customer Payment Risks

| ID | Risk | Severity | Likelihood | Score | Mitigation | Owner |
|----|------|----------|------------|-------|-----------|-------|
| CR-01 | Customer pays but booking is not confirmed — Stripe webhook fails silently | 5 | 2 | **10** | Idempotency key on `stripe_events.id`; WEBHOOK_RECEIVED logged to `financial_events` on every verified call; reconciliation detects orphaned confirmed bookings | Founder + Dev |
| CR-02 | Customer charged twice for same booking (duplicate checkout session) | 4 | 2 | **8** | Checkout sessions created once per booking; payment_intent_id stored on payments row; 23505 unique constraint prevents duplicate payment rows | Dev |
| CR-03 | Refund processed but customer not notified | 3 | 3 | **9** | `REFUND_COMPLETED` event logged; email notification to be added to `lib/resend/index.ts`; pending task | Dev |
| CR-04 | Customer disputes charge — chargeback filed, ELBOLD has no audit trail | 5 | 2 | **10** | `financial_events` append-only log captures every payment event; `charge.refunded` webhook handled; `disputes` table with open/closed status | Founder |
| CR-05 | ELBOLD holds customer deposit after vendor cancellation — no refund issued | 5 | 2 | **10** | Booking cancellation flow triggers refund; vendor payout is only created on `payment_status = 'fully_paid'`; manual review required for edge cases | Founder |
| CR-06 | Customer pays deposit but vendor rejects booking — deposit not returned promptly | 4 | 3 | **12** | MEDIUM-HIGH: Deposit refund on rejection is a manual step — needs automation. Add automatic refund trigger on booking status → 'rejected'. | Dev (pending) |
| CR-07 | Payment session expires but customer thinks they have paid | 3 | 2 | **6** | Stripe session expiry handled; booking remains in `pending` status until payment confirmed; customer can reattempt | Dev |

---

### Section 2 — Vendor Payment Risks

| ID | Risk | Severity | Likelihood | Score | Mitigation | Owner |
|----|------|----------|------------|-------|-----------|-------|
| VR-01 | Vendor payout delayed beyond 7 days with no communication | 4 | 3 | **12** | MEDIUM-HIGH: Overdue payouts flagged on Finance Dashboard (>7 days); no automated vendor notification exists — add email alert at 7-day mark | Dev (pending) |
| VR-02 | Vendor payout sent to wrong bank account | 5 | 1 | **5** | Vendor-supplied bank details stored in `vendor_bank_details`; admin must verify before first payout; no automated bank transfer (manual check required) | Founder |
| VR-03 | Commission calculated incorrectly — vendor overpaid or underpaid | 4 | 2 | **8** | `commission_amount` set at booking acceptance time (10% of `total_amount`); reconciliation engine compares expected vs actual commission daily; drift surfaces as critical alert | Dev |
| VR-04 | Vendor commission rate changed without vendor notification | 3 | 1 | **3** | Commission rate hardcoded at 10% in `lib/finance/ledger.ts`; not configurable per-vendor; any change requires code deployment | Dev |
| VR-05 | Vendor payout record exists but payout never sent (status stuck at 'pending') | 4 | 2 | **8** | Finance Dashboard shows pending payout total and overdue count; daily reconciliation flags overdue payouts; manual admin action required | Founder |
| VR-06 | Vendor subscription cancelled mid-month — partial period refund expected | 2 | 3 | **6** | Stripe handles subscription billing; no partial refunds on plan cancellation (standard SaaS practice); documented in vendor terms | Founder |
| VR-07 | Vendor disputes commission amount after event | 3 | 3 | **9** | Commission breakdown visible per-booking in `/vendor/payouts`; gross/fee/net shown per row; financial_ledger provides immutable source of truth | Founder |

---

### Section 3 — Fraud Risks

| ID | Risk | Severity | Likelihood | Score | Mitigation | Owner |
|----|------|----------|------------|-------|-----------|-------|
| FR-01 | Fraudulent customer disputes legitimate charge | 4 | 2 | **8** | `financial_events` log provides timestamped audit trail; booking confirmation email as proof of service; Stripe dispute evidence submission process | Founder |
| FR-02 | Synthetic booking — fraudulent vendor creates fake booking to extract payout | 5 | 2 | **10** | Vendor verification required before profile goes live; bookings require customer-initiated payment; vendor cannot create their own booking | Dev |
| FR-03 | Card testing — attacker uses ELBOLD checkout to test stolen cards | 4 | 2 | **8** | Stripe Radar fraud detection enabled by default; checkout sessions require real event/booking context; rate limiting on checkout creation recommended | Dev |
| FR-04 | Vendor account takeover — attacker changes bank details and extracts payout | 5 | 1 | **5** | Bank detail changes require authenticated vendor session; Supabase Auth email confirmation; admin notification on bank detail update recommended | Dev (pending) |
| FR-05 | Webhook replay attack — reprocessing old Stripe events | 4 | 1 | **4** | Idempotency enforced via `stripe_events.id` PRIMARY KEY; duplicate event INSERT throws 23505 and is handled gracefully; event is logged and skipped | Dev |
| FR-06 | Promo code abuse — customer reuses single-use discount codes | 2 | 3 | **6** | Promo system not yet built; address at implementation time | Dev |

---

### Section 4 — Chargeback Risks

| ID | Risk | Severity | Likelihood | Score | Mitigation | Owner |
|----|------|----------|------------|-------|-----------|-------|
| CB-01 | Customer files chargeback after vendor delivers event | 5 | 2 | **10** | Delivery evidence (booking confirmation, vendor communication) stored in DB; `charge.dispute.created` webhook adds to `disputes` table; Finance Dashboard shows open disputes | Founder |
| CB-02 | Chargeback reverses a payout already sent to vendor | 5 | 2 | **10** | ELBOLD absorbs chargeback cost until Stripe Connect migration; post-Connect, `reverse_transfer: true` on refunds claws back vendor share automatically. Pre-Connect risk requires reserve policy. | Founder |
| CB-03 | Multiple chargebacks from same customer — not flagged | 4 | 1 | **4** | `disputes` table captures all chargebacks by customer; admin can query dispute history; automated flag not yet built | Dev (pending) |
| CB-04 | Dispute not responded to within Stripe's deadline (typically 7–21 days) | 5 | 2 | **10** | Finance Dashboard shows open disputes; no automated email alert to admin — add Telegram/email notification on `charge.dispute.created` | Founder (pending) |

---

### Section 5 — Compliance Risks

| ID | Risk | Severity | Likelihood | Score | Mitigation | Owner |
|----|------|----------|------------|-------|-----------|-------|
| CP-01 | ELBOLD holds client money without FCA registration (PSR 2017) | 5 | 3 | **15** | HIGH: ELBOLD holds customer deposits before vendors are paid. Commercial agent exemption is uncertain. Stripe Connect migration eliminates this exposure. Monitor transaction volume against FCA de minimis thresholds. | Founder |
| CP-02 | No PCI DSS compliance — ELBOLD handles card data | 2 | 1 | **2** | Stripe Checkout handles all card data; ELBOLD never sees raw card numbers; PCI SAQ A applies (minimal scope) | Dev |
| CP-03 | GDPR — financial transaction data retention beyond legal requirement | 3 | 2 | **6** | `financial_events` is append-only (no DELETE/UPDATE policy); retention policy not yet defined — add data retention runbook (7-year financial record requirement in UK) | Founder |
| CP-04 | Consumer Rights Act 2015 — refund policy not clearly communicated pre-checkout | 4 | 2 | **8** | `RefundPolicyCard` component added to customer-facing pages; terms of service documents refund conditions; statutory 14-day cooling-off period applies to online services | Founder |
| CP-05 | VAT obligations — ELBOLD commission income may trigger VAT registration | 3 | 3 | **9** | Monitor: VAT threshold is £90,000 annual turnover. Commission at 10% of GMV means ELBOLD needs £900,000 GMV to cross threshold. Low risk at current scale, but track MRR + commission. | Founder |

---

### Section 6 — Operational Risks

| ID | Risk | Severity | Likelihood | Score | Mitigation | Owner |
|----|------|----------|------------|-------|-----------|-------|
| OR-01 | Stripe webhook delivery failure — missed events not detected | 5 | 2 | **10** | Stripe retries webhooks for 72 hours; `stripe_events` log shows last 24h health on Finance Dashboard; reconciliation detects gaps in commission records | Dev |
| OR-02 | Supabase database unavailable — payments processed but not recorded | 5 | 1 | **5** | Stripe holds payment record regardless; reconciliation can backfill from Stripe API; webhook will be retried by Stripe; non-fatal ledger writes prevent webhook 500s | Dev |
| OR-03 | Daily reconciliation cron fails silently | 4 | 2 | **8** | Vercel cron at 06:00 UTC; cron logs in Vercel dashboard; last reconciliation timestamp shown on Finance Dashboard — founder should note if >24h gap | Founder |
| OR-04 | ADMIN_EMAILS env var not set — admin routes unprotected | 5 | 1 | **5** | Admin routes check ADMIN_EMAILS; if empty, all users are rejected (fail-closed); Finance Dashboard and reconciliation route return 403 | Dev |
| OR-05 | STRIPE_WEBHOOK_SECRET rotated — webhook signature validation fails | 4 | 2 | **8** | Secret stored in Vercel env var; rotation requires immediate update and redeploy; monitoring: webhook 400 errors in Vercel logs signal this | Founder |
| OR-06 | Vendor payout batch processed against wrong vendor — admin error | 4 | 1 | **4** | Manual payout process requires admin to confirm vendor ID matches bank details; `vendor_payouts` row links to `vendor_id`; Finance Dashboard shows payout per vendor | Founder |
| OR-07 | Email provider (Resend) fails — booking confirmation not sent | 3 | 2 | **6** | Booking confirmation failure is non-fatal; booking is still created and payment recorded; Resend module-level import prevented per Next.js 16 constraint | Dev |
| OR-08 | Financial ledger write fails — payment recorded in payments but not ledger | 2 | 2 | **4** | Ledger writes are non-fatal (void IIFE); reconciliation detects GMV drift between payments table and ledger; daily drift report flags discrepancy | Dev |

---

## Priority Action Plan

Issues rated **≥10** requiring near-term founder/dev attention:

| Priority | Risk ID | Action | Deadline |
|----------|---------|--------|----------|
| 1 | CP-01 | Begin Stripe Connect vendor onboarding once GMV > £10k/month | Pre-scale |
| 2 | CR-06 | Automate deposit refund on booking rejection | Sprint 1 |
| 3 | CB-04 | Add Telegram/email alert on `charge.dispute.created` webhook | Sprint 1 |
| 4 | VR-01 | Add vendor email alert when payout is overdue by 7 days | Sprint 1 |
| 5 | CR-01 | Confirm reconciliation daily run is flagging orphaned bookings correctly | Verify now |
| 6 | OR-03 | Check Vercel cron execution logs to confirm reconciliation is running | Weekly |
| 7 | FR-04 | Add admin notification on `vendor_bank_details` UPDATE | Sprint 2 |
| 8 | CB-02 | Define pre-Connect chargeback reserve policy (% of GMV held) | Pre-scale |

---

## Closed / Mitigated Risks

| ID | Risk | Mitigation Date | Resolution |
|----|------|-----------------|------------|
| — | Duplicate webhook processing | Session 2 | `stripe_events` idempotency key (PRIMARY KEY on event.id) |
| — | No financial audit trail | Session 2 | `financial_events` append-only log + `financial_ledger` |
| — | Commission drift undetected | Session 2 | Daily reconciliation cron + Finance Dashboard alert bar |
| — | Vendor doesn't know their commission split | Session 2 | Per-booking breakdown in `/vendor/payouts` |

---

*Document owner: ELBOLD Founder*
*Last updated: June 2026*
*Related: `docs/Revenue_Flow_Architecture_Report.md`, `docs/Marketplace_Compliance_Assessment.md`, `docs/Stripe_Connect_Migration_Plan.md`, `docs/Revenue_Reconciliation_Runbook.md`*
