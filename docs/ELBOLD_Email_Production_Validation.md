# ELBOLD Email Production Validation Report
**Version:** 1.0 | **Date:** 2026-06-10 | **Sprint:** Final Email Production Validation  
**Recipient (all tests):** blue2gtv@gmail.com  
**Platform:** https://www.elbold.com  
**Standard:** PASS = delivered to inbox + Gmail authentication confirms spf=pass + dkim=pass + dmarc=pass

---

## Executive Summary

| # | Email Type | Trigger Method | Trigger Status | API Response | Gmail Delivery | Spam Check | SPF | DKIM | DMARC | Verdict |
|---|-----------|---------------|---------------|-------------|---------------|-----------|-----|------|-------|---------|
| T1 | Vendor Application Confirmation | Resend API | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T2 | Customer Registration Confirmation | Supabase Auth `/resend` | ✓ TRIGGERED 2026-06-10T05:00:00Z | HTTP 200 `{}` | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T3 | Password Reset | Supabase Auth `/recover` | ✓ TRIGGERED 2026-06-10T05:00:15Z | HTTP 200 `{}` | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T4 | Booking Confirmation | Resend API | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T5 | Refund Confirmation | Resend API | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |

**Overall Verdict:** ⚠ PENDING — 2 of 5 triggers confirmed; Resend API key required for T1/T4/T5; Gmail header evidence required for all 5.

---

## Prerequisites: DNS and Infrastructure State (confirmed 2026-06-10)

| Record | Status | Evidence |
|--------|--------|---------|
| SPF on `elbold.com` | ✓ PASS | `v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all` |
| DKIM (Resend) `resend._domainkey.elbold.com` | ✓ PASS | RSA-1024 key present, globally propagated |
| DKIM (M365) `selector1/selector2` | ✗ MISSING | NXDOMAIN — M365 DKIM not enabled |
| DMARC `_dmarc.elbold.com` | ✓ PASS | `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` |
| MX `elbold.com` | ✓ PASS | `elbold-com.mail.protection.outlook.com` |
| Bounce CNAME `bounces.elbold.com` | ✗ MISSING | NXDOMAIN — not configured |
| `RESEND_API_KEY` in Vercel Production | ✓ SET | Encrypted (confirmed via `vercel env ls`) |
| Supabase Auth | ✓ ACTIVE | Email auth enabled, auto-confirm OFF |
| Production platform | ✓ LIVE | https://www.elbold.com serving latest deploy |

**Predicted authentication results when Resend sends (DNS-confirmed):**
- SPF: PASS — `include:amazonses.com` covers Resend's Amazon SES infrastructure
- DKIM: PASS — `resend._domainkey.elbold.com` key present
- DMARC: PASS — dual alignment (SPF + DKIM)

---

## Test 1: Vendor Application Confirmation

**Email function:** `sendVendorApplicationReceived(to, name, businessName)`  
**Trigger:** vendor submits application → `POST /api/vendor/apply`  
**Sender:** `ELBOLD <noreply@elbold.com>` (via Resend / Amazon SES)  
**Recipient:** blue2gtv@gmail.com  
**Subject:** `Your application has been received | ELBOLD Events`

### Trigger Evidence

| Field | Value |
|-------|-------|
| Timestamp | ⚠ PENDING |
| Trigger method | Resend API (production key) |
| API call | `resend.emails.send({ from: "ELBOLD <noreply@elbold.com>", to: "blue2gtv@gmail.com", ... })` |
| Resend API response | ⚠ PENDING |
| Resend email ID | ⚠ PENDING |

### Gmail Evidence

| Field | Value |
|-------|-------|
| Delivered to inbox | ⚠ PENDING |
| Spam folder | ⚠ PENDING |
| Delivery timestamp | ⚠ PENDING |
| FROM address | ⚠ PENDING (expected: `noreply@elbold.com`) |
| SPF result | ⚠ PENDING (predicted: `spf=pass`) |
| DKIM result | ⚠ PENDING (predicted: `dkim=pass header.s=resend`) |
| DMARC result | ⚠ PENDING (predicted: `dmarc=pass`) |
| Screenshot | ⚠ PENDING |

