# ELBOLD Master Playbook

**Version:** 1.0  
**Date:** 2026-06-08  
**Owner:** ELBOLD Founder  
**Status:** Active — this document governs all ELBOLD operations.

Any future document, decision, or plan must support this playbook.  
If a new idea conflicts with the playbook, the playbook wins.

---

## 1. Vision

ELBOLD is the UK's most trusted events marketplace.

Not the largest. Not the fastest-growing. The most trusted.

Every vendor is real. Every review is earned. Every booking is protected.
When a customer books through ELBOLD, they know the vendor will show up,
the payment is safe, and if something goes wrong, it will be made right.

---

## 2. Mission

Connect people planning events with skilled, verified vendors —
and handle the entire process: discovery, quoting, booking, payment, and review.

The customer's job is to find the right vendor.  
ELBOLD's job is to make that safe and simple.  
The vendor's job is to deliver.

---

## 3. Founder Commandments

These are operational constraints, not aspirational values. They exist because the opposite of each is a real mistake real founders make.

1. **Do not build features when vendors are missing.** Every hour coding is an hour not recruiting. Below 20 vendors, the only valid reason to open a code editor is a launch-blocking bug.

2. **Trust is more important than growth.** One bad vendor destroys more trust than ten good vendors build. Grow only as fast as you can verify, onboard, and monitor.

3. **Real vendors beat fake activity.** Every vendor must be reachable, willing, and able to deliver. Placeholder profiles and unresponsive vendors damage customer trust. Remove them.

4. **Real reviews beat marketing claims.** No homepage copy means anything until a real customer has left a real review after a real event. Until then, say less, deliver more.

5. **One booking is worth more than 1,000 visitors.** A completed booking proves the platform works. Optimise for bookings, not page views.

6. **Fix launch-blocking bugs immediately.** Any defect that prevents a customer from booking, a vendor from quoting, a payment from processing, or a refund from reaching the customer: fix it now.

7. **Everything must support the path: Vendor → Quote → Booking → Review.** If a feature does not serve one of these four steps, do not build it yet.

8. **Protect customer money.** Refunds must be issued immediately when a vendor cancels. Never hold funds longer than terms allow. When in doubt: refund first, investigate second.

9. **Protect vendor reputation.** Do not approve without review. Do not suspend without cause. Do not route a booking a vendor cannot fulfil.

10. **Build slowly, build correctly.** A feature built correctly once costs less than a feature patched three times. Prefer a smaller platform that works over a larger one that sometimes doesn't.

---

## 4. Marketplace Strategy

### Model

ELBOLD is a managed marketplace, not an open directory.

- Vendors apply; they are not self-listed without approval.
- Customers browse, create events, and request quotes; they do not negotiate off-platform.
- All payments flow through ELBOLD. No cash, no BACS, no off-platform transfer.
- ELBOLD takes a platform commission on each completed booking.

### Supply-led Growth

At launch, the limiting factor is vendor supply, not customer demand.  
A customer who cannot find a vendor they want will leave and not return.  
Vendor recruitment and activation come before customer acquisition.

### Commission

- Platform commission: applied on deposit and full payment.
- Vendor receives payout after booking is confirmed and payment clears.
- Commission rate is set in vendor package configuration.
- Founding vendors receive a reduced commission on their first three bookings.

### Categories (Priority Order)

1. Photography
2. Catering & Food
3. Entertainment (DJ, Live Band, MC)
4. Venue
5. Floristry & Decor
6. Hair & Makeup
7. Photo Booth
8. Children's Entertainment (Bounce Castle, Magician)
9. Videography
10. Other

---

## 5. Launch Strategy

### Phase 0 — Infrastructure (Complete)
- Platform built and deployed
- Stripe live payments active
- Admin panel operational
- Vendor onboarding flow working
- Booking and quote flows functional

