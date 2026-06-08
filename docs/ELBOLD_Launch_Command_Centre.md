# ELBOLD Launch Command Centre

**Daily operating reference for the founder**  
**Last updated:** 2026-06-08

---

## Live Dashboard

The founder dashboard exists at:

```
www.elbold.com/admin/founder
```

Access requires your admin email (`ADMIN_EMAILS` env var). It shows all metrics in real time from the live database.

---

## What the Dashboard Shows

### Platform Metrics (9 cards)

| Metric | What it means | Target for soft launch |
|--------|--------------|----------------------|
| **Pending Vendors** | Applications awaiting review | Review within 24h |
| **Approved Vendors** | Live on the marketplace | 5 minimum before inviting customers |
| **Verified Vendors** | Approved + verification level ≥ 2 | 3+ for soft launch |
| **Quotes Requested** | Total customer enquiries sent | > 0 = customers are using it |
| **Quotes Responded** | Vendor response rate | Should be ≥ 80% of quotes requested |
| **Bookings Created** | Total bookings initiated | > 0 = first conversion |
| **Completed Bookings** | Bookings marked complete | > 0 = first payout due |
| **Revenue (GMV)** | Gross payment volume | £0 until first deposit paid |
| **Commission Earned** | ELBOLD's 10% share | £0 until first booking completed |

### First Booking Mission (7-step tracker)

Tracks progress toward the first completed and reviewed booking:

1. Customer requests a quote
2. Vendor responds to quote
3. Customer accepts → booking created
4. Booking confirmed
5. Deposit paid
6. Booking completed
7. Review submitted

All 7 steps can be seen at `/admin/founder`. Each step links to the relevant admin page.

---

## Current Status (as of 2026-06-08)

| Area | Status | Notes |
|------|--------|-------|
| **Company Registration** | IN PROGRESS | Certificate expected this week |
| **Legal documents** | READY | All placeholders in position — update within 30 min of incorporation |
| **Payment messaging** | CLEAN | Corrected across 18 locations |
| **Vendor profile routing** | FIXED | "Vendor Not Found" title bug resolved |
| **Refund automation** | LIVE | Automatic Stripe refund on cancellation |
| **Vendor count** | Check `/admin/founder` | Target: 20 Founding Vendors |
| **Verified vendors** | Check `/admin/founder` | Target: 5+ before soft launch |
| **First booking** | Check `/admin/founder` | Mission tracker shows current step |
| **Stripe live key** | IN VERCEL | Local dev uses test key; production uses live key |
| **ICO registration** | NOT STARTED | Required before public launch |

---

## Daily Checklist

Run through this each morning during the pre-launch period:

**Vendor pipeline (5 min)**
- [ ] Check `/admin/vendors?status=pending` — any new applications?
- [ ] Review and approve/reject within 24h of submission
- [ ] Check `/admin/vendor-acquisition` — who is at what stage?
- [ ] Follow up with vendors who have been approved but haven't completed their profile

**Customer activity (2 min)**
- [ ] Check `/admin/quotes` — any unanswered quote requests?
- [ ] If a vendor hasn't responded in 24h, reach out to the vendor directly
- [ ] Check `/admin/bookings` — any status changes?

**Platform health (2 min)**
- [ ] Check `/admin/founder` — any unexpected metric changes?
- [ ] Check support@elbold.com inbox

---

## Weekly Review

Every Monday, review:

| Metric | This week | Last week | Trend |
|--------|-----------|-----------|-------|
| Approved vendors | | | |
| Verified vendors | | | |
| Quotes requested | | | |
| Quote response rate | | | |
| Bookings created | | | |
| Revenue | | | |
| Reviews | | | |

---

## Key Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| Founder Dashboard | `/admin/founder` | Single-screen operational view |
| Vendor Applications | `/admin/vendors` | Review and approve vendors |
| Vendor Activation | `/admin/vendor-activation` | Funnel: approved → active |
| Vendor Acquisition | `/admin/vendor-acquisition` | Lead CRM |
| Outreach Queue | `/admin/vendor-outreach` | Email outreach management |
| Verifications | `/admin/verifications` | Document verification queue |
| Bookings | `/admin/bookings` | All customer bookings |
| Quotes | `/admin/quotes` | All customer quote requests |
| Finance | `/admin/finance` | Payments and revenue |
| Reviews | `/admin/reviews` | All submitted reviews |
| Coverage Map | `/admin/vendor-coverage` | Geographic coverage view |

---

## Launch Gates — Status

| Gate | Condition | Status |
|------|-----------|--------|
| Company incorporated | Certificate of Incorporation received | PENDING |
| Legal docs updated | All [placeholders] replaced | BLOCKED on incorporation |
| Live payment tested | One real deposit processed in production | NOT DONE |
| Vendor supply | 5+ approved vendors with complete profiles | TRACK at `/admin/founder` |
| ICO registration | Required before unrestricted public launch | NOT STARTED |
| Support monitored | support@, disputes@, urgent@ all active | CONFIRM |

**Current permitted actions:**
- ELBOLD Ltd can recruit Founding Vendors: **GO**
- ELBOLD Ltd can run an invite-only soft launch: **GO WITH CAUTION** (after live payment test)
- ELBOLD Ltd can run a public launch: **NO GO** (blocked on vendor supply + incorporation + ICO)

---

## Registration Completion — When the Certificate Arrives

1. Open `docs/Post_Incorporation_Execution_Checklist.md`
2. Follow steps 1–14 in order
3. Target: < 30 minutes from certificate to deployed

All placeholders are already in position. No code design work is needed. It is purely a find-and-replace operation.
