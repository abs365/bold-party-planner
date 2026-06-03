# Vendor Email Confirmation QA

Manual test record for the full vendor signup → email confirmation → dashboard flow.
This test must pass before external vendor invitations are sent.

---

## Supabase Auth Configuration (do this first)

Before running any test, confirm these URLs are set in **Supabase Dashboard → Authentication → URL Configuration**:

| Setting | Required value |
|---|---|
| Site URL | `https://www.elbold.com` |
| Redirect URLs | `http://localhost:3000/api/auth/callback` |
| | `http://localhost:3000/vendor/dashboard` |
| | `http://localhost:3000/dashboard` |
| | `https://www.elbold.com/api/auth/callback` |
| | `https://www.elbold.com/vendor/dashboard` |
| | `https://www.elbold.com/dashboard` |

Add Vercel preview URL once known: `https://<project>.vercel.app/api/auth/callback`

**Why this matters:** The signup form sends `emailRedirectTo: "${origin}/api/auth/callback"`. If this URL is not in the Supabase whitelist, the confirmation email link fails with a redirect URL error and the user cannot confirm their account.

---

## Email Provider Check (Resend)

Confirm in Vercel environment variables:
- `RESEND_API_KEY` is set and valid
- `RESEND_FROM_EMAIL` is a verified domain (check Resend → Domains for SPF/DKIM status)

Supabase sends confirmation emails via its own SMTP by default. If you configured Resend as a custom SMTP provider in Supabase Auth → SMTP Settings, confirm those credentials are live.

---

## Test A — Vendor Signup via /signup

**Flow:** `/signup` → "Join as Vendor" tab → fill form → submit → email → confirm → vendor apply → dashboard

| Step | Expected | Result | Notes |
|---|---|---|---|
| 1. Go to `/signup` | Page renders with role toggle | | |
| 2. Click "Join as Vendor" | Left panel shows vendor copy | | |
| 3. Fill name, email (real inbox), password (8+ chars) | Fields accept input | | |
| 4. Click "Create Vendor Account" | Loading state shown | | |
| 5. "Check Your Email" screen appears | Heading and email address shown | | |
| 6. Open email inbox | Confirmation email received from ELBOLD | | |
| 7. Click confirmation link | Browser opens | | |
| 8. Arrives at `/vendor/apply` | Vendor application form shown | | |
| 9. Fill 3-step vendor apply form | All steps advance correctly | | |
| 10. Click "Submit Application" | Success toast shown | | |
| 11. Redirected to `/vendor/dashboard` | Vendor dashboard loads | | |

**Test account used:** `__________________`
**Date tested:** `__________________`
**Tester:** `__________________`

| Check | Yes / No |
|---|---|
| Confirmation email received | |
| Email arrived within 60 seconds | |
| Confirmation link opened without error | |
| No "Redirect URL not allowed" error | |
| No "database error saving new user" | |
| Vendor profile created in `/admin/vendors` (status: pending) | |
| `profiles` table: role = vendor | |
| `vendors` table: record created | |
| Vendor dashboard shows empty-state onboarding correctly | |

**Overall result:** PASS / FAIL

---

## Test B — Vendor Apply via /vendor/apply (unauthenticated start)

**Flow:** `/vendor/apply` → fill form → unauthenticated submit → redirect to `/signup?role=vendor` → sign up → email → confirm → `/vendor/apply` (draft restored or re-fill) → dashboard

| Step | Expected | Result | Notes |
|---|---|---|---|
| 1. Go to `/vendor/apply` (not logged in) | Application form renders | | |
| 2. Fill all 3 steps | Form advances | | |
| 3. Click "Submit Application" | Saves draft to sessionStorage; redirects to `/signup?role=vendor` | | |
| 4. Signup form shows with "Join as Vendor" active | Role pre-selected | | |
| 5. Complete signup | "Check Your Email" shown | | |
| 6. Click confirmation link (same browser window) | Session created | | |
| 7. Redirected to `/vendor/apply` | Form shown (draft may be auto-restored) | | |
| 8. Submit vendor application | Success | | |
| 9. Redirected to `/vendor/dashboard` | Dashboard loads | | |

**Note on draft:** If the confirmation email link is opened in a new browser tab (not the same window), the sessionStorage draft may not be available. The user will need to fill the vendor form again. This is a known UX limitation. The form is short (3 steps) so this is acceptable for launch.

**Test account used:** `__________________`
**Date tested:** `__________________`
**Tester:** `__________________`

**Overall result:** PASS / FAIL

---

## Test C — Customer Signup

**Flow:** `/signup` → "Book Vendors" tab → fill form → email → confirm → `/dashboard`

| Step | Expected | Result | Notes |
|---|---|---|---|
| 1. Go to `/signup` | Page renders | | |
| 2. "Book Vendors" is default tab | Customer copy shown | | |
| 3. Fill name, email, password | OK | | |
| 4. Click "Create Free Account" | Loading → "Check Your Email" | | |
| 5. Confirmation email received | Yes | | |
| 6. Click link | Session created | | |
| 7. Redirected to `/dashboard` | Customer dashboard loads | | |
| 8. `profiles` table: role = customer | Confirmed in Supabase | | |

**Test account used:** `__________________`
**Date tested:** `__________________`
**Tester:** `__________________`

**Overall result:** PASS / FAIL

---

## Test D — Role Routing After Re-login

After confirming email, the vendor logs out and logs back in:

| Step | Expected | Result |
|---|---|---|
| 1. Log out | Redirected to `/login` | |
| 2. Log in with vendor credentials | | |
| 3. Redirect destination | `/vendor/dashboard` (not `/dashboard`) | |

**Overall result:** PASS / FAIL

---

## Database Verification (Supabase Table Editor)

Run these checks in Supabase Dashboard → Table Editor after Test A:

```sql
-- Confirm profile was created with correct role
SELECT id, email, full_name, role FROM profiles WHERE email = '<test-email>';

-- Confirm vendor record was created
SELECT id, user_id, business_name, category, status FROM vendors
WHERE user_id = (SELECT id FROM profiles WHERE email = '<test-email>');
```

Expected:
- `profiles.role = 'vendor'`
- `vendors.status = 'pending'`
- `vendors.business_name` matches what was entered

---

## Diagnostic Checklist — If Anything Fails

| Symptom | Likely cause | Action |
|---|---|---|
| No email received | Supabase SMTP not configured / Resend DNS not verified | Check Supabase Auth → SMTP; check Resend domain status |
| "Redirect URL not allowed" | URL not in Supabase whitelist | Add URL to Auth → URL Configuration → Redirect URLs |
| "database error saving new user" | handle_new_user trigger failed | Check Supabase → Logs → Database; apply migration 017 if not applied |
| "database error querying schema" | Missing GRANT statements | Apply migration 009 (schema_grants_fix) |
| Confirmation link returns 404 | `/api/auth/callback` route missing or wrong path | Check route exists at `app/api/auth/callback/route.ts` |
| Vendor lands on customer dashboard | profile.role not set, user_metadata.role not set | Check trigger; confirm metadata sent in signup API |
| Vendor dashboard shows "pending" but not loading | Vendor record not created / RLS | Check vendors table; check migration 009 grants |

---

## Sign-Off

| Criteria | Status |
|---|---|
| Customer signup works end-to-end | |
| Vendor signup works end-to-end | |
| Email confirmation link works | |
| Vendor lands on vendor dashboard (not customer) | |
| Customer lands on customer dashboard | |
| `profiles` record created correctly | |
| `vendors` record created correctly | |

**All four criteria must be PASS before inviting external vendors.**

Signed off by: `__________________`
Date: `__________________`
