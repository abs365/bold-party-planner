# ELBOLD 30-Day Execution Plan

**Start date:** 2026-06-08  
**End date:** 2026-07-07  
**Objective:** 20 Founding Vendors → 10 Quote-Ready → 1 Real Booking → 1 Verified Review  
**Constraint:** No new features. Fix launch-blocking bugs only.

---

## Success Metrics

| Milestone | Target date | Definition of done |
|-----------|-------------|-------------------|
| Companies House filed | Day 3 | Incorporation number received |
| Business bank account open | Day 7 | Account live, ELBOLD can receive funds |
| 5 vendors approved | Day 7 | Profile live, ≥1 package created |
| 10 vendors approved | Day 14 | Profile live, ≥1 package created |
| 20 vendors approved | Day 21 | Profile live, ≥1 package created |
| 10 vendors quote-ready | Day 21 | Vendor has responded to ≥1 quote within 24h |
| First real quote sent | Day 14 | Real customer sends quote request |
| First real booking | Day 25 | Deposit paid, booking status = `deposit_paid` |
| First verified review | Day 30 | Review submitted post-event, visible on vendor profile |

---

## Week 1 — Foundation (Days 1–7)

**Theme:** Company legal, first 5 vendors signed, platform live-check.

### Day 1 — Companies House & Legal

- [ ] File Ltd company at Companies House (online — £50, same-day confirmation)
  - Company name: ELBOLD Events Ltd (or verify chosen name is available)
  - Registered address: confirm address for public record
  - Director(s): confirm names and addresses
  - SIC code: `74909` (Other professional, scientific and technical activities) or `82990` (Other business support)
- [ ] Download Certificate of Incorporation when issued
- [ ] Note: Companies House number, UTR will follow from HMRC within 2–4 weeks
- [ ] Draft or finalise: Terms of Service, Privacy Policy, Cookie Policy
  - These must be live at `/legal/terms`, `/legal/privacy`, `/legal/cookies` before first transaction
- [ ] Confirm `elbold2026@gmail.com` is the ops email; create `hello@elbold.co.uk` if domain email not yet active

### Day 2 — Business Banking

- [ ] Apply for business bank account (Tide, Monzo Business, or Starling — same-day decisions common)
  - Required: Companies House number, director ID, business address
- [ ] Set Stripe payout bank account to business account once open
- [ ] Confirm Stripe account is verified and payouts are enabled (not blocked)

### Day 3 — Vendor Acquisition Prep

- [ ] Define founding vendor categories (aim for geographic and category spread):
  - Photography, Videography, Catering, Entertainment (DJ/Band), Venue, Floristry, Hair & Makeup, Bounce Castle / Inflatables, Photo Booth, Decor & Styling
- [ ] Write founding vendor pitch (1 paragraph):
  - "Be listed as a founding vendor on ELBOLD — UK's new events marketplace. No commission on your first 3 bookings. Get a verified badge. We handle quotes, bookings, and payments."
