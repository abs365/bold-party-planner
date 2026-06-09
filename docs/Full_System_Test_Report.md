# Full System Test Report

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 8
**Instructions:** Complete every row manually using a real browser, real email addresses, and the Stripe test card `4242 4242 4242 4242`. Mark each step PASS, FAIL, or BLOCKER.

---

## CUSTOMER JOURNEY

### CJ-01: Register

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Visit https://www.elbold.com | Homepage loads, ELBOLD branding visible | |
| 2 | Click Get Quotes / Sign Up | Redirects to /signup | |
| 3 | Enter real email + password | Form accepts input | |
| 4 | Submit | Account created, confirmation email sent | |
| 5 | Check inbox | Email arrives from noreply@elbold.com within 2 min | |
| 6 | Click confirmation link | Browser opens elbold.com, session created | |
| 7 | Confirm redirected to /dashboard | Customer dashboard visible | |

---

### CJ-02: Verify Email

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Click expired confirmation link (>24h) | Lands on /login with "Confirmation link didn't work" message | |
| 2 | Sign in with correct credentials | Lands on /dashboard | |

---

### CJ-03: Create Event

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | From /dashboard, create a new event | Form visible | |
| 2 | Fill in event name, type, date, location | Fields accept input | |
| 3 | Submit | Event created, visible in dashboard | |

---

### CJ-04: Request Quote

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Browse vendors (/browse) | Vendor cards visible | |
| 2 | Open a LIVE approved vendor profile | Profile page loads | |
| 3 | Click "Request Free Quote" | Quote form opens | |
| 4 | Fill in event details + message | Form accepts input | |
| 5 | Submit | Quote created, vendor notified | |
| 6 | Customer receives "quote submitted" confirmation | Email arrives from ELBOLD | |

---

### CJ-05: Receive and Compare Quote

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Vendor responds to quote (see vendor journey) | | |
| 2 | Customer receives "vendor responded" email | Email arrives | |
| 3 | Open /dashboard/quotes | Quote visible with response | |
| 4 | Open quote detail | Price, description, deposit amount visible | |
| 5 | With 2+ vendor quotes: click "Compare Quotes" | Comparison page loads | |

---

### CJ-06: Accept Quote and Book Vendor

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Click "Accept Quote" on a quote | Booking created in pending_payment state | |
| 2 | Customer receives "booking awaiting payment" email | Email arrives | |
| 3 | Open booking at /dashboard/bookings | Pay Deposit button visible | |

---

### CJ-07: Pay Deposit

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Click "Pay Deposit" | Stripe Checkout opens | |
| 2 | Enter test card 4242 4242 4242 4242, any CVC, any future date | Payment form accepts | |
| 3 | Complete payment | Stripe returns success | |
| 4 | Booking status → confirmed | Booking updates in dashboard | |
| 5 | Customer receives booking confirmation email | Email arrives | |
| 6 | Vendor receives booking confirmed email | Email arrives | |
| 7 | Financial ledger shows: gross, commission (10%), vendor share (90%) | Verify in Supabase > financial_ledger | |

---

### CJ-08: Receive Refund

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Cancel a confirmed booking | Cancel button visible | |
| 2 | Confirm cancellation | Booking status → cancelled | |
| 3 | Stripe refund initiated | Check Stripe Dashboard | |
| 4 | Customer receives refund confirmation email | Email arrives | |
| 5 | Booking payment_status → refunded | Verify in Supabase | |

---

### CJ-09: Leave Review

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | After booking completed: visit vendor profile | Review form visible | |
| 2 | Submit 5-star review with comment | Review submitted | |
| 3 | Review visible on vendor profile (verified badge) | Review shown | |
| 4 | Vendor rating updates | Rating recalculated | |

---

## VENDOR JOURNEY

### VJ-01: Apply

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Visit /vendor/apply | Application form loads | |
| 2 | Fill in all fields including portfolio links | Form accepts input, Add Link works | |
| 3 | Submit with at least 1 portfolio link | Application submitted | |
| 4 | Vendor receives "application received" email | Email arrives | |
| 5 | Admin receives "new application" alert email | Email arrives | |
| 6 | Vendor redirected to /vendor/onboarding | Status timeline visible | |

---

### VJ-02: Verify Email (Vendor)

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Vendor receives Supabase confirmation email at signup | Email arrives | |
| 2 | Click confirmation link | Redirects to /confirmed (not /vendor/dashboard) | |
| 3 | /confirmed page shows "Email confirmed. Application under review." | Message visible | |
| 4 | Journey timeline shows "Email Confirmed" done, "Under Review" as current | Timeline visible | |

---

### VJ-03: Approval

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Admin approves vendor (see admin journey) | | |
| 2 | Vendor receives approval email | Email arrives | |
| 3 | Vendor can now access /vendor/dashboard | Dashboard accessible | |
| 4 | Vendor can now create packages (POST /api/vendor/packages) | 200 response | |
| 5 | A PENDING vendor cannot create packages | 403 response with clear message | |

---

