# Go / No-Go: 6 Testers → 20 Testers Expansion Criteria

**Version:** 1.0  
**Date:** 2026-06-03  
**Decision owner:** Founder  

---

## Purpose

This document defines the exact criteria that must be met before expanding the ELBOLD beta from the initial 6-person cohort to the full 20-tester founding vendor programme. Every criterion must be evaluated honestly. When in doubt, the default is No-Go.

---

## Expansion Gate Summary

```
6-Tester Phase (now)
    │
    │  Run for minimum: 5 days
    │  OR until all 12 criteria below are PASS
    │
    ▼
Expansion Decision Point
    │
    ├── All 12 criteria PASS → GO → Invite next 14 testers
    └── Any criterion FAIL → NO-GO → Fix and re-evaluate
    │
    ▼
20-Tester Phase
    │
    └── Monitor against the same criteria continuously
```

---

## Mandatory Criteria — ALL must pass

### Category 1 — Auth and Onboarding (Non-negotiable)

| # | Criterion | Evidence required | Pass / Fail |
|---|---|---|---|
| 1.1 | Every beta tester who attempted signup successfully received a confirmation email | Check with each tester directly. Zero missed emails. | |
| 1.2 | Every tester who confirmed their email landed on the correct dashboard (vendor → `/vendor/apply`, customer → `/dashboard`) | Manual tester confirmation. Zero wrong-dashboard incidents. | |
| 1.3 | At least one vendor tester completed the full journey: signup → email → apply → approved → profile → visible in marketplace | Full end-to-end verified by admin. | |
| 1.4 | At least one customer tester completed: signup → email → dashboard → browse → quote request | Full end-to-end verified by admin. | |

**If any auth criterion fails:** Stop immediately. Fix the auth flow. Do not expand.

---

### Category 2 — Core Flows (All must pass)

| # | Criterion | Evidence required | Pass / Fail |
|---|---|---|---|
| 2.1 | Vendor application form submits without error on at least 2 different devices | Tester confirmation. Browser/device noted. | |
| 2.2 | Vendor approval email delivers when admin clicks Approve | Check vendor tester inbox. | |
| 2.3 | At least one quote request sent and received by vendor | Vendor tester confirms notification. Quote visible in `/vendor/quotes`. | |
| 2.4 | Admin vendor approval workflow operates correctly (approve, reject, phone verify) | Admin self-test confirmed. | |
| 2.5 | No P0 or P1 bugs are open | All critical and high bugs closed or have confirmed fixes deployed. | |

---

### Category 3 — Stability (No tolerance for instability before scaling)

| # | Criterion | Evidence required | Pass / Fail |
|---|---|---|---|
| 3.1 | Platform uptime > 99% during the 6-tester phase | Vercel deployment logs show no outages. | |
| 3.2 | Zero data loss incidents | No tester profile, application, or quote was lost due to a platform error. | |
| 3.3 | TypeScript 0 errors and build passing on the deployed commit | Run `npx tsc --noEmit` and `npm run build` on latest commit. | |

---

### Category 4 — Tester Experience (Subjective but required)

| # | Criterion | Threshold | Pass / Fail |
|---|---|---|---|
| 4.1 | Average tester satisfaction (1–10 rating from Section 7 of Beta_Test_Results.md) | Average ≥ 7.0 | |
| 4.2 | No tester abandoned the journey due to a platform issue (as opposed to personal choice) | All dropouts must be non-platform causes. Zero platform-caused abandonments. | |

---

## Scoring

Count the PASS results:

| Score | Recommendation |
|---|---|
| 12 / 12 PASS | **GO** — expand immediately |
| 10–11 / 12 PASS | **CONDITIONAL GO** — expand only if failing criteria are Category 3/4, not Category 1/2 |
| 8–9 / 12 PASS | **NO-GO** — fix failing criteria, re-evaluate in 3 days |
| < 8 / 12 PASS | **HARD NO-GO** — significant platform issues; pause expansion indefinitely |

---

## Expansion Process — When GO is confirmed

```
1. Identify the next 14 tester candidates
   ├── From: ELBOLD Vendor Pipeline (Drive)
   ├── Mix: 7 vendors + 7 customers (or per target mix)
   └── Priority: vendors already in "Interested" stage of Pilot CRM

2. Personalise outreach for each
   ├── Use WhatsApp scripts from /admin/pilot/outreach
   └── Reference: founding vendor benefits, limited slots

3. Stagger invitations (do not send all 14 at once)
   ├── Send 5 invitations on Day 1
   ├── Send 5 invitations on Day 3
   └── Send 4 invitations on Day 5
   Reason: staggering allows admin to handle application reviews without being overwhelmed

4. Monitor the same daily checklist (07_Daily_Beta_Monitoring_Checklist.md)
   └── Scale of monitoring increases with tester count

5. Update pilot CRM status for each new invite
   └── /admin/pilot/vendors → set status to "Contacted"
```

---

## Target Mix for 20-Tester Phase

| Category | Slots | Notes |
|---|---|---|
| Photographers | 5 | London, Manchester, Birmingham priority |
| Decorators | 5 | Any UK city |
| DJs | 3 | — |
| Caterers | 3 | — |
| Cake Designers | 2 | — |
| Event Planners | 2 | — |
| **Total vendors** | **20** | — |
| Customer testers | 5–10 | Friends, family, event planners |

Note: vendor slots may overlap with customer testers if a vendor also wants to test the customer flow.

---

## What Changes at 20 Testers

| Area | 6-tester phase | 20-tester phase |
|---|---|---|
| Vendor review SLA | 24 hours | 24 hours (maintained) |
| Bug response P0 | 2 hours | 2 hours (maintained) |
| Bug response P1 | 24 hours | 24 hours (maintained) |
| Daily monitoring | Full checklist | Full checklist + additional B/C checks |
| Outreach pace | 10 contacts/day | Continue 10/day until 20 slots filled |
| Admin capacity | Low | Monitor for signs of overload |
| Quote volume | Low | May increase — ensure vendor response rate stays high |

---

## Signs to Pause Expansion Mid-20

Even after starting the 20-tester phase, pause adding more testers if:

- A new P0 or P1 bug is found that affects the core journey
- Email delivery fails for any tester (even one)
- Admin capacity to review applications within 24h is exceeded
- A tester reports a security or privacy concern

In these cases: stop sending new invitations, fix the issue, then resume.

---

## Sign-Off

| Criterion category | All pass? | Date checked | Signed |
|---|---|---|---|
| Category 1 — Auth | | | |
| Category 2 — Core flows | | | |
| Category 3 — Stability | | | |
| Category 4 — Experience | | | |

**Decision: GO / NO-GO**

**Next invitation date:** `_______________`

**Signed:** `_______________`  
**Date:** `_______________`
