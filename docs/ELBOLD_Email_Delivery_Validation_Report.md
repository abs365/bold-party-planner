# ELBOLD Email Delivery Validation Report
**Version:** 1.0 | **Date:** 2026-06-09
**Sprint:** Email Delivery Validation
**DNS Resolver:** Google DNS (8.8.8.8) + Cloudflare DNS (1.1.1.1) — cross-verified
**Platform:** https://www.elbold.com

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✓ CONFIRMED | Verified by DNS query or API call in this session |
| ⚠ PENDING | Requires user to inspect Gmail headers and provide results |
| ✗ FAIL | Confirmed not present or not configured |

---

## Part 1: DNS Validation — CONFIRMED

All DNS queries executed 2026-06-09 against both 8.8.8.8 (Google) and 1.1.1.1 (Cloudflare). Results identical on both resolvers.

### 1.1 SPF Record — ✓ CONFIRMED PASS

**Query:** `nslookup -type=TXT elbold.com`

**Live record:**
```
elbold.com text = "v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all"
```

**Assessment:**

| Component | Present | Purpose |
|-----------|---------|---------|
| `include:spf.protection.outlook.com` | YES | Authorises Microsoft 365 as a sender |
| `include:amazonses.com` | YES | Authorises Amazon SES (Resend infrastructure) as a sender |
| `~all` (softfail) | YES | Unknown senders flagged but not rejected |

**This record satisfies the required unified SPF.** Note: since the previous sprint's DNS audit (`docs/Email_Infrastructure_Readiness_Report.md`), the SPF record has been **updated** — it previously contained only `include:spf.protection.outlook.com ~all`. The `include:amazonses.com` component has been added since then. Soft-launch condition C1 is now COMPLETE.