### VJ-04: Profile Creation

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Upload 3+ portfolio photos | Photos saved, visible on profile | |
| 2 | Write bio (50+ chars) | Bio saved | |
| 3 | Create at least 1 service package with price | Package saved | |
| 4 | Add availability | Calendar updated | |

---

### VJ-05: Verification

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Submit ID document at /vendor/verification | Upload succeeds | |
| 2 | Submit proof of address | Upload succeeds | |
| 3 | Admin reviews documents (see admin journey) | | |
| 4 | verification_level updates to 2 | Verified badge visible on profile | |

---

### VJ-06: Go Live

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Admin advances lifecycle to LIVE | lifecycle_state = 'live' | |
| 2 | Vendor profile visible in /browse and /categories/[category] | Profile appears in search | |

---

### VJ-07: Receive Quote Request

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Customer sends quote request (see CJ-04) | | |
| 2 | Vendor receives "new quote request" email | Email arrives | |
| 3 | Quote visible at /vendor/quotes | Quote shown | |

---

### VJ-08: Respond to Quote

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Open quote, fill in price and description | Form accepts input | |
| 2 | Submit response | Quote status → responded | |
| 3 | Customer receives "vendor responded" email | Email arrives | |

---

### VJ-09: Receive Booking

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Customer accepts quote and pays deposit | | |
| 2 | Vendor receives "booking confirmed" email | Email arrives | |
| 3 | Booking visible at /vendor/bookings | Booking shown with customer details | |

---

## ADMIN JOURNEY

### AJ-01: View Application

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Login to admin@elbold.com | Redirects to /admin | |
| 2 | Navigate to /admin/vendors?status=pending | Pending vendor list visible | |
| 3 | Vendor from VJ-01 is visible in list | Application appears | |
| 4 | Stats bar shows Total = Approved + Pending + Rejected + Suspended | No integrity gap alert | |

---

### AJ-02: Approve Vendor

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Click Approve on a pending vendor | Approval modal opens with readiness checks | |
| 2 | Confirm approval | vendor.status → approved, lifecycle_state → approved | |
| 3 | Vendor approval email sent | Verify in Resend dashboard | |
| 4 | Audit log created | Check audit_logs table | |

---

### AJ-03: Reject Vendor

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Click Reject on a pending vendor | Rejection modal opens | |
| 2 | Select rejection reason template | Reason populated | |
| 3 | Confirm rejection | vendor.status → rejected | |
| 4 | Vendor rejection email sent | Verify in Resend dashboard | |

---

### AJ-04: Suspend Vendor

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Open an approved vendor | Suspend button visible | |
| 2 | Click Suspend | vendor.status → suspended, lifecycle_state → suspended | |
| 3 | Vendor loses marketplace access | Profile no longer visible in browse | |

---

### AJ-05: Advance Lifecycle

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Open an approved vendor (lifecycle_state=approved) | "Profile Setup" button visible | |
| 2 | Click "Profile Setup" | lifecycle_state → profile_setup | |
| 3 | "Verify Docs" button now visible | Button shows | |
| 4 | Click "Verify Docs" | lifecycle_state → verified | |
| 5 | "Go Live" button now visible | Button shows | |
| 6 | Click "Go Live" | lifecycle_state → live | |
| 7 | "Live" indicator shown | Green Zap + Live text | |

---

### AJ-06: Verify Documents

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Navigate to /admin/verifications | Pending verifications visible | |
| 2 | Open a vendor verification | Documents visible | |
| 3 | Mark as verified | verification_level updates | |

---

### AJ-07: Review Bookings

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Navigate to /admin/bookings | All bookings visible | |
| 2 | Filter by status | Filter works | |

---

### AJ-08: Review Payments

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Navigate to /admin/finance | Finance dashboard loads | |
| 2 | GMV shows correct value from live bookings | Value matches manual calculation | |
| 3 | Commission shows 10% of GMV | Value correct | |

---

### AJ-09: Review Refunds

| # | Step | Expected | Result |
|---|---|---|---|
| 1 | Cancel a booking as admin | Refund initiated | |
| 2 | Stripe Dashboard shows refund | Refund visible | |
| 3 | financial_ledger shows REFUND_COMPLETED event | Event in DB | |

---

## TEST SUMMARY

| Journey | Steps | PASS | FAIL | BLOCKER |
|---|---|---|---|---|
| Customer | 9 groups | | | |
| Vendor | 9 groups | | | |
| Admin | 9 groups | | | |

**Legend:**
- **PASS** — step completed successfully
- **FAIL** — step failed but not blocking the overall journey
- **BLOCKER** — step failure prevents the rest of the journey from being tested

---

## Known Blockers Before Testing

1. Migration 046 must be applied in Supabase Dashboard
2. Supabase redirect URL must be registered: `https://www.elbold.com/api/auth/callback`
3. Resend domain must be verified (SPF/DKIM/DMARC)
4. `ADMIN_EMAILS` must be set in Vercel production
5. At least 1 vendor must be in LIVE state before CJ-04 can be tested
