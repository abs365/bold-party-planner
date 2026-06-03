# ELBOLD — Beta Test Results

**Document:** Beta_Test_Results  
**Owner:** Founder  
**Started:** 2026-06-03  
**Status:** IN PROGRESS — awaiting test results  
**Version:** 1.0

---

> Complete each section as you run the tests.
> Mark each row: **PASS** / **FAIL** / **PARTIAL** / **NOT RUN**
> Record the exact error message if a step fails — do not paraphrase.
> Sign off the final decision at the bottom when all sections are complete.

---

## Section 1 — Customer Signup

**Test account used:** `_______________________`  
**Date:** `_______________________`  
**Environment:** Local / Production (circle one)

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| 1.1 | Go to `/signup` | Page loads | | |
| 1.2 | "Book Vendors" tab is active by default | Yes | | |
| 1.3 | Fill Full Name, Email, Password (8+ chars) | Fields accept input | | |
| 1.4 | Click "Create Free Account" | Loading state shown | | |
| 1.5 | Form transitions to "Check Your Email" | Heading and email visible | | |

**Section 1 result:** PASS / FAIL / PARTIAL

---

## Section 2 — Vendor Signup

**Test account used:** `_______________________`  
**Date:** `_______________________`  
**Environment:** Local / Production (circle one)

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| 2.1 | Go to `/signup` | Page loads | | |
| 2.2 | Click "Join as Vendor" tab | Tab activates, copy changes | | |
| 2.3 | Fill Full Name, Email, Password | Fields accept input | | |
| 2.4 | Click "Create Vendor Account" | Loading state shown | | |
| 2.5 | Form transitions to "Check Your Email" | Heading and email visible | | |

**Section 2 result:** PASS / FAIL / PARTIAL

---

## Section 3 — Email Verification

**Applies to:** Customer (Section 1 account) and Vendor (Section 2 account)

| Check | Customer | Vendor | Notes |
|---|---|---|---|
| 3.1 Email received within 90 seconds | | | |
| 3.2 Sender address looks correct | | | |
| 3.3 No spam / junk folder | | | |
| 3.4 Confirmation link is clickable | | | |
| 3.5 Link opens without browser error | | | |
| 3.6 No "Redirect URL not allowed" error | | | |
| 3.7 No "database error saving new user" | | | |
| 3.8 No "database error querying schema" | | | |
| 3.9 Session created (user is logged in) | | | |

**Exact error seen (if any):**

```
_______________________
```

**Section 3 result:** PASS / FAIL / PARTIAL

---

## Section 4 — Dashboard Routing

After clicking the confirmation link, record where each user lands.

| Account | Expected destination | Actual destination | Correct? |
|---|---|---|---|
| Customer (Section 1) | `/dashboard` | | |
| Vendor (Section 2) | `/vendor/apply` | | |
| Admin (`abylaw365@gmail.com`) | `/admin` | | |

**Additional routing checks:**

| Check | Expected | Actual | Correct? |
|---|---|---|---|
| 4.4 Vendor logs out then logs back in | `/vendor/dashboard` | | |
| 4.5 Customer logs out then logs back in | `/dashboard` | | |
| 4.6 Authenticated vendor visits `/login` | Bounced to `/vendor/dashboard` | | |
| 4.7 Authenticated customer visits `/login` | Bounced to `/dashboard` | | |
| 4.8 Unauthenticated user visits `/vendor/dashboard` | Redirected to `/login` | | |

**Section 4 result:** PASS / FAIL / PARTIAL

---

## Section 5 — Vendor Application

**Continuing from Section 2 — vendor lands on `/vendor/apply` after confirmation**

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| 5.1 | Step 1 — fill Business Name and select Category | Step 1 fields accept input | | |
| 5.2 | Click Continue | Step 2 opens | | |
| 5.3 | Step 2 — fill City and Phone (UK format) | Fields accept input | | |
| 5.4 | Phone field rejects non-UK format | Validation error shown | | |
| 5.5 | Click Continue | Step 3 opens | | |
| 5.6 | Step 3 — fill Bio (optional), click Submit | Toast: "Application submitted!" | | |
| 5.7 | Lands on `/vendor/dashboard` | Vendor dashboard visible | | |
| 5.8 | Vendor dashboard shows pending state | Onboarding prompt or pending message | | |

**Database check (run in Supabase SQL Editor):**

```sql
SELECT v.business_name, v.category, v.city, v.phone, v.status,
       p.role, p.email
FROM vendors v JOIN profiles p ON p.id = v.user_id
WHERE p.email = 'VENDOR_TEST_EMAIL';
```

| Field | Expected | Actual |
|---|---|---|
| `status` | `pending` | |
| `profiles.role` | `vendor` | |
| `phone` | number entered | |

**Section 5 result:** PASS / FAIL / PARTIAL

---

## Section 6 — Admin Visibility

**Admin account:** `abylaw365@gmail.com`

