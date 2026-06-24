# Phase 70D.6A — Global Admin Operations Guide

**Role:** Global Admin (`global_admin`)  
**Assignee:** Ts (`tosinlawal05@gmail.com`)  
**Effective from:** 2026-06-24  
**Last updated:** 2026-06-24  
**Source audit:** Phase 70D.6A — live code review of routes and UI pages

---

## 1. Role Reference

| Role | Weight | Source | Can grant/revoke |
|---|---|---|---|
| Founder Admin | 4 | `ADMIN_EMAILS` env var | Global Admin + below |
| **Global Admin** | **3** | `admin_roles` DB | Ops Admin, Reviewer |
| Ops Admin | 2 | `admin_roles` DB | Reviewer |
| Reviewer | 1 | `admin_roles` DB | — |

Global Admin sits one tier below Founder. Every route that requires `ops_admin` is accessible to Global Admin (weight 3 >= 2). Every route that requires `global_admin` is accessible to Global Admin (weight 3 >= 3). Routes that require `founder` (weight 4) are not accessible.

---

## 2. Admin Dashboard

**URL:** `/admin`  
**Minimum role:** `ops_admin` — Global Admin has full access

The dashboard is the starting point for all operations. On login, Ts will see:

- **Operations Alert Bar** — amber/red badges for anything requiring action: pending vendor approvals, open disputes, pending verifications, flagged vendors, content reports, flagged reviews
- **Core Platform KPIs** — total customers, total/approved vendors, pending applications, bookings, revenue, disputes, phone verification rate
- **Vendor Approvals widget** — pending applications listed with Approve/Reject quick-action buttons (each button calls `requireAdminRole("global_admin")`)
- **Booking Activity** — pending, confirmed, disputed counts
- **System Alerts** — unread admin alerts by severity
- **Recent Activity** — timeline of new signups, vendor applications, bookings

**First action on login:** Check the Operations Alert Bar. Any orange badge = immediate attention required.

---

## 3. Operational Checklist

### 3.1 Daily

- [ ] Open `/admin` — check Operations Alert Bar for any badges
- [ ] Open `/admin/vendors?status=pending` — review all pending applications (target: same-day decision)
- [ ] Open `/admin/verifications` — process pending verification documents
- [ ] Open `/admin/disputes` — check for new disputes (escalate to Founder if unresolved past 48h)
- [ ] Open `/admin/governance` — review flagged vendors; action or note reason for deferral
- [ ] Open `/admin/reviews` — moderate flagged reviews
- [ ] Open `/admin/governance-log` — review today's decisions for any anomalies

### 3.2 Weekly

- [ ] Open `/admin/governance-log?entity_type=vendor` — review all vendor decisions for the week
- [ ] Check vendor rejection rate — flag unusual patterns to Founder
- [ ] Review `/admin/verifications?status=all` for stale pending verifications
- [ ] Review `/admin/payouts` — flag any vendor payouts awaiting manual processing to Founder

### 3.3 On-demand

- [ ] Vendor complaints or appeals → review governance log for vendor history → decide reinstate/uphold/escalate
- [ ] Suspicious vendor flag received → `/admin/verifications` → flag + add suspicious_reason → notify Founder if serious

---

## 4. Vendor Approval Workflow

**Route:** `PATCH /api/admin/vendors` with `status` field  
**Minimum role:** `global_admin` (status changes only)  
**UI:** `/admin/vendors?status=pending`

### 4.1 Reviewing an Application

Navigate to `/admin/vendors?status=pending`. Each application shows:
- Business name, category, city
- Applicant name (from profile)
- Date applied
- Media, packages, and profile data

**What to check before approving:**
- Business name is legitimate and not a duplicate
- Category and city are correctly entered
- At minimum one service package is configured
- No suspicious_flag already set from a previous review

### 4.2 Approve a Vendor

Set `status: "approved"` via the Approve button or `/admin/vendors` PATCH.

**What happens automatically:**
1. `vendors.status` → `"approved"`
2. `vendors.rejection_reason` → `null` (cleared)
3. Audit log entry: `admin.vendor.approve`
4. Governance decision: `vendor.approved` (handbook §1.3)
5. Email sent to vendor: approval notification

### 4.3 Reject a Vendor

Set `status: "rejected"` + `rejection_reason` (required field in UI).

**What happens automatically:**
1. `vendors.status` → `"rejected"`
2. `vendors.rejection_reason` → reason text
3. Audit log entry: `admin.vendor.reject`
4. Governance decision: `vendor.rejected` (handbook §1.4)
5. Email sent to vendor: rejection notification with reason

