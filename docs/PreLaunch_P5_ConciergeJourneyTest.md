# Pre-Launch Priority 5 — Concierge Journey Test

**Date:** 2026-06-07
**Sprint:** ELBOLD Pre-Launch Operations
**Objective:** Run one complete concierge journey from customer submission through to vendor contact and customer response. Document every step.

---

## Prerequisites

Before running this test:
- Migration 041 applied (Priority 1 complete)
- At least 1 approved vendor in the relevant category
- Admin email notifications working (ADMIN_EMAILS set in Vercel)

---

## The Journey

```
Customer submits event request
     |
     v
Admin receives notification
     |
     v
Admin reviews request in /admin/concierge
     |
     v
Admin identifies matching vendor
     |
     v
Admin contacts vendor directly
     |
     v
Vendor responds with availability and pricing
     |
     v
Admin introduces vendor to customer
     |
     v
Customer receives a vendor recommendation
```

---

## Step-by-Step Test Script

### Step 1 — Customer Submits Request

Open a private browser window (or use a second email address) as the customer.

Navigate to: /concierge (or https://www.elbold.com/concierge)

Fill in real event details. Use a real event scenario that matches a vendor you have already approved.

For example:
- Name: Test Customer
- Email: a real inbox you can check
- Phone: real number
- Event type: Birthday Party
- Event date: 2-3 months from today
- Location: Essex (or Kent or London, matching your approved vendor's city)
- Guest count: 40
- Budget: £500 - £1,000
- Notes: "Looking for a DJ for an adult birthday party at a venue in Chelmsford. Needs 4 hours of music including some Motown."

Submit the form.

**Record:** Did the success screen appear? Y/N

---

### Step 2 — Admin Receives Notification

Check the admin inbox for the notification email.

**Record:**
- Email received: Y/N
- Time to receive: __ minutes
- All submitted fields visible in email: Y/N

---

### Step 3 — Admin Reviews Request in Panel

Log in as admin. Navigate to /admin/concierge.

Locate the request submitted in Step 1.

**Record:**
- Request appears in admin panel: Y/N
- All fields correctly displayed: Y/N
- Status shows as "New": Y/N

---

### Step 4 — Admin Identifies Matching Vendor

From /admin/concierge, click "Find Vendors" on the request card.

This opens the browse page filtered to the relevant category.

Identify the most suitable approved vendor based on:
- Category match (e.g. DJ for a DJ request)
- City match (vendor city close to the customer's location)
- Readiness score (prefer vendors with 3+ photos and 1+ package)
- Verification level (prefer verified vendors)

**Record:**
- Vendor identified: Y/N
- Vendor name: ______________
- Vendor category: ______________
- Vendor verification level: __

---

### Step 5 — Admin Contacts Vendor

Use the "Reply" link on the concierge request to open a mailto to the customer's email.

Alternatively, contact the vendor directly (you have their email from the admin vendor manager at /admin/vendors).

Send an email to the vendor with:
- The customer's event type, date, location, and guest count
- The customer's budget range
- The customer's email address and phone number (with the customer's permission)
- A request for the vendor's availability and quote

This is a manual match. You are the concierge.

**Template:**

Subject: ELBOLD Concierge Referral — [Event Type], [Date], [Location]

Hi [Vendor Name],

We have received an enquiry from a customer looking for [event type] services in [location] on [date]. Based on your profile, we think you would be a great fit.

Customer details:
- Event: [event type]
- Date: [event date]
- Location: [location]
- Guest count: [guest count]
- Budget: [budget range]
- Notes: [customer notes]

If you are available and interested, please reply with your availability, pricing, and any questions for the customer. We will make the introduction.

Kind regards,
ELBOLD Team

**Record:**
- Email sent to vendor: Y/N
- Timestamp: __

---

### Step 6 — Vendor Responds

Wait for the vendor to reply with availability and pricing.

**Record:**
- Vendor responded: Y/N
- Time to response: __ hours
- Response included: availability / pricing / questions

---

### Step 7 — Admin Introduces Vendor to Customer

Reply to the customer with the vendor's details.

**Template:**

Subject: We found a great match for your event on ELBOLD

Hi [Customer Name],

Thank you for your enquiry through ELBOLD Concierge. We have found a vendor who is available and matches your requirements.

[Vendor Business Name] — [Category]
[Vendor City]
Profile: [link to vendor profile on ELBOLD]
Availability: [confirmed for your date]
Pricing: [summary of vendor's quote or pricing range]

You can contact them directly at [vendor email or phone] or request a formal quote through their ELBOLD profile.

If you have any questions or need more options, please reply to this email.

Kind regards,
ELBOLD Team

**Record:**
- Introduction email sent to customer: Y/N
- Customer acknowledged or responded: Y/N

---

### Step 8 — Update Concierge Status

Update the request status to "matched" in Supabase:

```sql
UPDATE concierge_requests
SET status = 'matched',
    admin_notes = 'Matched with [Vendor Name]. Introduction sent [date].'
WHERE email = 'customer-email@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

---

## Journey Summary Record

| Step | Description | Result | Notes |
|---|---|---|---|
| 1 | Customer submits concierge request | PASS / FAIL | |
| 2 | Admin receives notification email | PASS / FAIL | Time: __ min |
| 3 | Request appears in /admin/concierge | PASS / FAIL | |
| 4 | Admin identifies matching vendor | PASS / FAIL | Vendor: __ |
| 5 | Admin contacts vendor | PASS / FAIL | |
| 6 | Vendor responds | PASS / FAIL | Time: __ hours |
| 7 | Admin introduces vendor to customer | PASS / FAIL | |
| 8 | Status updated to "matched" | PASS / FAIL | |

**Journey result:** COMPLETE / PARTIAL / BLOCKED

---

## What a Successful Journey Proves

A completed concierge journey proves:
1. The submission form works end-to-end
2. Admin notifications reach the right inbox
3. You can operate as a concierge without additional software
4. At least one vendor can respond in a reasonable timeframe
5. The customer experience is human and personal, not automated

This is the service level that differentiates ELBOLD from a directory. The concierge journey is not a fallback. It is one of the most valuable things the platform offers to customers who are overwhelmed or unsure where to start.

---

## Blockers and How to Handle Them

**No approved vendors in the right category:** Defer this test until at least 1 relevant vendor is approved.

**Vendor does not respond within 48 hours:** This is valuable data. Record it. This vendor needs a response time reminder and potentially a direct call.

**Customer does not receive the admin email:** Check ADMIN_EMAILS env var. Check Resend dashboard for delivery errors.

**Concierge request does not appear in admin panel:** Confirm migration 041 was applied successfully (Priority 1).
