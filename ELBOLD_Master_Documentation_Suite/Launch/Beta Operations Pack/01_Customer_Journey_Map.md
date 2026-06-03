# Customer Journey Map — ELBOLD Beta

**Version:** 1.0  
**Date:** 2026-06-03  
**Scope:** Beta phase (6–20 testers)

---

## Overview

A customer is someone planning an event who uses ELBOLD to discover, compare, and book event vendors across the UK.

---

## Stage 1 — Discovery

```
Entry points
    │
    ├── Organic search ("wedding photographer London")
    ├── Direct invite from ELBOLD (beta tester)
    ├── Word of mouth / social media
    └── Homepage: https://www.elbold.com
```

**What the customer sees:**

- Hero: "Find trusted vendors for your extraordinary celebration"
- Two CTAs: "Browse Vendors" and "List Your Services Free"
- Featured vendor cards (live data from DB)
- Trust bar: manually verified, secure payments, UK-wide
- How It Works section

**Emotional state:** Curious, cautious, evaluating trust

**Success signal:** Customer scrolls past the fold or clicks "Browse Vendors"

---

## Stage 2 — Registration

```
/signup  (Book Vendors tab — default)
    │
    ├── Fill: Full Name, Email, Password
    ├── Click "Create Free Account"
    ├── "Check Your Email" screen
    │
    ├── Email inbox: confirmation link
    │
    └── Click link → /api/auth/callback → /dashboard
```

**What can go wrong:**
- Email lands in spam → customer does not confirm → lost
- Redirect URL not whitelisted in Supabase → confirmation fails
- Weak password rejected → customer frustrated

**Beta monitoring point:** Did the confirmation email arrive? Did the customer land on `/dashboard`?

---

## Stage 3 — First Login and Dashboard

```
/dashboard
    │
    ├── Welcome banner (if no events yet)
    ├── Quick actions: Plan Event, Browse, Saved Vendors, Quotes
    ├── Smart Tips widget
    └── Empty states for events / bookings / quotes
```

**Key empty-state messages the customer sees:**
- "You haven't planned any events yet — start planning"
- Events section: link to /dashboard/create-event
- Bookings section: empty until first booking

**What the customer should do next:** Create their first event

---

## Stage 4 — Create Event

```
/dashboard/create-event  (Smart Event Wizard)
    │
    ├── Step 1: Event type (wedding / birthday / corporate / ...)
    ├── Step 2: Date, guest count, location, budget
    ├── Step 3: Mood / style (AI Smart Planner generates plan)
    ├── Step 4: Vendor categories needed
    └── Step 5: Plan generated → vendor recommendations shown
```

**Output:** Event record created in DB. Vendor suggestions displayed.

**Beta monitoring point:** Does the wizard complete without error? Does the Smart Planner return results?

---

## Stage 5 — Browse and Shortlist Vendors

```
/browse  (Marketplace)
    │
    ├── Filter by: category, city, price range, verified status
    ├── Vendor cards: photo, name, category, city, rating, starting price
    ├── Click vendor card → /vendors/[id]
    │
    /vendors/[id]  (Vendor Profile)
    ├── Photos gallery, bio, packages, reviews
    ├── Trust badges (verified level, response rate)
    ├── "Request Quote" CTA
    └── "Save" button → adds to /dashboard/saved
```

**Beta monitoring point:** Do vendor profiles load? Do photos display? Is "Request Quote" clickable?

---

## Stage 6 — Request a Quote

```
/dashboard/quotes/new?vendor=[id]
    │
    ├── Pre-filled vendor name
    ├── Fill: event date, location, guest count, budget, requirements
    ├── Submit → quote created in DB
    ├── Vendor receives email: "New quote request from [Customer]"
    └── Customer sees quote in /dashboard/quotes with status "Pending"
```

**Beta monitoring point:** Does the vendor receive the quote request email?

---

## Stage 7 — Receive and Review Quote Response

```
/dashboard/quotes/[id]
    │
    ├── Vendor responds with: price, deposit, description, services, terms
    ├── Customer sees "New Response!" banner
    ├── Options: Accept Quote, Decline Quote, Compare (if 2+ vendors)
    │
    Compare view: /dashboard/quotes/compare?event_id=[id]
    ├── Side-by-side vendor comparison
    ├── "Lowest price" badge, trust signals
    └── Accept → booking created, other quotes rejected
```

---

## Stage 8 — Booking and Payment

```
Booking created → /dashboard/bookings/[id]
    │
    ├── Status: Confirmed (deposit paid) or Pending payment
    ├── Stripe checkout: /api/payments/checkout
    ├── Payment success → /payment/success
    ├── Booking status updated → Deposit Paid
    └── Vendor receives "Booking confirmed" email
```

---

## Stage 9 — Post-Event Review

```
After event date passes and booking = completed:
    │
    ├── Customer can leave review on vendor
    ├── Star rating + written review
    ├── Review appears on vendor public profile
    └── Vendor reputation score updated
```

---

## Customer Journey Summary Table

| Stage | Route | Key Action | Success Signal |
|---|---|---|---|
| Discovery | `/` `/browse` | Lands on site, browses | Clicks CTA or vendor card |
| Registration | `/signup` | Creates account | Confirms email, lands on `/dashboard` |
| Onboarding | `/dashboard` | Sees dashboard | Creates first event |
| Browse | `/browse` `/vendors/[id]` | Views vendor profiles | Saves vendor or clicks Request Quote |
| Quote | `/dashboard/quotes/new` | Sends quote request | Vendor receives notification |
| Response | `/dashboard/quotes/[id]` | Reviews vendor response | Accepts quote |
| Booking | `/dashboard/bookings/[id]` | Pays deposit | Booking confirmed |
| Review | Vendor profile | Leaves review | Rating submitted |

---

## Beta-Specific Notes

- During beta, payment via Stripe is **live** — real money moves. Warn testers before they proceed to checkout.
- If a customer tester gets stuck, escalate via the bug escalation process (`06_Bug_Escalation_Process.md`).
- Collect feedback after Stage 3 (first dashboard impression) and after Stage 6 (first quote request).
