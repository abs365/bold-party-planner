# Beta Test Results — ELBOLD Pilot Validation

**Document:** Beta_Test_Results
**Phase:** 29 — Pilot Validation Mode
**Platform:** https://www.elbold.com
**Started:** 2026-06-03
**Last updated:** 2026-06-03

---

> This document tracks the outcome of every structured test run against the live platform.
> Each test is run by a real user on their real device.
> Do not simulate. Do not test from the same account that performed setup.
> Record pass, fail, or partial for every step.

---

## Tester Register

| Tester ID | Real name | Role | Device | Browser | Invited | Signed up | Active |
|---|---|---|---|---|---|---|---|
| C-01 | | Customer | | | | | |
| C-02 | | Customer | | | | | |
| C-03 | | Customer | | | | | |
| V-01 | | Vendor | | | | | |
| V-02 | | Vendor | | | | | |
| V-03 | | Vendor | | | | | |

---

## Test Suite A — Customer Journey

### A1 — Account Creation

**Tester:** ___  **Date:** ___  **Device:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| A1.1 | Visit https://www.elbold.com | Homepage loads. "Extraordinary Celebrations Start Here." visible | PASS / FAIL / SKIP | |
| A1.2 | Click "Sign Up" or "Get Started" | Signup page loads at /signup | PASS / FAIL / SKIP | |
| A1.3 | Select "Book Vendors" (customer role) | Customer signup path shown | PASS / FAIL / SKIP | |
| A1.4 | Enter real name, email, password | Form accepts input without error | PASS / FAIL / SKIP | |
| A1.5 | Submit signup form | "Check your email" confirmation shown | PASS / FAIL / SKIP | |
| A1.6 | Click confirmation link in email | Account confirmed, redirected to dashboard | PASS / FAIL / SKIP | |
| A1.7 | Dashboard loads correctly | Customer dashboard at /dashboard visible | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### A2 — Vendor Discovery

**Tester:** ___  **Date:** ___  **Device:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| A2.1 | Navigate to /browse | Browse page loads. Vendor cards visible | PASS / FAIL / SKIP | |
| A2.2 | Filter by category (e.g. "Photographer") | Vendor list filters correctly | PASS / FAIL / SKIP | |
| A2.3 | Filter by city | City filter narrows results | PASS / FAIL / SKIP | |
| A2.4 | Click a vendor card | Vendor profile page loads | PASS / FAIL / SKIP | |
| A2.5 | View vendor photos | Media gallery visible and loads | PASS / FAIL / SKIP | |
| A2.6 | View vendor packages | At least one package with price visible | PASS / FAIL / SKIP | |
| A2.7 | View vendor reviews | Reviews visible (or "no reviews yet") | PASS / FAIL / SKIP | |
| A2.8 | View verification badges | Trust badges render correctly | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### A3 — Quote Request

**Tester:** ___  **Date:** ___  **Device:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| A3.1 | On vendor profile, click "Request Free Quote" | Redirected to /dashboard/quotes/new?vendor=... | PASS / FAIL / SKIP | |
| A3.2 | Form loads with vendor name pre-filled | Vendor name visible at top of form | PASS / FAIL / SKIP | |
| A3.3 | Fill in: event type | Dropdown selects correctly | PASS / FAIL / SKIP | |
| A3.4 | Fill in: event date | Date picker works | PASS / FAIL / SKIP | |
| A3.5 | Fill in: city/location | Text field accepts input | PASS / FAIL / SKIP | |
| A3.6 | Fill in: guest count | Number field accepts input | PASS / FAIL / SKIP | |
| A3.7 | Fill in: budget range | Min/max fields accept input | PASS / FAIL / SKIP | |
| A3.8 | Fill in: message to vendor | Textarea accepts input | PASS / FAIL / SKIP | |
| A3.9 | Submit quote request | Success message shown. Redirected to /dashboard/quotes | PASS / FAIL / SKIP | |
| A3.10 | Quote appears in /dashboard/quotes | Quote visible with status "Awaiting Response" | PASS / FAIL / SKIP | |
| A3.11 | Vendor receives email notification | Vendor gets "New Quote Request" email | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### A4 — Quote Review and Accept

**Tester:** ___  **Date:** ___  **Device:** ___  
*Requires vendor to have responded first (coordinate with V-01 or V-02)*

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| A4.1 | Customer receives email: "You have a new quote response" | Email delivered with link | PASS / FAIL / SKIP | |
| A4.2 | Click link or navigate to /dashboard/quotes | Quote shows status "Response Received" | PASS / FAIL / SKIP | |
| A4.3 | Click quote to view detail | /dashboard/quotes/[id] loads with vendor response | PASS / FAIL / SKIP | |
| A4.4 | Vendor's price, message, and inclusions visible | All response fields rendered | PASS / FAIL / SKIP | |
| A4.5 | Click "Accept & Book" | Confirmation prompt or booking created | PASS / FAIL / SKIP | |
| A4.6 | Booking confirmation shown | Redirected to /dashboard/bookings | PASS / FAIL / SKIP | |
| A4.7 | Booking visible in /dashboard/bookings | Booking card shows vendor, amount, status | PASS / FAIL / SKIP | |
| A4.8 | Vendor receives "Quote Accepted" email | Email delivered to vendor | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### A5 — Quote Decline

