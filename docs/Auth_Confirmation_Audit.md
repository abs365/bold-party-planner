# Authentication and Email Confirmation Audit

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 4

---

## Objective

Ensure every email confirmation link works reliably, and that vendors who complete email confirmation land on a clear, reassuring success page — not a raw dashboard or an error screen.

---

## Confirmation Flow (Expected)

```
Vendor Applies (/vendor/apply)
        |
        v
Vendor receives confirmation email from Supabase Auth
        |
        v
Vendor clicks link in email
        |
        v
GET /api/auth/callback?code=xxx&type=signup
        |
        v
Code exchanged for session (Supabase)
        |
        v
Role resolved → vendor with pending application
        |
        v
Redirect to /confirmed
        |
        v
"Your email has been confirmed successfully.
 Your application is currently under review.
 We will notify you once approved."
```

---

## Confirmed Fix Applied

**File:** `app/api/auth/callback/route.ts`

Previously, a pending vendor who clicked the signup confirmation link was sent directly to `/vendor/dashboard`. There was no message confirming their email was verified or that their application was under review.

**New logic:**

```typescript
if (!vendor) {
  dest = "/vendor/apply";
} else if (vendor.status === "pending" && type === "signup") {
  // Just confirmed email for a pending application: show clear success page
  dest = "/confirmed";
} else {
  dest = "/vendor/dashboard";
}
```

**New page created:** `app/(auth)/confirmed/page.tsx`

- Confirms email verified with green checkmark
- Shows "Application under review" amber status
- Displays 4-stage journey: Email Confirmed → Under Review → Decision → Profile Published
- Links to `/vendor/onboarding` (application status) and `/support`

---

## Failure Path Audit

### Current Failure Path

When code exchange fails (link expired, used on different device, etc.):

```
GET /api/auth/callback?code=xxx
        |
        v
supabase.auth.exchangeCodeForSession fails
        |
        v
Redirect to /login?error=auth_callback_failed
```

The login page shows an `auth_callback_failed` banner (implemented at `app/(auth)/login/page.tsx` lines 110-123):

```
"Confirmation link didn't work"
"This usually happens when the link expires or is opened on a different device.
 If your email is already confirmed, sign in below. Otherwise check your inbox
 for a newer confirmation email, or contact hello@elbold.com."
```

This is acceptable messaging. The vendor is directed to either sign in (if already confirmed) or check inbox for a newer link.

**Assessment:** Failure path is handled. No improvements required.

---

## Supabase Redirect URL Configuration

For the confirmation link to work in production, the following Supabase redirect URL must be registered.

**Required URL in Supabase Auth > URL Configuration > Redirect URLs:**

```
https://www.elbold.com/api/auth/callback
```

**Also add for local development:**
```
http://localhost:3000/api/auth/callback
```

**Risk if not set:** Supabase will reject the callback as an unauthorised redirect, causing every email confirmation to fail with a 403 error before reaching the app.

**Verify in:** Supabase Dashboard > Authentication > URL Configuration

---

## Email Confirmation Settings

| Setting | Recommended Value | Where |
|---|---|---|
| Enable email confirmations | ON | Supabase Auth > Email |
| Confirm email change | ON | Supabase Auth > Email |
| OTP expiry | 86400 (24 hours) | Supabase Auth > Email |
| Confirmation email template | Custom (see below) | Supabase Auth > Email Templates |

### Recommended Custom Email Template

Subject: `Confirm your email for ELBOLD`

Body:
```
Please confirm your email address to complete your ELBOLD registration.

Click the link below to confirm:
{{ .ConfirmationURL }}

This link expires in 24 hours.

If you did not register with ELBOLD, you can safely ignore this email.

ELBOLD | hello@elbold.com
```

---

## Resend Domain Verification Requirements

The confirmation email is sent by Supabase using its built-in email system by default. However, if ELBOLD has configured a custom SMTP with Resend:

1. SPF record on `elbold.com`: `v=spf1 include:_spf.resend.com ~all`
2. DKIM: CNAME records provided by Resend → add to DNS
3. DMARC: TXT on `_dmarc.elbold.com`: `v=DMARC1; p=quarantine; rua=mailto:dmarc@elbold.com; fo=1`

Unverified domains cause emails to land in spam or be silently dropped.

---

## Test Plan

| Test | Expected Result | Pass/Fail |
|---|---|---|
| New vendor signs up → clicks confirmation link within 24h | Lands on /confirmed page with success message | |
| New vendor clicks expired link (>24h old) | Lands on /login with "Confirmation link didn't work" message | |
| New vendor clicks link on different device | Lands on /login with "Confirmation link didn't work" message | |
| Already-confirmed vendor signs in | Routes to /vendor/dashboard or /vendor/onboarding | |
| Admin clicks any confirmation link | Routes to /admin | |
| Customer clicks confirmation link | Routes to /dashboard | |

---

## Success Criteria

- [x] Pending vendors who click confirmation link land on /confirmed page
- [x] Clear message: "Email confirmed, application under review"
- [x] Journey timeline visible showing current stage
- [x] Links to application status (/vendor/onboarding) and support
- [x] Failure path shows helpful message on /login page
- [ ] Supabase redirect URL registered: `https://www.elbold.com/api/auth/callback`
- [ ] Custom email template set in Supabase Dashboard
- [ ] Resend domain verified (SPF/DKIM/DMARC)
- [ ] Manual QA: run all 6 tests in test plan above