### Phase 1 — Founding Vendors (Days 1–21)
- 20 founding vendors approved and profile-complete
- 10 vendors quote-ready (responding within 24h)
- Legal pages live (Terms, Privacy, Cookie Policy)
- Companies House registered
- Business bank account open

### Phase 2 — First Transaction (Days 14–30)
- First real customer acquires a quote
- First real booking placed and deposit paid
- First real event delivered
- First verified review published

### Phase 3 — Controlled Growth (Days 31–90)
- 50 vendors total
- 5 bookings per month
- 5 verified reviews
- Marketing begins only after first review is live

### Phase 4 — Scale (Day 91+)
- Paid acquisition considered only after proven unit economics
- Geographic expansion only after the first market is working
- New features only after the core path (Vendor → Quote → Booking → Review) is reliable at volume

### What "Launch" Means

ELBOLD is launched when:
- A customer can discover a vendor, request a quote, pay a deposit, have the event, and leave a review — without any founder intervention required.

Until that cycle has completed once, the platform is in validation mode.

---

## 6. Trust Principles

Trust is the product. Every other feature is infrastructure.

### With Customers
- Customer money is never at risk. Stripe holds funds. Refunds are automatic on cancellation.
- Reviews are real. No incentivised or fabricated reviews will ever be published.
- Vendors are verified. Every approved vendor has been reviewed by a human before going live.
- Disputes are handled fairly and promptly. The customer is not abandoned after payment.

### With Vendors
- Vendors are not approved and forgotten. They receive onboarding support.
- Vendors are not suspended arbitrarily. Suspension requires cause, documented in the admin panel.
- Vendor payouts are processed on the agreed schedule. No unexplained delays.
- Vendor reputation is protected. A bad customer review is not removed, but it is monitored for abuse.

### Trust Signals (for the platform)
- Verified vendor badge (approved by ELBOLD)
- Founding vendor badge (one of the first 20)
- Response rate displayed on vendor profile
- Verified review badge on each review
- SSL, legal pages, Companies House number displayed in footer

---

## 7. Vendor Acquisition

### Ideal Founding Vendor Profile
- Based in the UK (initially: Essex, London, South East)
- Has an active portfolio or social media presence showing real work
- Responds to messages within 24 hours
- Has a clear, fixed-price service offering
- Has not had public complaints or poor reviews elsewhere

### Outreach Channels (Priority Order)
1. Instagram DM (search relevant hashtags by category + location)
2. Facebook local business groups
3. Google Maps / Yell.com listings
4. LinkedIn (for corporate event vendors)
5. Referrals from approved vendors
6. Local wedding and events expos

### Founding Vendor Offer
- Founding vendor badge on profile
- Reduced commission on first three bookings
- Free listing (no subscription fee)
- ELBOLD handles all payment, booking admin, and dispute resolution
- Early access to platform improvements

### Outreach Message Framework
- One paragraph. No jargon.
- Lead with: what ELBOLD does, why they should be a founding vendor, what it costs them (nothing).
- End with: direct link to apply.
- Never overpromise on booking volume at launch.

### Rejection Criteria
Do not approve a vendor who:
- Has no portfolio or cannot evidence their work
- Does not respond to onboarding messages within 48 hours
- Has no fixed pricing or refuses to list a package
- Has documented complaints or disputes on public review platforms
- Cannot clearly describe their service area

### Tracking
Maintain a vendor pipeline spreadsheet at all times:
Vendor Name | Category | Contact | Status | Date Applied | Date Approved | Quote Response Rate | Notes

---

## 8. Vendor Activation

A vendor is approved but not activated until they are quote-ready.

### Activation Steps
1. **Application approved** — vendor receives approval email, gains dashboard access
2. **Profile completed** — bio, photo, location, service area, gallery image
3. **Package created** — at least one package with name, price, duration, and inclusions
4. **Onboarding call** — 15-minute call: walk dashboard, confirm they can receive quotes, set expectations
5. **Test quote received and responded to** — vendor responds within 24 hours
6. **Status: Quote-Ready** — vendor is listed as active and visible to customers

