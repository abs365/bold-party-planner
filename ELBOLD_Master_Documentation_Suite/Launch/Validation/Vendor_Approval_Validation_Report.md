# Vendor Approval Flow — Technical Validation Report

**Document:** Vendor_Approval_Validation_Report  
**Phase:** 28D  
**Updated:** 2026-06-03  
**Status:** ⬜ AWAITING LIVE VALIDATION

---

## Purpose

This report documents every technical component in the vendor approval workflow — from application submission to marketplace visibility — and records live validation results.

---

## Flow Overview

```
Vendor Application → Database → Admin Alert → Admin Queue
→ Admin Approves → Vendor Email → Marketplace Visibility
```

---

## Step-by-Step Technical Breakdown

### Step 1 — Vendor Submits Application

**Route:** `POST /api/vendor/apply`  
**File:** `app/api/vendor/apply/route.ts`  
**Authentication:** Required (`requireAuth()`)

**Data written:**

| Table | Columns written | Values |
|---|---|---|
| `profiles` | `role` | Updated to `'vendor'` |
| `auth.users` | `raw_user_meta_data->>'role'` | Synced to `'vendor'` via `supabase.auth.updateUser()` |
| `vendors` | `user_id`, `business_name`, `category`, `city`, `phone`, `bio`, `location`, `travel_radius_km`, `min_price`, `max_price`, `years_experience`, `instagram_url`, `website_url`, `status` | `status = 'pending'` |
| `admin_alerts` | `type`, `title`, `body`, `vendor_id`, `severity` | `type = 'vendor_applied'`, `severity = 'info'` |
| `analytics_events` | `event`, `user_id`, `properties` | `vendor.registered` tracked |

**Email triggered:** `sendVendorApplicationReceived()` — vendor receives "Application received" confirmation  
**File:** `lib/resend/index.ts`

**Logging:** `logger.info("vendor.apply.submit", ...)`, `logger.info("vendor.apply.created", ...)`

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| `vendors` row created | `status = 'pending'` | | |
| `profiles.role = 'vendor'` | Confirmed in DB | | |
| `auth.users.raw_user_meta_data->>'role' = 'vendor'` | Confirmed in Supabase Auth | | |
| `admin_alerts` row created | Type = vendor_applied | | |
| Vendor receives "Application received" email | Within 90 seconds | | |
| Admin alert bar shows count increase | `/admin` alert bar updates | | |

---

### Step 2 — Application Lands in Admin Queue

**Admin view:** `GET /api/admin/vendors?status=pending`  
**File:** `app/api/admin/vendors/route.ts`  
**Page:** `/admin/vendors` (Pending tab)  
**Authentication:** Admin only (`requireAdmin()` → service role)

**Data queried:**

```sql
SELECT *, profile:profiles(full_name, email, phone)
FROM vendors
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 100
```

**What admin sees per vendor card:**
- Business name, category, city
- Owner full name and email (from profiles join)
- Phone number (from vendors.phone)
- Join date
- Current status badge
- Action buttons: Approve, Reject, View profile

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| Vendor application appears in Pending tab | Correct business name, category, city | | |
| Phone number visible on card | Number entered at apply time | | |
| Owner email visible | Matches signup email | | |
| "View" button opens public profile in new tab | Profile page loads (even if incomplete) | | |

---

### Step 3 — Admin Approves or Rejects

**API route:** `PATCH /api/admin/vendors`  
**File:** `app/api/admin/vendors/route.ts`

#### Approve path:

**Data written:**

| Table | Columns written | Values |
|---|---|---|
| `vendors` | `status` | `'approved'` |
| `audit_logs` | Full audit entry | `action = 'admin.vendor.approve'`, actor_id, vendor_id, before/after status |
| `analytics_events` | `admin.vendor.approved` | Tracked |

**Email triggered:** `sendVendorApproved(email, full_name, business_name)` — vendor receives approval email with link to complete profile

#### Reject path:

**Data written:**

| Table | Columns written | Values |
|---|---|---|
| `vendors` | `status` | `'rejected'` |
| `audit_logs` | Full audit entry | `action = 'admin.vendor.reject'` |

**Email triggered:** `sendVendorRejected(email, full_name, business_name, rejection_reason)` — vendor receives rejection with reason

#### Additional admin actions (do not change status):