**SPF alignment for DMARC:** When M365 sends email from `support@elbold.com` or `legal@elbold.com`, the MAIL FROM domain (via Outlook's MTA) aligns with `elbold.com` through `spf.protection.outlook.com`. When Resend sends from `noreply@elbold.com`, it aligns through `amazonses.com`. Both paths are covered.

---

### 1.2 DKIM (Resend) — ✓ CONFIRMED PASS

**Query:** `nslookup -type=TXT resend._domainkey.elbold.com`

**Live record:**
```
resend._domainkey.elbold.com text =
  "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6nC6y00NWYpOttj+wvZ1CZamFhoe3
   aVa9OphMPRYehzeyszr9MvviwuYBRdE7JHHOU67ktOAyk+awWMOcQDko2G1SC6aQZGI56QuoNv
   JEehEBlDq7Ko+btQmie2uw7aRsnDzpN7A4tQWuBxek9HPy95Qjh7t0+pDupc9YuwIDAQAB"
```

**Assessment:** RSA-1024 public key present. Selector `resend`, domain `elbold.com`. Identical result on both DNS resolvers — fully propagated globally. When Resend signs outbound email with `DKIM-Signature: s=resend; d=elbold.com`, receiving servers will find this record and verify the signature successfully.

---

### 1.3 DKIM (M365) — ✗ NOT CONFIGURED

**Queries:**
```
selector1._domainkey.elbold.com → NXDOMAIN
selector2._domainkey.elbold.com → NXDOMAIN
```

**Assessment:** Microsoft 365 DKIM signing is not enabled for `elbold.com`. When M365 sends email from `support@elbold.com` or `legal@elbold.com`, the email will:
- Pass SPF (M365 MTA is in SPF `include:spf.protection.outlook.com`)
- FAIL DKIM (no DKIM signature from elbold.com)
- DMARC result: PASS via SPF only (if SPF alignment holds)

**Impact:** Email from M365 mailboxes will deliver. However, delivery relies entirely on SPF alignment — there is no DKIM backup. If SPF check fails for any reason (forwarding, SRS issues), M365 emails will fail DMARC and be quarantined.

**Required action:** In Microsoft 365 Admin Centre → Settings → Domains → elbold.com → Enable DKIM. This generates selector1 and selector2 CNAME records to add to Cloudflare DNS.

---

### 1.4 DMARC — ✓ CONFIRMED PASS

**Query:** `nslookup -type=TXT _dmarc.elbold.com`

**Live record:**
```
_dmarc.elbold.com text = "v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com"
```

**Assessment:**
- Policy: `p=quarantine` — unauthenticated email goes to spam, not rejected
- Reporting: `rua=mailto:admin@elbold.com` — aggregate XML reports delivered daily
- Alignment: relaxed (default) for both SPF and DKIM

**DMARC pass logic:**
- M365 email (support@, legal@): DMARC PASS via SPF (no DKIM from M365)
- Resend email (noreply@): DMARC PASS via DKIM (if Resend is verified and signing)
- Spoofed email: DMARC FAIL → quarantine

---

### 1.5 MX Record (Inbound) — ✓ CONFIRMED PASS

**Query:** `nslookup -type=MX elbold.com`

**Live record:**
```
elbold.com MX preference = 0, mail exchanger = elbold-com.mail.protection.outlook.com
```

**Assessment:** Microsoft 365 Exchange Online Protection is the sole mail receiver for elbold.com. All inbound email to @elbold.com is processed by M365. Active mailboxes confirmed: support@, legal@, urgent@, disputes@.

---

### 1.6 Bounce CNAME — ✗ NOT CONFIGURED

**Query:** `nslookup -type=CNAME bounces.elbold.com`

**Result:** NXDOMAIN

**Assessment:** Bounce handling is not configured. Email hard bounces (invalid addresses) are not routed to the elbold.com domain. The `Return-Path:` header on Resend emails points to Resend's default bounce domain, not `bounces.elbold.com`. This means:
- Hard bounce events are not tracked under the elbold.com domain in Resend
- SPF alignment for the MAIL FROM envelope address does not match elbold.com
- This is a DMARC alignment gap (SPF checks the MAIL FROM, not the From:)

**Required action:** Retrieve bounce CNAME from Resend Dashboard → Domains → elbold.com → DNS Settings. Add to Cloudflare: `bounces.elbold.com CNAME → [value from Resend]` (DNS only, not proxied).

---

### DNS Summary

| Record | Type | Status | Evidence |
|--------|------|--------|---------|
| `elbold.com` SPF | TXT | ✓ PASS | `v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all` |
| `resend._domainkey.elbold.com` | TXT | ✓ PASS | RSA public key present, globally propagated |
| `selector1._domainkey.elbold.com` | CNAME | ✗ MISSING | NXDOMAIN |
| `selector2._domainkey.elbold.com` | CNAME | ✗ MISSING | NXDOMAIN |
| `_dmarc.elbold.com` | TXT | ✓ PASS | `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` |
| `elbold.com` MX | MX | ✓ PASS | `elbold-com.mail.protection.outlook.com` |
| `bounces.elbold.com` | CNAME | ✗ MISSING | NXDOMAIN |

---

## Part 2: Test 1 — Microsoft 365 Support Mailbox

**Sender:** support@elbold.com
**Recipient:** blue2gtv@gmail.com
**Subject:** ELBOLD Support Test

### Trigger Status: ⚠ PENDING USER ACTION

This test requires you to manually send an email from the M365 support mailbox.

**Steps to complete Test 1:**

1. Go to [outlook.office.com](https://outlook.office.com) and sign in as `support@elbold.com`
2. Compose a new email to `blue2gtv@gmail.com`
3. Subject: `ELBOLD Support Test`
4. Body: any text (e.g. "This is a delivery test for ELBOLD email infrastructure.")
5. Send
6. Open `blue2gtv@gmail.com` in a browser
7. Find the received email
8. Click the three-dot menu (⋮) next to "Reply" → **Show original**
9. In the raw headers, find the `Authentication-Results:` line — it will contain `spf=`, `dkim=`, `dmarc=`
10. Copy the entire `Authentication-Results:` block and the `Received:` timestamp line
11. Note: was the email in inbox or spam?

**Expected Authentication-Results (DNS-predicted):**
```
spf=pass   (elbold.com: domain of support@elbold.com designates [M365 IP] as permitted sender)
dkim=fail  (No selector1/selector2 DKIM records configured in DNS)
dmarc=pass (policy=quarantine) — passes via SPF alignment
```

| Field | Value |
|-------|-------|
| Delivered | ⚠ PENDING |
| Spam Folder | ⚠ PENDING |
| Delivery Timestamp | ⚠ PENDING |
| SPF Result | ⚠ PENDING |
| DKIM Result | ⚠ PENDING (PREDICTED: fail — M365 DKIM not configured) |
| DMARC Result | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

---

## Part 3: Test 2 — Microsoft 365 Legal Mailbox

**Sender:** legal@elbold.com
**Recipient:** blue2gtv@gmail.com
**Subject:** ELBOLD Legal Test

### Trigger Status: ⚠ PENDING USER ACTION

**Steps to complete Test 2:**

1. Go to [outlook.office.com](https://outlook.office.com) and sign in as `legal@elbold.com`
2. Compose a new email to `blue2gtv@gmail.com`
3. Subject: `ELBOLD Legal Test`
4. Body: any text
5. Send
6. Repeat steps 6–11 from Test 1 above

**Expected Authentication-Results (DNS-predicted):**
```
spf=pass
dkim=fail  (same — no M365 DKIM CNAME records)
dmarc=pass (via SPF)
```

| Field | Value |
|-------|-------|
| Delivered | ⚠ PENDING |
| Spam Folder | ⚠ PENDING |
| Delivery Timestamp | ⚠ PENDING |
| SPF Result | ⚠ PENDING |
| DKIM Result | ⚠ PENDING (PREDICTED: fail) |
| DMARC Result | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

---

## Part 4: Test 3 — Platform Transactional Email (Resend / noreply@elbold.com)

**Sender:** noreply@elbold.com (via Resend / Amazon SES)
**Recipient:** blue2gtv@gmail.com
**Trigger:** Password reset request

### Trigger Status: EXECUTED

A password reset request was sent to the Supabase Auth recovery endpoint at **2026-06-09** during this session:

```
POST https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/recover
Body: {"email":"blue2gtv@gmail.com","gotrue_meta_security":{}}
Response: {} HTTP 200
Time: 1.795s
```

Supabase returns `{}` for all recovery requests regardless of whether the account exists (prevents email enumeration). If a Supabase account exists for `blue2gtv@gmail.com`, an email was dispatched.

**⚠ Important note on FROM address:**

Supabase Auth's password reset email can originate from:
- **Supabase default SMTP**: FROM = `noreply@mail.supabase.io` — this would NOT be from `noreply@elbold.com`
- **Custom SMTP (Resend configured in Supabase Dashboard)**: FROM = `noreply@elbold.com` — satisfies Test 3

To confirm which: check the FROM address of the email you receive.

**If the email comes from `noreply@mail.supabase.io`:**
The platform's Resend transactional emails (noreply@elbold.com) have not been directly tested. To trigger a proper Test 3:
- Option A: Submit a vendor application from the platform (sends `sendVendorWelcomeEmail` via Resend to applicant)
- Option B: Have an admin approve a pending vendor (triggers approval email via Resend)
- Option C: Log in to Resend dashboard → Domains → elbold.com → Send test email

**Steps to complete Test 3:**
1. Open `blue2gtv@gmail.com`
2. Find the email triggered during this session
3. Note the FROM address
4. If FROM = `noreply@elbold.com`: proceed to headers (step 5)
5. Click the three-dot menu (⋮) → **Show original**
6. Find and copy the `Authentication-Results:` block
7. Note: was the email in inbox or spam?

**Expected Authentication-Results if sent via Resend (DNS-predicted):**
```
spf=pass   (elbold.com designated via amazonses.com include)
dkim=pass  (resend._domainkey.elbold.com — key confirmed present in DNS)
dmarc=pass (policy=quarantine) — passes via both SPF and DKIM
```

| Field | Value |
|-------|-------|
| Trigger API Call | EXECUTED — HTTP 200 at 2026-06-09 |
| FROM Address | ⚠ PENDING (check Gmail) |
| Delivered | ⚠ PENDING |
| Spam Folder | ⚠ PENDING |
| Delivery Timestamp | ⚠ PENDING |
| SPF Result | ⚠ PENDING |
| DKIM Result | ⚠ PENDING (PREDICTED: pass if sent via Resend) |
| DMARC Result | ⚠ PENDING |
| Screenshot | ⚠ PENDING |

---

## Part 5: Bounce Handling Validation

### Bounce CNAME status: ✗ NOT CONFIGURED

`bounces.elbold.com` is NXDOMAIN on both Google DNS and Cloudflare DNS.

**Consequence for email delivery:**

Hard bounces (emails to non-existent addresses) are routed to Resend's internal bounce handler, not to an elbold.com-branded bounce domain. The practical effect:
- Email still delivers to valid addresses
- Bounce tracking in Resend dashboard is operational (Resend's own bounce management)
- DMARC SPF alignment for MAIL FROM envelope is NOT aligned to elbold.com (this is separate from the From: header SPF)

**Action required:** Retrieve CNAME target from Resend Dashboard → Domains → elbold.com → DNS Settings and add to Cloudflare.

---

## Part 6: Test Summary Table

| Test | Sender | Recipient | Delivered | Spam | SPF | DKIM | DMARC | Verdict |
|------|--------|-----------|-----------|------|-----|------|-------|---------|
| 1 — M365 Support | support@elbold.com | blue2gtv@gmail.com | ⚠ PENDING | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |
| 2 — M365 Legal | legal@elbold.com | blue2gtv@gmail.com | ⚠ PENDING | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |
| 3 — Platform Email | noreply@elbold.com | blue2gtv@gmail.com | ⚠ PENDING | ⚠ | ⚠ | ⚠ | ⚠ | ⚠ PENDING |

---

## Part 7: Predicted Verdicts (DNS-based)

Based on DNS records confirmed in this session, the following verdicts are predicted before live test results are received:

### Microsoft 365 Email (support@, legal@)

**Predicted: PASS WITH GAP**

M365 email will deliver to inbox because:
- SPF includes `spf.protection.outlook.com` ✓
- DMARC passes via SPF alignment ✓
- Email goes to inbox (not spam) when SPF passes under `p=quarantine`

GAP: DKIM not configured for M365 (selector1/selector2 missing). Email will show `dkim=none` or `dkim=fail` in headers. Deliverability depends entirely on SPF. Risk: email forwarding scenarios break SPF → DMARC fails → quarantine.

### Resend / Platform Transactional Email (noreply@)

**Predicted: PASS**

Resend email will deliver and pass all authentication checks because:
- SPF includes `amazonses.com` (Resend's sending infrastructure) ✓
- DKIM public key present at `resend._domainkey.elbold.com` ✓
- DMARC passes via both SPF and DKIM (dual alignment) ✓

Condition: Resend domain must be "Verified" in Resend Dashboard. This cannot be confirmed from this environment.

---

## Part 8: Actions Required to Complete This Report

**You need to do the following. All three tests require Gmail access and Outlook access.**

### 8.1 Complete Test 3 NOW (email already triggered)

1. Open Gmail (blue2gtv@gmail.com)
2. Find the password reset email (triggered during this session — check inbox AND spam)
3. Note the FROM address:
   - If `noreply@elbold.com` → Test 3 is valid, continue to step 4
   - If `noreply@mail.supabase.io` → Test 3 requires a different trigger (see Part 4 above)
4. Click three dots → **Show original** (or **More → Show original**)
5. Find `Authentication-Results:` — copy the spf=, dkim=, dmarc= values
6. Note the delivery timestamp from `Received:` header

### 8.2 Complete Tests 1 and 2 (manual M365 send required)

For each of support@elbold.com and legal@elbold.com:
1. Sign in at [outlook.office.com](https://outlook.office.com)
2. Send email to `blue2gtv@gmail.com` with subject as specified
3. In Gmail: open the received email → three dots → **Show original**
4. Copy the `Authentication-Results:` block
5. Note whether email was in inbox or spam folder

### 8.3 Provide results

Share the Authentication-Results headers from all three emails. Format:
```
Authentication-Results: mx.google.com;
       dkim=pass/fail header.i=@elbold.com header.s=resend
       spf=pass (google.com: domain of ... )
       dmarc=pass (policy=quarantine)
```

Once you provide these, this report will be updated with confirmed verdicts.

---

## Part 9: Infrastructure Findings Summary (Confirmed)

| Finding | Status | Action Required |
|---------|--------|----------------|
| SPF record — M365 + Resend unified | ✓ COMPLETE | None — C1 condition from Operational Excellence Sprint is NOW MET |
| Resend DKIM public key | ✓ PRESENT | Confirm "Verified" status in Resend Dashboard |
| DMARC policy | ✓ ACTIVE | None |
| M365 MX record | ✓ ACTIVE | None |
| M365 DKIM (selector1/selector2) | ✗ MISSING | Enable DKIM in M365 Admin Centre → add 2 CNAMEs to Cloudflare |
| Bounce CNAME (`bounces.elbold.com`) | ✗ MISSING | Get target from Resend Dashboard → add CNAME to Cloudflare |

---

## Final Verdicts (current state — pending live test confirmation)

| System | Current Verdict | Upgrades to PASS when |
|--------|----------------|----------------------|
| Microsoft 365 Email | PREDICTED PASS (DKIM gap) | M365 DKIM enabled (selector1/selector2 configured) |
| Resend / Platform Email | PREDICTED PASS | Live test headers confirm spf=pass, dkim=pass, dmarc=pass |
| Bounce Handling | FAIL | `bounces.elbold.com` CNAME added to DNS |
| Overall Email Infrastructure | **GO WITH CONDITIONS** | Tests 1+2+3 headers confirmed; M365 DKIM enabled; bounce CNAME added |

---

*This report will be updated to CONFIRMED verdicts once you provide the Gmail header evidence from Tests 1, 2, and 3.*
