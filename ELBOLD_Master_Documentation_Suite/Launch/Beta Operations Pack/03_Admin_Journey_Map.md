# Admin Journey Map — ELBOLD Beta

**Version:** 1.0  
**Date:** 2026-06-03  
**Scope:** Admin operations during 6–20 tester beta phase

---

## Overview

The admin is the platform operator (founder). During beta, the admin is the sole operator responsible for vendor approval, quality control, dispute resolution, analytics monitoring, and pilot CRM management.

**Admin account:** `abylaw365@gmail.com`  
**Admin entry point:** `https://www.elbold.com/admin`

---

## Daily Admin Routine

```
Morning (start of day)
    │
    ├── 1. Open /admin (dashboard overview)
    ├── 2. Check alert bar (pending verifications, flagged vendors)
    ├── 3. Review /admin/vendors (pending applications)
    ├── 4. Review /admin/pilot/vendors (pilot CRM status)
    └── 5. Check /api/health (platform status)

During the day
    │
    ├── Respond to vendor applications within 24h
    ├── Monitor quote activity
    └── Address any support escalations

Evening (end of day)
    └── Weekly: review /admin/pilot/report
```

---

## Stage 1 — Admin Login

```
https://www.elbold.com/login
    │
    ├── Enter admin email: abylaw365@gmail.com
    ├── Enter password
    ├── Supabase authenticates
    ├── proxy.ts checks: email in ADMIN_EMAILS env var?
    └── Yes → redirect to /admin
```

**What admin sees on `/admin`:**
- Platform stat bar: total vendors, customers, bookings, revenue
- Pending vendor count (alert if > 0)
- Flagged vendor count (alert if > 0)
- Unread admin alerts count
- Quick management grid: Vendors, Customers, Bookings, Verifications, Reviews, Payouts

---

## Stage 2 — Vendor Application Review

```
/admin/vendors
    │
    ├── Status tabs: All | Pending | Approved | Rejected | Suspended
    ├── Search by business name
    │
    For each pending vendor card:
    ├── Business name, category, city
    ├── Owner name and email
    ├── Phone number (grey = unverified, green = verified)
    ├── Join date
    ├── Tagline (if set)
    │
    Actions:
    ├── View → opens public vendor profile in new tab
    ├── Approve → status = approved, approval email sent
    ├── Reject → modal with reason → rejection email sent
    ├── Suspend → status = suspended
    ├── Reactivate → returns to approved
    ├── Feature toggle (amber star icon)
    ├── Verified toggle (blue shield icon)
    └── Phone Verified toggle (green phone icon)
```

**Admin checklist for each application:**
- [ ] Business name is real and specific (not "Test" or "ABC")
- [ ] Category is appropriate
- [ ] City is a real UK city
- [ ] Phone number present and UK format
- [ ] Bio is substantive (not lorem ipsum)
- [ ] No duplicate application from same person

**Decision time target:** Within 24 hours of application during beta.

---

## Stage 3 — Verification Management

```
/admin/verifications
    │
    ├── Pending verification documents (vendors submitting for Level 2+)
    ├── Each card shows: vendor, document type, submitted date
    │
    Actions per document:
    ├── View Document → generates signed URL (1-hour TTL)
    ├── Approve → level upgrades, approval email sent
    ├── Reject (with reason) → rejection email sent, vendor can resubmit
    ├── Request Resubmission → resubmission email sent
    └── Manual level override (0–4 buttons)
    
Verification levels:
    ├── Level 0: Unverified (default)
    ├── Level 1: Auto (email + phone + bio + city + packages + media)
    ├── Level 2: ID Verified (government ID checked by admin)
    ├── Level 3: Address Verified (proof of address)
    └── Level 4: Business Verified (company documents)
```

---

## Stage 4 — Customer Management

```
/admin/customers
    │
    ├── Customer list: name, email, join date, event count, booking count
    ├── Search by name or email
    └── No destructive actions — read-only view during beta
```

