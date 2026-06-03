# ELBOLD Quote Pipeline Audit

**Date:** 2026-06-03
**Phase:** 28B — Pipeline validation before pilot
**Status: PILOT READY**

---

## Executive Summary

The ELBOLD Quote Pipeline is a fully implemented, end-to-end marketplace workflow. All critical paths exist and function:

- Customer can browse a vendor and request a quote ✅
- Quote is stored with full event details ✅
- Vendor receives in-app notification and email ✅
- Vendor sees lead in their dashboard with lead score ✅
- Vendor submits a priced quote response ✅
- Customer sees the response and can accept/decline/compare ✅
- Accept creates a confirmed booking automatically ✅
- Admin can monitor the full pipeline in real time ✅
- Audit trail logged to `quote_events` for every transition ✅

**Pipeline status: LIVE**

---

## 1. Routes Involved

| Route | Role | Purpose |
|---|---|---|
| `/vendors/[id]` | Customer | Vendor profile — contains "Request Free Quote" CTA |
| `/dashboard/quotes/new` | Customer | Quote request form |
| `/dashboard/quotes` | Customer | Quote list (all requests made) |
| `/dashboard/quotes/[id]` | Customer | Quote detail — accept/decline/view response |
| `/dashboard/quotes/compare` | Customer | Side-by-side comparison of multiple vendor quotes for same event |
| `/vendor/quotes` | Vendor | Lead inbox — pending and responded quotes |
| `/admin/quotes` | Admin | Platform-wide pipeline with full visibility |

---

## 2. API Routes Involved

| Route | Methods | Purpose |
|---|---|---|
| `POST /api/quotes` | POST | Create quote request (customer-initiated) |
| `GET /api/quotes` | GET | List quotes for current user (role-aware) |
| `GET /api/quotes/[id]` | GET | Quote detail with full relations |
| `PATCH /api/quotes/[id]` | PATCH | All status transitions (respond, view, shortlist, accept, reject, withdraw, vendor_decline) |

---

## 3. Database Tables Involved

| Table | Purpose |
|---|---|
| `quotes` | Core quote request record — customer, vendor, event, status, budget, category |
| `quote_responses` | Vendor's priced response (one per quote, upserted) |
| `quote_events` | Full audit trail of every lifecycle event |
| `events` | Customer event that the quote is attached to |
| `vendors` | Vendor being quoted |
| `profiles` | Customer identity |
| `bookings` | Created automatically on quote accept |
| `notifications` | In-app alerts sent to vendor/customer on status changes |

---

## 4. Quote Status Lifecycle

```
[Customer creates quote]
       ↓
   PENDING ──────────────────────────────────→ DECLINED (vendor declines)
       ↓                                    → WITHDRAWN (customer withdraws)
       ↓ vendor submits price                → EXPIRED (7-day timeout)
   RESPONDED
       ↓ customer opens
   VIEWED
       ↓ customer saves for comparison
   SHORTLISTED
       ↓
   ┌────────────────────────────────────────────────┐
   │ ACCEPTED → creates booking → CONVERTED         │
   │ REJECTED → customer chose another vendor       │
   └────────────────────────────────────────────────┘
```

**Status values in database:** `pending`, `responded`, `viewed`, `shortlisted`, `converted`, `accepted`, `rejected`, `declined`, `withdrawn`, `expired`

**Note:** `accepted` and `converted` are functionally equivalent (both mean booking created). `converted` is the canonical terminal state.

---

## 5. Component Map

| Component | Used By | Purpose |
|---|---|---|
| `VendorProfileView.tsx` | `/vendors/[id]` | Contains "Request Free Quote" button |
| `NewQuoteForm` | `/dashboard/quotes/new` | Quote request form (event details, budget, message) |
| `CustomerQuotesView.tsx` | `/dashboard/quotes` | Quote list with status badges, compare CTA |
| `QuoteDetailView.tsx` | `/dashboard/quotes/[id]` | Accept/decline UI, vendor response display |
| `QuoteComparisonView.tsx` | `/dashboard/quotes/compare` | Side-by-side multi-vendor comparison |
| `VendorQuotesView.tsx` | `/vendor/quotes` | Vendor lead inbox with full response form |
| `AdminQuotesView.tsx` | `/admin/quotes` | Admin pipeline with action visibility, stuck detection |

---

## 6. What Works

- Quote request form collects: event type, event date, city, guest count, budget range, message, requirements, category
- Duplicate prevention: cannot request a quote to the same vendor for the same event twice (409 if open quote exists)
- Rate limiting: 20 quotes per hour, 100 per day per user
- Vendor receives email and in-app notification on new quote
- Lead scoring: budget (0–40pts) + guests (0–30pts) + event date proximity (0–30pts) = 0–100 score
- Lead score displayed in vendor inbox (Hot ≥70, Good 40–69)
- Vendor can respond with: price, deposit %, services, message, terms, duration, valid until
- Vendor can decline with optional reason
- Customer can accept → creates booking with 10% commission, 90% vendor payout
- Customer can reject with optional reason
- Customer can withdraw a pending request
- Auto-reject: accepting one vendor's quote auto-rejects all other open quotes for the same event
- Customer comparison view for events with 2+ vendor responses
- Quote expires after 7 days (field set; cron enforcement documented below)
- Full audit trail in `quote_events` table
- Analytics tracking on all transitions

