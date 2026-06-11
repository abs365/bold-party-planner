# ELBOLD Email Production Validation Report
**Version:** 2.0 | **Date:** 2026-06-10  
**Sprint:** Final Email Production Validation  
**Platform:** https://www.elbold.com  
**Recipient (all tests):** blue2gtv@gmail.com  
**Validation method:** Temporary admin-only endpoint deployed to production (commit `06d15d4`), called via authenticated admin session, removed post-validation (commit `91d050a`). No API keys exposed, logged, or committed.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✓ CONFIRMED | Verified programmatically in this session |
| ⚠ PENDING | Requires Gmail inspection to finalise verdict |
| ✗ FAIL | Confirmed failed |

---

## Part 1: DNS Infrastructure (Pre-Condition)

Confirmed on Google DNS (8.8.8.8) and Cloudflare DNS (1.1.1.1):

| Record | Status | Evidence |
|--------|--------|---------|
| SPF `elbold.com` | ✓ PASS | `v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all` |
| DKIM `resend._domainkey.elbold.com` | ✓ PASS | RSA-1024 public key present, globally propagated |
| DKIM M365 `selector1/selector2` | ✗ MISSING | NXDOMAIN — M365 DKIM not enabled |
| DMARC `_dmarc.elbold.com` | ✓ PASS | `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` |
| MX `elbold.com` | ✓ PASS | `elbold-com.mail.protection.outlook.com` |
| Bounce CNAME `bounces.elbold.com` | ✗ MISSING | NXDOMAIN |
| `RESEND_API_KEY` in Vercel Production | ✓ SET | Confirmed via `vercel env ls` (encrypted); API accepted all 4 sends |

**DNS-predicted authentication for Resend emails (noreply@elbold.com):**
- SPF: PASS — `include:amazonses.com` covers Resend's Amazon SES infrastructure
- DKIM: PASS — `resend._domainkey.elbold.com` RSA key confirmed present
- DMARC: PASS — dual alignment via both SPF and DKIM under `p=quarantine`

---

## Part 2: Email Trigger Evidence

### Authentication Method
A temporary route `POST /api/admin/email-validation` was deployed to production. Authentication:
1. Supabase Admin API generated a magic link for `blue2gtv@gmail.com` (service role key, local only)
2. OTP exchanged for an access token via `supabase.auth.verifyOtp()`
3. Endpoint called with `Authorization: Bearer <access_token>`
4. Endpoint verified the token server-side using `supabase.auth.getUser(token)` and confirmed email in `ADMIN_EMAILS`

No secrets left the production Vercel environment. The endpoint called `new Resend(process.env.RESEND_API_KEY)` using the key already in Vercel.

---

## Test 1: Vendor Application Confirmation

**Email function:** `sendVendorApplicationReceived(to, name, businessName)`  
**Triggered by:** New vendor submitting an application (`POST /api/vendor/apply`)  
**Test scenario:** Admin-triggered validation send

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:23:08.183Z |
| Sender | `ELBOLD <noreply@elbold.com>` |
| Recipient | blue2gtv@gmail.com |
| Subject | `[VALIDATION] Your application has been received \| ELBOLD Events` |
| Resend API Response | `{"success":true,"id":"859dada4-4448-498b-89f2-cf28bc976aa9"}` |
| Resend Email ID | `859dada4-4448-498b-89f2-cf28bc976aa9` |
| Delivery Status | ⚠ PENDING — check Gmail |
| Spam Folder | ⚠ PENDING — check Gmail |
| Screenshot | ⚠ PENDING |

### Gmail Authentication Results (paste from Show Original)
```
Authentication-Results: mx.google.com;
       dkim=  ⚠ PENDING (predicted: pass header.s=resend header.d=elbold.com)
       spf=   ⚠ PENDING (predicted: pass)
       dmarc= ⚠ PENDING (predicted: pass policy=quarantine)
```

**Verdict:** ⚠ PENDING — Resend accepted delivery (`success:true`, ID confirmed). Gmail inspection required to confirm inbox vs spam and authentication headers.  
**Predicted verdict:** PASS (DNS confirms SPF/DKIM/DMARC aligned)