- [ ] Build outreach list: 50 vendors minimum (name, Instagram/Facebook, email if public)
  - Sources: Instagram hashtags (#essexphotographer, #londonweddingphotography, etc.), Yell.com, Google Maps, Facebook groups
- [ ] Set up tracking spreadsheet: Vendor Name | Category | Contact | Status | Date contacted | Notes

### Day 4 — First Outreach Batch

- [ ] Send first 20 outreach messages (Instagram DM or email)
  - Lead with: founding vendor benefit, zero-cost to list, ELBOLD handles the admin
  - Include: direct link to `/vendor/apply` or `/vendor/register`
- [ ] Follow up with any vendor who engaged during beta or soft launch period
- [ ] Post on LinkedIn: announce ELBOLD is live and seeking founding vendors

### Day 5 — Platform Live-Check

- [ ] Walk the full customer journey as a non-admin user:
  - Browse vendors → view profile → create event → send quote request
  - Confirm no broken pages, missing data, or auth errors
- [ ] Walk the full vendor journey:
  - Register → apply → (approve in admin) → add package → receive quote → respond
- [ ] Confirm admin panel is accessible at `/admin` and shows correct data
- [ ] Confirm Stripe payouts are enabled (not in restricted mode)
- [ ] If any journey-breaking bug found: fix it. Document it in `docs/bugs/`.

### Day 6 — Legal Pages Live

- [ ] Publish Terms of Service at `/legal/terms`
- [ ] Publish Privacy Policy at `/legal/privacy`
- [ ] Publish Cookie Policy at `/legal/cookies`
- [ ] Add footer links to all three on every page (if not already present)
- [ ] Confirm ICO registration or assess whether turnover threshold requires it

### Day 7 — Week 1 Review

**Targets:**
- [ ] Companies House filed (incorporation number in hand)
- [ ] Business bank account applied/open
- [ ] 20 outreach messages sent
- [ ] ≥5 vendor applications received or in pipeline
- [ ] Legal pages live

---

## Week 2 — Vendor Pipeline (Days 8–14)

**Theme:** Approve first 10 vendors, complete their profiles, send first quote.

### Day 8 — Process Applications

- [ ] Review all pending vendor applications in `/admin/vendors`
- [ ] Approve vendors who have: business name, bio, ≥1 photo, ≥1 package with price
- [ ] Reject or return incomplete applications with a specific note (use admin notes field)
- [ ] Send second outreach batch: 20 more vendors

### Day 9 — Vendor Onboarding Calls

- [ ] Book 15-minute calls with each approved vendor to:
  - Walk them through the dashboard
  - Help them add their first package if not done
  - Set expectation: you will send them a test quote this week
  - Get their availability window for first real customer
- [ ] Document which vendors have responded to test quote within 24h → these are your "quote-ready" vendors

### Day 10 — Vendor Profile Audit

For each approved vendor:
- [ ] Profile photo present and professional
- [ ] Bio is ≥ 100 words and describes the service clearly
- [ ] ≥1 package listed with price, duration, and what's included
- [ ] At least 1 gallery image
- [ ] Location/service area set correctly

Flag any vendor whose profile would not convert a customer. Contact them with specific improvement requests.

### Day 11 — First Customer Activation

- [ ] Identify first real customer (friend, family member, colleague planning an event)
  - Event must be real or planned (not fabricated)
  - Must be willing to go through the full flow: create event → quote → book → review
- [ ] Brief the customer: they will pay a real deposit, they will get a real vendor
- [ ] Have customer create account and create their event on the platform

### Day 12 — First Quote Request

- [ ] Customer sends quote request to ≥2 vendors on the platform
- [ ] Monitor admin panel: confirm quote appears in vendor dashboard
- [ ] Contact vendors directly (phone/WhatsApp) to ensure they see the quote and respond
- [ ] Target: first quote response within 24 hours

### Day 13 — Third Outreach Batch

- [ ] Send outreach batch 3: 20 more vendors
- [ ] Focus on categories not yet covered
- [ ] Share any early social proof: "X vendors already listed on ELBOLD"

### Day 14 — Week 2 Review

**Targets:**
- [ ] ≥10 vendors approved and profile-complete
- [ ] ≥5 vendors have responded to ≥1 quote (quote-ready)
- [ ] First customer account created, first quote request sent
- [ ] Companies House confirmation received (if not Day 1)

---

## Week 3 — Activation Sprint (Days 15–21)

**Theme:** Push to 20 vendors, 10 quote-ready, move first customer toward booking.

### Day 15 — Quote Follow-Through

- [ ] Check if customer has received quotes back from vendors
- [ ] If vendor has not responded: call them directly — is the platform dashboard working for them? Are notifications going to spam?
- [ ] If customer has quotes: help them understand how to accept a quote and proceed to deposit

### Day 16 — Vendor 11–15 Onboarding

- [ ] Approve and onboard next batch of vendors
- [ ] Prioritise vendors in categories the first customer needs
- [ ] For each new vendor: onboarding call + profile audit (same process as Week 2)

### Day 17 — Acquisition Push

- [ ] Post ELBOLD vendor recruitment content on:
  - Instagram (business account)
  - Facebook (local business groups)
  - LinkedIn
- [ ] Reach out to any local wedding or events Facebook groups — announce founding vendor opportunity
- [ ] Ask approved vendors to share ELBOLD to one other vendor in their network

### Day 18 — First Booking Setup

- [ ] Customer has selected a vendor from quotes received
- [ ] Customer clicks "Accept Quote" → proceeds to deposit payment
- [ ] Confirm: booking status moves to `pending_payment`, checkout session created
- [ ] Customer pays £X deposit via Stripe checkout
- [ ] Confirm: webhook fires, booking moves to `deposit_paid`, vendor and customer receive confirmation emails
- [ ] Check admin finance dashboard: ledger entry visible, no partial failure alerts

### Day 19 — Vendor 16–20 Onboarding

- [ ] Approve and onboard final batch to reach 20 founding vendors
- [ ] Send "Founding Vendor" confirmation email to all 20 approved vendors:
  - Thank them, confirm their founding badge
  - Set expectation for first booking referrals

### Day 20 — First Booking Confirmed

- [ ] Confirm booking in admin: status = `deposit_paid` or `confirmed`
- [ ] Vendor has confirmed the booking in their dashboard
- [ ] Both vendor and customer have received confirmation emails
- [ ] Event date is set and in the future

### Day 21 — Week 3 Review

**Targets:**
- [ ] 20 vendors approved and profile-complete
- [ ] 10 vendors have responded to ≥1 quote within 24h (quote-ready)
- [ ] First booking exists with status `deposit_paid` or `confirmed`
- [ ] Stripe payout scheduled or pending for vendor

---

## Week 4 — First Review (Days 22–30)

**Theme:** Shepherd the first booking to completion and capture a verified review.

### Day 22–24 — Pre-Event Check

- [ ] Contact vendor: confirm they are prepared, have all event details
- [ ] Contact customer: confirm event is still on, ask if they have any questions
- [ ] Confirm no cancellation or rescheduling is needed
- [ ] If event date is beyond Day 30: skip to mock review flow — see Day 28 note

### Day 25 — Post-Event Outreach (if event has occurred)

- [ ] Contact customer within 24 hours of event:
  - "How did it go? We'd love to hear your feedback."
  - Direct link to the review page for that booking
- [ ] Contact vendor: confirm event was delivered, mark booking as `completed` in dashboard

### Day 26 — Review Request

- [ ] If automated review request email has not fired: send manually from `hello@elbold.co.uk`
- [ ] Include: booking reference, vendor name, direct review link
- [ ] Follow up with a WhatsApp or text if customer is known personally

### Day 27 — Review Submitted

- [ ] Customer submits star rating + written review via platform
- [ ] Confirm review appears on vendor profile (if auto-approved) or in admin moderation queue
- [ ] If moderation is required: approve the review in admin
- [ ] Confirm review is publicly visible on vendor profile page

### Day 28 — Contingency: Event Is After Day 30

If the first customer's event date is beyond Day 30:
- [ ] Identify a vendor who has already worked an event (pre-ELBOLD) and is willing to submit a retrospective review
- [ ] Have a trusted contact book a service directly through the platform, take the service, and submit a review
- [ ] This is acceptable for platform validation; label the review accurately
- [ ] Do not fabricate or falsify reviews

### Day 29 — Evidence Pack

Compile proof of the four milestones:

**20 Founding Vendors**
- Screenshot of `/admin/vendors` showing 20 approved vendors

**10 Quote-Ready Vendors**
- Screenshot or export of vendors who responded to a quote within 24h

**1 Real Booking**
- Booking ID from admin panel
- Stripe payment intent ID (deposit paid)
- Screenshot: booking status = `deposit_paid` or `confirmed`

**1 Verified Review**
- Screenshot of review on vendor profile
- Booking reference it was submitted against

### Day 30 — 30-Day Retrospective

Answer the following:

- [ ] How many vendors are live on the platform?
- [ ] How many are actively quote-responsive (respond within 24h)?
- [ ] How many real bookings have been placed?
- [ ] How many verified reviews exist?
- [ ] What was the biggest acquisition bottleneck?
- [ ] What was the biggest activation bottleneck?
- [ ] What one platform fix (if any) would most improve conversion?
- [ ] What is the 30-day plan for Days 31–60?

---

## Daily Founder Routine

| Time | Action |
|------|--------|
| 09:00 | Check admin panel: new applications, new quotes, new bookings, any alerts |
| 09:30 | Reply to all vendor messages (email, Instagram, WhatsApp) |
| 10:00 | Outreach block: send 5–10 new vendor messages |
| 11:00 | Onboarding call(s) with new vendors |
| 14:00 | Customer follow-up (quotes, bookings, reviews) |
| 15:00 | Content / social post (vendor recruitment) |
| 17:00 | Update vendor tracking spreadsheet |
| 17:30 | End-of-day: check Stripe dashboard for any payment issues |

---

## Vendor Recruitment Targets by Category

| Category | Target count | Why |
|----------|-------------|-----|
| Photography | 4 | Highest demand on events platforms |
| Catering / Food | 3 | High average booking value |
| Entertainment (DJ/Band) | 3 | Repeat demand, easy to recruit |
| Venue | 2 | Anchor listings; high trust signal |
| Floristry / Decor | 2 | Strong visual content for social |
| Hair & Makeup | 2 | Popular for weddings and parties |
| Photo Booth | 2 | Low price point — good for first booking |
| Other | 2 | Bounce castles, magicians, MC, etc. |
| **Total** | **20** | |

---

## Launch-Blocking Bug Definition

Do not build features. Stop and fix only if:

- A customer cannot complete a booking (payment fails, booking not created)
- A vendor cannot receive or respond to a quote
- A webhook fails silently and booking status is wrong
- A refund fails and customer money is at risk
- Admin panel shows incorrect financial data

Anything else: log it, schedule it for after Day 30.

---

## Companies House Checklist

- [ ] Choose company name (check availability: find-and-update.company-information.service.gov.uk)
- [ ] Confirm registered office address (can be director's home temporarily)
- [ ] Confirm director details (name, DOB, nationality, occupation, address)
- [ ] Confirm share structure (e.g. 100 ordinary shares at £1 each)
- [ ] File online at Companies House (£50 fee, card payment)
- [ ] Receive Certificate of Incorporation (usually same day, emailed as PDF)
- [ ] Note: Companies House number is required to open business bank account
- [ ] HMRC will automatically notify you of Corporation Tax registration within 3 months
- [ ] Register for VAT only if turnover will exceed £90,000 in 12 months (unlikely at launch)

---

*Document owner: ELBOLD Founder*  
*Created: 2026-06-08*  
*Review date: 2026-07-07*