### Authentication Results Block (paste from Gmail)
```
Authentication-Results: mx.google.com;
       dkim=  ...
       spf=   ...
       dmarc= ...
```
⚠ PENDING — run `RESEND_API_KEY=<key> node scripts/email-production-validation.mjs`, then check Gmail.

**Verdict:** ⚠ PENDING

---

## Test 2: Customer Registration Confirmation

**Email system:** Supabase Auth (confirmation email on signup/resend)  
**Trigger:** `POST /auth/v1/resend` with `{"type":"signup","email":"blue2gtv@gmail.com"}`  
**Sender:** Depends on Supabase SMTP config (default: `noreply@mail.supabase.io` OR custom: `noreply@elbold.com`)  
**Recipient:** blue2gtv@gmail.com  
**Subject:** `Confirm Your Email` (Supabase default subject)

### Trigger Evidence

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:00:00Z |
| Trigger method | `POST https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/resend` |
| Request body | `{"type":"signup","email":"blue2gtv@gmail.com"}` |
| API response | `{}` HTTP 200 |
| Response time | 0.354s |

### Gmail Evidence

| Field | Value |
|-------|-------|
| Delivered to inbox | ⚠ PENDING — check Gmail |
| Spam folder | ⚠ PENDING |
| Delivery timestamp | ⚠ PENDING |
| FROM address | ⚠ PENDING — if `noreply@mail.supabase.io`: Supabase default SMTP. If `noreply@elbold.com`: custom Resend SMTP configured in Supabase. |
| SPF result | ⚠ PENDING |
| DKIM result | ⚠ PENDING |
| DMARC result | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

### Authentication Results Block (paste from Gmail)
```
Authentication-Results: mx.google.com;
       dkim=  ...
       spf=   ...
       dmarc= ...
```
⚠ PENDING — check Gmail for email triggered at 05:00:00Z.

**Note on PASS/FAIL:** If FROM is `noreply@mail.supabase.io`, this email does not originate from elbold.com infrastructure and authentication results will show supabase.io domain. This would mean Supabase custom SMTP is not configured, and this test would need to be re-triggered via the Resend path (custom SMTP setup required in Supabase Dashboard → Auth → SMTP Settings).

**Verdict:** ⚠ PENDING

---

## Test 3: Password Reset

**Email system:** Supabase Auth (recovery email)  
**Trigger:** `POST /auth/v1/recover` with `{"email":"blue2gtv@gmail.com","gotrue_meta_security":{}}`  
**Sender:** Depends on Supabase SMTP config (same as T2)  
**Recipient:** blue2gtv@gmail.com  
**Subject:** `Reset Your Password` (Supabase default)

### Trigger Evidence

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:00:15Z |
| Trigger method | `POST https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/recover` |
| Request body | `{"email":"blue2gtv@gmail.com","gotrue_meta_security":{}}` |
| API response | `{}` HTTP 200 |
| Response time | 1.338s |
| Prior trigger | Also triggered 2026-06-09 (previous sprint, HTTP 200) |

### Gmail Evidence

| Field | Value |
|-------|-------|
| Delivered to inbox | ⚠ PENDING — check Gmail (two triggers: 2026-06-09 + 2026-06-10) |
| Spam folder | ⚠ PENDING |
| Delivery timestamp | ⚠ PENDING |
| FROM address | ⚠ PENDING |
| SPF result | ⚠ PENDING |
| DKIM result | ⚠ PENDING |
| DMARC result | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

### Authentication Results Block (paste from Gmail)
```
Authentication-Results: mx.google.com;
       dkim=  ...
       spf=   ...
       dmarc= ...
```
⚠ PENDING — check Gmail for email triggered at 05:00:15Z on 2026-06-10. There should be 2 password reset emails (one from 2026-06-09, one from today).

**Note on PASS/FAIL:** Same FROM-address caveat as T2. If FROM is `noreply@elbold.com`, this tests the Resend SMTP path fully.

**Verdict:** ⚠ PENDING

---

## Test 4: Booking Confirmation