### Vendor Dashboard Checklist (per vendor, verify in admin)
- [ ] Profile photo: professional, not a logo
- [ ] Bio: minimum 100 words, written in first or third person consistently
- [ ] At least one gallery image uploaded
- [ ] Service area set
- [ ] At least one package with price > £0
- [ ] Notification email confirmed active

### Vendor Support Protocol
- First non-response to onboarding: follow up after 48 hours
- Second non-response: send final message, mark as "inactive" in pipeline
- Approved vendor who never completes profile after 7 days: suspend pending completion
- Vendor who does not respond to a real quote within 24 hours: contact directly, investigate

---

## 9. Customer Acquisition

### Sequence
Customer acquisition does not begin at scale until:
- ≥10 quote-ready vendors are live
- ≥1 real booking has completed successfully
- ≥1 verified review is published

### Before First Review
- First customer is recruited personally (friend, family, colleague with a real event)
- No paid advertising
- No social media campaigns targeting customers
- No SEO investment
- Word of mouth and direct outreach only

### After First Review
- Share the review on Instagram and LinkedIn
- Begin SEO: optimise vendor profile pages for local search terms
- Consider Google Business Profile for ELBOLD

### After 5 Reviews
- Begin Instagram content calendar: vendor spotlights, before/after events, review features
- Consider Facebook/Instagram paid ads with a small test budget (£5/day maximum initially)
- Referral programme: existing customers receive a discount code for recommending ELBOLD

### Customer Trust Signals
- Real vendor photos and bios (not stock imagery)
- Real reviews with event type and date visible
- Clear pricing: no hidden fees
- Refund policy stated clearly before payment
- Legal pages accessible from every page

---

## 10. Revenue Operations

### Revenue Model
- Commission on each booking (deposit and/or full payment)
- No subscription fees at launch
- No listing fees at launch
- Founding vendor commission discount applies to first three bookings per vendor only

### Stripe Configuration
- Live mode: active
- Payouts: enabled to ELBOLD business bank account
- Refunds: automatic via platform on vendor cancellation
- Disputes: monitored in Stripe dashboard weekly

### Financial Ledger
- Every payment creates a ledger entry (`financial_ledger` table)
- Every refund creates a `REFUND_COMPLETED` ledger event
- Admin finance dashboard at `/admin/finance` shows: revenue, refunds, payouts, partial failure alerts
- Partial refund failures (Stripe succeeded but secondary step failed) appear as orange alerts in admin finance dashboard

### Reconciliation Cadence
- Weekly: check admin finance dashboard for alerts
- Weekly: check Stripe dashboard for failed payouts or disputes
- Monthly: reconcile Supabase `financial_ledger` with Stripe payout statements
- Monthly: confirm `booking.refund.partial_failure` audit log is empty; if not, execute recovery playbook

### Payout Schedule
- Vendor payouts are triggered after booking is marked `completed` by the vendor
- Payout timeline follows Stripe's standard processing (typically 2–7 business days)
- Vendor payout amount = booking amount minus platform commission

### Cash Flow Note
At launch volume (0–10 bookings/month), revenue is negligible.
Do not make financial decisions based on projected revenue until 20 bookings/month is sustained.

---

## 11. Admin Operations

### Admin Panel (`/admin`)
- Vendor management: approve, reject, suspend, unsuspend, view profile
- Booking management: view all bookings, status, payment status
- Finance dashboard: ledger, refunds, partial failure alerts
- Audit logs: every admin action is logged with actor, timestamp, and entity
- Analytics: booking trends, vendor performance, quote response rates

### Daily Admin Checks
- Pending vendor applications: review and action within 24 hours
- New bookings: confirm status is correct (no stuck `pending_payment` bookings)
- Finance alerts: check for `booking.refund.partial_failure` entries
- Stripe dashboard: check for disputes or payout failures

