# ELBOLD Phase 4 — Customer Trust Layer Design Proposal

**Date:** 2026-06-07  
**Status:** Design proposal only — no implementation  
**Priority context:** Trust signals are the #1 conversion lever for marketplace platforms. A first-time customer choosing between two vendors with similar prices and photos will always choose the one that feels more trustworthy.

---

## Overview

The current trust system shows verification badges (ID Verified, Business Verified) and star ratings. This proposal adds four additional trust signals that directly address the customer's core questions before booking:

1. *Is this vendor real and legitimate?* → **Verified by ELBOLD** signal
2. *Will they respond quickly?* → **Vendor Response Time**
3. *Have other customers used them?* → **Events Completed**
4. *Do customers come back?* → **Repeat Booking Rate**

---

## Signal 1: "Verified by ELBOLD"

**What it is:** A distinct, premium trust mark shown on vendor cards, profile headers, and in quote responses — only displayed when verification_level >= 2.

**Current state:** We show "ID Verified" as a small badge. It's easy to miss on cards.

**Proposed change:** Replace the compact badge on vendor cards with a more prominent "Verified by ELBOLD" treatment:

```
┌─────────────────────────────────┐
│  [Navy shield icon]             │
│  Verified by ELBOLD             │  ← bolder, more authoritative
│  Identity & documents checked   │  ← one-line explanation
└─────────────────────────────────┘
```

**Display rules:**
- Level 0–1: no badge (no documents checked)
- Level 2: "ID Verified by ELBOLD"
- Level 3: "Address Verified by ELBOLD"  
- Level 4: "Business Verified by ELBOLD"
- Trusted Professional: "Trusted Professional · Verified by ELBOLD"

**Implementation note:** Update `VendorBadgesRow` and `VendorTrustBadges` — the data is already available via `verification_level`. Estimated effort: 2 hours.

---

## Signal 2: Vendor Response Time

**What it is:** "Typically responds within X hours" shown on the vendor profile page and in search results.

**Current state:** `response_rate` (%) is stored and shown. Response time in hours is not stored.

**Data required:** A new column `avg_response_time_hours` on the `vendors` table, populated by a cron job that computes the average time between `quotes.created_at` and `quote_responses.created_at`.

**Display logic:**
- < 2 hours: "Responds within 2 hours" (emerald)
- 2–12 hours: "Responds within 12 hours" (emerald)
- 12–24 hours: "Responds within a day" (amber)
- > 24 hours or unknown: not shown

**Why it matters:** Customers abandon quote requests when they fear the vendor won't respond. A visible response time SLA directly reduces this anxiety. Etsy data shows response time display increases enquiry conversion by 12–18%.

**Implementation plan:**
1. Add migration: `ALTER TABLE vendors ADD COLUMN avg_response_time_hours NUMERIC;`
2. Cron job (extend existing `app/api/cron/reminders/route.ts`): compute and update avg for each vendor after each response
3. Display in `VendorProfileView` and `VendorCard`

**Estimated effort:** 4 hours (migration + cron + display)

---

## Signal 3: Events Completed

**What it is:** "X events completed" shown prominently on the vendor profile — not buried in a stat grid.

**Current state:** `completed_jobs_count` is stored but shown only in the compact trust badges row (small text). It's not prominent enough to influence conversion.

**Proposed placement:**

```
[Vendor Name]
★ 4.8  (23 reviews)  ·  47 events completed  ·  ID Verified
```

Directly below the vendor name, inline with the rating — this is prime trust real estate.

**Display rules:**
- 0 events: not shown (don't display "0 events completed")
- 1–4: "X events" (no emphasis)
- 5–19: "X events completed" (normal weight)
- 20+: "20+ events completed" (bold, emerald)

**Implementation note:** Edit `VendorProfileView.tsx` line ~85 (the header stats row). The data is already fetched. Estimated effort: 30 minutes.

**This is a P1 from the Phase 3 conversion audit — the easiest high-impact change available.**

---

## Signal 4: Repeat Booking Rate

**What it is:** "X% of customers re-book" shown on profiles with 10+ completed bookings.

**Current state:** `repeat_customer_count` is stored on the vendor row. No percentage is computed or displayed.

**Data required:** No new data needed. Compute: `(repeat_customer_count / completed_jobs_count) * 100`.

**Display logic:**
- Only show when `completed_jobs_count >= 10` (enough data to be meaningful)
- Round to nearest 10% (e.g. "40% of customers re-book")
- If repeat rate >= 30%: show with green indicator
- If repeat rate < 10%: don't show (low signal)

**Display location:** Profile page trust metrics panel (alongside response rate, jobs completed).

**Why it matters:** A high repeat booking rate is the strongest possible social proof — it means people who experienced this vendor first-hand chose to use them again. This is more powerful than star ratings which customers are sceptical of.

**Implementation note:** Add to `VendorTrustBadges.tsx` and `VendorProfileView.tsx`. Estimated effort: 1 hour.

---

## Priority Order for Implementation

| Signal | Data Available | Implementation Effort | Conversion Impact | Priority |
|---|---|---|---|---|
| Events Completed (prominent placement) | Yes | 30 min | High | **Implement now** |
| Repeat Booking Rate | Yes | 1 hour | High | **Implement now** |
| Verified by ELBOLD (enhanced display) | Yes | 2 hours | Medium | **Next sprint** |
| Vendor Response Time | No — needs migration + cron | 4 hours | Medium | **Phase 5** |

---

## What NOT to Build

- Customer identity verification (e.g. "Verified customer review") — premature until we have review volume
- Insurance verification display — adds complexity without proportionate trust benefit at this stage
- Third-party review aggregation (Google/Facebook reviews) — dilutes the ELBOLD brand; focus on native reviews

---

*This proposal should be reviewed after Mission 3 data is available — real quote/booking data will reveal which trust gaps actually blocked conversion.*