---

## Test 2: Customer Registration Confirmation

**Email system:** Supabase Auth (signup confirmation)  
**Triggered by:** `POST /auth/v1/resend` with `{"type":"signup","email":"blue2gtv@gmail.com"}`  
**Sender:** Depends on Supabase SMTP config (default: `noreply@mail.supabase.io` / custom: `noreply@elbold.com`)

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:00:00Z |
| Trigger endpoint | `POST https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/resend` |
| Request body | `{"type":"signup","email":"blue2gtv@gmail.com"}` |
| API Response | `{}` HTTP 200 (0.354s) |
| Resend Email ID | N/A — Supabase Auth sends via its own SMTP pipeline |
| Delivery Status | ⚠ PENDING — check Gmail |
| Spam Folder | ⚠ PENDING |
| FROM Address | ⚠ PENDING — if `noreply@elbold.com`: Resend SMTP configured in Supabase. If `noreply@mail.supabase.io`: default Supabase SMTP. |
| Screenshot | ⚠ PENDING |

### Gmail Authentication Results (paste from Show Original)
```
Authentication-Results: mx.google.com;
       dkim=  ⚠ PENDING
       spf=   ⚠ PENDING
       dmarc= ⚠ PENDING
```

**Verdict:** ⚠ PENDING — Supabase accepted the resend request (HTTP 200). Gmail inspection determines FROM address, delivery location, and auth headers.  
**Note:** If FROM is `noreply@mail.supabase.io`, this confirms Supabase default SMTP is in use (not the Resend custom SMTP). To fix: configure Resend SMTP in Supabase Dashboard → Auth → SMTP Settings.

---

## Test 3: Password Reset

**Email system:** Supabase Auth (password recovery)  
**Triggered by:** `POST /auth/v1/recover` with `{"email":"blue2gtv@gmail.com","gotrue_meta_security":{}}`

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:00:15Z |
| Prior trigger | Also triggered 2026-06-09 (previous sprint) |
| Trigger endpoint | `POST https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/recover` |
| Request body | `{"email":"blue2gtv@gmail.com","gotrue_meta_security":{}}` |
| API Response | `{}` HTTP 200 (1.338s) |
| Resend Email ID | N/A — Supabase Auth pipeline |
| Delivery Status | ⚠ PENDING — check Gmail (expect 2 emails: 2026-06-09 + 2026-06-10) |
| Spam Folder | ⚠ PENDING |
| FROM Address | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

### Gmail Authentication Results (paste from Show Original)
```
Authentication-Results: mx.google.com;
       dkim=  ⚠ PENDING
       spf=   ⚠ PENDING
       dmarc= ⚠ PENDING
```

**Verdict:** ⚠ PENDING — same Supabase SMTP caveat as Test 2.

---

## Test 4: Booking Confirmation

**Email function:** `sendPaymentReceived(to, name, amount, eventTitle, type, bookingId)`  
**Triggered by:** Customer pays deposit → Stripe webhook → `payment_intent.succeeded`  
**Test data:** Booking `2e61b3ce-813e-421d-8211-58043114b421` (REV TEST Photography / RevVal2 Test Birthday Party / £1.00)

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:23:08.318Z |
| Sender | `ELBOLD <noreply@elbold.com>` |
| Recipient | blue2gtv@gmail.com |
| Subject | `[VALIDATION] Payment received: Deposit Payment for RevVal2 Test Birthday Party` |
| Resend API Response | `{"success":true,"id":"f6cac420-b41d-4158-9b05-bc510f77173e"}` |
| Resend Email ID | `f6cac420-b41d-4158-9b05-bc510f77173e` |
| Delivery Status | ⚠ PENDING — check Gmail |
| Spam Folder | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

### Gmail Authentication Results (paste from Show Original)
```
Authentication-Results: mx.google.com;
       dkim=  ⚠ PENDING (predicted: pass header.s=resend header.d=elbold.com)
       spf=   ⚠ PENDING (predicted: pass)
       dmarc= ⚠ PENDING (predicted: pass policy=quarantine)
```