### Vendor Suspension Protocol
Suspend a vendor if:
- They fail to respond to a real customer quote within 48 hours (after direct contact attempt)
- A customer complaint is verified as valid
- Their profile contains false information
- They request removal

Suspension must be:
- Documented in admin notes with reason and date
- Communicated to the vendor via email
- Reviewed after 7 days — reinstate or permanently remove

### Refund Protocol
- Vendor-initiated cancellation: full refund issued automatically by platform
- Customer-initiated cancellation: refund per cancellation policy stated in terms
- Disputed charge: do not issue refund until Stripe dispute resolution completes
- Failed secondary action after Stripe refund: execute recovery playbook in `docs/Refund_Integrity_Report.md`

---

## 12. Daily Founder Routine

| Time | Action |
|------|--------|
| 09:00 | Admin panel: pending applications, new quotes, new bookings, finance alerts |
| 09:30 | Reply to all vendor messages (email, Instagram DM, WhatsApp) |
| 10:00 | Outreach block: 5–10 new vendor messages sent |
| 11:00 | Vendor onboarding call(s) if scheduled |
| 12:00 | Break |
| 13:00 | Customer follow-up: quotes accepted, bookings in progress, events completed |
| 14:00 | Platform check: walk one user journey end-to-end |
| 15:00 | Content or social post (vendor recruitment, event spotlight) |
| 16:00 | Vendor pipeline update: spreadsheet, status, notes |
| 17:00 | Stripe dashboard check: payouts, disputes |
| 17:30 | Done. No feature work after hours unless it is a launch-blocking bug. |

---

## 13. Weekly Founder Routine

| Day | Focus |
|-----|-------|
| Monday | Review previous week metrics. Set weekly targets. Plan outreach batch. |
| Tuesday | Vendor outreach batch (20+ messages). Onboarding calls. |
| Wednesday | Vendor profile audits. Admin cleanup. Content creation. |
| Thursday | Customer follow-up. Quote monitoring. Booking progress check. |
| Friday | Weekly review: vendors approved, quotes sent, bookings placed, reviews received. Adjust next week. |
| Saturday | Optional: social media, community engagement, vendor WhatsApp follow-ups. |
| Sunday | Rest. Do not operate the platform from a position of exhaustion. |

### Weekly Review Questions
1. How many vendors are now approved and quote-ready?
2. How many quotes were sent this week?
3. How many bookings are in progress?
4. Were any finance alerts triggered? Resolved?
5. What is the biggest blocker to the next milestone?
6. What is the one action next week that will move the needle most?

---

## 14. Launch Gates

Do not proceed to the next phase until the current gate is cleared.

### Gate 1: Legal Ready
- [ ] Companies House incorporation number received
- [ ] Business bank account open
- [ ] Terms of Service live at `/legal/terms`
- [ ] Privacy Policy live at `/legal/privacy`
- [ ] Cookie Policy live at `/legal/cookies`
- [ ] Stripe payouts enabled to business bank account

### Gate 2: Vendor Ready
- [ ] 20 vendors approved with complete profiles
- [ ] 10 vendors have responded to a real quote within 24 hours
- [ ] No launch-blocking bugs outstanding

### Gate 3: Transaction Ready
- [ ] First real quote request sent by a real customer
- [ ] First real quote response received from a vendor within 24 hours
- [ ] First real booking placed (deposit paid, booking status = `deposit_paid`)
- [ ] Stripe webhook confirmed: booking updated correctly after payment
- [ ] Admin finance dashboard: ledger entry visible, no partial failure alerts

### Gate 4: Review Ready
- [ ] First event delivered
- [ ] First verified review submitted by the customer
- [ ] Review visible on vendor profile page
- [ ] No fake, incentivised, or fabricated reviews have been published

### Gate 5: Growth Ready
- [ ] Gates 1–4 cleared
- [ ] 5 bookings completed (not just placed)
- [ ] 5 verified reviews published
- [ ] Unit economics confirmed: revenue per booking > cost per booking
- [ ] Platform operates without founder intervention for at least one booking cycle end-to-end

