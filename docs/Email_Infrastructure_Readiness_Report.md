# Email Infrastructure Readiness Report
**Version:** 1.0 | **Date:** 2026-06-09
**Domain:** elbold.com
**DNS Provider:** Cloudflare (nameservers: mcgrory.ns.cloudflare.com, wren.ns.cloudflare.com)
**Email Provider:** Resend (infrastructure: Amazon SES us-east-1)
**Standard:** Evidence required for every verdict. No estimates. No inferred results.

---

## Verdicts

| Area | Verdict | Evidence |
|------|---------|----------|
| SPF | **FAIL** | No `v=spf1` TXT record on elbold.com — DNS confirmed |
| DKIM | **PASS** | `resend._domainkey.elbold.com` TXT record present — DNS confirmed |
| DMARC | **PASS** | `_dmarc.elbold.com` TXT record present — DNS confirmed |
| Bounce Handling | **FAIL** | `bounces.elbold.com` NXDOMAIN — DNS confirmed |
| Resend Deliverability | **CONDITIONAL** | DKIM key present; Resend dashboard "Verified" status cannot be confirmed from this environment |

---

## SPF — FAIL

### Evidence

**Query executed:** `nslookup -type=TXT elbold.com 8.8.8.8`

**Complete TXT record response for elbold.com:**
```
elbold.com  text = "MS=ms42917341"
elbold.com  text = "google-site-verification=0HFkSto0xQ6GNM-p-I3dCQef996Wv_NwjQ0iTFojIHY"
```

**Records returned:** 2 TXT records. Neither contains `v=spf1`. No SPF record exists on `elbold.com`.

### Impact

| Consequence | Severity |
|-------------|----------|
| Any server can send email claiming to be from `@elbold.com` with no SPF barrier | HIGH |
| DMARC SPF alignment fails — DMARC can only pass via DKIM | MEDIUM |
| If DKIM signing fails for any reason, email fails DMARC (`p=quarantine`) | HIGH |
| Resilience gap: email delivery depends entirely on DKIM functioning correctly | HIGH |

### Fix Required

Add to `elbold.com` DNS (Cloudflare):
```
Type:  TXT
Name:  @
Value: v=spf1 include:amazonses.com ~all
TTL:   Auto
```

