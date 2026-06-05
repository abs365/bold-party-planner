# ELBOLD Launch Monitoring Checklist
**Pilot Phase — First 30 Days**
Version 1.0 | Created 2026-06-05 | Commit dc405ed

---

## How to Use This Checklist

Run this checklist every day for the first 30 days after pilot launch.
Time required: 10–15 minutes per day.
Owner: Founder / admin.

Mark each item: ✅ PASS | ⚠️ WARN | ❌ FAIL | — N/A

---

## Daily Checklist

**Date:** ___________  **Completed by:** ___________  **Overall status:** ✅ / ⚠️ / ❌

---

### 1. SENTRY HEALTH

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 1.1 | No new error spikes | sentry.io → Issues → Last 24h | 0 new critical errors | |
| 1.2 | Payment webhook errors | sentry.io → filter tag `route:/api/payments/webhook` | 0 errors | |
| 1.3 | Auth errors | sentry.io → filter tag `route:/api/auth/*` | 0 errors | |
| 1.4 | Sentry event volume | sentry.io → Performance → Events/24h | > 0 (confirms DSN active) | |

**Action if FAIL:** Check Vercel Function logs for the failing route. Check `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are set correctly in Vercel.

---

### 2. STRIPE WEBHOOK HEALTH

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 2.1 | Webhook delivery rate | Stripe Dashboard → Developers → Webhooks → `/api/payments/webhook` | > 99% delivery | |
| 2.2 | Failed webhook attempts | Stripe → Webhooks → Failed | 0 failures | |
| 2.3 | Recent events processed | Stripe → Events → Last 24h | Events match expected activity | |
| 2.4 | `invoice.payment_failed` events | Stripe → Events → filter `invoice.payment_failed` | 0 (ideally) or handled | |

**Action if FAIL:** Check Vercel logs for `/api/payments/webhook`. Verify `STRIPE_WEBHOOK_SECRET` in Vercel env matches the secret in Stripe Dashboard → Webhook → Signing secret.

---

### 3. UPLOAD API HEALTH

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 3.1 | Supabase storage available | Supabase Dashboard → Storage → Buckets | `vendor-images` and `vendor-videos` both present | |
| 3.2 | Recent uploads succeeded | Supabase → Storage → vendor-images → Objects | New files from today's activity | |
| 3.3 | No upload errors in logs | Vercel → Functions → `/api/uploads` → Errors | 0 errors | |
| 3.4 | Plan limits enforced | Check a free vendor profile | Max 5 media items shown | |

**Action if FAIL:** Check Vercel function logs. Verify `SUPABASE_SERVICE_ROLE_KEY` is set. Check migration 037 was applied.

---

### 4. EVENT EMAIL HEALTH

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 4.1 | Resend sending domain verified | resend.com → Domains → elbold.com | Status: Verified | |
| 4.2 | Recent email deliveries | Resend → Emails → Last 24h | Emails delivered, not bouncing | |
| 4.3 | Bounce rate | Resend → Emails → filter Bounced | < 2% | |
| 4.4 | Test event creation email | Create a test event on production | Email received within 2 min | |

**Action if FAIL:** Check Resend Dashboard for error detail. Verify `RESEND_API_KEY` in Vercel. Check DNS SPF/DKIM records for elbold.com.

---

### 5. VENDOR REGISTRATIONS

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 5.1 | New applications today | `/admin/vendors` → filter Pending | Count ≥ 0 (review all) | |
| 5.2 | Applications approved within 24h | Admin review queue | 0 pending > 24h | |
| 5.3 | Approval email delivered | After approving → check Resend logs | Email sent and delivered | |
| 5.4 | Vendor onboarding progress | `/admin/vendors` → Verified count | Growing week-over-week | |

**Targets (Pilot Phase):**
- Week 1: 5 vendors applied
- Week 2: 10 vendors applied, 5 verified
- Week 3: 15 vendors, 10 verified
- Week 4: 20 vendors, 15 verified

---

### 6. CUSTOMER REGISTRATIONS

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 6.1 | New customer sign-ups today | `/admin/customers` → sort by created_at | Count ≥ 0 | |
| 6.2 | Signup errors | Vercel → `/api/auth/signup` → Errors | 0 | |
| 6.3 | Rate limit hits (429) | Vercel Logs → filter `429` | 0 (or legitimate: > 5/hr from same IP) | |
| 6.4 | Auth callback errors | Vercel → `/api/auth/callback` → Errors | 0 | |

---

### 7. QUOTE REQUESTS

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 7.1 | New quotes submitted | `/admin/quotes` → Last 24h | Count ≥ 0 | |
| 7.2 | Vendor response rate | `/admin/quotes` → responded / total | > 50% within 24h | |
| 7.3 | Quote emails delivered | Resend → filter subject `quote` | Delivered, not bouncing | |
| 7.4 | Converted to bookings | `/admin/bookings` → new today | Growing | |

**Targets (Pilot Phase):**
- Week 1: 2 quote requests
- Week 2: 5 quote requests, 1 booking
- Week 3: 10 quotes, 3 bookings
- Week 4: 20 quotes, 5 bookings, 1 payment

---

### 8. FAILED PAYMENTS

| # | Check | How | Expected | Status |
|---|---|---|---|---|
| 8.1 | `invoice.payment_failed` events | Stripe → Events → filter `invoice.payment_failed` | 0 | |
| 8.2 | Vendor notification sent | After any failure: check vendor email | Email received within 5 min | |
| 8.3 | `featured` flag cleared | After failure: check vendor DB row | `featured = false` | |
| 8.4 | Vendor recovered payment | Stripe → Subscriptions → `past_due` | 0 vendors stuck in past_due > 7 days | |
| 8.5 | One-time payment failures | Stripe → Payments → Failed | 0 | |

**Action if ❌ 8.4:** Contact vendor directly (email + phone). Check if card is expired. Offer to extend manually.

---

### 9. CRON EXECUTION STATUS

| # | Job | Schedule | How to verify | Expected | Status |
|---|---|---|---|---|---|
| 9.1 | `/api/cron/governance` | 03:00 UTC daily | Vercel → Functions → governance → last invocation | Runs daily, 200 response | |
| 9.2 | `/api/cron/reminders` | 08:00 UTC daily | Vercel → Functions → reminders → last invocation | Runs daily, 200 response | |
| 9.3 | `/api/cron/verification-check` | 04:00 UTC daily | Vercel → Functions → verification-check → last invocation | Runs daily, 200 response | |
| 9.4 | No admin alerts backlog | `/admin` → alert bar | 0 unread admin alerts (or all reviewed) | |

**Action if FAIL:** Check `CRON_SECRET` is set in Vercel. Check Vercel → Cron Jobs tab — all 3 should be listed. Check function logs for error detail.

---

## Weekly Summary (Every Monday)

| Metric | Target Week 1 | Target Week 2 | Target Week 4 | Actual |
|---|---|---|---|---|
| Vendors onboarded | 5 | 10 | 20 | |
| Vendors verified (L2+) | 2 | 5 | 10 | |
| Quote requests | 2 | 10 | 30 | |
| Bookings created | 0 | 1 | 5 | |
| First payment received | — | — | 1 | |
| Sentry errors | 0 critical | 0 critical | 0 critical | |
| Webhook delivery rate | 100% | 100% | 100% | |
| Email bounce rate | < 2% | < 2% | < 2% | |

---

## Escalation Criteria

Escalate immediately (do not wait for next daily check) if:

- Any Stripe webhook delivery drops below 95%
- Any payment failure with no vendor notification sent
- Sentry shows > 5 critical errors in 1 hour on payment routes
- Supabase storage bucket returns errors (uploads failing for all vendors)
- All 3 cron jobs missed for 2 consecutive days

---

## Quick Links

| Resource | URL |
|---|---|
| Production site | https://www.elbold.com |
| Admin panel | https://www.elbold.com/admin |
| Admin launch checklist | https://www.elbold.com/admin/launch |
| Vercel dashboard | https://vercel.com/abs365s-projects/bold-party-planner |
| Stripe dashboard | https://dashboard.stripe.com |
| Sentry dashboard | https://sentry.io |
| Resend dashboard | https://resend.com |
| Supabase dashboard | https://supabase.com/dashboard |
| GitHub repo | https://github.com/abs365/bold-party-planner |
