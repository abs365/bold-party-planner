# Real Vendor Journey Test Plan
**Version:** 1.0 | **Date:** 2026-06-09 | **Type:** Manual Execution Required

> **NOTE:** This is a structured test plan. Execution requires a real browser, a real email address, and access to the Supabase SQL Editor and admin panel at /admin/vendors. SQL verification queries are provided for each stage so that every step produces evidence.

---

## Pre-Conditions

| Requirement | Check |
|-------------|-------|
| Test email account available (not already used on Elbold) | Manual |
| Production URL accessible: https://www.elbold.com | Manual |
| Supabase SQL Editor accessible | Manual |
| Admin panel accessible: https://www.elbold.com/admin/vendors | Manual |
| Migration 046 applied (lifecycle_state, portfolio_links columns exist) | Confirmed in Migration_046_Verification_Report.md |
| ADMIN_EMAILS env var includes your email | Verify in Vercel dashboard |

---

## Stage 1: Navigate to Application Page

**Action:** Open https://www.elbold.com/vendors/apply in an incognito/private browser window.

**Expected:**
- Page renders with Navbar showing "Elbold" wordmark (new clean wordmark — no starburst)
- 3-step form visible: "Your Business" | "Location & Pricing" | "About & Links"
- Benefits sidebar visible on left (desktop) or collapsed (mobile)

**SQL verification:** Not applicable at this stage.

**PASS criteria:** Page loads without error. Form step 1 is visible.

---

## Stage 2: Complete Step 1 — Business Basics

**Action:**
1. Enter business name: "Test Vendor Elbold QA"
2. Select a category (e.g., "DJ / Music")
3. Click "Continue"

**Expected:**
- Clicking Continue with empty business_name shows toast: "Please fill in all required fields"
- Clicking Continue with empty category shows toast: "Please fill in all required fields"
- With both filled, advance to step 2

**PASS criteria:** Step indicator shows step 2 active. Step 1 indicator shows green checkmark.

---

## Stage 3: Complete Step 2 — Location & Phone

**Action:**
1. Enter city: "London"
2. Leave phone blank, click Continue
3. Observe error, then enter phone: "07700 900000"
4. Enter invalid phone: "12345", click Continue
5. Observe error, then enter valid phone: "07700 900000"
6. Click Continue

**Expected:**
- Empty phone → toast: "Phone number is required" **(Phase 7 hardening)**
- Invalid phone "12345" → toast: "Please enter a valid UK phone number"
- Valid phone → advance to step 3

**PASS criteria:** Phone validation enforced at two levels. Step 3 becomes active.

---

## Stage 4: Complete Step 3 — Bio & Portfolio Links

**Action:**
1. Leave bio blank, try to submit
2. Enter bio < 30 characters, try to submit
3. Enter bio ≥ 30 characters: "A professional DJ service specialising in weddings and private events across London."
4. Add a portfolio link with invalid URL "notaurl", try to submit
5. Fix URL to "https://instagram.com/testvendorqa"
6. Click "Submit Application"

**Expected:**
- Empty bio → toast: "Please write at least 30 characters about your business" **(Phase 7 hardening)**
- Short bio → char counter shows "X more characters needed" **(Phase 7 hardening)**
- Invalid URL → toast: "Portfolio links must be valid URLs starting with https://" **(Phase 7 hardening)**
- Valid submission → redirects to /signup?role=vendor if not logged in (or proceeds if already logged in)

**PASS criteria:** All three new validations fire correctly.

---

## Stage 5: Sign Up / Authenticate

**Action:**
1. If redirected to /signup, create an account with the test email
2. Verify email from inbox
3. Return to /api/auth/callback URL in the email

**Expected:**
- After email confirmation, pending vendor is redirected to /confirmed page
- /confirmed page shows 4-stage timeline: Email confirmed (green) → Application under review (amber) → Decision → Published

