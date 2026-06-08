# ELBOLD First Revenue Validation Report

**Date:** 2026-06-08  
**Booking ID:** `9acefbfa-aaab-457e-864c-faeb5cb43b8c`  
**Payment:** GBP 1.00 live Stripe payment (infrastructure validation — not a real booking)  
**Tester:** Claude Code (automated CLI validation)

---

## Executive Summary

A live end-to-end test of the full ELBOLD booking and payment flow was executed against production. The payment pipeline (quote → booking → checkout → webhook → ledger) is **fully operational**. However, **one critical bug** remains in the cancellation/refund path that must be fixed before going live.

| Phase | Result |
|-------|--------|
| Booking Creation | PASS |
| Payment & Webhook | PASS |
| Financial Ledger | PASS |
| In-App Notifications | PASS |
| Cancellation Trigger | PASS |
| Automatic Refund | **FAIL — CRITICAL BUG** |

**FINAL VERDICT: Revenue Ready = NO** (one critical bug: automatic refund fires with `void` and is killed by Vercel serverless before completing)

---

## Pre-conditions

### Migration 045 Applied

Critical schema fix applied before this test:

```sql
-- Migration 045: Fix bookings.status CHECK constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN (
    'pending','pending_payment','accepted','rejected',
    'confirmed','completed','cancelled','disputed'
  ));
```

Without this migration, every quote acceptance would fail with PostgreSQL error 23514 (CHECK violation).

---

## Test Data

| Entity | ID / Value |
|--------|-----------|
| Customer | `rev-test-customer@elbold.com` (user `725addf7-1cfc-4c93-9db2-0f2c76622244`) |
| Vendor | `rev-test-vendor@elbold.com` (vendor `84c3d9ae-208e-4265-b60b-561b34a7f103`) |
| Event | `8343f6f7-66fd-419b-b327-2212c33c67cc` |
| Quote | accepted with price = GBP 1.00 (deposit = GBP 1.00) |
| Booking | `9acefbfa-aaab-457e-864c-faeb5cb43b8c` |
| Stripe Payment Intent | `pi_3Tg8sL6lIKzSGzKL11qTibsO` |
| Stripe Checkout Session | `cs_live_a1URF1lodfTNxGp0m5zUZCTi7rv0sAZLKeRZITmK6VtzXDu6M0n9cH0NvM` |
| Financial Ledger | `c80c15fc-6e98-46dc-8dd6-495d7f533f65` |

---

## Step-by-Step Results

### Payment Flow (Steps 1-12)

#### Step 1 — Stripe checkout session completed
**PASS**

- Session: `cs_live_a1URF1lodfTNxGp0m5zUZCTi7rv0sAZLKeRZITmK6VtzXDu6M0n9cH0NvM`
- Payment Intent: `pi_3Tg8sL6lIKzSGzKL11qTibsO`
- Amount: GBP 1.00 (live mode)

---

#### Step 2 — Webhook received successfully
**PASS**

Two webhook events processed at `2026-06-08T19:30:27`:

| Stripe Event ID | Type |
|----------------|------|
| `evt_3Tg8sL6lIKzSGzKL18g1mGFx` | `payment_intent.succeeded` |
| `evt_1Tg8sQ6lIKzSGzKLl8pdP03f` | `checkout.session.completed` |

Both recorded in `stripe_events` table (idempotency guard active).

---

#### Step 3 — No webhook errors
**PASS**

No error entries in `stripe_events`. Both events processed without exception.

---

#### Step 4 — Booking status: pending_payment -> confirmed
**PASS**

```
bookings.id     = 9acefbfa-aaab-457e-864c-faeb5cb43b8c
bookings.status = confirmed   (was: pending_payment)
```

Database evidence: direct REST query on `bookings` table, `status = 'confirmed'`.

---

#### Step 5 — payment_status updated correctly
**PASS**

```
bookings.payment_status = deposit_paid
```

---

#### Step 6 — confirmed_at timestamp populated
**FAIL — MINOR BUG**

```
bookings.confirmed_at = null
```

The webhook handler (`app/api/payments/webhook/route.ts`) updates `status` and `payment_status` but does not set `confirmed_at`. This is a minor data-completeness bug — the booking IS confirmed but the timestamp is missing. Does not affect revenue.

**Fix:** Add `confirmed_at: new Date().toISOString()` to the webhook's booking update in the `checkout.session.completed` handler.

---

#### Step 7 — payments table updated
**PASS**

```
payments row created:
  id         = 2ed1874a-8a2c-4e54-8bca-cc4056b849ff
  type       = deposit
  amount     = 1.00
  status     = succeeded
  currency   = gbp
  stripe_payment_intent_id = pi_3Tg8sL6lIKzSGzKL11qTibsO
  stripe_checkout_session_id = cs_live_a1URF1...
  created_at = 2026-06-08T19:30:28
```

---

#### Step 8 — financial_ledger entry created
**PASS**