**Rejection reasons — standard language:**
- Profile incomplete: "Application incomplete — please add at least one service package and a complete business description before reapplying."
- Duplicate/suspicious: "We were unable to verify this business at this time."
- Wrong category: "Please reapply under the correct service category."
- Missing contact: "A valid business contact number is required."

### 4.4 Suspend an Active Vendor

Set `status: "suspended"`.

**When to suspend:**
- Customer reports of non-delivery
- Repeated disputes won by customers
- Fraudulent activity suspected
- Serious policy violation

**What happens automatically:**
1. `vendors.status` → `"suspended"`
2. Audit log entry: `admin.vendor.suspend`
3. Governance decision: `vendor.suspended` (handbook §3.1)
4. No automatic email — manually notify vendor via notes field and Founder if high-profile

**Suspension does not:**
- Cancel existing bookings (requires separate action)
- Refund customers automatically (manual process via Founder)

### 4.5 Reinstate a Vendor

Set `status: "approved"` on a currently suspended vendor.

**What happens automatically:**
1. `vendors.status` → `"approved"`
2. Audit log entry: `admin.vendor.approve`
3. Governance decision: `vendor.reinstated` (handbook §3.4) — system detects previous status was `"suspended"` and uses the reinstate action type

**When to reinstate:**
- Suspension was an error
- Vendor has resolved the issue and provided evidence
- Founder has reviewed and approved reinstatement

**Escalate to Founder before reinstating if:** suspension was for fraud, repeated disputes, or customer harm.

### 4.6 Bulk Actions

Available via `POST /api/admin/vendors` — bulk approve, reject, or suspend multiple vendors in one operation. Each vendor gets its own audit log and governance decision entry.

Use for: batch processing of test accounts, batch approval of vetted pilot vendors, batch suspension of dormant accounts.

---

## 5. Verification Workflow

**Route:** `PATCH /api/admin/verifications`  
**Minimum role:** `global_admin`  
**UI:** `/admin/verifications`

### 5.1 Document Approval

When a vendor submits a verification document (government ID, business registration, etc.):

1. Go to `/admin/verifications`
2. Review the submitted document
3. Choose action:

| Action | When to use |
|---|---|
| **Approve** | Document is valid, legible, matches vendor identity |
| **Reject** | Document is invalid, expired, or unrelated |
| **Request resubmission** | Document is blurry, wrong type, or partially incomplete — vendor can fix and resubmit |
| **Flag** | Document raises fraud concerns — adds `suspicious_flag` to vendor |
| **Unflag** | Flag was set in error |

**Automatic level upgrades on approval:**
- Government ID approved → `verification_level: 2`, `verified: true`
- All category-required documents approved → `verification_level: 3`

Each action generates:
- Audit log entry
- Governance decision (§2.3)
- Email to vendor

### 5.2 Verification Levels

| Level | Meaning | Trigger |
|---|---|---|
| 0 | Unverified | Default |
| 1 | Basic (manual) | Set manually |
| 2 | Identity verified | Gov ID approved |
| 3 | Fully verified | All category docs approved |
| 4 | Elite | Set manually by Global Admin+ |

---

## 6. Governance Log

**URL:** `/admin/governance-log`  
**Minimum role:** `global_admin` (page-level)

The governance log is an immutable record of every status-changing decision made on the platform. It cannot be edited or deleted — any attempt raises a `restrict_violation` database error.

### 6.1 What Gets Logged

Every operation Ts performs that changes a vendor status, verification status, or role is automatically logged. No manual entry is required.

| Action | Handbook § | Auto-logged |
|---|---|---|
| Vendor approved | 1.3 | Yes |
| Vendor rejected | 1.4 | Yes |
| Vendor reinstated | 3.4 | Yes |
| Vendor suspended | 3.1 | Yes |
| Vendor bulk-approved | 1.3 | Yes (one entry per vendor) |
| Vendor bulk-rejected | 1.4 | Yes (one entry per vendor) |
| Vendor bulk-suspended | 3.1 | Yes (one entry per vendor) |
| Vendor flagged | 3.1 | Yes |
| Vendor unflagged | 3.1 | Yes |
| Document approved | 2.3 | Yes |
| Document rejected | 2.3 | Yes |
| Resubmission requested | 2.3 | Yes |
| Verification level changed | 2.3 | Yes |
| Role granted | — | Yes |
| Role revoked | — | Yes |

### 6.2 Reading the Log