**SQL verification:**
```sql
SELECT id, user_id, business_name, status, lifecycle_state, phone, portfolio_links
FROM vendors
WHERE business_name = 'Test Vendor Elbold QA'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected DB result:**
```
status: 'pending'
lifecycle_state: 'applied'
phone: '07700 900000'  -- NOT NULL
portfolio_links: [{"type": "instagram", "url": "https://instagram.com/testvendorqa"}]
```

**PASS criteria:** Vendor row exists with correct data. Phone is populated. Portfolio links are JSONB array.

---

## Stage 6: Email Confirmation

**Action:** Check the test email inbox.

**Expected emails:**
1. Supabase auth confirmation email (from Supabase)
2. "Application Received" email from Elbold (from Resend) — sent by `sendVendorApplicationReceived()`
3. Admin alert email to ADMIN_EMAILS — sent by `sendAdminNewVendorAlert()`

**PASS criteria:** All three emails arrive. If Resend domain is not verified, emails may land in spam — check spam folder.

> **Known issue:** Resend domain verification (DKIM/DMARC/SPF) is pending. Until verified, emails may be flagged as spam. This is a pre-launch blocker.

---

## Stage 7: Admin Visibility

**Action:** Log in as admin and navigate to /admin/vendors.

**Expected:**
- New vendor "Test Vendor Elbold QA" appears in the pending queue
- Stats bar shows: Total +1, Pending +1
- Vendor row shows correct business name, category, city, phone

**SQL verification:**
```sql
SELECT
  (SELECT COUNT(*) FROM vendors WHERE status = 'pending') AS pending_count,
  (SELECT COUNT(*) FROM vendors)                           AS total_count;
```

**PASS criteria:** Pending count in DB matches what admin panel displays.

---

## Stage 8: Admin Approval

**Action:**
1. Click on the vendor row in /admin/vendors
2. Change status to "approved"
3. Save

**Expected:**
- Vendor status changes to `approved`
- lifecycle_state auto-advances to `approved` (via DB trigger `trg_sync_vendor_lifecycle`)
- Stats bar updates: Approved +1, Pending -1, Total unchanged
- Approval email fires: `sendVendorApproved()` to vendor's email

**SQL verification:**
```sql
SELECT status, lifecycle_state, updated_at
FROM vendors
WHERE business_name = 'Test Vendor Elbold QA';
```

**Expected:**
```
status: 'approved'
lifecycle_state: 'approved'
```

**PASS criteria:** Both columns updated. Stats bar reconciles.

---

## Stage 9: Vendor Logs In After Approval

**Action:** Log in as the test vendor and navigate to /vendor/dashboard.

**Expected:**
- Dashboard loads
- Status shows "Approved" or prompts vendor to complete profile

**PASS criteria:** Vendor can access their dashboard without error.

---

## Stage 10: Cleanup

After the test, delete the test vendor to keep production data clean.

**SQL cleanup:**
```sql
-- ONLY run after test is complete and results are recorded
DELETE FROM vendors WHERE business_name = 'Test Vendor Elbold QA';
-- Also remove the Supabase auth user via Supabase dashboard → Auth → Users
```

---

## Test Summary

| Stage | Description | Status |
|-------|-------------|--------|
| 1 | Navigate to application page | MANUAL REQUIRED |
| 2 | Business basics (step 1) | MANUAL REQUIRED |
| 3 | Phone required validation (phase 7) | MANUAL REQUIRED |
| 4 | Bio minimum + URL validation (phase 7) | MANUAL REQUIRED |
| 5 | Auth + vendor row creation | MANUAL REQUIRED |
| 6 | Email confirmation (3 emails) | MANUAL REQUIRED |
| 7 | Admin visibility | MANUAL REQUIRED |
| 8 | Admin approval + lifecycle trigger | MANUAL REQUIRED |
| 9 | Vendor login post-approval | MANUAL REQUIRED |
| 10 | Cleanup | MANUAL REQUIRED |

---

**Pre-execution blockers:**
- BUG-002 (void calls in `issueRefundForCancellation`) — not on the vendor application path; does not block this test
- Resend domain unverified — emails may land in spam; does not block form submission test
- ADMIN_EMAILS must be set in Vercel — required for stage 6 admin alert email