**Tester:** ___  **Date:** ___  **Device:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| A5.1 | On quote detail, click "Decline" | Decline confirmation shown | PASS / FAIL / SKIP | |
| A5.2 | Quote status updates to "Not Selected" | Quote card reflects declined state | PASS / FAIL / SKIP | |
| A5.3 | Vendor receives "Quote Not Selected" email | Email delivered | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### A6 — Mobile Customer Journey

**Tester:** ___  **Date:** ___  **Device:** Mobile (iOS/Android)

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| A6.1 | Open https://www.elbold.com on mobile | Homepage renders correctly on small screen | PASS / FAIL / SKIP | |
| A6.2 | Browse vendors on mobile | Vendor cards render, touch targets usable | PASS / FAIL / SKIP | |
| A6.3 | Open vendor profile on mobile | Profile page, photos, packages readable | PASS / FAIL / SKIP | |
| A6.4 | Tap "Request Free Quote" on mobile | Mobile sticky CTA tappable, navigates correctly | PASS / FAIL / SKIP | |
| A6.5 | Complete quote request form on mobile | Form fields usable on touch screen | PASS / FAIL / SKIP | |
| A6.6 | View dashboard on mobile | Mobile bottom nav functional | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

## Test Suite B — Vendor Journey

### B1 — Vendor Application

**Tester:** ___  **Date:** ___  **Device:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| B1.1 | Visit https://www.elbold.com | Homepage loads | PASS / FAIL / SKIP | |
| B1.2 | Click "Join as a Vendor" or navigate to /vendor/apply | Application page loads | PASS / FAIL / SKIP | |
| B1.3 | Create account (if not already) | Signup completes | PASS / FAIL / SKIP | |
| B1.4 | Step 1 — Business Details: Fill in name, category, city | Form accepts input | PASS / FAIL / SKIP | |
| B1.5 | Step 2 — Location & Pricing: Fill in radius, min/max price | Form accepts input | PASS / FAIL / SKIP | |
| B1.6 | Step 3 — About & Links: Fill in bio, optional social | Form accepts input | PASS / FAIL / SKIP | |
| B1.7 | Submit application | "Check your email — we'll be in touch within 24–48 hours" shown | PASS / FAIL / SKIP | |
| B1.8 | Receive application confirmation email | "Your application has been received — ELBOLD Events" delivered | PASS / FAIL / SKIP | |
| B1.9 | Admin sees application in /admin/vendors?status=pending | Application visible in admin queue | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### B2 — Vendor Approval and Onboarding

**Tester:** ___  **Date:** ___  *Requires admin to approve B1*

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| B2.1 | Admin approves vendor in /admin/vendors | Status changes to "approved" | PASS / FAIL / SKIP | |
| B2.2 | Vendor receives "Your vendor profile is approved" email | Approval email delivered with next steps | PASS / FAIL / SKIP | |
| B2.3 | Vendor logs in at /login | Redirected to /vendor/dashboard | PASS / FAIL / SKIP | |
| B2.4 | Vendor dashboard loads | Dashboard shows profile completion score and quick actions | PASS / FAIL / SKIP | |
| B2.5 | Vendor navigates to /vendor/profile | Profile edit page loads | PASS / FAIL / SKIP | |
| B2.6 | Vendor adds/edits bio | Bio saves successfully | PASS / FAIL / SKIP | |
| B2.7 | Vendor navigates to /vendor/media | Photo upload page loads | PASS / FAIL / SKIP | |
| B2.8 | Vendor uploads at least one photo | Photo appears in media gallery | PASS / FAIL / SKIP | |
| B2.9 | Vendor navigates to /vendor/services | Package creation page loads | PASS / FAIL / SKIP | |
| B2.10 | Vendor creates a service package with price | Package saved and visible | PASS / FAIL / SKIP | |
| B2.11 | Vendor profile visible on /browse | Vendor card appears in marketplace | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### B3 — Lead Response

**Tester:** ___  **Date:** ___  
*Requires a customer to have sent a quote request first (coordinate with C-01)*

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| B3.1 | Vendor receives "New Quote Request" email | Email delivered with event details | PASS / FAIL / SKIP | |
| B3.2 | Vendor navigates to /vendor/quotes | Quote appears in "Needs Your Response" section | PASS / FAIL / SKIP | |
| B3.3 | Lead score visible (Good/Hot) | Score badge renders | PASS / FAIL / SKIP | |
| B3.4 | Customer event details visible | Event type, date, location, guests, budget shown | PASS / FAIL / SKIP | |
| B3.5 | Vendor expands card and fills in quote: price | Price field accepts number | PASS / FAIL / SKIP | |
| B3.6 | Vendor fills in message and services included | Fields accept input | PASS / FAIL / SKIP | |
| B3.7 | Vendor submits quote | "Quote submitted" confirmation | PASS / FAIL / SKIP | |
| B3.8 | Quote moves to "History" tab | Card no longer in "Needs Your Response" | PASS / FAIL / SKIP | |
| B3.9 | Customer receives "New Quote Response" email | Email delivered to customer | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### B4 — Booking Received

