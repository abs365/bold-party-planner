# ELBOLD — Vendor Email Confirmation QA

**Document:** Vendor_Email_Confirmation_QA  
**Owner:** Founder  
**Status:** REQUIRED — must pass before external vendor invitations  
**Version:** 1.0 (2026-06-03)

---

## Pre-Test: Supabase Configuration Gate

Before running any test, confirm these are set in **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Required value |
|---|---|
| Site URL | `http://localhost:3000` (local) / `https://www.elbold.com` (production) |
| Redirect URL | `http://localhost:3000/api/auth/callback` |
| Redirect URL | `https://www.elbold.com/api/auth/callback` |

**If these are missing, email confirmation will silently fail. Complete this before any test.**

Full configuration instructions: `docs/auth-configuration.md`

---

## Test A — Customer Signup End-to-End

**Path:** `/signup` (Book Vendors tab) → email → confirmation → `/dashboard`

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| A1 | Go to `/signup` | Page loads with two role tabs | | |
| A2 | Tab shows "Book Vendors" by default | Customer tab is active | | |
| A3 | Fill: Full Name, Email (real inbox), Password (8+ chars) | All fields accept input | | |
| A4 | Click "Create Free Account" | Button shows loading state | | |
| A5 | Form transitions to "Check Your Email" screen | Heading and email address visible | | |
| A6 | Open email inbox | Email received from ELBOLD within 60 seconds | | |
| A7 | Click confirmation link in email | Browser opens — no error page | | |
| A8 | Confirmation link redirects | Lands on `/dashboard` (customer dashboard) | | |
| A9 | Dashboard loads | No error, correct layout shown | | |
| A10 | `profiles` table checked | `role = customer`, `email_confirmed_at` set | | |

**Test account:** `_______________________`  
**Date tested:** `_______________________`  
**Tester:** `_______________________`

| Check | Yes / No |
|---|---|
| Email received within 60 seconds | |
| No "Redirect URL not allowed" error | |
| No "database error saving new user" | |
| No "database error querying schema" | |
| Landed on customer dashboard (not vendor) | |
| `profiles.role = customer` confirmed | |

**Result: PASS / FAIL**

---

## Test B — Vendor Signup End-to-End

**Path:** `/signup` (Join as Vendor tab) → email → confirmation → `/vendor/apply` → `/vendor/dashboard`

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| B1 | Go to `/signup` | Page loads | | |
| B2 | Click "Join as Vendor" | Right panel copy changes to vendor | | |
| B3 | Fill: Full Name, Email (real inbox, different from Test A), Phone (UK), Password | Fields accept input | | |
| B4 | Click "Create Vendor Account" | Loading state shown | | |
| B5 | Transitions to "Check Your Email" screen | Email address displayed correctly | | |
| B6 | Open email inbox | Confirmation email received within 60 seconds | | |
| B7 | Click confirmation link | Browser opens — no error | | |
| B8 | Confirmation link redirects | Lands on `/vendor/apply` (not `/dashboard`) | | |
| B9 | Vendor apply form shown | 3-step form loads | | |
| B10 | Complete vendor apply (Business Name, Category, City, Phone) | Steps 1–3 advance correctly | | |
| B11 | Submit application | Success toast shown | | |
| B12 | Redirected to `/vendor/dashboard` | Vendor dashboard loads | | |
| B13 | Database records checked | See database verification below | | |

**Test account:** `_______________________`  
**Date tested:** `_______________________`  
**Tester:** `_______________________`

| Check | Yes / No |
|---|---|
| Confirmation email received | |
| Confirmation link opened without error | |
| Redirected to `/vendor/apply` (not customer dashboard) | |
| Vendor apply form completed successfully | |
| Redirected to `/vendor/dashboard` | |
| `profiles.role = vendor` confirmed | |
| `vendors` record created with `status = pending` | |

**Result: PASS / FAIL**

---

## Test C — Customer-to-Vendor Conversion