---

## 15. Crisis Response

### Payment Failure (Customer cannot pay)
1. Check Stripe dashboard: is the payment intent in `failed` status?
2. Check admin finance dashboard: any partial failure alerts?
3. Contact the customer directly: explain the issue, offer alternative (regenerate checkout link)
4. If Stripe is down: check Stripe status page; communicate ETA to customer; do not promise delivery
5. Log the incident in `docs/incidents/`

### Refund Not Received (Customer paid, booking cancelled, no refund)
1. Check `booking.payment_status` in admin: is it `refunded`?
2. Check Stripe: was `refunds.create` called for this payment intent?
3. If Stripe refund was issued: refund is in transit (2–7 days). Communicate to customer with Stripe refund ID.
4. If Stripe refund was NOT issued: issue manually via Stripe Dashboard immediately.
5. Check admin finance dashboard for `booking.refund.partial_failure` alerts.
6. Execute recovery playbook in `docs/Refund_Integrity_Report.md`.

### Vendor No-Show (Vendor does not attend the event)
1. Contact vendor immediately. Document non-response.
2. Issue full refund to customer immediately — do not wait for vendor response.
3. Suspend the vendor pending investigation.
4. Contact customer to apologise and confirm refund timeline.
5. If vendor has a valid reason: document and decide on reinstatement.
6. If vendor has no valid reason: permanent removal, logged in audit trail.

### False or Malicious Review
1. Do not remove immediately. Investigate first.
2. Contact the customer who submitted the review: confirm they are a real booking customer.
3. Contact the vendor: give them right of response.
4. If review is fabricated: remove, log in audit trail with reason.
5. If review is genuine but negative: do not remove. Respond publicly on behalf of ELBOLD if appropriate.
6. If review is abusive or defamatory: remove, notify the user, retain a copy.

### Platform Outage
1. Check Vercel deployment status: `vercel.com/dashboard`
2. Check Supabase status: `status.supabase.com`
3. Check Stripe status: `status.stripe.com`
4. If ELBOLD-specific: check recent deployments for a bad release; rollback via Vercel dashboard
5. Communicate to any in-flight customers via direct contact until platform is restored

---

## 16. Scale Roadmap

### Level 0 — Validation (Current)
- 0–20 vendors, 0–5 bookings/month
- Founder manages all operations manually
- No paid marketing
- No new features
- Objective: prove the core path works

### Level 1 — Early Traction
- 20–50 vendors, 5–20 bookings/month
- Introduce vendor self-service for more profile actions
- Begin SEO and organic social
- Introduce referral programme for customers
- Consider first part-time community/ops hire

### Level 2 — Growth
- 50–200 vendors, 20–100 bookings/month
- Introduce subscription tier for vendors (priority placement, analytics)
- Begin paid acquisition (Facebook/Instagram, Google)
- Geographic expansion to second UK city/region
- Introduce automated vendor performance monitoring

### Level 3 — Scale
- 200+ vendors, 100+ bookings/month
- Dedicated vendor success function
- Automated dispute resolution for standard cases
- API integrations (calendar sync, automated review requests)
- Consider institutional fundraising only if unit economics are proven

### What Not to Build Before Level 2
- Mobile app (vendor and customer)
- AI recommendation engine
- Real-time messaging between vendor and customer
- Subscription plans
- Affiliate or influencer programme
- International expansion

---

## 17. Success Metrics

### Primary Metrics (measure weekly)
| Metric | Definition |
|--------|-----------|
| Approved vendors | Vendors with status = `approved` and ≥1 package |
| Quote-ready vendors | Vendors who responded to ≥1 quote within 24h |
| Quotes sent | Total quote requests submitted by customers |
| Quote response rate | Quotes responded to within 24h ÷ total quotes sent |
| Bookings placed | Bookings with deposit paid (status = `deposit_paid`) |
| Bookings completed | Bookings with status = `completed` |
| Verified reviews | Reviews submitted against a completed booking |
| Refunds issued | Count and total value of refunds processed |
| Partial failure alerts | `booking.refund.partial_failure` entries in audit log |