**Beta use case:** Confirm that beta customer testers have registered correctly. Verify their role and profile data via SQL if needed.

---

## Stage 5 — Quote and Booking Pipeline

```
/admin/quotes
    │
    ├── Platform-wide quote pipeline
    ├── 8-stat bar: total, pending, responded, shortlisted, accepted, rejected, withdrawn, declined
    ├── Filter by status, sort by date / price / score
    └── Each quote links to relevant booking
    
/admin/bookings
    │
    ├── All bookings across platform
    ├── Status: confirmed, deposit_paid, completed, cancelled, disputed
    └── Manual payout actions during pilot
```

---

## Stage 6 — Review Moderation

```
/admin/reviews
    │
    ├── Reported reviews (reported by users)
    ├── Pending media (vendor photos flagged for moderation)
    │
    Actions:
    ├── Approve review
    ├── Remove review (with reason)
    └── Flag review
```

**Beta threshold:** Reviews with 3+ reports are auto-flagged.

---

## Stage 7 — Pilot CRM Operations

```
/admin/pilot/vendors  (Pilot CRM)
    │
    ├── All outreach contacts in acquisition funnel
    ├── Stages: Prospect → Contacted → Interested → Applied → Verified
    ├── Each row: name, business, category, city, status, last contact date
    │
    Actions:
    ├── Add new prospect
    ├── Update status (inline dropdown)
    ├── Edit contact details
    ├── Delete prospect
    └── Expandable row: full notes
    
/admin/pilot/outreach
    │
    └── Copyable scripts: email, WhatsApp, Instagram DM (per category)

/admin/pilot/report
    │
    └── Weekly metrics: vendor growth, quotes, bookings, feedback averages
```

---

## Stage 8 — Platform Health Monitoring

```
/admin/system
    │
    ├── Environment variable grid (present/missing check)
    ├── Required migrations checklist (001–034)
    ├── API quick links: /api/health, /api/system/status
    └── Build info

/api/health
    │
    ├── Checks: database, Supabase Auth, storage, environment
    └── Returns 200 (healthy) or 503 (degraded)

/admin/launch
    │
    └── Pre-launch checklist: env vars, email, Stripe, Sentry, DNS
```

---

## Stage 9 — Governance

```
/admin/governance
    │
    ├── At-risk vendors (low activity, poor response rate)
    ├── Warning issuance (manual)
    └── Health distribution chart

/api/cron/governance  (runs daily via Vercel Cron)
    │
    └── Auto-flags inactive vendors, sends warnings
```

---

## Admin Tools Summary

| Tool | Route | Use During Beta |
|---|---|---|
| Main dashboard | `/admin` | Daily start — overview and alerts |
| Vendor applications | `/admin/vendors` | Approve/reject within 24h |
| Verification docs | `/admin/verifications` | Review L2+ document submissions |
| Customer list | `/admin/customers` | Confirm tester registrations |
| Quote pipeline | `/admin/quotes` | Monitor quote activity |
| Bookings | `/admin/bookings` | Track booking and payout status |
| Review moderation | `/admin/reviews` | Handle reported reviews |
| Pilot CRM | `/admin/pilot/vendors` | Track outreach and funnel |
| Outreach scripts | `/admin/pilot/outreach` | Copy messaging for vendors |
| Weekly report | `/admin/pilot/report` | Friday review |
| System health | `/admin/system` `/api/health` | If something breaks |
| Governance | `/admin/governance` | Weekly check of vendor health |

---

## Beta Admin Commitments

| Commitment | SLA |
|---|---|
| Vendor application reviewed | Within 24 hours |
| Bug report acknowledged | Within 4 hours |
| Bug fix deployed | Depends on severity (see escalation doc) |
| Support query answered | Within 12 hours |
| Weekly pilot report reviewed | Every Friday |