| Action | API param | Effect |
|---|---|---|
| Toggle featured | `featured: true/false` | `vendors.featured` updated |
| Toggle verified | `verified: true/false` | `vendors.verified` updated |
| Toggle phone verified | `phone_verified: true/false` | `vendors.phone_verified` updated |
| Suspend | `status: 'suspended'` | Vendor removed from marketplace |

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| `vendors.status = 'approved'` after approve | Confirmed in DB | | |
| Vendor receives approval email | Within 90 seconds | | |
| `audit_logs` entry created | actor_id, action, before/after | | |
| Vendor dashboard shows approved status | `/vendor/dashboard` no longer shows "pending" | | |

---

### Step 4 — Vendor Completes Profile

**Routes used by vendor:**

| Route | Purpose | Completion impact |
|---|---|---|
| `/vendor/profile` | Edit bio, location, contact | +points for bio, city |
| `/vendor/media` | Upload photos and videos | +points for media |
| `/vendor/services` | Create service packages | +points for packages |
| `/vendor/verification` | Submit identity documents | Level upgrade |

**Completion score calculation:**  
**File:** `lib/vendor/completion.ts`

| Criteria | Points | Level required |
|---|---|---|
| Email confirmed | 10 | Auto |
| Phone number set | 10 | Profile |
| Bio written | 15 | Profile |
| City set | 10 | Profile |
| 1+ package created | 15 | Services |
| 1+ photo uploaded | 15 | Media |
| Verification L1 auto-upgrade | 5 | Trigger: `tryUpgradeLevel1()` |
| Instagram URL set | 5 | Profile |
| Travel radius set | 5 | Profile |
| Website URL set | 5 | Profile |

Marketplace visibility threshold: **60 points**

---

### Step 5 — Marketplace Visibility

**Vendor appears in `/browse` when:**
- `vendors.status = 'approved'`
- Completion score ≥ 60% (at least: email + phone + bio + city + 1 package + 1 photo)
- `vendors.deleted_at IS NULL`

**DB query used by marketplace:**
```sql
SELECT vendors.*, vendor_media(url, type, is_cover)
FROM vendors
WHERE status = 'approved'
  AND deleted_at IS NULL
ORDER BY subscription_plan DESC, verification_level DESC, rating DESC
```

Subscription plan order: `featured > pro > free`

**Vendor profile public URL:** `/vendors/[vendor_id]`

**SEO:** JSON-LD structured data injected into vendor profile pages

**Validation check:**

| Check | Expected | Result | Date |
|---|---|---|---|
| Approved vendor appears in `/browse` | Visible in correct category filter | | |
| Vendor card shows business name, photo, city, rating | Correct data from DB | | |
| `/vendors/[id]` loads vendor profile | Full profile with packages and media | | |
| Vendor NOT in browse before approval | Pending vendor invisible to customers | | |

---

### Step 6 — Verification Level Upgrade (Optional)

**Level 1 — Automatic:**  
File: `lib/verification-automation.ts` → `tryUpgradeLevel1()`  
Triggered on every vendor profile PATCH.  
Requirements: email, phone, bio, city, 1 package, 1 photo.

**Level 2 — Admin-reviewed:**  
Vendor uploads: `POST /api/vendor/verification`  
Admin reviews at `/admin/verifications`  
Admin approves: `PATCH /api/admin/verifications` with `action: "approve"`

**Level 3 — Automatic:**  
`tryUpgradeLevel3()` triggers on cron and booking completion.  
Requirements: 5+ jobs, 4.5+ rating, 80%+ response rate, < 5% cancellation.

**Level 4 — Admin-only:**  
Manual override via `/admin/verifications` level buttons.

---

## Gap Analysis

| Area | Gap identified | Severity | Status |
|---|---|---|---|
| Vendor phone validation | UK format required at apply time; admin can see it | None | ✅ Resolved |
| Profile score visible to admin | Only visible to vendor at `/vendor/dashboard` | Low | Acceptable for beta |
| Email delivery dependency | Approval email requires Resend DNS to be verified | Critical | Must confirm pre-beta |
| Duplicate vendor prevention | `23505` unique constraint on user_id in vendors table | None | ✅ Handled |
| Vendor profile after rejection | Vendor can reapply by contacting admin — no self-serve resubmit | Low | By design for beta |

---

## Vendor Approval Validation Summary

| Step | Description | Status |
|---|---|---|
| 1 | Vendor submits application | ⬜ |
| 2 | Application appears in admin queue | ⬜ |
| 3 | Admin approves; vendor email sent | ⬜ |
| 4 | Vendor completes profile | ⬜ |
| 5 | Vendor visible in marketplace | ⬜ |
| 6 | Verification level upgrade | ⬜ |

**Overall Vendor Approval Status:** ⬜ AWAITING LIVE VALIDATION

**Signed off:** `_______________`  **Date:** `_______________`
