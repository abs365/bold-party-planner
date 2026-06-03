# Vendor Approval Workflow Diagram — ELBOLD Beta

**Version:** 1.0  
**Date:** 2026-06-03

---

## Overview

Every vendor who applies to ELBOLD goes through a manual review before appearing in the marketplace. During beta, all reviews are performed by the founder within 24 hours. This document describes every decision point, action, and outcome in the approval workflow.

---

## Full Approval Flow

```
VENDOR                      PLATFORM                      ADMIN
    │                           │                             │
    │  Submits application       │                             │
    │  /vendor/apply             │                             │
    │──────────────────────────► │                             │
    │                           │  vendors row inserted        │
    │                           │  status = "pending"          │
    │                           │  admin_alert created         │
    │                           │  ─────────────────────────► │
    │                           │                         Alert: "New vendor application"
    │                           │                         /admin alert bar shows count
    │  Email: "Application       │                             │
    │  received"                │                             │
    │                           │                         Admin opens /admin/vendors
    │                           │                         Filter: Pending
    │                           │                         Reviews vendor card:
    │                           │                         - Business name
    │                           │                         - Category
    │                           │                         - City
    │                           │                         - Phone (from apply form)
    │                           │                         - Owner email
    │                           │                         - Bio (if supplied)
    │                           │                             │
    │                           │           DECISION POINT    │
    │                           │                             │
    │                           │        ┌──────────────────  │
    │                           │        │                    │
    │                           │    APPROVE                REJECT
    │                           │        │                    │
    │                           │◄───────┘                    │
    │                           │  status = "approved"         │
    │                           │  verified = true             │
    │◄───────────────────────── │                             │
  Email: "You're approved!"      │                             │
  Link to complete profile       │                             │
    │                           │      OR                     │
    │                           │◄────────────────────────────│
    │                           │  status = "rejected"         │
    │                           │  rejection_reason saved      │
    │◄───────────────────────── │                             │
  Email: "Application not        │                             │
  approved" + reason             │                             │
  + invitation to reapply        │                             │
```

---

## Admin Decision Criteria

### Approve when ALL of the following are true:

| Criterion | Check |
|---|---|
| Business name is a real trading name (not "Test", "ABC", generic) | Yes |
| Service category is appropriate and correctly chosen | Yes |
| City is a real UK city or town | Yes |
| Phone number is present and UK format | Yes |
| Vendor does not already have an approved account | Yes |
| No obvious duplicate application from the same person | Yes |
| Application is not spam or clearly fraudulent | Yes |

**Approve immediately if:** Vendor was personally outreached via the pilot acquisition campaign. Phone number present, professional business name. No red flags.

### Reject when ANY of the following are true:

| Reason | Rejection message |
|---|---|
| Business name is generic / test data | "Please provide your real trading name" |
| Category does not match the described service | "Please select the correct category for your service" |
| City is outside the UK | "ELBOLD currently serves UK vendors only" |
| Duplicate account detected | "An account already exists for this business" |
| Incomplete application (no bio, no city) | "Please complete all required fields before reapplying" |
| Cannot verify business existence | "We could not verify this business — please contact support" |
| Suspected spam or bot submission | (Internal note only — no specific reason given) |

### Request resubmission when:

- Bio is too short (under 30 words) but everything else is fine
- Instagram URL is broken
- Photos are needed before the platform can display them well

---

## Post-Approval Actions

```
Vendor receives approval email
    │
    Vendor logs in → /vendor/dashboard  (status = approved)
    │
    Completion score shown:
    ├── < 60%  → "Almost Ready" — not yet in marketplace
    ├── 60-79% → "Good Profile" — visible in marketplace
    ├── 80-99% → "Strong Profile" — better placement
    └── 100%   → "Fully Optimised" — maximum visibility
    │
    Admin at /admin/vendors can additionally:
    ├── Toggle "Featured" (amber star) → vendor appears on homepage
    ├── Toggle "Verified" (blue shield) → shows verified badge on profile
    └── Toggle "Phone Verified" (green phone) → shows phone verified trust signal
```

---

## Verification Level Upgrade Workflow

Separate from application approval — vendors can request additional trust levels.

```
Level 1 — Automatic (no admin action required)
    │
    Triggered when vendor profile meets ALL:
    ├── Email confirmed
    ├── Phone number set
    ├── Bio written (> 30 chars)
    ├── City set
    ├── At least 1 package created
    └── At least 1 photo uploaded
    
    System: tryUpgradeLevel1() runs on every profile PATCH
    Result: verification_level = 1 (auto-applied)

Level 2 — ID Verified (admin reviews documents)
    │
    Vendor uploads: government ID (passport/driving licence)
    → /vendor/verification → Documents tab
    → vendor_verifications row inserted (status = pending)
    → admin_alert created
    │
    Admin at /admin/verifications:
    ├── View signed document URL (1h TTL)
    ├── Approve → level 2, "ID Verified" email sent
    └── Reject (with reason) → rejection email, resubmit allowed

Level 3 — Trusted Pro (automatic)
    │
    Triggered when:
    ├── completed_jobs_count >= 5
    ├── rating >= 4.5
    ├── response_rate >= 80%
    └── cancellation_rate < 5%
    
    System: tryUpgradeLevel3() runs on cron + booking completion
    Result: verification_level = 3

Level 4 — Premium Partner (admin-assigned only)
    │
    Admin manually sets level to 4 via /admin/verifications
    → "Premium Partner" invite email sent
    → Gold badge shown on vendor profile
```

---

## Suspension Workflow

```
Admin identifies issue with approved vendor:
    │
    ├── Review /admin/governance (at-risk queue)
    ├── Identify: low activity / poor reviews / complaints
    │
    Actions available:
    ├── Issue warning (via governance page)
    ├── Suspend vendor (suspend button on /admin/vendors)
    │   └── status = "suspended"
    │   └── Vendor cannot receive new leads
    │   └── Vendor profile removed from marketplace
    └── Reactivate → returns to approved
```

---

## Rejection Email Content

**Subject:** Your ELBOLD application  
**Body structure:**
- Acknowledge the application
- State clearly that it was not approved at this time
- Give the specific reason (from admin input)
- Invite reapplication once the issue is resolved
- Link to help centre

**Note:** Supabase confirmation emails are NOT customisable without custom SMTP. The rejection email is sent by Resend via `sendVendorRejected()` in `lib/resend/index.ts`.

---

## Approval SLAs During Beta

| Scenario | SLA |
|---|---|
| Standard application | 24 hours |
| Application from personally outreached vendor | 4 hours |
| Resubmitted application after rejection | 24 hours |
| Verification document review (Level 2) | 48 hours |
| Suspension decision | Immediate for safety issues; 24h for quality issues |
