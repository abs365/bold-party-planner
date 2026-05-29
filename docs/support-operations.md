# Bold Party Planner — Support & Moderation Operations

**Version:** 1.0

---

## Overview

This document covers the operational workflows for handling real users: vendor moderation, dispute resolution, identity verification, account actions, and audit investigations. As the platform onboards real vendors and customers, these workflows become the primary day-to-day admin activity.

---

## 1. Vendor Moderation

### Vendor application review

New vendors submit an application via `/vendor/apply`. This creates a `vendors` row with `status = "pending"`.

**Admin workflow:**
1. Log in to `/admin/vendors` → filter by "Pending"
2. Review: business name, category, city, description, profile photo, portfolio (if any media uploaded)
3. Check for red flags: duplicate business names, unverifiable business details, inappropriate content
4. Decision:
   - **Approve** → `status = "approved"`, vendor receives email notification, vendor dashboard unlocked
   - **Reject** → `status = "rejected"`, vendor receives email with reason, can re-apply

**What to check:**

| Field | What to look for |
|---|---|
| Business name | No offensive language, no impersonation of known brands |
| Category | Matches the services described |
| Description | Coherent, professional, no contact details (phone/email in description bypasses platform) |
| Profile photo | Real person or professional business photo |
| Media | No inappropriate content, no watermarked stock images |

**Timeline target:** All pending applications reviewed within 24 hours.

---

### Media moderation

Vendor media uploads go to `vendor_media` with `moderation_status = "pending"`. Media is displayed publicly once approved.

**Admin workflow:**
1. `/admin/moderation` → review pending media items
2. Check: appropriate for an event services platform, no nudity, no offensive content, no stolen images
3. Decision: Approve or Reject (rejection marks `moderation_status = "rejected"` and removes from public view)

**Automated flag:** Explicit content detection is not yet automated. All media requires manual review for now.

---

### Vendor suspension

Suspend a vendor if:
- Multiple verified user complaints
- Fraudulent activity detected
- Terms of service violation
- No-show for confirmed bookings

**Admin action:**
1. `/admin/vendors` → find vendor → "Suspend"
2. Write a suspension reason (stored in audit log)
3. Vendor loses dashboard access, profile hidden from marketplace
4. Outstanding bookings must be manually reviewed — notify affected customers

**Audit requirement:** Every suspension must be logged with a reason. The audit log (`audit_logs`) records the action automatically when the admin suspension API route is called. Add a free-text reason to the admin UI action.

---

## 2. Dispute Handling

### What constitutes a dispute

A dispute arises when a customer reports a problem with a booked vendor:
- Vendor did not show up (no-show)
- Service significantly different from what was advertised
- Damage to customer property
- Vendor behaving unprofessionally

### Dispute workflow

1. Customer reports via the booking page or a support channel
2. Admin receives an `admin_alerts` notification (or a content report is submitted)
3. Admin reviews the booking details: `/admin/bookings` → find booking by ID
4. Admin contacts both parties:
   - Request vendor's account of events
   - Request customer evidence (photos, messages)
5. Investigation window: 5 business days
6. Resolution options:
   - **Dismiss** — insufficient evidence, close dispute
   - **Partial refund** — admin processes partial refund via Stripe
   - **Full refund** — admin processes full refund via Stripe
   - **Vendor suspension** — if misconduct confirmed

**Audit requirement:** Every dispute investigation must be logged. Document the outcome and evidence reviewed.

### Refund process

Stripe refunds are issued via:
1. Stripe Dashboard → Payments → find the payment → Refund
2. Update `bookings.payment_status = "refunded"` or `"partially_refunded"` via admin SQL or an admin API route
3. Notify customer via email

> Full refund automation via the API is a future enhancement. Currently managed via Stripe Dashboard.

---

## 3. Verification Review Workflow

Vendors request identity and business verification via the vendor dashboard. Documents are stored in the private `verification-documents` Supabase Storage bucket.

### Verification levels

| Level | What vendor submits | Admin action |
|---|---|---|
| Level 1 | Auto (email + phone + profile completeness) | None — automatic |
| Level 2 | Government ID, business registration, category-specific docs | Manual review |
| Level 3 | Auto (5+ jobs, 4.5+ rating, 80%+ response rate) | None — automatic |
| Level 4 | N/A | Admin-assigned (premium partner designation) |

### Level 2 review workflow