**Tester:** ___  **Date:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| B4.1 | Customer accepts vendor quote | Booking created | PASS / FAIL / SKIP | |
| B4.2 | Vendor receives "Quote Accepted" email | Email delivered with event details | PASS / FAIL / SKIP | |
| B4.3 | Vendor navigates to /vendor/bookings | Booking visible in bookings list | PASS / FAIL / SKIP | |
| B4.4 | Booking shows customer name, event, amount | All booking details readable | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

## Test Suite C — Admin Journey

### C1 — Admin Access and Overview

**Tester:** Admin (founder)  **Date:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| C1.1 | Navigate to /admin | Redirected to /login?redirect=/admin | PASS / FAIL / SKIP | |
| C1.2 | Log in with admin email | Redirected back to /admin | PASS / FAIL / SKIP | |
| C1.3 | ELBOLD Command Centre loads | 10 KPIs visible, no "Plan My Event" content | PASS / FAIL / SKIP | |
| C1.4 | Core Platform KPIs show real numbers | Counts match known state | PASS / FAIL / SKIP | |
| C1.5 | Pilot Launch KPIs visible | Vendors Contacted count correct | PASS / FAIL / SKIP | |
| C1.6 | Operations alerts show if pending items exist | Alert bar appears when vendors pending | PASS / FAIL / SKIP | |
| C1.7 | Sidebar groups visible (Marketplace, Trust & Safety, Finance, Operations, Pilot Launch) | All 5 groups with correct items | PASS / FAIL / SKIP | |
| C1.8 | Click every sidebar item | All 21 modules load without 404 | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### C2 — Vendor Approval Workflow

**Tester:** Admin  **Date:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| C2.1 | Navigate to /admin/vendors | Vendors list loads | PASS / FAIL / SKIP | |
| C2.2 | Click "Pending" filter | Only pending vendors shown | PASS / FAIL / SKIP | |
| C2.3 | Open a vendor record | Vendor details, category, city, bio visible | PASS / FAIL / SKIP | |
| C2.4 | Click "Approve" | Vendor status changes to approved | PASS / FAIL / SKIP | |
| C2.5 | Approval email sent to vendor | Confirmed by vendor tester | PASS / FAIL / SKIP | |
| C2.6 | Reject a different vendor with reason | Rejection modal opens, reason saved | PASS / FAIL / SKIP | |
| C2.7 | Rejection email sent to vendor | Confirmed by vendor tester | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

### C3 — Quote Pipeline Monitoring

**Tester:** Admin  **Date:** ___

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| C3.1 | Navigate to /admin/quotes | Quote pipeline loads with stats row | PASS / FAIL / SKIP | |
| C3.2 | Active quotes visible in table | Rows show vendor, customer, event, status | PASS / FAIL / SKIP | |
| C3.3 | "Action Required" column shows correct labels | "Awaiting vendor", "Awaiting customer" etc. | PASS / FAIL / SKIP | |
| C3.4 | "Needs Action" filter shows only actionable quotes | Filter reduces list correctly | PASS / FAIL / SKIP | |
| C3.5 | Search by vendor name works | Results filter in real time | PASS / FAIL / SKIP | |

**Outcome:** PASS / FAIL / PARTIAL  
**Bugs raised:** ___  
**Notes:** ___

---

## Test Results Summary

| Suite | Test | Last run | Tester | Outcome | Bugs |
|---|---|---|---|---|---|
| A | A1 — Account Creation | | | | |
| A | A2 — Vendor Discovery | | | | |
| A | A3 — Quote Request | | | | |
| A | A4 — Quote Accept | | | | |
| A | A5 — Quote Decline | | | | |
| A | A6 — Mobile Journey | | | | |
| B | B1 — Vendor Application | | | | |
| B | B2 — Vendor Approval & Onboarding | | | | |
| B | B3 — Lead Response | | | | |
| B | B4 — Booking Received | | | | |
| C | C1 — Admin Access & Overview | | | | |
| C | C2 — Vendor Approval Workflow | | | | |
| C | C3 — Quote Pipeline Monitoring | | | | |

**Total tests:** 13 suites  
**Passed:** 0 / 13  
**Failed:** 0 / 13  
**Not run:** 13 / 13

---

## Journey Completion Rate

The primary goal of the pilot is a completed end-to-end journey:

```
Vendor applies → Admin approves → Customer browses → Customer requests quote
→ Vendor responds → Customer accepts → Booking created
```

| Full journey attempt | Date | Customer tester | Vendor tester | Outcome | Blocker |
|---|---|---|---|---|---|
| Attempt 1 | | | | | |
| Attempt 2 | | | | | |
| Attempt 3 | | | | | |

**Target:** 3 complete end-to-end journeys before expanding to 20 testers.