```
financial_ledger:
  id                         = c80c15fc-6e98-46dc-8dd6-495d7f533f65
  gross_amount               = 1.00 GBP
  platform_commission_amount = 0.10 GBP  (10%)
  vendor_amount              = 0.90 GBP  (90%)
  payment_status             = paid
```

---

#### Step 9 — financial_events entries created
**PASS**

Two events created at `2026-06-08T19:30:29`:

| Event Type | Timestamp |
|-----------|-----------|
| `PAYMENT_RECEIVED` | 19:30:29.565 |
| `BOOKING_CONFIRMED` | 19:30:29.704 |

---

#### Step 10 — Customer confirmation email sent
**PRODUCTION-ONLY**

Cannot verify without Resend API key in local environment. Code path (`sendPaymentReceived`) is reachable and executes within webhook handler. In-app notification "Payment Received" fired for customer at `2026-06-08T19:30:29` (verified in `notifications` table).

---

#### Step 11 — Vendor notification sent
**PRODUCTION-ONLY**

Cannot verify without Resend API key. Code path (`sendVendorPaymentNotification`) reachable. In-app notification "Payment Confirmed" fired at `2026-06-08T19:30:29` (verified in `notifications` table).

---

#### Step 12 — Admin notification (payment)
**N/A**

No admin email configured for payment events (only for refunds). Not applicable.

---

### Cancellation and Refund Flow (Steps 13-19)

#### Step 13 — Cancel booking
**PASS**

```
PATCH /api/bookings/9acefbfa-aaab-457e-864c-faeb5cb43b8c
Body: { "status": "cancelled" }
Response: 200 OK

bookings.status       = cancelled
bookings.cancelled_at = 2026-06-08T19:49:27.017+00:00
```

---

#### Step 14 — Stripe refund created
**FAIL — CRITICAL BUG**

No refund recorded against payment intent `pi_3Tg8sL6lIKzSGzKL11qTibsO`.

**Root cause:** The cancellation route (`app/api/bookings/[id]/route.ts` line 251) calls `issueRefundForCancellation` using `void`:

```typescript
void issueRefundForCancellation(
  supabase, booking, user.id, "customer",
  user.email ?? "", customerName, eventTitle, ip
);

return NextResponse.json(booking);  // Response sent immediately
```

On Vercel serverless, execution terminates after the HTTP response is sent unless `waitUntil()` is used. The `void` fire-and-forget pattern causes the async refund work (Stripe API call, DB updates, emails) to be killed before it completes.

**Evidence:** Verified 15+ seconds after cancellation: no change in any of:
- `bookings.payment_status` (still `deposit_paid`)
- `payments` table (no refund row)
- `financial_ledger` (refund_amount=0, payment_status=paid)
- `financial_events` (no REFUND_COMPLETED)
- `audit_logs` (no booking.refund.issued)

**Fix required (Option B — non-blocking, Vercel-idiomatic):**
```typescript
import { waitUntil } from '@vercel/functions';

// Replace void call with:
waitUntil(issueRefundForCancellation(
  supabase as unknown as SupabaseClient,
  booking as unknown as RefundableBooking,
  user.id, "customer",
  user.email ?? "",
  (profile as { role: string; full_name?: string } | null)?.full_name ?? "Customer",
  eventData?.title ?? "your event",
  ipFromRequest(request)
));
```

Apply the same fix to the vendor cancel block (same `void` pattern around line 180).

---

#### Step 15 — Refund in payments table
**FAIL — see Step 14**

No refund payment row. Only original deposit row exists (`type=deposit, status=succeeded`).

---

#### Step 16 — financial_ledger refund entry
**FAIL — see Step 14**

```
financial_ledger.refund_amount  = 0    (expected: 1.00)
financial_ledger.payment_status = paid (expected: refunded)
```

---

#### Step 17 — booking.refund.issued audit log
**FAIL — see Step 14**

Zero audit log entries for this booking post-cancellation.

---

#### Step 18 — Customer refund email sent
**FAIL — see Step 14**

`sendRefundProcessed()` never called.

---

#### Step 19 — Admin refund alert sent
**FAIL — see Step 14**

`sendAdminRefundAlert()` never called.

---

## Evidence Summary

### Stripe Evidence

| Item | Value |
|------|-------|
| Payment Intent | `pi_3Tg8sL6lIKzSGzKL11qTibsO` |
| Checkout Session | `cs_live_a1URF1lodfTNxGp0m5zUZCTi7rv0sAZLKeRZITmK6VtzXDu6M0n9cH0NvM` |
| Amount charged | GBP 1.00 (live mode) |
| Refund | NOT ISSUED — manual refund required via Stripe Dashboard |
| Webhook Event 1 | `evt_3Tg8sL6lIKzSGzKL18g1mGFx` — `payment_intent.succeeded` |
| Webhook Event 2 | `evt_1Tg8sQ6lIKzSGzKLl8pdP03f` — `checkout.session.completed` |

### Database Evidence

