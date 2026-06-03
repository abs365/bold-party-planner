# RFQ / Quote Workflow Diagram — ELBOLD Beta

**Version:** 1.0  
**Date:** 2026-06-03

---

## Overview

The RFQ (Request for Quote) system is the core commercial workflow connecting customers to vendors. A customer sends a quote request; the vendor responds with a price and terms; the customer accepts; a booking and deposit payment follow.

---

## Full Quote Lifecycle

```
CUSTOMER                    PLATFORM                      VENDOR
    │                           │                             │
    │  1. Browse /browse         │                             │
    │  2. Open /vendors/[id]     │                             │
    │  3. Click "Request Quote"  │                             │
    │──────────────────────────► │                             │
    │                           │  Insert: quotes table        │
    │                           │  status = "pending"          │
    │                           │  lead_score calculated       │
    │                           │  ─────────────────────────► │
    │                           │                         Email: "New quote request"
    │                           │                         /vendor/quotes updated
    │                           │                             │
    │  /dashboard/quotes         │                             │
    │  Status: "Awaiting         │                             │
    │   Response"               │                             │
    │                           │  4. Vendor opens lead        │
    │                           │  viewed_at recorded          │
    │                           │◄───────────────────────────  │
    │                           │                             │
    │                           │  5. Vendor submits response  │
    │                           │  ◄─────────────────────────  │
    │                           │  quote status = "responded"  │
    │                           │  responded_at recorded       │
    │◄───────────────────────── │                             │
  Email: "New response           │                             │
  from [Vendor]"                │                             │
    │                           │                             │
    │  6. Customer reviews       │                             │
    │  /dashboard/quotes/[id]    │                             │
    │                           │                             │
    │  Decision branch:         │                             │
    │                           │                             │
    ├── ACCEPT ─────────────────►│                             │
    │                           │  Booking created             │
    │                           │  Other quotes → rejected     │
    │                           │  ─────────────────────────► │
    │                           │                         Email: "Booking confirmed"
    │                           │                             │
    │  Stripe checkout           │                             │
    │──────────────────────────► │                             │
    │                           │  payment recorded            │
    │◄───────────────────────── │                             │
  /payment/success               │                             │
    │                           │                             │
    ├── DECLINE ────────────────►│                             │
    │                           │  quote status = "rejected"   │
    │                           │  ─────────────────────────► │
    │                           │                         Email: "Quote not accepted"
    │                           │                             │
    └── COMPARE (2+ vendors) ───►│                             │
        /dashboard/quotes/compare│                             │
        Side-by-side view        │                             │
        Accept one → booking     │                             │
```

---

## Quote Status States

| Status | Meaning | Who sets it |
|---|---|---|
| `pending` | Sent by customer, not yet seen by vendor | System (on create) |
| `viewed` | Vendor opened the lead | System (on vendor view) |
| `responded` | Vendor submitted a price and terms | System (on vendor response) |
| `shortlisted` | Customer marked as shortlisted | Customer |
| `accepted` | Customer accepted — booking created | Customer |
| `rejected` | Customer declined vendor | Customer |
| `withdrawn` | Customer cancelled the RFQ | Customer |
| `vendor_declined` | Vendor cannot fulfil the request | Vendor |

---

## Lead Score Calculation

The platform automatically scores each lead on insert. Vendors see their leads sorted by score.

```
Lead Score (0–100) = weighted sum of:

  Budget range match        ── 25 pts max
  Guest count (larger = higher value) ── 20 pts max
  Customer verification status ── 15 pts max
  Event proximity (days until event) ── 15 pts max
  Customer response rate    ── 15 pts max
  Event type (wedding = premium) ── 10 pts max

Score labels:
  80–100 = "Hot"   (amber badge)
  50–79  = "Good"  (blue badge)
  0–49   = "Lead"  (grey badge)
```

---

## Quote Response Fields (Vendor → Customer)

| Field | Required | Notes |
|---|---|---|
| Title | Yes | Short label for the quote e.g. "Wedding Photography — Full Day" |
| Price | Yes | Total price in GBP |
| Deposit amount | Yes | Amount due on booking confirmation |
| Description | Yes | What is included in this quote |
| Services list | No | Bullet-point inclusions |
| Message | No | Personal note to customer |
| Terms | No | Specific T&Cs |
| Duration (hours) | No | How long the service runs |
| Valid until | No | Expiry date — UI shows countdown badge if < 48h |

---

## Quote Expiry

If a vendor sets a `valid_until` date:
- Quote card shows a countdown badge when < 48 hours remain
- After expiry, the quote is still visible but marked expired
- No automatic status change — vendor must manually withdraw if needed

---

## Quote Comparison View

When a customer has received 2+ responses for the same event:

```
/dashboard/quotes/compare?event_id=[id]
    │
    ├── Side-by-side vendor cards
    ├── Price comparison (lowest = "Best Price" badge)
    ├── Trust signals per vendor (verification level, response rate, rating)
    ├── Package inclusions comparison
    └── Accept CTA per vendor
```

Accepting one vendor in compare view:
- That vendor's quote → `accepted` → booking created → deposit payment triggered
- All other vendors' quotes for same event → `rejected` → rejection emails sent

---

## API Routes

| Method | Route | Action |
|---|---|---|
| `POST` | `/api/quotes` | Customer creates quote request |
| `GET` | `/api/quotes` | Customer/vendor lists their quotes |
| `PATCH` | `/api/quotes/[id]` | Update quote status (respond / view / accept / reject / withdraw / vendor_decline) |

All routes require authentication. Vendors can only read/update quotes they received. Customers can only read/update quotes they sent.

---

## Email Notifications Triggered

| Event | Recipient | Template |
|---|---|---|
| Quote created | Vendor | "New quote request from [Customer]" |
| Vendor responds | Customer | "New response from [Vendor]" |
| Customer accepts | Vendor | "Booking confirmed — [Customer]" |
| Customer declines | Vendor | "Quote not selected" |
| Booking confirmed | Customer | "Your booking is confirmed" |

---

## Beta Monitoring Checkpoints

| Checkpoint | Where to verify |
|---|---|
| Quote created and visible to vendor | `/vendor/quotes` on vendor account |
| Vendor email notification sent | Check vendor inbox |
| Vendor response visible to customer | `/dashboard/quotes/[id]` |
| Customer email notification sent | Check customer inbox |
| Booking created on accept | `/dashboard/bookings` and `/vendor/bookings` |
| All other quotes rejected on accept | Check `/vendor/quotes` for other vendors |
