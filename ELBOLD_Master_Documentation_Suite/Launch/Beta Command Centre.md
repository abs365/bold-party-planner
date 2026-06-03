# ELBOLD Beta Command Centre

**Document:** Beta Command Centre  
**Phase:** 28E — Validation Mode  
**Updated:** 2026-06-03  
**Purpose:** Single source of truth during pilot  

---

> Update this document at the start of each day.
> This is the one page that tells you the state of everything.

---

## PLATFORM STATUS

| System | Status | Last checked |
|---|---|---|
| https://www.elbold.com | 🟢 LIVE / 🟡 DEGRADED / 🔴 DOWN | |
| Vercel deployment | 🟢 READY / 🔴 FAILED | |
| Supabase database | 🟢 UP / 🔴 DOWN | |
| Resend email | 🟢 DELIVERING / 🟡 DELAYED / 🔴 FAILING | |
| Stripe payments | 🟢 LIVE / 🔴 ISSUE | |

**Last deployment commit:** `15ca529`  
**Deployed:** 2026-06-03  
**Open P0 bugs:** 0  
**Open P1 bugs:** 0  

---

## TESTER DASHBOARD

*Update daily from Pilot_Testers.md and pipeline files.*

| Metric | Count | Target | Progress |
|---|---|---|---|
| Total testers invited | 0 | 6 | ░░░░░░░░░░ 0% |
| Accounts created | 0 | 6 | ░░░░░░░░░░ 0% |
| Email confirmed | 0 | 6 | ░░░░░░░░░░ 0% |
| Active testers (last 48h) | 0 | 6 | ░░░░░░░░░░ 0% |
| Testers completed full journey | 0 | 2 | ░░░░░░░░░░ 0% |

---

## VENDOR METRICS

| Metric | Count | Target | Progress |
|---|---|---|---|
| Vendors applied | 0 | 20 | ░░░░░░░░░░ 0% |
| Vendors approved | 0 | 20 | ░░░░░░░░░░ 0% |
| Vendors with profile > 60% | 0 | 20 | ░░░░░░░░░░ 0% |
| Vendors visible in marketplace | 0 | 20 | ░░░░░░░░░░ 0% |
| Vendors verified (Level 1+) | 0 | 10 | ░░░░░░░░░░ 0% |

**Slot fill by category:**

| Category | Filled | Target |
|---|---|---|
| Photographers | 0 | 5 |
| Decorators | 0 | 5 |
| DJs | 0 | 3 |
| Caterers | 0 | 3 |
| Cake Designers | 0 | 2 |
| Event Planners | 0 | 2 |
| **TOTAL** | **0** | **20** |

---

## PLATFORM ACTIVITY

| Metric | Today | This week | Total |
|---|---|---|---|
| Events created | 0 | 0 | 0 |
| RFQs created | 0 | 0 | 0 |
| Quote responses submitted | 0 | 0 | 0 |
| Quotes accepted | 0 | 0 | 0 |
| Bookings created | 0 | 0 | 0 |
| Reviews submitted | 0 | 0 | 0 |

---

## REVENUE

| Metric | Amount |
|---|---|
| Total deposit payments | £0 |
| Total booking value | £0 |
| Largest single booking | £0 |
| Average booking value | £0 |

*Note: Stripe is in LIVE mode. All amounts are real transactions.*

---

## BUG TRACKER

| Metric | Count |
|---|---|
| P0 Critical — open | 0 |
| P0 Critical — closed | 0 |
| P1 High — open | 0 |
| P1 High — closed | 0 |
| P2 Medium — open | 0 |
| P2 Medium — closed | 0 |
| P3 Low — open | 0 |
| P3 Low — closed | 0 |
| **Total open** | **0** |
| **Total closed** | **0** |

*Full bug log: `Pilot CRM/Bug_Tracker.md`*

---

## CRITICAL INCIDENTS

| # | Date | Description | Duration | Resolution | Status |
|---|---|---|---|---|---|
| — | — | No incidents recorded | — | — | — |

---

## VALIDATION STATUS

| Journey | Steps complete | Total steps | Status |
|---|---|---|---|
| Customer | 0 | 9 | ⬜ NOT STARTED |
| Vendor | 0 | 9 | ⬜ NOT STARTED |
| Admin | 0 | 9 | ⬜ NOT STARTED |
| RFQ Flow | 0 | 7 | ⬜ NOT STARTED |
| Vendor Approval | 0 | 6 | ⬜ NOT STARTED |

*Full validation: `Validation/Journey_Validation_Tracker.md`*

---

## EXPANSION GATE

| Gate | Status |
|---|---|
| Auth working for all testers | ⬜ |
| Vendor journey end-to-end PASS | ⬜ |
| Customer journey end-to-end PASS | ⬜ |
| Admin journey PASS | ⬜ |
| RFQ flow PASS | ⬜ |
| Vendor approval PASS | ⬜ |
| No open P0 or P1 bugs | ⬜ |
| Average tester rating ≥ 7.0 | ⬜ |
| Zero platform-caused abandonments | ⬜ |

**Current gate result:** NO-GO (validation in progress)  
**Target expansion date:** TBD — when all gate criteria pass

---

## TESTER SATISFACTION

| Tester | Role | Score | Key feedback |
|---|---|---|---|
| | | | |
| | | | |
| | | | |
| | | | |

**Running average:** — / 10  
**Target:** ≥ 7.0

---

## QUICK LINKS

| Tool | URL |
|---|---|
| Admin dashboard | https://www.elbold.com/admin |
| Vendor queue | https://www.elbold.com/admin/vendors |
| Quote pipeline | https://www.elbold.com/admin/quotes |
| Pilot CRM | https://www.elbold.com/admin/pilot/vendors |
| Pilot report | https://www.elbold.com/admin/pilot/report |
| System health | https://www.elbold.com/api/health |
| Vercel | https://vercel.com/dashboard |
| Supabase | https://supabase.com/dashboard |
| Resend | https://resend.com/emails |
| Stripe | https://dashboard.stripe.com |

---

## DAILY DECISION FRAMEWORK

Use this to decide what to work on each day.

```
Is there an open P0 bug?
  YES → Fix immediately. Nothing else matters.
  NO  → Continue below.

Is there an open P1 bug?
  YES → Fix today before any outreach.
  NO  → Continue below.

Is any tester stuck or waiting?
  YES → Unblock them first.
  NO  → Continue below.

Are there pending vendor applications to review?
  YES → Review and approve/reject (SLA: 24h).
  NO  → Continue below.

Is today's outreach quota met? (10 contacts/day)
  NO  → Send today's outreach contacts.
  YES → Continue below.

Are all validation tracker steps up to date?
  NO  → Update Journey_Validation_Tracker.md.
  YES → Done for the day. Review tomorrow's plan.
```

---

*Last updated: 2026-06-03*  
*Next update: tomorrow morning before 09:30*