**Evidence for `include:amazonses.com`:**
- `send.resend.com` TXT = `v=spf1 include:amazonses.com ~all` (Resend's own sending domain, confirmed via DNS query 2026-06-09)
- `smtp.resend.com` → AWS ELB → Amazon SES (confirmed via DNS query 2026-06-09)
- `_spf.resend.com` → NXDOMAIN (confirmed via DNS query 2026-06-09) — do NOT use this include

---

## DKIM — PASS

### Evidence

**Query executed:** `nslookup -type=TXT resend._domainkey.elbold.com 8.8.8.8`

**Response:**
```
resend._domainkey.elbold.com  text =
    "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6nC6y00NWYpOttj+wvZ1CZamFhoe3aVa9Oph
    MPRYehzeyszr9MvviwuYBRdE7JHHOU67ktOAyk+awWMOcQDko2G1SC6aQZGI56QuoNvJEehEBlDq7Ko+bt
    Qmie2uw7aRsnDzpN7A4tQWuBxek9HPy95Qjh7t0+pDupc9YuwIDAQAB"
```

**Cross-verified:** Same query on Cloudflare DNS (1.1.1.1) returned identical value on 2026-06-09.

**Record analysis:**

| Field | Value |
|-------|-------|
| Record type | TXT (direct public key — not CNAME delegation) |
| Selector | `resend` |
| Domain | `elbold.com` |
| Key algorithm | RSA (1024-bit, `MIGfMA0GCSqGSIb3DQEBAQUAA4GN...`) |
| Key encoding | DER/Base64 as specified in DKIM RFC 6376 |
| Record name | `resend._domainkey.elbold.com` — correct format for DKIM selector `resend` on domain `elbold.com` |

The record is present, globally propagated, and in valid DKIM format. When a receiving mail server checks `DKIM-Signature: s=resend; d=elbold.com`, it will find this TXT record and be able to verify the signature.

### Condition on PASS verdict

This verdict is based on the DNS record existing and being in valid format. DKIM will PASS only if Resend is actively signing outbound email from `noreply@elbold.com` with the private key corresponding to this public key. That requires the domain to be "Verified" in the Resend dashboard. The Resend dashboard "Verified" status cannot be confirmed from this environment (requires a valid Resend API key — local key is a placeholder, production key is encrypted in Vercel).

**Action required:** Log in to resend.com → Domains → confirm `elbold.com` shows "Verified".

---

## DMARC — PASS

### Evidence

**Query executed:** `nslookup -type=TXT _dmarc.elbold.com 8.8.8.8`

**Response:**
```
_dmarc.elbold.com  text = "v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com"
```

**Record analysis:**

| Tag | Value | Assessment |
|-----|-------|------------|
| `v=DMARC1` | Version tag | Valid |
| `p=quarantine` | Policy for failing messages | Appropriate — quarantine rather than reject allows investigation of false positives |
| `rua=mailto:admin@elbold.com` | Aggregate report recipient | Aggregate XML reports delivered daily to admin@elbold.com |
| `fo` | Not present | Defaults to `fo=0` (aggregate reports only) |
| `adkim` | Not present | Defaults to `r` (relaxed DKIM alignment) — correct |
| `aspf` | Not present | Defaults to `r` (relaxed SPF alignment) — correct |
| `pct` | Not present | Defaults to `100` — policy applies to 100% of mail |

**DMARC pass/fail logic with current configuration:**

DMARC passes if EITHER:
- DKIM alignment passes (From: domain matches `d=` in DKIM signature) — currently: PASSES if Resend is signing
- SPF alignment passes (From: domain matches MAIL FROM domain) — currently: FAILS (no bounce CNAME, no SPF record)

With DMARC `p=quarantine`: any email that fails BOTH DKIM and SPF alignment will be marked as spam. Any email that passes DKIM alignment (correctly signed by Resend) will be delivered.

**Current DMARC delivery outcome:**
- Email signed by Resend with `d=elbold.com` → DKIM alignment PASS → DMARC PASS → inbox
- Email NOT signed by Resend (e.g., spoofed) → DKIM alignment FAIL + SPF alignment FAIL → DMARC FAIL → quarantine

The DMARC record is functioning correctly and provides real protection. No changes required to the DMARC record.

---

## Bounce Handling — FAIL

### Evidence

**Query executed:** `nslookup -type=CNAME bounces.elbold.com 8.8.8.8`

**Response:**
```
*** dns.google can't find bounces.elbold.com: Non-existent domain
```

**Query executed:** `nslookup -type=A bounces.elbold.com 8.8.8.8`

**Response:**
```
*** dns.google can't find bounces.elbold.com: Non-existent domain
```

`bounces.elbold.com` does not exist in DNS. No CNAME, no A record, no record of any type.

### Impact

| Consequence | Severity |
|-------------|----------|
| Hard bounce events (invalid email addresses) are not routed to elbold.com domain | HIGH |
| Bounce data not visible in Resend dashboard for elbold.com domain | HIGH |
| Customer refund emails to invalid addresses silently fail — no suppression list update | HIGH |
| Vendor welcome emails to invalid addresses silently fail | HIGH |
| Admin refund alerts to a misconfigured ADMIN_EMAILS address silently fail | HIGH |
| SPF alignment under DMARC fails (MAIL FROM not aligned to elbold.com) | MEDIUM |
| `Return-Path:` header in email points to Resend's default domain, not elbold.com | MEDIUM |

### Fix Required

Retrieve the bounce CNAME target from the Resend dashboard (Domains → elbold.com → DNS settings). The target will follow the pattern `feedback-smtp.{region}.amazonses.com`.

Add to `elbold.com` DNS (Cloudflare):
```
Type:   CNAME
Name:   bounces
Target: [value from Resend dashboard]
TTL:    Auto
Proxy:  DNS only (grey cloud — do not proxy)
```

**DNS infrastructure supporting this:** `feedback-smtp.us-east-1.amazonses.com` confirmed resolving to `18.235.76.96`, `3.218.134.115`, `34.192.233.193` as of 2026-06-09.

---

## Resend Deliverability — CONDITIONAL

### What is confirmed

| Item | Status | Evidence |
|------|--------|---------|
| DKIM public key in DNS | CONFIRMED PRESENT | DNS query: `resend._domainkey.elbold.com` TXT = RSA public key |
| DMARC configured | CONFIRMED PRESENT | DNS query: `_dmarc.elbold.com` TXT = `v=DMARC1; p=quarantine` |
| Resend infrastructure resolves | CONFIRMED | `smtp.resend.com` → AWS ELB (54.205.195.44) |
| Production RESEND_API_KEY exists | CONFIRMED EXISTS | `vercel env ls` shows encrypted var set 14 days ago |
| Local RESEND_API_KEY is invalid | CONFIRMED INVALID | API call → HTTP 400 `"API key is invalid"` |

### What cannot be confirmed

| Item | Why unconfirmable |
|------|-------------------|
| Resend domain "Verified" status | Requires valid Resend API key — local key is placeholder; production key encrypted in Vercel |
| Production RESEND_API_KEY is a real `re_*` key | Production key encrypted in Vercel — cannot read via CLI |
| Resend is actively signing with the DKIM private key | Requires sending a test email and inspecting headers |

### Deliverability assessment

**If** the Resend domain is "Verified" (i.e., Resend has confirmed the DKIM record and is actively signing):
- Outbound email from `noreply@elbold.com` will carry a valid `DKIM-Signature: s=resend; d=elbold.com`
- Receiving servers will find the TXT record at `resend._domainkey.elbold.com` and verify the signature
- DKIM will PASS
- DMARC will PASS (via DKIM alignment)
- Email will reach inbox

**If** the Resend domain is NOT "Verified":
- Resend may not be signing outbound email, or may be signing with a different key
- DKIM verification will fail (signature not found, or key mismatch)
- DMARC will fail (neither SPF nor DKIM alignment passes)
- Email will be quarantined or rejected at servers that enforce DMARC
- This situation requires checking the Resend dashboard

### Action required to upgrade to PASS

1. Log in to resend.com → Domains → confirm `elbold.com` shows green "Verified" status
2. Confirm production RESEND_API_KEY in Vercel Dashboard starts with `re_`
3. Send a test transactional email and check the delivered message headers for `DKIM-Signature` and `Authentication-Results`

---

## Summary — Exact Remediation Steps

| Priority | Action | Where | Time |
|----------|--------|-------|------|
| 1 | Add SPF TXT record: `v=spf1 include:amazonses.com ~all` on `@` | Cloudflare DNS | 2 min |
| 2 | Retrieve bounce CNAME target | Resend Dashboard → Domains → elbold.com | 2 min |
| 3 | Add bounce CNAME: `bounces` → [value from step 2] | Cloudflare DNS | 2 min |
| 4 | Confirm domain "Verified" status | Resend Dashboard → Domains | 2 min |
| 5 | Run post-fix DNS validation commands | Terminal (see ELBOLD_DNS_Remediation_Guide.md §6) | 5 min |
| 6 | Send test email and verify headers | Browser / email client | 5 min |

**Total time: approximately 18 minutes.**

After these steps are complete, re-run the verdicts in this document. Expected post-fix verdicts:

| Area | Expected Post-Fix Verdict |
|------|--------------------------|
| SPF | PASS |
| DKIM | PASS (already passing; no change needed) |
| DMARC | PASS (already passing; no change needed) |
| Bounce Handling | PASS |
| Resend Deliverability | PASS |