Columns:
- **Date** — when the decision was made
- **Action** — colour-coded badge (green = positive, red = restrictive, amber = warning)
- **Entity** — what was affected (vendor, verification, admin_role) + truncated ID
- **Actor** — who made the decision (email + role)
- **Status change** — previous → new status
- **§** — handbook section reference

Filters available:
- Entity type: all / vendor / verification / payout / review / dispute / admin_role
- Source: all / human only / automated only

### 6.3 Correction Policy

If a governance decision was made in error (e.g., wrong vendor suspended), the correct process is:
1. **Do not attempt to delete the record** — it is blocked
2. Create a new corrective action (e.g., reinstate the vendor)
3. The new record becomes the correction; both entries are visible in the log
4. Note the correction in `admin_notes` of the new decision

---

## 7. Team Management Visibility

**Team page:** `/admin/team` — requires `founder` — **Ts cannot access this page**

**Team API:** `GET /api/admin/team` — requires `ops_admin` — Ts can call the API

**What this means in practice:** Ts can see the team roster via API but not via the admin UI team page. The team roster UI is Founder-only. This is by design — role management changes are a Founder function.

**Role grant/revoke:** Ts can grant `ops_admin` or `reviewer` to users via `POST /api/admin/team`. Ts cannot grant `global_admin` (blocked at route:55) and cannot grant `founder` (blocked at route:49 validation — "founder" is not in the valid roles list).

---

## 8. Governance Checklist

For every vendor status decision, confirm:

- [ ] Decision is justified by observable evidence (document, behaviour, customer report)
- [ ] Standard rejection/suspension language used where applicable (avoids vague or legally ambiguous notes)
- [ ] Admin notes field completed for any non-routine decision
- [ ] Governance log entry visible in `/admin/governance-log` within seconds of action
- [ ] Automated email to vendor confirmed (approval, rejection, verification)
- [ ] Any reinstatement of a previously suspended vendor — Founder notified before action

For verifications:
- [ ] Document type matches the verification type requested
- [ ] Name on document matches vendor profile name
- [ ] Document is not expired
- [ ] If flagging: `suspicious_reason` filled in with specific observable behaviour

---

## 9. Daily Workflow for Ts

```
START OF DAY
  1. Log in → /admin
  2. Check Operations Alert Bar
     → Any amber/red badge: open that section first
     → No badges: proceed to routine

  VENDOR QUEUE (daily, highest priority)
  3. /admin/vendors?status=pending
     → Review each pending application
     → Approve, reject, or request missing info via admin_notes
     → Target: zero pending applications by end of day

  VERIFICATIONS (daily)
  4. /admin/verifications
     → Review all pending documents
     → Approve/reject/request resubmission
     → Flag anything suspicious → notify Founder

  DISPUTES (daily)
  5. /admin/disputes
     → Check for new disputes
     → If dispute > 48h unresolved: escalate to Founder

  GOVERNANCE (daily)
  6. /admin/governance
     → Check flagged vendors
     → Action or defer with note

  REVIEWS (as needed)
  7. /admin/reviews
     → Moderate flagged reviews
     → Remove if policy violation; approve if valid

  END OF DAY
  8. /admin/governance-log?automated=false
     → Review today's human decisions
     → Confirm no anomalous entries
```

---

## 10. Escalation Workflow to Founder

**Contact:** `blue2gtv@gmail.com` (Founder Admin, AY)

### When Ts must escalate immediately:

| Situation | Reason |
|---|---|
| Vendor suspension for suspected fraud | High impact; Founder review required before action |
| Vendor suspension where customer funds are at risk | Refund/payout decision requires Founder |
| Dispute involving transaction > £500 | Financial exposure |
| Vendor has significant booking history (>5 completed) | Suspension would break active service relationships |
| System alert at `danger` severity | May require infrastructure or payment intervention |
| Vendor threatening legal action | Legal exposure — do not take action without Founder |
| Any evidence of data breach or security issue | P0 escalation — immediate |
| Request to grant `global_admin` to a new person | Founder-only role grant |
| Request to modify ADMIN_EMAILS | Infrastructure-level change — Founder only |

### When Ts should flag but can act first:

| Situation | Action | Then flag |
|---|---|---|
| Duplicate vendor application (same business, different email) | Reject the duplicate | Note to Founder for awareness |
| Vendor with incomplete profile applying repeatedly | Reject with detail | Flag pattern if >3 attempts |
| Review that is clearly fake/incentivised | Remove review | Log to governance |
| Suspicious verification document | Flag vendor + reject document | Notify Founder |

### How to escalate:

Since there is no in-platform escalation queue yet, escalation is by direct communication. Document the situation before escalating:

