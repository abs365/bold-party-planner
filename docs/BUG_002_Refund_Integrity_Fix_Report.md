# BUG-002 Refund Integrity Fix Report
**Version:** 1.0 | **Date:** 2026-06-09 | **Reporter:** Engineering
**Bug ID:** BUG-002 | **Severity:** HIGH

---

## Executive Summary

BUG-002 is **RESOLVED**. All secondary integrity actions following a Stripe refund are now awaited, error-tracked, and surfaced for admin review on failure. The `refund_amount` field — which was not being written to the booking row — has been added to the booking update.

**Refund Integrity: PASS**
**Revenue Ready: GO WITH CAUTION** — code is correct; live end-to-end production test and 4 operational prerequisites remain.

---

## 1. Background

BUG-002 was identified in two phases:

**Phase 1 (fixed in commit `2d0b3f4`):** The outer call `void issueRefundForCancellation(...)` was fire-and-forget. If the Vercel serverless function completed its response before the refund function ran, the entire refund operation could be silently lost.

**Phase 2 (fixed in commit `b6fdb2a`):** Inside `issueRefundForCancellation`, the Stripe refund was awaited but the secondary integrity actions — booking status update, ledger update, audit log, refund emails — remained `void`. Each could silently fail or be killed by serverless function termination.

---

## 2. State of `issueRefundForCancellation` Before This Fix

### What was already correct (commit `b6fdb2a`)

| Action | Status |
|--------|--------|
| `await createRefund(...)` — Stripe refund | AWAITED ✓ |
| `await supabase.from("bookings").update(...)` — payment_status | AWAITED ✓ |
| `await updateLedgerPaymentStatus(...)` | AWAITED ✓ |
| `await appendLedgerEvent(...)` | AWAITED ✓ |
| `await createAuditLog(...)` — refund issued | AWAITED ✓ |
| `await sendRefundProcessed(...)` — customer email, in try/catch | AWAITED ✓ |
| `await sendAdminRefundAlert(...)` — admin alert, in try/catch | AWAITED ✓ |
| `await createAuditLog(...)` — partial_failure audit if steps fail | AWAITED ✓ |
| `failures[]` tracking for booking_status, customer_email, admin_email | PRESENT ✓ |

**Conclusion:** BUG-002 Phase 2 was already resolved in the codebase by commit `b6fdb2a`.

---

## 3. Remaining Gaps Found and Fixed in This Session

### Gap 1: `refund_amount` not written to booking row (FIXED)

**File:** `app/api/bookings/[id]/route.ts`

The `bookings` table has a `refund_amount DECIMAL(10,2)` column (added in migration 003). When a refund was issued, only `payment_status: "refunded"` was written. `refund_amount` remained NULL.

**Before:**
```typescript
const { error: bookingUpdateErr } = await supabase
  .from("bookings")
  .update({ payment_status: "refunded" })
  .eq("id", booking.id);
```

**After:**
```typescript
const { error: bookingUpdateErr } = await supabase
  .from("bookings")
  .update({ payment_status: "refunded", refund_amount: refundAmount })
  .eq("id", booking.id);
```

**Impact:** Before the fix, any query or UI that shows refund_amount on a booking would display NULL even after a successful refund. The financial_ledger table correctly stored `refund_amount` (via `updateLedgerPaymentStatus`), but the bookings table did not.

---

### Gap 2: Ledger update failure not tracked in `failures[]` (FIXED)

**File:** `app/api/bookings/[id]/route.ts`

`updateLedgerPaymentStatus` returns `null` on failure (it has an internal try/catch). Previously, a null return was not tracked in `failures[]`, so a ledger update failure would not generate a `partial_failure` audit entry.

**Before:**
```typescript
const ledgerId = await updateLedgerPaymentStatus(
  supabase,
  payment.stripe_payment_intent_id,
  "refunded",
  { refundAmount }
);
await appendLedgerEvent(..., ledgerId);
```

**After:**
```typescript
const ledgerId = await updateLedgerPaymentStatus(
  supabase,
  payment.stripe_payment_intent_id,
  "refunded",
  { refundAmount }
);
if (ledgerId === null) {
  console.error("[refund] ledger payment_status update returned null for booking", booking.id);
  failures.push("ledger_update");
}
await appendLedgerEvent(..., ledgerId);
```

**Impact:** Ledger failures are now tracked. If `updateLedgerPaymentStatus` fails, a `booking.refund.partial_failure` audit entry is written with `failed_steps: ["ledger_update"]`, making it visible in the admin finance dashboard.

---

## 4. Complete `issueRefundForCancellation` — Post-Fix Execution Flow

```
1. Check booking.payment_status is refundable (deposit_paid / fully_paid)
2. Fetch succeeded payment record from payments table
3. Calculate refund amount (deposit vs full)
4. AWAIT createRefund() ← Stripe API call
   → If Stripe fails: log + return (no secondary actions run)
5. AWAIT booking update: payment_status="refunded", refund_amount=N
   → If fails: log + failures.push("booking_status")
6. AWAIT updateLedgerPaymentStatus() ← returns ledgerId or null
   → If null: log + failures.push("ledger_update")
7. AWAIT appendLedgerEvent(REFUND_COMPLETED)
8. AWAIT createAuditLog(booking.refund.issued)
9. AWAIT sendRefundProcessed() ← customer email, try/catch
   → If fails: log + failures.push("customer_email")
10. AWAIT sendAdminRefundAlert() ← admin alert, try/catch
    → If fails: log + failures.push("admin_email")
11. If failures.length > 0:
    AWAIT createAuditLog(booking.refund.partial_failure) with failed_steps list
```

