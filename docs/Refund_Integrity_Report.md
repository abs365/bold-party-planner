# ELBOLD Refund Integrity Report

**Date:** 2026-06-08  
**Applies to:** `issueRefundForCancellation()` in `app/api/bookings/[id]/route.ts`  
**Sprint:** Revenue Finalisation

---

## Execution Model

When a booking is cancelled (by customer or vendor) and the payment_status is `deposit_paid`
or `fully_paid`, `issueRefundForCancellation()` runs synchronously within the API request
before the HTTP response is returned. This guarantees all steps below are attempted within
Vercel's function execution window.

The function runs in two phases:

1. **Stripe phase** — must succeed or the whole function aborts (no secondary steps run).
2. **Secondary phase** — each step runs independently. A failure in one does not stop the others.
   Failures are logged to Vercel logs and recorded in `audit_logs` with
   `action = booking.refund.partial_failure` so the admin finance dashboard can surface them.

---

## Step-by-step Integrity Map

| Step | Target | Guarantee | On Failure |
|------|--------|-----------|------------|
| **1. Stripe refund** | Stripe API | **Guaranteed** — function returns early if this fails; no secondary steps run | Logged to Vercel logs; no DB change; booking stays in `deposit_paid` / `fully_paid` |
| **2. Booking payment_status** | `bookings.payment_status = "refunded"` | **Guaranteed** — awaited with error check; failure written to `failures[]` | Logged; partial_failure audit entry created; Stripe refund already issued |
| **3. Ledger status** | `financial_ledger.payment_status = "refunded"`, `refund_amount` set | **Guaranteed** — `updateLedgerPaymentStatus` is awaited; errors are internally logged | Logged by ledger helper; partial_failure audit entry created |
| **4. Ledger event** | `financial_events` row: `REFUND_COMPLETED` | **Best effort** — `appendLedgerEvent` is awaited; internal try/catch | Logged by ledger helper; row may be missing from financial event log |
| **5. Audit log** | `audit_logs` row: `booking.refund.issued` | **Best effort** — `createAuditLog` is awaited; internal try/catch | Logged by audit helper; refund still issued |
| **6. Customer email** | Customer receives "Refund processed" email via Resend | **Best effort** — awaited, wrapped in try/catch; failure pushed to `failures[]` | Logged to Vercel logs; partial_failure audit entry created |
| **7. Admin alert email** | Admin receives refund alert via Resend | **Best effort** — awaited, wrapped in try/catch; failure pushed to `failures[]` | Logged to Vercel logs; partial_failure audit entry created |
| **8. Partial failure record** | `audit_logs` row: `booking.refund.partial_failure` | **Best effort** — only written if `failures[]` is non-empty | Logged to Vercel logs only; admin must check Vercel logs if this also fails |

---

## Guarantee Definitions

| Level | Meaning |
|-------|---------|
| **Guaranteed** | The step is `await`ed with explicit error detection. If it fails, a `booking.refund.partial_failure` audit entry is created. The failure is surfaced in the admin finance dashboard. |
| **Best effort** | The step is `await`ed but failures are tolerated and do not prevent subsequent steps. Failures are logged and, where possible, written to the partial_failure audit entry. |
| **Optional** | Not applicable to this function — there are no optional steps. |

---

## Observability

### Vercel Logs
All failures in the secondary phase produce `console.error` lines prefixed with `[refund]`:
```
[refund] booking payment_status update failed <booking_id> <error>
[refund] Customer refund email failed <booking_id> <error>
[refund] Admin refund alert email failed <booking_id> <error>
```

### Admin Finance Dashboard (`/admin/finance`)
- Alert bar: shows orange banner if any `booking.refund.partial_failure` audit entries exist.
- Refund Partial Failures panel: lists each failure with booking ID, Stripe PI, failed steps, amount, and timestamp.

### Supabase `audit_logs` Table
Query to find all partial failures:
```sql
SELECT entity_id, new_values, created_at
FROM audit_logs
WHERE action = 'booking.refund.partial_failure'
ORDER BY created_at DESC;
```

---

## Recovery Playbook

If a partial failure is detected:

1. **Stripe refund already issued** — customer has their money. No reversal needed.

2. **Booking payment_status not updated** — run:
   ```sql
   UPDATE bookings SET payment_status = 'refunded' WHERE id = '<booking_id>';
   ```

3. **Ledger not updated** — run:
   ```sql
   UPDATE financial_ledger
   SET payment_status = 'refunded', refund_amount = <amount>, updated_at = now()
   WHERE stripe_payment_intent_id = '<pi_id>';

   INSERT INTO financial_events (ledger_id, event_type, metadata)
   SELECT id, 'REFUND_COMPLETED', '{"manual": true}'::jsonb
   FROM financial_ledger WHERE stripe_payment_intent_id = '<pi_id>';
   ```

4. **Customer email not sent** — contact customer directly or re-trigger via Resend dashboard.

5. **Admin alert not sent** — acknowledged via the finance dashboard panel.

---

## Rollback Policy

**Stripe refunds are never rolled back.** Once the Stripe API returns success, the customer's
refund is in flight regardless of what happens to secondary steps. ELBOLD does not attempt to
reverse a Stripe refund under any circumstances.

---

## Architecture Decision: Why Not a DB Transaction?

Stripe is an external system. A DB transaction cannot span a Stripe API call. Options considered:

| Option | Problem |
|--------|---------|
| Wrap all in DB transaction | Cannot include Stripe call; would rollback DB but not Stripe |
| Two-phase commit | Overkill for current scale; Stripe does not support distributed transactions |
| Saga pattern with compensating transactions | Correct architecture for high-volume; deferred to Phase 3 |
| Current approach: sequential await with failure logging | Correct for current scale; failures are detectable and recoverable |

The current approach is appropriate for the 0-50 booking/day scale of the current pilot.
When daily refund volume exceeds ~20/day, consider a durable queue (e.g., Vercel Queues) to
retry failed secondary steps.

---

*Report generated 2026-06-08*