1. Note the vendor/user ID
2. Note what action you're considering and why
3. Note any relevant governance log entry IDs
4. Contact Founder with this summary

---

## 11. Situations Requiring Founder Approval

The following cannot be done by Global Admin and require the Founder to act:

| Situation | Why |
|---|---|
| Grant `global_admin` to a new person | Route explicitly blocks: `auth.role !== "founder"` → 403 |
| Revoke `global_admin` from an existing person | Same code path; Founder-only |
| View the Admin Team UI page (`/admin/team`) | Page requires `founder` role |
| Change `ADMIN_EMAILS` environment variable | Vercel production env — infrastructure access only |
| Any action on Founder's own account | ADMIN_EMAILS anchored; no DB row to act on |
| Payout manual processing or cancellation | `/api/admin/payouts` — review required (check route minimum) |
| Platform configuration changes | Beyond admin panel scope |
| High-value disputes or fraud investigation | Financial/legal exposure |

---

## 12. Handbook Alignment

The platform's governance actions map directly to handbook sections. These are recorded automatically in the `handbook_section` field of every governance_decision:

| Action | §  | Handbook topic |
|---|---|---|
| `vendor.approved` | 1.3 | Vendor application approval |
| `vendor.rejected` | 1.4 | Vendor application rejection |
| `verification.document_approved` | 2.3 | Document verification |
| `verification.document_rejected` | 2.3 | Document verification |
| `verification.resubmission_requested` | 2.3 | Document resubmission |
| `verification.level_upgraded` | 2.3 | Verification level change |
| `vendor.suspended` | 3.1 | Vendor suspension and warnings |
| `vendor.warning_issued` | 3.1 | Warning issued |
| `vendor.flagged` | 3.1 | Suspicious flag |
| `vendor.reinstated` | 3.4 | Vendor reinstatement |
| `appeal.received` | 4.1 | Appeal received |
| `appeal.resolved_overturn` | 4.1 | Appeal resolved — overturned |
| `appeal.resolved_uphold` | 4.1 | Appeal resolved — upheld |
| `dispute.resolved` | 5.1 | Dispute resolution |
| `dispute.dismissed` | 5.1 | Dispute dismissed |
| `review.approved` | 6.1 | Review approved |
| `review.removed` | 6.1 | Review removed |
| `review.flagged` | 6.1 | Review flagged |

Role grants/revokes have no handbook section assigned — they are platform governance events outside the vendor handbook scope.

---

## 13. Access Map — Full Admin Surface

| URL | Minimum Role | Ts Access | Notes |
|---|---|---|---|
| `/admin` | `ops_admin` | YES | Full dashboard |
| `/admin/vendors` | `ops_admin` | YES | Read + bulk approve/reject via API |
| `/admin/vendors` PATCH (status) | `global_admin` | YES | Approve/reject/suspend/reinstate |
| `/admin/verifications` | `ops_admin` | YES | Read |
| `/admin/verifications` PATCH | `global_admin` | YES | Approve/reject/flag/set level |
| `/admin/governance-log` | `global_admin` | YES | Full immutable log |
| `/admin/governance` | `ops_admin` | YES | Flagged vendor management |
| `/admin/disputes` | `ops_admin` | YES | View disputes |
| `/admin/reviews` | `ops_admin` | YES | Moderate reviews |
| `/admin/moderation` | `ops_admin` | YES | Content reports |
| `/admin/customers` | `ops_admin` | YES | Customer list |
| `/admin/bookings` | `ops_admin` | YES | Booking list |
| `/admin/analytics` | `ops_admin` | YES | Platform analytics |
| `/admin/payouts` | `ops_admin` | YES (read) | Payout management |
| `/admin/team` | **`founder`** | **NO** | Founder-only team roster UI |
| `/admin/founder` | **`founder`** | **NO** | Founder-only configuration |

---

## 14. Key Constraints Summary

| Constraint | Enforced By |
|---|---|
| Cannot grant `global_admin` | `route:55` — 403 if `auth.role !== "founder"` |
| Cannot grant `founder` | `validRoles` array excludes `"founder"` — 400 |
| Cannot view team roster UI | `/admin/team` page requires `founder` |
| Cannot modify Founder's access | No DB row for Founder exists; ADMIN_EMAILS is env-var only |
| All actions are logged | Automatic — no bypass path in any admin route |
| Log is immutable | `trg_governance_immutable` trigger — raises `restrict_violation` |

---

*This guide reflects the live codebase as of Phase 70D.6A (2026-06-24). Route-level enforcement is fully active. All constraints are implemented in code, not policy alone.*