### Secondary Metrics (measure monthly)
| Metric | Definition |
|--------|-----------|
| Revenue | Total platform commission collected |
| Gross booking value | Total value of all bookings placed |
| Average booking value | Total booking value ÷ bookings placed |
| Vendor churn | Vendors suspended or removed ÷ total approved |
| Customer repeat rate | Customers who placed ≥2 bookings ÷ total customers |
| Time to first quote | Time from event created to first quote received |
| Time to booking | Time from quote accepted to deposit paid |

### Vanity Metrics (do not optimise for these at launch)
- Page views
- Social media followers
- Email list size
- Vendor application count (vs. approvals)

---

## 18. 30-Day Plan

*See `docs/ELBOLD_30_Day_Execution_Plan.md` for full daily breakdown.*

**Summary:**

| Week | Theme | Target |
|------|-------|--------|
| 1 (Days 1–7) | Legal + First Vendors | Companies House filed; 5 vendors approved |
| 2 (Days 8–14) | Pipeline + First Quote | 10 vendors approved; first real quote sent |
| 3 (Days 15–21) | Activation Sprint | 20 vendors; 10 quote-ready; first booking |
| 4 (Days 22–30) | First Review | Event delivered; verified review published |

---

## 19. 90-Day Plan

| Period | Theme | Target |
|--------|-------|--------|
| Days 1–30 | Validation | 20 vendors, 1 booking, 1 review |
| Days 31–60 | Early Traction | 35 vendors, 5 bookings, 5 reviews |
| Days 61–90 | Growth Foundation | 50 vendors, 15 bookings, 10 reviews; organic SEO begun |

### Days 31–60 Actions
- Onboard vendors in underrepresented categories
- Implement automated review request email (if not already live)
- Publish first vendor spotlight posts on social media
- Analyse quote-to-booking conversion: which vendor types convert best?
- Begin keyword research for SEO (vendor category + location pages)

### Days 61–90 Actions
- Vendor profile pages optimised for local search
- Google Business Profile created for ELBOLD
- Referral programme launched for customers
- First assessment: is the platform operating without constant founder intervention?
- Decision point: continue bootstrapped growth or explore funding

---

## 20. Annual Vision

By the end of Year 1, ELBOLD should be:

- The most trusted events marketplace in its target geography (Essex, London, South East)
- Known for real vendors, real reviews, and reliable payments
- Generating enough revenue to cover platform costs without external funding
- Operating with enough vendor supply that a customer can always find a quote within 24 hours
- Referenced by vendors as the marketplace that treats them professionally
- Referenced by customers as the marketplace where they feel safe booking

**Not measured by:**
- Valuation
- Investor interest
- Social media reach
- Press coverage

**Measured by:**
- Number of completed bookings
- Number of verified reviews
- Net Promoter Score from customers
- Vendor retention rate
- Zero unresolved refund failures

---

## Document Index

| Document | Purpose |
|----------|---------|
| `docs/ELBOLD_MASTER_PLAYBOOK.md` | This document — single source of truth |
| `docs/ELBOLD_Founder_Commandments.md` | The 10 rules; read before every decision |
| `docs/ELBOLD_30_Day_Execution_Plan.md` | Daily and weekly actions for Days 1–30 |
| `docs/Refund_Integrity_Report.md` | Refund architecture, guarantee levels, recovery playbook |
| `docs/Revenue_Ready_Final_Report.md` | Revenue readiness validation evidence |

---

*This playbook is a living document. Update it when strategy changes, not when tactics change.*  
*Tactics belong in daily and weekly plans. Strategy belongs here.*  
*Last updated: 2026-06-08*