1. Admin receives notification in `admin_alerts` or `/admin/verifications`
2. Access documents via signed URL: `GET /api/verification/document?path=verification/{vendorId}/{type}/{filename}`
3. Verify:
   - **Government ID**: Name matches profile, document is genuine, not expired
   - **Business registration**: Matches the business name on the vendor profile
   - **Category-specific docs**: Relevant qualifications, insurance, licences for the category
4. Decision:
   - **Approve** → `vendor_verifications.status = "approved"`, vendor's `verification_level` incremented
   - **Reject** → `vendor_verifications.status = "rejected"`, vendor notified with rejection reason

**Document security:** Signed URLs expire after 1 hour. Do not share signed URLs externally.

**Timeline target:** Verification reviews within 2 business days.

---

## 4. Account Suspension

### When to suspend

| Scenario | Action |
|---|---|
| Vendor confirmed fraud | Immediate suspension, consider ban |
| Customer chargeback abuse | Account review, potential suspension |
| Terms of service violation (first offence) | Warning, then suspension |
| Impersonation of another vendor | Immediate suspension |
| Spam/fake reviews | Remove reviews, review account history |

### Suspension vs ban

- **Suspension**: Temporary, reversible. Account is inactive. Vendor profile hidden. Can be unsuspended.
- **Ban** (future feature): Permanent. Auth account disabled. Requires admin intervention to reinstate.

Currently, suspension sets `vendors.status = "suspended"`. There is no hard ban mechanism yet — document when added.

### Unsuspending a vendor

1. Admin reviews the case and determines the vendor should be reinstated
2. `/admin/vendors` → find suspended vendor → "Unsuspend"
3. Document the reason for reinstatement in the audit log
4. Notify the vendor

---

## 5. Audit Investigation Workflow

Use the audit trail to investigate unexplained platform behavior.

### When to run an audit investigation

- Vendor reports their profile was changed without their action
- Customer reports a booking was cancelled without their action
- Admin reports an unexpected change in the admin dashboard
- Security concern: unauthorized admin access suspected

### Investigation queries

```sql
-- All actions on a specific vendor record
SELECT al.action, al.actor_id, p.full_name, al.ip_address, al.created_at, al.metadata
FROM audit_logs al
LEFT JOIN profiles p ON al.actor_id = p.id
WHERE al.entity_type = 'vendor' AND al.entity_id = '<vendor-id>'
ORDER BY al.created_at DESC;

-- All actions by a specific admin
SELECT al.action, al.entity_type, al.entity_id, al.ip_address, al.created_at
FROM audit_logs al
WHERE al.actor_id = '<admin-user-id>'
ORDER BY al.created_at DESC
LIMIT 100;

-- All admin actions in the last 24 hours
SELECT al.action, al.entity_type, al.entity_id, p.email, al.ip_address, al.created_at
FROM audit_logs al
JOIN profiles p ON al.actor_id = p.id
WHERE al.created_at > NOW() - INTERVAL '24 hours'
ORDER BY al.created_at DESC;
```

### Investigation output

Document the investigation outcome in a postmortem or support note:
- Timeline of events
- Actor identified (or "no audit trail found")
- Root cause
- Corrective action taken

---

## 6. Content Reports

Customers and vendors can submit content reports via the platform (stored in `content_reports`).

**Admin workflow:**
1. `/admin/moderation` → Content Reports tab
2. Review reported content (vendor profile, review, message)
3. Actions:
   - **Dismiss** — report is unfounded, no action needed
   - **Remove content** — delete or hide the reported content
   - **Warn vendor** — send a warning notification
   - **Escalate** — treat as a formal dispute or suspension case

**Priority:**
- Reports of illegal content: immediate review (within 4 hours)
- Reports of offensive content: same-day review
- General quality complaints: 2-day review

---

## 7. Preparing for Real Users

Before the platform goes live with real users, ensure:

- [ ] At least one admin user (non-demo) is designated and has tested admin workflows
- [ ] A support contact channel exists and is published on the platform (email or form)
- [ ] Moderation workflows are documented and understood by the admin team
- [ ] Verification review SLA is agreed (target: 2 business days for Level 2)
- [ ] Dispute resolution process is communicated to vendors in onboarding
- [ ] Refund policy is published (determines dispute resolution outcomes)
- [ ] Stripe test mode is switched to live mode with test transactions verified
- [ ] Sentry alerts are routed to the admin team's notification channel