---

## 7. What Is Missing / Limitations

### 7a — Quote Expiry Not Enforced by Cron ⚠️
**Issue:** `expires_at = NOW() + INTERVAL '7 days'` is set at creation but no cron job transitions status from `pending` to `expired` after 7 days.
**Impact:** Expired quotes stay as `pending` in the database. Admin sees them as pending but the 7-day deadline has passed.
**Recommended fix:** Add a scheduled cron job (e.g. Vercel Cron or Supabase pg_cron) running nightly:
```sql
UPDATE quotes SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW();
```
**Pilot impact:** Low. At pilot scale (10 vendors, <50 quotes), admin can manually identify and expire stale quotes. Not blocking.

### 7b — Single Quote Response Per Vendor ⚠️
**Issue:** Each vendor can only submit one quote response per request. They can update it (upserted), but cannot offer multiple price tiers.
**Impact:** Vendor cannot offer a "basic" and "premium" package in a single quote response.
**Pilot impact:** None. One price per quote is standard behaviour for pilot.

### 7c — Multi-Vendor Lead Routing Not Active ⚠️
**Issue:** `lib/ai/lead-routing.ts` contains automatic vendor-matching logic, but quotes are currently sent to a vendor explicitly chosen by the customer.
**Impact:** No automated lead distribution to multiple vendors yet.
**Pilot impact:** None. Customers browse and select vendors manually.

### 7d — No Quote Amendment After Vendor Response
**Issue:** After a vendor responds, neither party can amend the quote — the customer can only accept or decline.
**Impact:** No negotiation flow.
**Pilot impact:** None. Standard accept/decline is sufficient for pilot.

---

## 8. Customer Journey (Verified)

```
1. Customer visits /browse → finds vendor
2. Customer clicks "Request Free Quote" on vendor profile
3. Redirected to /dashboard/quotes/new?vendor={id} (must be logged in)
4. Customer fills form: event details, budget, message
5. POST /api/quotes → creates quote with status="pending"
6. Vendor receives notification (in-app + email via Resend)
7. Customer sees quote in /dashboard/quotes with "Awaiting Response" badge
```

**Auth check:** If customer is not logged in, "Request Free Quote" shows toast + redirects to /login. ✅
**Role check:** If a vendor tries to request a quote, shows error "Vendors cannot request quotes". ✅

---

## 9. Vendor Journey (Verified)

```
1. Vendor logs into /vendor/quotes (their "Leads" page)
2. Quote appears in "Needs Your Response" section with lead score
3. Vendor expands card to see customer event details, budget, message
4. Vendor fills response form: price, deposit, services, message, terms
5. PATCH /api/quotes/[id] with action="respond" → status → "responded"
6. Customer receives notification (in-app + email)
7. Vendor can also decline with optional reason
```

**Empty state:** When no leads, shows encouragement to complete profile (photos, verification). ✅

---

## 10. Admin Monitoring (Phase 28B Enhanced)

Admin sees at `/admin/quotes`:
- Stats: Total, Pending, Responded, Shortlisted, Converted, Declined, Expired, Conversion Rate %
- Operational alerts: "X quotes need attention", "Y vendors not responding (48h+)"
- Filter: All, Needs Action, Active, Pending, Responded, Shortlisted, Converted, Declined, Expired
- Table columns: Age, Vendor + Category, Customer, Event & Budget, Status, **Action Required**, Price, Lead Score
- "Action Required" column shows: "Awaiting vendor", "Vendor not responding" (red, 48h+), "Awaiting customer", "Customer reviewing", "Comparing quotes", "Booking live"
- Stuck quotes (pending 48h+) highlighted in red row tint
- Footer shows stuck count

---

## 11. Security

- All quote API routes require authentication (`requireAuth()`)
- Customers can only view/act on their own quotes (RLS + application validation)
- Vendors can only view/respond to their vendor's quotes (ownership check)
- Rate limiting on quote creation (20/hr, 100/day)
- No admin route for direct quote manipulation — oversight only

---

## 12. Pipeline Status Assessment

| Journey | Status | Notes |
|---|---|---|
| Customer → Browse vendor | ✅ Live | `/browse` and `/vendors/[id]` working |
| Customer → Request quote | ✅ Live | Form at `/dashboard/quotes/new` |
| Customer → See quote status | ✅ Live | `/dashboard/quotes` list |
| Customer → View response | ✅ Live | `/dashboard/quotes/[id]` detail |
| Customer → Accept/create booking | ✅ Live | Auto-creates booking, auto-rejects others |
| Customer → Compare quotes | ✅ Live | `/dashboard/quotes/compare` |
| Vendor → Receive lead | ✅ Live | `/vendor/quotes` inbox |
| Vendor → Respond with price | ✅ Live | Response form in vendor leads |
| Vendor → Decline lead | ✅ Live | Decline form with reason |
| Admin → Monitor pipeline | ✅ Live | `/admin/quotes` with action visibility |
| Notifications → Vendor on new quote | ✅ Live | In-app + Resend email |
| Notifications → Customer on response | ✅ Live | In-app + Resend email |
| Quote expiry enforcement | ⚠️ Needs cron | `expires_at` set; no auto-transition |
| Multi-vendor auto-routing | ⚠️ Not active | Manual selection only |

**Overall verdict: PILOT READY**