**Email function:** `sendPaymentReceived(to, name, amount, eventTitle, type, bookingId)`  
**Trigger:** customer pays deposit → Stripe webhook → `payment_intent.succeeded`  
**Sender:** `ELBOLD <noreply@elbold.com>` (via Resend / Amazon SES)  
**Recipient:** blue2gtv@gmail.com  
**Subject:** `Payment received: Deposit Payment for [event title]`

**Test data used:**
- Booking ID: `2e61b3ce-813e-421d-8211-58043114b421` (status: pending_payment, £1.00)
- Event: RevVal2 Test Birthday Party (Chelmsford, 8 July 2026)
- Vendor: REV TEST Photography

### Trigger Evidence

| Field | Value |
|-------|-------|
| Timestamp | ⚠ PENDING |
| Trigger method | Resend API (production key) |
| API call | `resend.emails.send({ from: "ELBOLD <noreply@elbold.com>", to: "blue2gtv@gmail.com", ... })` |
| Resend API response | ⚠ PENDING |
| Resend email ID | ⚠ PENDING |

### Gmail Evidence

| Field | Value |
|-------|-------|
| Delivered to inbox | ⚠ PENDING |
| Spam folder | ⚠ PENDING |
| Delivery timestamp | ⚠ PENDING |
| FROM address | ⚠ PENDING (expected: `noreply@elbold.com`) |
| SPF result | ⚠ PENDING (predicted: `spf=pass`) |
| DKIM result | ⚠ PENDING (predicted: `dkim=pass header.s=resend`) |
| DMARC result | ⚠ PENDING (predicted: `dmarc=pass`) |
| Screenshot | ⚠ PENDING |

### Authentication Results Block (paste from Gmail)
```
Authentication-Results: mx.google.com;
       dkim=  ...
       spf=   ...
       dmarc= ...
```
⚠ PENDING — run `RESEND_API_KEY=<key> node scripts/email-production-validation.mjs`, then check Gmail.

**Verdict:** ⚠ PENDING

---

## Test 5: Refund Confirmation

**Email function:** `sendRefundProcessed(to, name, amount, eventTitle)`  
**Trigger:** booking cancelled with refund issued → `issueRefundForCancellation()`  
**Sender:** `ELBOLD <noreply@elbold.com>` (via Resend / Amazon SES)  
**Recipient:** blue2gtv@gmail.com  
**Subject:** `Refund processed: [event title]`

**Test data used:**
- Booking ID: `2e61b3ce-813e-421d-8211-58043114b421` (£1.00 — same as T4)
- Refund amount: £1.00 (full deposit)

### Trigger Evidence

| Field | Value |
|-------|-------|
| Timestamp | ⚠ PENDING |
| Trigger method | Resend API (production key) |
| API call | `resend.emails.send({ from: "ELBOLD <noreply@elbold.com>", to: "blue2gtv@gmail.com", ... })` |
| Resend API response | ⚠ PENDING |
| Resend email ID | ⚠ PENDING |

### Gmail Evidence

| Field | Value |
|-------|-------|
| Delivered to inbox | ⚠ PENDING |
| Spam folder | ⚠ PENDING |
| Delivery timestamp | ⚠ PENDING |
| FROM address | ⚠ PENDING (expected: `noreply@elbold.com`) |
| SPF result | ⚠ PENDING (predicted: `spf=pass`) |
| DKIM result | ⚠ PENDING (predicted: `dkim=pass header.s=resend`) |
| DMARC result | ⚠ PENDING (predicted: `dmarc=pass`) |
| Screenshot | ⚠ PENDING |

### Authentication Results Block (paste from Gmail)
```
Authentication-Results: mx.google.com;
       dkim=  ...
       spf=   ...
       dmarc= ...
```
⚠ PENDING — run `RESEND_API_KEY=<key> node scripts/email-production-validation.mjs`, then check Gmail.

**Verdict:** ⚠ PENDING

---

## Completing This Validation

### Step 1: Check Gmail now for T2 and T3 (already triggered)

Open Gmail at blue2gtv@gmail.com. Look for:
- **T2** — subject line similar to "Confirm your email" from Supabase (triggered 05:00:00Z today)
- **T3** — subject line similar to "Reset your password" from Supabase (triggered 05:00:15Z today + one from 2026-06-09)