**Path:** Existing customer account → `/vendor/apply` → submit → `/vendor/dashboard`

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| C1 | Log in as existing customer | Customer dashboard visible | | |
| C2 | Go to `/vendor/apply` | Vendor application form loads | | |
| C3 | Complete all 3 steps | Form advances | | |
| C4 | Submit application | Success toast shown | | |
| C5 | Redirected to `/vendor/dashboard` | Vendor dashboard loads | | |
| C6 | Log out, then log in again | | | |
| C7 | Redirect destination | `/vendor/dashboard` (not customer dashboard) | | |
| C8 | Database checked | `profiles.role = vendor`, `vendors` record exists | | |
| C9 | `auth.users.user_metadata` | `role = vendor` | | |

**Test account:** `_______________________`  
**Date tested:** `_______________________`  
**Tester:** `_______________________`

**Result: PASS / FAIL**

---

## Test D — Admin Vendor Application Visibility

| # | Step | Expected | Result | Notes |
|---|---|---|---|---|
| D1 | Log in as admin | Admin dashboard visible | | |
| D2 | Go to `/admin/vendors` | Vendor list loads | | |
| D3 | Find vendor from Test B | Status shows "pending" | | |
| D4 | Vendor record shows business name, category, city | Correct values from application | | |
| D5 | Phone number visible to admin | Yes | | |
| D6 | Approve vendor | Status changes to "approved" | | |
| D7 | Vendor receives approval email | Yes | | |
| D8 | Vendor now visible in `/browse` marketplace | Yes (after approval) | | |

**Admin account:** `_______________________`  
**Date tested:** `_______________________`  
**Tester:** `_______________________`

**Result: PASS / FAIL**

---

## Database Verification SQL

Run in **Supabase Dashboard → SQL Editor** after Tests A and B:

```sql
-- Confirm customer profile (Test A)
SELECT id, email, full_name, role, phone
FROM profiles
WHERE email = '<test-a-email>';

-- Confirm vendor profile + vendor record (Test B)
SELECT p.id, p.email, p.full_name, p.role, p.phone,
       v.id AS vendor_id, v.business_name, v.category, v.status, v.phone AS vendor_phone
FROM profiles p
LEFT JOIN vendors v ON v.user_id = p.id
WHERE p.email = '<test-b-email>';

-- Confirm user_metadata role is set (Test B and C)
SELECT id, email, raw_user_meta_data->>'role' AS meta_role
FROM auth.users
WHERE email IN ('<test-a-email>', '<test-b-email>');
```

Expected results:
- Test A: `role = customer`, no vendor row
- Test B: `role = vendor`, vendor row with `status = pending`
- Both: `meta_role` matches `role` in profiles

---

## Diagnostic Guide — If a Test Fails

| Symptom | Root Cause | Fix |
|---|---|---|
| No email received | Supabase SMTP or Resend DNS not configured | Check `docs/auth-configuration.md` → Email Provider |
| "Redirect URL not allowed" | URL not in Supabase whitelist | Add URL to Auth → URL Configuration → Redirect URLs |
| "database error saving new user" | `handle_new_user` trigger failure | Check Supabase Logs; ensure migration 017 is applied |
| "database error querying schema" | Missing GRANT statements | Apply migration 009 |
| Vendor lands on `/dashboard` | Profile trigger failed + metadata not set | Check trigger; re-sign in to refresh session |
| Vendor apply redirects to `/vendor/apply` loop | Vendor record already exists (duplicate) | Check vendors table for existing record |
| Approval email not sent | Resend API key or from-address not configured | Check `RESEND_API_KEY` and `RESEND_FROM_EMAIL` env vars |

---

## Sign-Off Gate

All four tests must pass before inviting external vendors or customers.

| Test | Result | Date | Signed by |
|---|---|---|---|
| A — Customer signup | | | |
| B — Vendor signup | | | |
| C — Customer-to-vendor conversion | | | |
| D — Admin visibility | | | |

**Authorised to begin external beta: YES / NO**

**Signed:** `_______________________`  
**Date:** `_______________________`
