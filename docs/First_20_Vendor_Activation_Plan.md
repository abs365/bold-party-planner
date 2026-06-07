# ELBOLD — First 20 Vendor Activation Plan

**Version:** 1.0  
**Date:** 2026-06-07  
**Owner:** Founder  
**Live Tracker:** https://www.elbold.com/admin/vendor-activation

---

## What This Is

Acquisition gets a vendor to sign up. Activation gets a vendor to a state where a customer can find them, request a quote, and receive a response.

A vendor account that has never received a quote is not a vendor on the platform. It is a data entry.

This plan defines the 8-stage activation journey for ELBOLD's first 20 vendors, what success looks like at each stage, what can go wrong, and exactly what the founder does to prevent drop-off.

---

## Success Metric

> **An approved vendor who receives a quote request within 30 days of approval.**

Not:
- A vendor who registered
- A vendor who was approved
- A vendor who has a profile

A vendor who has been found by a real customer, considered, and contacted.

---

## The 8-Stage Activation Journey

| Stage | Checkpoint | What It Means | Owner |
|---|---|---|---|
| 1 | Application submitted | Vendor has applied to join ELBOLD | Vendor |
| 2 | Verification completed | Government ID approved (Level 2+) | Vendor + Admin |
| 3 | Approved | Admin has approved the vendor profile | Admin |
| 4 | Profile completed | Bio (50+ chars), phone, city all set | Vendor |
| 5 | Media uploaded | At least one photo uploaded to gallery | Vendor |
| 6 | Services added | At least one package with pricing defined | Vendor |
| 7 | First quote received | A customer has requested a quote | Customer |
| 8 | First booking received | A customer has confirmed a booking | Customer |

**Activation = Reaching Stage 7 within 30 days of Stage 3.**

---

## Why Vendors Stall at Each Stage

### Stage 1 → 2 (Verification drop-off)
**Why it happens:** Vendors don't know what documents to submit, worry their documents will be rejected, or don't feel verification is necessary.
**What the data says:** 40-60% of registrations never complete document submission without a follow-up.
**Fix:** Send a personal message within 24 hours of registration. Tell them exactly what to upload and why it matters.

### Stage 2 → 3 (Approval delay)
**Why it happens:** Admin hasn't reviewed the submission. Verification documents need to be reviewed manually.
**Fix:** Review every pending verification within 24 hours. Never let a vendor wait more than 48 hours for an approval decision.

### Stage 3 → 4 (Profile completion stall)
**Why it happens:** Vendor is approved but doesn't realise their profile is incomplete. They think "approved" means "ready."
**Fix:** Send a welcome message immediately after approval. Include a link to /vendor/profile and a checklist of exactly what to complete. Follow up at 72 hours if incomplete.

### Stage 4 → 5 (No photos)
**Why it happens:** Vendors don't have professional photos readily available. They plan to upload later. Later never comes.
**Fix:** Explicitly tell them during onboarding that profiles without photos receive ~0 quote requests. Even one photo is enough to start. Ask for their phone photos if they have no professional ones yet.

### Stage 5 → 6 (No packages/pricing)
**Why it happens:** Vendors are unsure how to price or structure their offering. They don't want to commit to a price publicly.
**Fix:** Give pricing examples for their category. Tell them the package is a starting point, not a contract — they can negotiate per quote. A price range is better than no price.

### Stage 6 → 7 (Quote-ready but no customers)
**Why it happens:** The vendor has done everything right. The marketplace doesn't yet have enough customer traffic to generate quote requests organically.
**Fix:** This is a platform demand problem, not a vendor problem. Solutions: (1) reach out to customers directly and direct them to quote-ready vendors, (2) share vendor profiles on social media, (3) ensure the vendor appears in category pages and search results.

### Stage 7 → 8 (Quote not converting to booking)
**Why it happens:** Vendor response time is slow, pricing is too high, customer chose a different vendor, or vendor declined the quote.
**Fix:** Coach vendors on response speed (respond within 4 hours) and quote quality (specific, personal responses win over generic templates).

---

## The 30-Day Activation Timeline

### Day 1 (Application received)
- [ ] Send welcome message confirming receipt
- [ ] Remind: government ID required to proceed
- [ ] Link directly to /vendor/verification

### Day 2-3 (Verification review)
- [ ] Review submitted documents within 24 hours
- [ ] Approve or send specific feedback on rejection
- [ ] Never leave a vendor waiting more than 48 hours

### Day 3 (Approval day)
- [ ] Send personalised approval message
- [ ] Include direct links: /vendor/profile, /vendor/media, /vendor/services
- [ ] Share the activation checklist (stages 4-6)
- [ ] Explain what happens when a customer finds them

### Day 5 (First check-in)
- [ ] Is profile bio written? (50+ characters)
- [ ] Is city/phone set?
- [ ] If not: send a personal nudge with the specific missing items

### Day 7 (One-week check)
- [ ] Has at least one photo been uploaded?
- [ ] Has at least one package been created with a price?
- [ ] If not: send specific help (photo tips, pricing examples for their category)

### Day 10 (Quote-readiness review)
- [ ] Is the vendor visible in browse by their category?
- [ ] Does their profile look good to a customer?
- [ ] If profile is strong: proactively share on ELBOLD's social channels
- [ ] If profile is weak: flag specific improvements