For each: open the email → click three dots (⋮) → **Show original** → copy the `Authentication-Results:` block.

### Step 2: Run the Resend validation script for T1, T4, T5

Retrieve the Resend API key from [Resend Dashboard → API Keys](https://resend.com/api-keys), then:

```bash
cd C:\Users\Admin\Workspace\projects\bold-party-planner
RESEND_API_KEY=re_xxxxxxxxxxxx node scripts/email-production-validation.mjs
```

This sends test emails to blue2gtv@gmail.com for T1, T3 (Resend path), T4, T5.  
Results are written to `scripts/email-validation-results.json`.

### Step 3: Check Gmail for T1, T4, T5

Look for emails with subjects:
- T1: `[VALIDATION TEST] Your application has been received | ELBOLD Events`
- T4: `[VALIDATION TEST] Payment confirmed: Deposit Payment for Birthday Party | ELBOLD Events`
- T5: `[VALIDATION TEST] Refund processed: RevVal2 Test Birthday Party | ELBOLD Events`

For each: open → Show original → copy `Authentication-Results:` block.

### Step 4: Fill in the evidence tables above

Update each test's Gmail Evidence section with the actual results, then update the final verdicts below.

---

## Final Verdict Table (update after completing steps above)

| Test | Email Type | Trigger | Delivery | Spam | Auth | Verdict |
|------|-----------|---------|----------|------|------|---------|
| T1 | Vendor Application Confirmation | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T2 | Customer Registration Confirmation | ✓ Triggered | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T3 | Password Reset | ✓ Triggered | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T4 | Booking Confirmation | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |
| T5 | Refund Confirmation | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING | ⚠ PENDING |

**PASS criteria per test:**  
- Email delivered to inbox (not spam)
- FROM address matches expected (`noreply@elbold.com` for T1/T4/T5; any for T2/T3)
- `spf=pass` confirmed in Gmail Authentication-Results
- `dkim=pass` confirmed in Gmail Authentication-Results
- `dmarc=pass` confirmed in Gmail Authentication-Results

**FAIL criteria per test:**  
- Email missing after 10 minutes
- Email delivered to spam
- Any of spf/dkim/dmarc = fail or none in Authentication-Results

---

## Validation Script Reference

**File:** `scripts/email-production-validation.mjs`  
**Purpose:** Sends test versions of T1, T3 (Resend path), T4, T5 to blue2gtv@gmail.com using the production Resend API key  
**Output:** `scripts/email-validation-results.json` containing timestamps, Resend email IDs, and error details

```bash
# Run with production Resend API key:
RESEND_API_KEY=re_xxxx node scripts/email-production-validation.mjs

# Sample successful output:
# [2026-06-10T05:30:00Z] Triggering T1_VENDOR_APPLICATION: Vendor Application Confirmation
#   SUCCESS: email_id=abc123def456
# [2026-06-10T05:30:02Z] Triggering T2_CUSTOMER_REGISTRATION: Customer Registration Confirmation
#   SUCCESS: email_id=abc123def457
# ...
```

---

## Blocker Summary

| Blocker | Impact | Resolution |
|---------|--------|-----------|
| `RESEND_API_KEY` not accessible via `vercel env pull` (encrypted) | Cannot run T1/T4/T5 | Get key from [Resend Dashboard → API Keys](https://resend.com/api-keys) and run script |
| Gmail headers not accessible programmatically | Cannot auto-verify auth results | Manual inspection: email → Show original → Authentication-Results |
| Supabase SMTP config unknown (default vs custom) | T2/T3 FROM address unclear | Check Gmail FROM address; if `mail.supabase.io`, configure Resend SMTP in Supabase Auth settings |
| Bounce CNAME `bounces.elbold.com` NXDOMAIN | DMARC SPF envelope alignment gap | Add CNAME from Resend Dashboard → Domains → elbold.com → DNS Settings |
| M365 DKIM selector1/selector2 NXDOMAIN | M365 email lacks DKIM signature | Enable in M365 Admin Centre → Settings → Domains → elbold.com → DKIM |

---

*This report was created 2026-06-10. Update the PENDING fields above to convert to PASS/FAIL verdicts.*
