# Phase 5 — Launch KPI Framework

**Date:** 2026-06-07
**Philosophy:** Measure what matters to the business. Ignore what flatters it.

---

## Guiding Principle

A marketplace has two sides. Both must function for either to succeed. The KPIs below track the health of both sides and the connection between them. They are ordered by the sequence in which they need to be true for the marketplace to work.

Trust first. Supply second. Reviews third. Demand fourth. Scale fifth.

---

## Tier 1: Supply Quality (must be true before customer acquisition)

These numbers tell you whether the marketplace is ready to accept real customers. If they are not healthy, acquiring customers is premature and potentially damaging.

### Approved Vendors
**What it measures:** How many vendors are live and capable of receiving bookings.
**Why it matters:** Below a critical mass, customers browse and find nothing relevant. The target before opening to customers is 5 minimum, 10 strongly preferred.
**Where to find it:** /admin/founder, /admin/cohort
**Target:** 10 approved vendors by end of Phase 4.

### Verified Vendors (ID verified or above)
**What it measures:** How many approved vendors carry a verified badge.
**Why it matters:** Unverified vendors convert at a lower rate. Customer confidence depends on this. A marketplace where 80% of vendors are unverified is not a verified marketplace.
**Where to find it:** /admin/verification-audit
**Target:** At least 60% of approved vendors with verification_level >= 2 before opening to customers.

### Vendor Profile Completeness
**What it measures:** How many approved vendors have 3+ photos, 1+ package, and a 50+ character bio.
**Why it matters:** An approved vendor without these cannot convert customer interest into a booking. An incomplete profile on the marketplace reflects badly on the whole platform.
**Where to find it:** /admin/cohort (readiness score)
**Target:** At least 80% of approved vendors with a readiness score of 50 or above.

---

## Tier 2: Transaction Health (measures whether the marketplace is working)

These numbers tell you whether the connection between supply and demand is functioning. They are the proof that the platform does what it promises.

### Quotes Requested
**What it measures:** How many customers have sent a formal quote request to a vendor.
**Why it matters:** This is the first transaction event. It proves customers are using the marketplace for its intended purpose, not just browsing.
**Target:** First quote within 7 days of opening to customers.

### Quotes Responded
**What it measures:** How many quote requests received a vendor response.
**Why it matters:** If vendors do not respond, customers give up. Every unanswered quote request is a lost booking and a damaged customer experience.
**Healthy ratio:** Above 70% response rate across the platform.
**Action trigger:** Any vendor with a response rate below 50% should receive a reminder. Any vendor with a response rate below 25% should be reviewed.

### Vendor Response Rate (average across platform)
**What it measures:** The percentage of quote requests that received a vendor response within 48 hours.
**Why it matters:** Customers do not wait. A platform-level response rate below 60% means customers are leaving because vendors are too slow.
**Where to track it:** Compute from quotes table: (responded quotes / total quotes) * 100, filtered to within 48 hours of creation.
**Target:** Above 70% platform-wide.

### Bookings Created
**What it measures:** How many quotes have been accepted and converted into confirmed bookings.
**Why it matters:** A quote is an intention. A booking is a commitment. This is the second transaction event.
**Target:** First booking within 14 days of first quote.

### Bookings Completed
**What it measures:** How many bookings resulted in a completed event.
**Why it matters:** A completed booking is proof that the marketplace delivered its core promise. It is the only event that generates a review, a payout to the vendor, and income for ELBOLD.

---

## Tier 3: Trust Accumulation (compounds over time)

These numbers build the long-term defensibility of the marketplace. They cannot be shortcut.

### Reviews Collected
**What it measures:** How many genuine reviews have been submitted by real customers after completed bookings.
**Why it matters:** Reviews are the compounding trust asset of the platform. Every review makes the next booking easier to convert.
**Target:** 100% review request rate (automated), 30% collection rate (realistic expectation).

### Average Vendor Rating
**What it measures:** The mean rating across all vendors with at least 3 reviews.
**Why it matters:** A healthy marketplace should have a mean rating above 4.0. Below this suggests either quality problems or generous reviews from a small sample.
**Where to find it:** Compute from vendors table.

---

## What Not to Track

**Page views.** A customer browsing 20 pages and booking nothing is not a success.

**Registered users.** Registration without a booking or a quote request is not progress.

**Vendor applications.** An application without approval and activation is not supply.

**Time on site.** Engagement metrics measure attention. ELBOLD succeeds when customers complete bookings, not when they spend time on the platform.

**Social media follower counts.** Followers who do not book vendors are not customers.

---

## KPI Dashboard Location

The primary KPI dashboard is at /admin/founder. It shows all Tier 1 and Tier 2 metrics in a single view. The First Booking Mission tracker shows the status of Tier 2 milestones in sequence.

The recruitment dashboard at /admin/recruitment shows Tier 1 supply-side metrics with funnel breakdown.

---

## Weekly Review Rhythm

Every Monday: open /admin/founder. Look at the numbers. Answer three questions.

1. Did anything change meaningfully since last week?
2. Is there a number that is clearly not where it should be?
3. What is the one thing that would most improve the weakest number this week?

Do that one thing. Repeat next Monday.

This is a startup. The weekly rhythm matters more than the quarterly targets.