### Day 14 (Two-week check)
- [ ] Has the vendor received any quote requests?
- [ ] If yes: confirm they responded promptly — coach if not
- [ ] If no: investigate why — is the vendor appearing in search? Any category competition?

### Day 21 (Three-week review)
- [ ] If still no quote: consider direct outreach to potential customers in the vendor's location/category
- [ ] Check vendor response rate — are they using the platform?
- [ ] Review whether the vendor's profile is compelling vs others in the category

### Day 30 (Activation deadline)
- [ ] Count: how many of the first 20 received at least one quote within 30 days?
- [ ] For those who didn't: document the reason and the intervention attempted
- [ ] Feed findings into acquisition strategy for the next 30 vendors

---

## What "Quote-Ready" Looks Like

Before a vendor can receive a quote, they need ALL of the following:

| Requirement | Check |
|---|---|
| Status: approved | `vendors.status = 'approved'` |
| Bio written (50+ characters) | `vendors.bio.length >= 50` |
| Phone number set | `vendors.phone IS NOT NULL` |
| City / service area set | `vendors.city IS NOT NULL` |
| At least 1 photo | `vendor_media.count >= 1` |
| At least 1 package with price | `vendor_packages.count >= 1` |

A vendor missing ANY of these items is not fully visible to customers and will not receive quote requests.

---

## Per-Category Activation Notes

### Photographers
- Ask for 5-10 portfolio shots immediately — this category lives on visual evidence
- Pricing should cover: half-day, full-day, and event packages separately
- Location matters most: Essex/Kent/London customer radius is tight

### DJs
- Music genres and venue experience are key bio elements
- Equipment list in package description reduces customer hesitation
- Video of setup or past events is highly effective

### Decorators
- Style description is the #1 conversion factor after photos
- Before/after photos are most effective
- Balloon, flowers, and theme specialisms should be explicit in bio

### Caterers
- Dietary information (halal, vegan, gluten-free) must be in bio
- Minimum guest count is critical for customer filtering
- Hygiene certificate is a customer trust factor — encourage upload

### Cake Designers
- Design portfolio is the entire product — 10+ photos is ideal
- Lead time and minimum notice should be explicit
- Flavour and dietary options are key search terms

### Event Planners
- Experience types (corporate, weddings, birthdays) must be explicit
- Package descriptions should list deliverables, not just hours
- Testimonial-style bio ("clients describe me as...") converts better

---

## Activation Metrics to Track Weekly

| Metric | Target | Track At |
|---|---|---|
| Vendors who submitted verification | 100% by day 3 | /admin/vendor-activation |
| Verification reviewed within 24h | 100% | /admin/verifications |
| Profile completion after approval | 100% by day 7 | /admin/vendor-activation |
| Media uploaded after approval | 80%+ by day 7 | /admin/vendor-activation |
| Services/packages added | 80%+ by day 7 | /admin/vendor-activation |
| Quote received within 30 days | Target: 50%+ | /admin/vendor-activation |
| Booking within 60 days | Target: 20%+ | /admin/vendor-activation |

---

## Personal Outreach Templates

### On Registration
> "Hi [Name], welcome to ELBOLD. Your application is received and we'll review it within 24 hours. To speed things up, please upload your government ID at elbold.com/vendor/verification — it's the first step to going live. Any questions, reply here. — [Founder name]"

### On Approval
> "Hi [Name], your profile is approved — you're live on ELBOLD! To start receiving quote requests, complete these three things: (1) Write your bio at elbold.com/vendor/profile, (2) Upload some photos at elbold.com/vendor/media, (3) Add a service package at elbold.com/vendor/services. I'll check back in a few days. You can also message me directly if you get stuck on anything."

### Day 7 Nudge (No Media)
> "Hi [Name], quick update — your profile is approved but you haven't uploaded any photos yet. Profiles with photos get 5x more enquiries than those without. Even one photo of your past work is enough to start. Can you add one today? Here's the link: elbold.com/vendor/media"

### Day 14 No Quote Yet
> "Hi [Name], you've been live for two weeks and we want to make sure you're set up for success. I had a look at your profile and [specific observation]. I'd suggest [specific change]. Let me know if you need any help — I want to make sure you get your first enquiry soon."

---

## Founder Responsibilities During Activation Phase

This is not a system that runs itself. During the first 20 vendors, the founder is the activation manager.

**Daily (15 min):**
- Check /admin/vendor-activation for vendors stuck at a stage > 2 days
- Send personal messages to any vendor who has been approved but hasn't completed stages 4-6
- Respond to any vendor messages within 24 hours

**Weekly (30 min):**
- Review all vendors against the 30-day activation goal
- For any vendor with a quote, confirm they responded promptly
- Update the activation tracker with manual notes on each vendor's status

**Monthly:**
- Calculate activation rate: how many of the 20 received a quote within 30 days?
- Document what worked and what didn't in vendor outreach/coaching
- Use findings to improve the automated onboarding email sequence

---

## What This Plan Does Not Cover

- Vendor acquisition (see `docs/First_50_Vendors_Playbook.md`)
- Customer acquisition (separate demand-side problem)
- Automated email sequences (Phase 2 feature)
- Vendor retention beyond first booking (Phase 2 concern)

---

*Live tracker: https://www.elbold.com/admin/vendor-activation*  
*Policy context: https://www.elbold.com/admin/launch-freeze*