**Verdict:** ⚠ PENDING — Resend accepted delivery (ID confirmed). Gmail inspection required.  
**Predicted verdict:** PASS

---

## Test 4b: Booking Awaiting Payment (Bonus — Quote Accepted Flow)

**Email function:** `sendBookingAwaitingPayment(to, customerName, vendorBusiness, eventTitle, eventDate, depositAmount, bookingId)`  
**Triggered by:** Customer accepts a vendor quote

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:23:08.418Z |
| Sender | `ELBOLD <noreply@elbold.com>` |
| Recipient | blue2gtv@gmail.com |
| Subject | `[VALIDATION] Pay your deposit to confirm your booking \| ELBOLD Events` |
| Resend API Response | `{"success":true,"id":"2c1b353a-6f1e-430a-9d85-5bb20d6eed75"}` |
| Resend Email ID | `2c1b353a-6f1e-430a-9d85-5bb20d6eed75` |
| Delivery Status | ⚠ PENDING |
| Spam Folder | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

---

## Test 5: Refund Confirmation

**Email function:** `sendRefundProcessed(to, name, amount, eventTitle)`  
**Triggered by:** Booking cancelled → `issueRefundForCancellation()` in `/api/bookings/[id]`

| Field | Value |
|-------|-------|
| Timestamp | 2026-06-10T05:23:08.519Z |
| Sender | `ELBOLD <noreply@elbold.com>` |
| Recipient | blue2gtv@gmail.com |
| Subject | `[VALIDATION] Refund processed: RevVal2 Test Birthday Party \| ELBOLD Events` |
| Resend API Response | `{"success":true,"id":"61f75aa5-308a-431e-9dab-bcfb355ac4e3"}` |
| Resend Email ID | `61f75aa5-308a-431e-9dab-bcfb355ac4e3` |
| Delivery Status | ⚠ PENDING — check Gmail |
| Spam Folder | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

### Gmail Authentication Results (paste from Show Original)
```
Authentication-Results: mx.google.com;
       dkim=  ⚠ PENDING (predicted: pass header.s=resend header.d=elbold.com)
       spf=   ⚠ PENDING (predicted: pass)
       dmarc= ⚠ PENDING (predicted: pass policy=quarantine)
```

**Verdict:** ⚠ PENDING — Resend accepted delivery (ID confirmed). Gmail inspection required.  
**Predicted verdict:** PASS

---

## Part 3: Trigger Summary Table

| Test | Email Type | Method | Timestamp | API Response | Resend ID | Verdict |
|------|-----------|--------|-----------|-------------|-----------|---------|
| T1 | Vendor Application Confirmation | Production Resend API | 2026-06-10T05:23:08.183Z | `success:true` | `859dada4-4448-498b-89f2-cf28bc976aa9` | ⚠ PENDING Gmail |
| T2 | Customer Registration Confirmation | Supabase Auth `/resend` | 2026-06-10T05:00:00Z | HTTP 200 `{}` | N/A (Supabase) | ⚠ PENDING Gmail |
| T3 | Password Reset | Supabase Auth `/recover` | 2026-06-10T05:00:15Z | HTTP 200 `{}` | N/A (Supabase) | ⚠ PENDING Gmail |
| T4 | Booking Confirmation | Production Resend API | 2026-06-10T05:23:08.318Z | `success:true` | `f6cac420-b41d-4158-9b05-bc510f77173e` | ⚠ PENDING Gmail |
| T4b | Booking Awaiting Payment | Production Resend API | 2026-06-10T05:23:08.418Z | `success:true` | `2c1b353a-6f1e-430a-9d85-5bb20d6eed75` | ⚠ PENDING Gmail |
| T5 | Refund Confirmation | Production Resend API | 2026-06-10T05:23:08.519Z | `success:true` | `61f75aa5-308a-431e-9dab-bcfb355ac4e3` | ⚠ PENDING Gmail |

**Confirmed:** All 6 triggers accepted by their respective systems. Resend API returned `success:true` with individual email IDs for all 4 Resend-based tests, confirming the production `RESEND_API_KEY` is valid and the `elbold.com` domain is verified in Resend.