| Table | Key Field | Value |
|-------|-----------|-------|
| `bookings` | status | cancelled |
| `bookings` | payment_status | deposit_paid (not refunded — bug) |
| `bookings` | confirmed_at | null (bug) |
| `bookings` | cancelled_at | 2026-06-08T19:49:27 |
| `payments` | deposit row | type=deposit, GBP 1.00, succeeded |
| `payments` | refund row | NOT CREATED (bug) |
| `financial_ledger` | gross_amount | 1.00 |
| `financial_ledger` | platform_commission | 0.10 |
| `financial_ledger` | vendor_amount | 0.90 |
| `financial_ledger` | refund_amount | 0 (bug) |
| `financial_ledger` | payment_status | paid (not refunded — bug) |
| `financial_events` | PAYMENT_RECEIVED | 2026-06-08T19:30:29 |
| `financial_events` | BOOKING_CONFIRMED | 2026-06-08T19:30:29 |
| `financial_events` | REFUND_COMPLETED | NOT CREATED (bug) |
| `stripe_events` | checkout.session.completed | 2026-06-08T19:30:27 |
| `stripe_events` | payment_intent.succeeded | 2026-06-08T19:30:27 |
| `notifications` | Payment Received | 2026-06-08T19:30:29 |
| `notifications` | Payment Confirmed | 2026-06-08T19:30:29 |
| `audit_logs` | booking.cancelled | 2026-06-08T19:49:27 |
| `audit_logs` | booking.refund.issued | NOT CREATED (bug) |

### Email Evidence

Cannot verify email delivery without Resend API access. In-app notifications confirm the notification code path executed for payment events.

---

## Bugs Found

### BUG-001 (FIXED BEFORE TEST) — CRITICAL
**bookings.status CHECK constraint missing 'pending_payment'**

- File: `supabase/migrations/001_initial.sql`
- Effect: Every quote acceptance fails with PostgreSQL 23514. No bookings can ever be created.
- Fix: `supabase/migrations/045_bookings_status_constraint_fix.sql` applied 2026-06-08
- Status: **FIXED AND VERIFIED**

---

### BUG-002 — CRITICAL (BLOCKS REVENUE READINESS)
**Automatic refund killed by Vercel serverless before completing**

- File: `app/api/bookings/[id]/route.ts` line 251 (customer cancel) and ~line 180 (vendor cancel)
- Effect: Cancellations never trigger automatic Stripe refunds. Customer left with no refund, no communication.
- Root cause: `void issueRefundForCancellation(...)` + immediate `return NextResponse.json(booking)`
- Fix: Replace `void` with `waitUntil()` from `@vercel/functions`
- Status: **OPEN — MUST FIX BEFORE FIRST LIVE BOOKING**

---

### BUG-003 — MINOR
**confirmed_at never set by webhook handler**

- File: `app/api/payments/webhook/route.ts` — `checkout.session.completed` handler
- Effect: Booking shows `confirmed_at = null` after successful payment. Affects data reporting.
- Fix: Add `confirmed_at: new Date().toISOString()` to the booking update
- Status: **OPEN — non-blocking for launch**

---

### OBSERVATION-001
**STRIPE_SECRET_KEY uses non-standard `mk_` prefix**

The `.env.local` and production environment contain `STRIPE_SECRET_KEY=mk_1TdbDi...`. Standard live secret keys start with `sk_live_`. The application works (checkouts and webhooks function), but direct REST API verification is blocked. Confirm the correct key type with Stripe support.

---

## Remaining Actions Before Public Launch

| Action | Priority |
|--------|----------|
| Fix BUG-002: `void` -> `waitUntil()` in cancel route | **CRITICAL** |
| Re-run this validation after BUG-002 fix | **CRITICAL** |
| Manual refund of GBP 1.00 via Stripe Dashboard (`pi_3Tg8sL6lIKzSGzKL11qTibsO`) | High |
| Verify Resend emails in Resend dashboard (check test@elbold) | High |
| ICO registration | High |
| Stripe bank account payout test | High |
| Confirm STRIPE_SECRET_KEY format with Stripe | Medium |
| Fix BUG-003: set confirmed_at in webhook | Low |
| Replace 14 post-incorporation placeholders (see Post_Incorporation_Execution_Checklist.md) | Medium |
| Recruit 20 Founding Vendors | Medium |

---

## Final Verdict

```
Revenue Ready = NO
```

**One fix required:** Apply `waitUntil()` to the cancellation refund path (~30 min including deploy). After that fix passes re-validation, ELBOLD is revenue ready.

**Payment pipeline works end-to-end:**
- Quote acceptance creates booking with `status=pending_payment` (post migration 045)
- Stripe checkout session generated correctly
- Webhook fires, updates booking to `confirmed/deposit_paid`
- Financial ledger records 90/10 split correctly
- In-app notifications fire for customer and vendor
- Cancellation updates booking status correctly

---

*Report generated by automated production smoke test — 2026-06-08*