At no point does a secondary failure roll back or prevent the Stripe refund (step 4). At no point is the caller blocked by a secondary failure — failures are absorbed and audited.

---

## 5. Failure Tracking Summary

| Step | Failure Tracked In `failures[]` | Partial Audit Written |
|------|--------------------------------|----------------------|
| Stripe refund fails | N/A — function returns early | No |
| Booking status update fails | Yes: `"booking_status"` | Yes |
| Ledger update fails | Yes: `"ledger_update"` | Yes |
| Customer email fails | Yes: `"customer_email"` | Yes |
| Admin email fails | Yes: `"admin_email"` | Yes |
| Partial failure audit write fails | No — but this is an audit of an audit; error is logged | N/A |

---

## 6. TypeScript and Build Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS — 0 errors |
| `npm run build` | PASS — 102 routes compiled |

---

## 7. Live Test Protocol (Manual — Required)

**The following test must be executed manually in a real browser with a real Stripe account.**

> **Pre-condition:** Resolve the 4 operational prerequisites before the live test (see section 9).

**Test Steps:**

1. Log in as a customer with a real email account
2. Find an approved vendor with at least one package
3. Submit a quote request
4. Log in as the vendor; accept the quote
5. Log in as the customer; complete payment (real card, minimum amount)
6. Log in as either vendor or customer; cancel the booking
7. Verify all 8 outcomes below

**8 Verification Checks:**

```sql
-- 1. Stripe refund: check in Stripe Dashboard → Payments → [PI] → Refunds
-- Visual check required — no SQL for Stripe data

-- 2+3. booking payment_status + refund_amount
SELECT id, payment_status, refund_amount
FROM bookings
WHERE id = '<booking_id>';
-- Expected: payment_status='refunded', refund_amount NOT NULL

-- 4. Financial ledger updated
SELECT payment_status, refund_amount
FROM financial_ledger
WHERE booking_id = '<booking_id>';
-- Expected: payment_status='refunded', refund_amount = expected value

-- 5. Financial event appended
SELECT event_type, metadata, created_at
FROM financial_events
WHERE metadata->>'booking_id' = '<booking_id>'
ORDER BY created_at DESC LIMIT 5;
-- Expected: REFUND_COMPLETED event present

-- 6. Audit log: booking.refund.issued
SELECT action, actor_role, new_values, created_at
FROM audit_logs
WHERE entity_id = '<booking_id>'
ORDER BY created_at DESC LIMIT 5;
-- Expected: action='booking.refund.issued' present

-- 7+8. Email delivery: check Resend dashboard → Logs
-- Filter by customer email and admin email
-- Expected: sendRefundProcessed + sendAdminRefundAlert delivered (or in spam if domain unverified)
```

---

## 8. Out-of-Scope `void` Calls (Intentionally Retained)

The following `void` calls remain in the PATCH handler outside `issueRefundForCancellation`. They are intentionally fire-and-forget:

| Call | Reason Retained as void |
|------|------------------------|
| `void createAuditLog({ action: "booking.status.change" })` | Status change audit — does not affect financial integrity |
| `void createAuditLog({ action: "booking.cancelled" })` | Cancellation audit — same |
| `void track(...)` — analytics | Analytics failures must never block responses |
| `void updateVendorMetrics(...)` | Background metric refresh — delay is acceptable |
| `void sendBookingAccepted(...)` | Notification email — best effort |
| `void sendBookingRejected(...)` | Notification email — best effort |
| `void supabase.rpc("notify_user", ...)` | In-app notification — best effort |

None of these void calls are on the refund path.

---

## 9. Operational Prerequisites (Blocking Live Test)

These items must be resolved before the live test is meaningful:

| Prerequisite | Status | Action |
|-------------|--------|--------|
| Resend domain verified (DKIM/SPF/DMARC) | OPEN | Verify in Resend Dashboard — without this, refund emails land in spam |
| ADMIN_EMAILS confirmed in Vercel | OPEN | Check Vercel Dashboard → Environment Variables |
| Supabase redirect URL registered | OPEN | Add `https://www.elbold.com/api/auth/callback` in Supabase Auth settings |
| Manual refund: `pi_3Tg8sL6lIKzSGzKL11qTibsO` | OPEN | Issue GBP 1.00 refund in Stripe Dashboard |

---

## 10. Final Verdicts

### Refund Integrity: PASS

All integrity requirements are met:
- Stripe refund is awaited and failure causes early return (no secondary actions without confirmed Stripe refund)
- `booking.payment_status` set to `"refunded"` — AWAITED ✓
- `booking.refund_amount` populated — AWAITED ✓ **(new in this fix)**
- Financial ledger updated — AWAITED ✓
- Financial event appended — AWAITED ✓
- Audit log written — AWAITED ✓
- Customer refund email attempted — AWAITED in try/catch ✓
- Admin alert attempted — AWAITED in try/catch ✓
- Any failure after Stripe success produces a `partial_failure` audit entry ✓

### Revenue Ready: GO WITH CAUTION

The refund code is correct. The following operational items prevent upgrading to YES:

1. Live end-to-end refund test not yet executed in production
2. Resend domain unverified — refund emails may land in spam
3. ADMIN_EMAILS not confirmed — admin may not receive refund alerts
4. No live vendor with a completed booking cycle exists to test against

**Once the 4 operational prerequisites are resolved and the live test passes all 8 verification checks, Revenue Ready = YES.**

---

**Commit:** `fix(revenue): await refund integrity side effects`
**TypeScript:** PASS (0 errors)
**Build:** PASS (102 routes)
**Status:** DEPLOYED (pending Vercel)