---

## Part 4: Completing the Verdicts

**To convert PENDING to PASS/FAIL:**

Open Gmail at `blue2gtv@gmail.com`. You should find all of the following emails (sent between 05:00Z and 05:24Z on 2026-06-10):

| Subject to find | Test |
|----------------|------|
| `Confirm your email` or similar (Supabase) | T2 Customer Registration |
| `Reset your password` or similar (Supabase) | T3 Password Reset |
| `[VALIDATION] Your application has been received` | T1 Vendor Application |
| `[VALIDATION] Payment received: Deposit Payment` | T4 Booking Confirmation |
| `[VALIDATION] Pay your deposit to confirm your booking` | T4b Booking Awaiting Payment |
| `[VALIDATION] Refund processed: RevVal2 Test Birthday Party` | T5 Refund Confirmation |

**For each email:**
1. Open the email → note whether it arrived in **Inbox** or **Spam**
2. Click the three-dot menu (⋮) → **Show original**
3. Find and copy the `Authentication-Results:` block
4. Record the FROM address

**PASS criteria:**
- Email arrived in Inbox (not Spam)
- FROM address = `noreply@elbold.com` (for T1/T4/T4b/T5)
- `spf=pass` in Authentication-Results
- `dkim=pass` in Authentication-Results
- `dmarc=pass` in Authentication-Results

**FAIL criteria:**
- Email missing from both Inbox and Spam after 10 minutes
- Email in Spam
- `spf=fail` or `dkim=fail` or `dmarc=fail`

---

## Part 5: Known Gaps (Non-Blocking)

| Gap | Impact | Fix |
|-----|--------|-----|
| Bounce CNAME `bounces.elbold.com` NXDOMAIN | Resend bounce tracking not aligned to elbold.com domain; DMARC MAIL FROM envelope not aligned | Add CNAME from Resend Dashboard → Domains → elbold.com → DNS Settings |
| M365 DKIM `selector1/selector2` NXDOMAIN | M365-sent emails (support@, legal@) lack DKIM signature; delivery relies on SPF only | Enable in M365 Admin Centre → Settings → Domains → elbold.com → DKIM |
| Supabase SMTP not confirmed | Tests T2/T3 FROM address unknown — may be Supabase default (`mail.supabase.io`) not elbold.com | Configure custom SMTP in Supabase Dashboard → Auth → SMTP Settings (use Resend SMTP credentials) |

---

## Final Verdict (Update After Gmail Inspection)

| Test | Delivered | Spam | SPF | DKIM | DMARC | VERDICT |
|------|-----------|------|-----|------|-------|---------|
| T1 Vendor Application | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |
| T2 Customer Registration | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |
| T3 Password Reset | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |
| T4 Booking Confirmation | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |
| T5 Refund Confirmation | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |

**Overall:** ⚠ PENDING — all emails triggered and accepted by production infrastructure. Final PASS/FAIL requires Gmail header evidence.

**Predicted:** 4 of 5 PASS (T1/T4/T5 via Resend — DNS fully aligned). T2/T3 verdict depends on Supabase SMTP configuration.

---

## Appendix A: Validation Infrastructure

| Item | Detail |
|------|--------|
| Endpoint deployed | `app/api/admin/email-validation/route.ts` (commit `06d15d4`) |
| Endpoint removed | commit `91d050a` |
| Auth mechanism | Supabase Bearer token verified server-side via `supabase.auth.getUser(token)` |
| Admin verified | `blue2gtv@gmail.com` confirmed in `ADMIN_EMAILS` |
| Production key used | `process.env.RESEND_API_KEY` from Vercel — never read, logged, or stored locally |
| Results file | `scripts/email-validation-results.json` |
| Calling script | `scripts/run-email-validation.mjs` |
| Endpoint test run | 2026-06-10T05:23:02.640Z |
| HTTP status | 200 |
| Overall API status | `ALL_TRIGGERED` |

---

*Report created 2026-06-10. Fill in Part 4 Gmail inspection results to finalise PASS/FAIL verdicts.*