| Step | Action | Expected | Result | Notes |
|---|---|---|---|---|
| 6.1 | Log in as admin | Lands on `/admin` | | |
| 6.2 | Go to `/admin/vendors` | Vendor list loads | | |
| 6.3 | Find vendor from Section 5 | Card visible, status = pending | | |
| 6.4 | Phone number shown on card | Yes, in grey | | |
| 6.5 | Click green phone button | Phone turns green, "verified" label | | |
| 6.6 | Click Approve | Status changes to approved, toast shown | | |
| 6.7 | Vendor receives approval email | Yes | | |
| 6.8 | Go to `/browse` | Approved vendor visible in marketplace | | |
| 6.9 | Go to `/admin/customers` | Customer from Section 1 visible | | |
| 6.10 | Go to `/admin/pilot/vendors` | Pilot CRM loads | | |

**Section 6 result:** PASS / FAIL / PARTIAL

---

## Section 7 — Friend Tester Feedback

Record feedback from any external testers invited during this QA phase.

**Instructions for testers:**  
Send testers to `https://www.elbold.com/signup` and ask them to sign up and describe anything that felt confusing, broken, or missing.

---

### Tester 1

**Name / handle:** `_______________________`  
**Role tested:** Customer / Vendor  
**Date:** `_______________________`

**What worked:**

```
_______________________
```

**What was confusing:**

```
_______________________
```

**What was broken:**

```
_______________________
```

**Overall impression (1–10):** `___`

---

### Tester 2

**Name / handle:** `_______________________`  
**Role tested:** Customer / Vendor  
**Date:** `_______________________`

**What worked:**

```
_______________________
```

**What was confusing:**

```
_______________________
```

**What was broken:**

```
_______________________
```

**Overall impression (1–10):** `___`

---

### Tester 3

**Name / handle:** `_______________________`  
**Role tested:** Customer / Vendor  
**Date:** `_______________________`

**What worked:**

```
_______________________
```

**What was confusing:**

```
_______________________
```

**What was broken:**

```
_______________________
```

**Overall impression (1–10):** `___`

---

## Section 8 — Bugs Found

Record every bug discovered during testing. One row per bug.

| # | Section | Description | Severity | Reproducible | Status |
|---|---|---|---|---|---|
| B001 | | | Critical / High / Medium / Low | Yes / No | Open / Fixed |
| B002 | | | | | |
| B003 | | | | | |
| B004 | | | | | |
| B005 | | | | | |

**Severity guide:**
- **Critical** — blocks signup, login, or email confirmation. No workaround. Beta cannot launch.
- **High** — breaks a key flow but has a workaround. Should fix before launch.
- **Medium** — visible problem that does not block core journey. Fix in next sprint.
- **Low** — minor UX issue, cosmetic, or edge case. Log and schedule.

---

## Section 9 — Fixes Applied

Record every fix applied in response to bugs found during this QA session.

| # | Bug ref | File changed | Description | TypeScript | Build | Date |
|---|---|---|---|---|---|---|
| F001 | | | | Pass / Fail | Pass / Fail | |
| F002 | | | | | | |
| F003 | | | | | | |

**After each fix:**
- Run `npx tsc --noEmit` — must return 0 errors
- Run `npm run build` — must pass
- Re-run the affected test section and update its result

---

## Section 10 — Final Go / No-Go Decision

Complete this section only when Sections 1–6 are all filled in and all Critical bugs are Fixed.

### Checklist

| Criteria | Status |
|---|---|
| Customer signup completes without error | PASS / FAIL |
| Customer receives confirmation email | PASS / FAIL |
| Customer lands on `/dashboard` after confirmation | PASS / FAIL |
| Vendor signup completes without error | PASS / FAIL |
| Vendor receives confirmation email | PASS / FAIL |
| Vendor lands on `/vendor/apply` after confirmation | PASS / FAIL |
| Vendor apply form submits successfully | PASS / FAIL |
| Vendor lands on `/vendor/dashboard` after apply | PASS / FAIL |
| `profiles.role` correct in database | PASS / FAIL |
| `vendors` record created in database | PASS / FAIL |
| `auth.users.raw_user_meta_data.role` correct | PASS / FAIL |
| Admin can see vendor application | PASS / FAIL |
| Admin can approve vendor | PASS / FAIL |
| No critical bugs open | PASS / FAIL |
| Migration 033 applied | PASS / FAIL |
| Migration 034 applied | PASS / FAIL |
| TypeScript 0 errors | PASS / FAIL |
| Build passing | PASS / FAIL |

### Decision

**Number of FAIL items:** `___`

**Number of Critical bugs open:** `___`

---

**DECISION: GO / NO-GO**

**Reasoning:**

```
_______________________
```

**Signed:** `_______________________`  
**Date:** `_______________________`

---

*Once this document shows GO, external vendor invitations may be sent.*  
*File: `ELBOLD_Master_Documentation_Suite/Launch/Beta_Test_Results.md`*
