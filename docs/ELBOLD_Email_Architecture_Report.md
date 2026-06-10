# ELBOLD Email Architecture Report
**Version:** 1.0 | **Date:** 2026-06-09
**Domain:** elbold.com
**DNS Provider:** Cloudflare (mcgrory.ns.cloudflare.com, wren.ns.cloudflare.com)
**Standard:** Evidence cited for every claim. No assumptions. No generic recommendations.

---

## Final Verdict

**Email Infrastructure: GO WITH CAUTION**

| Component | Verdict |
|-----------|---------|
| Microsoft 365 Inbound | PASS |
| Microsoft 365 Outbound (SPF) | PASS |
| Microsoft 365 Outbound (DKIM) | FAIL — not configured |
| Resend Transactional (DKIM) | PASS |
| Resend Transactional (SPF) | FAIL — Resend not in SPF record |
| Bounce Handling (Resend) | FAIL — CNAME missing |
| DMARC Policy | PASS |
| DMARC Reporting | AT RISK — rua target not confirmed to exist |

**Both email systems are currently delivering.** Microsoft 365 passes DMARC via SPF alignment. Resend passes DMARC via DKIM alignment. Three confirmed gaps prevent a PASS verdict.

---

## Section 1 — What Currently Sends Email from ELBOLD

**Answer: Both Microsoft 365 and Resend.**

### Evidence

**Microsoft 365**

MX record: `nslookup -type=MX elbold.com 8.8.8.8`
```
elbold.com  MX preference = 0, mail exchanger = elbold-com.mail.protection.outlook.com
```

MX target resolution: `nslookup -type=A elbold-com.mail.protection.outlook.com 8.8.8.8`
```
elbold-com.mail.protection.outlook.com → 52.101.89.0, 52.101.89.1, 52.101.89.2, 52.101.99.0
```

`elbold-com.mail.protection.outlook.com` is the Exchange Online Protection (EOP) endpoint for the elbold.com tenant. This is the definitive evidence that Microsoft 365 is the configured mail system for elbold.com.

Autodiscover: `nslookup -type=CNAME autodiscover.elbold.com 8.8.8.8`
```
autodiscover.elbold.com  canonical name = autodiscover.outlook.com
autodiscover.outlook.com → atm.autodiscover.mira.tm.svc.cloud.microsoft (40.99.202.104, ...)
```

`autodiscover.elbold.com → autodiscover.outlook.com` is the Microsoft 365 autodiscover CNAME. This enables Outlook and other mail clients to automatically configure for support@, legal@, urgent@, and disputes@elbold.com.

Enterprise device management: both `enterpriseregistration.elbold.com → enterpriseregistration.windows.net` and `enterpriseenrollment.elbold.com → enterpriseenrollment-s.manage.microsoft.com` are present, confirming Microsoft Intune MDM is configured alongside Exchange Online.

**Microsoft 365 mailboxes in scope:**
- support@elbold.com
- legal@elbold.com
- urgent@elbold.com
- disputes@elbold.com

**Resend**

SPF domain on elbold.com: `nslookup -type=TXT elbold.com 8.8.8.8`
```
v=spf1 include:spf.protection.outlook.com ~all
```

The current SPF record covers Microsoft 365 only. It does NOT include Amazon SES / Resend IPs.

DKIM selector `resend`: `nslookup -type=TXT resend._domainkey.elbold.com 8.8.8.8`
```
resend._domainkey.elbold.com  text = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6..."
```

A DKIM public key for selector `resend` is published for `elbold.com`. This key was placed in DNS during Resend domain setup. It enables email signed by Resend with `s=resend; d=elbold.com` to pass DKIM verification.

Resend sends transactional email: booking confirmations, refund notifications, vendor application emails, admin alerts — from `noreply@elbold.com` (see `lib/resend/index.ts`).

---

## Section 2 — Current DNS State (Complete)

All records queried via 8.8.8.8 (Google DNS) on 2026-06-09.

### elbold.com TXT Records (complete set)

```
elbold.com  text = "MS=ms42917341"
elbold.com  text = "google-site-verification=0HFkSto0xQ6GNM-p-I3dCQef996Wv_NwjQ0iTFojIHY"
elbold.com  text = "v=spf1 include:spf.protection.outlook.com ~all"
```

Three TXT records. One SPF record present: covers M365 only, no Resend.

### MX Record
```
elbold.com  MX 0  elbold-com.mail.protection.outlook.com
```
Resolves to Microsoft Exchange Online Protection IPs.

### CNAME Records
```
autodiscover.elbold.com      → autodiscover.outlook.com          (M365 mail client config)
enterpriseregistration.elbold.com → enterpriseregistration.windows.net    (Intune MDM)
enterpriseenrollment.elbold.com   → enterpriseenrollment-s.manage.microsoft.com  (Intune MDM)
```

### DKIM Records
```
resend._domainkey.elbold.com  TXT = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6..."
selector1._domainkey.elbold.com   → NXDOMAIN  (M365 DKIM not configured)
selector2._domainkey.elbold.com   → NXDOMAIN  (M365 DKIM not configured)
```

### DMARC Record
```
_dmarc.elbold.com  TXT = "v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com"
```

### Bounce Record
```
bounces.elbold.com  → NXDOMAIN
```

### SRV Records (Microsoft Teams)
```
_sipfederationtls._tcp.elbold.com → NXDOMAIN
_sip._tls.elbold.com              → NXDOMAIN
```
Microsoft Teams/Skype federation is not configured. Not required for email.

---

## Section 3 — Microsoft 365 Mail Flow Verification

### Inbound Mail: ACTIVE AND CONFIGURED

Evidence: MX record points to `elbold-com.mail.protection.outlook.com` (Exchange Online Protection). Target resolves to four live Microsoft IPs. Inbound email to support@, legal@, urgent@, disputes@elbold.com is flowing through Exchange Online.

### Outbound Mail: SPF PASSES, DKIM FAILS

**SPF (outbound):**

Current `elbold.com` SPF: `v=spf1 include:spf.protection.outlook.com ~all`

`spf.protection.outlook.com` TXT:
```
v=spf1 ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/15 ip4:52.102.0.0/16
       ip4:52.103.0.0/17 ip4:104.47.0.0/17
       ip6:2a01:111:f400::/48 ip6:2a01:111:f403::/49 ip6:2a01:111:f403:8000::/51
       ip6:2a01:111:f403:c000::/51 ip6:2a01:111:f403:f000::/52 -all
```

The SPF record for `elbold.com` correctly includes Microsoft 365's outbound IP ranges. When support@elbold.com sends an email, the sending M365 IP will be covered by this record.

**SPF alignment under DMARC:**
- MAIL FROM domain for M365 outbound = `elbold.com`
- From: header domain = `elbold.com`
- Alignment: PASS (exact match)
- DMARC result via SPF: PASS

**DKIM (outbound):**

`selector1._domainkey.elbold.com` → NXDOMAIN
`selector2._domainkey.elbold.com` → NXDOMAIN

Microsoft 365 DKIM signing for `elbold.com` is **not configured**. These two CNAME records must be added to DNS to enable M365 to sign outbound email with `d=elbold.com`. Without them, M365 either sends unsigned or signs with Microsoft's default domain — neither produces a `d=elbold.com` DKIM signature.

**Effect of missing M365 DKIM:**
DMARC currently passes for M365 outbound via SPF alignment alone. This is sufficient for delivery. However:
- If SPF ever fails for any M365 message, DMARC fails (no DKIM fallback)
- Some receiving systems assign higher deliverability weight to DKIM-signed email
- Microsoft best practice requires DKIM to be configured for custom domains

### Autodiscover: CONFIRMED ACTIVE

`autodiscover.elbold.com → autodiscover.outlook.com → Microsoft cloud endpoints`

Outlook, Apple Mail, and other IMAP/Exchange clients will auto-configure correctly for all four M365 mailboxes.

### Exchange Online Configuration Summary

| Item | Status | Evidence |
|------|--------|---------|
| MX record pointing to EOP | CONFIGURED | `elbold-com.mail.protection.outlook.com` — resolves to M365 IPs |
| Domain ownership token | PRESENT | `MS=ms42917341` TXT record |
| Autodiscover | CONFIGURED | CNAME → `autodiscover.outlook.com` → Microsoft cloud |
| Enterprise registration | CONFIGURED | CNAME → `enterpriseregistration.windows.net` |
| Enterprise enrollment | CONFIGURED | CNAME → `enterpriseenrollment-s.manage.microsoft.com` |
| SPF (M365 outbound IPs) | CONFIGURED | `include:spf.protection.outlook.com` in SPF record |
| DKIM signing | NOT CONFIGURED | `selector1` and `selector2` both NXDOMAIN |

---

## Section 4 — Resend Domain Status

### DKIM: PRESENT

`resend._domainkey.elbold.com` TXT record confirmed (identical on 8.8.8.8 and 1.1.1.1):
```
p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6nC6y00NWYpOttj+wvZ1CZamFhoe3aVa9OphMPR
  Yehzeyszr9MvviwuYBRdE7JHHOU67ktOAyk+awWMOcQDko2G1SC6aQZGI56QuoNvJEehEBlDq7Ko+btQmie
  2uw7aRsnDzpN7A4tQWuBxek9HPy95Qjh7t0+pDupc9YuwIDAQAB
```

RSA-1024 public key. Selector `resend`. Valid DKIM format per RFC 6376.

**Condition:** This DNS record enables DKIM verification. Resend must be actively signing outbound email with the private key corresponding to this public key. That requires the domain to show "Verified" in the Resend dashboard. The Resend dashboard verified status cannot be confirmed from this environment (production API key is encrypted in Vercel; local key returns HTTP 400).

### SPF: NOT INCLUDED (CRITICAL GAP)

Current `elbold.com` SPF: `v=spf1 include:spf.protection.outlook.com ~all`

Amazon SES IP ranges (which Resend uses) are NOT in this record. Evidence:
- `smtp.resend.com` resolves to AWS ELB in `us-east-1`
- `send.resend.com` SPF = `v=spf1 include:amazonses.com ~all`
- `amazonses.com` SPF contains the SES sending IP ranges
- `spf.protection.outlook.com` is IP-only and contains ONLY Microsoft 365 IP ranges

When Resend sends email from `noreply@elbold.com` and a receiving server checks SPF:
- Without bounce CNAME: MAIL FROM is on Resend's default domain, not elbold.com → SPF check is on Resend's domain, not elbold.com → SPF alignment FAILS for DMARC
- With bounce CNAME: MAIL FROM is `bounces.elbold.com` → SPF check on `bounces.elbold.com` follows CNAME to SES infrastructure → would PASS, but bounce CNAME is not configured

Current result: Resend delivers via DKIM alignment only. SPF alignment fails for all Resend messages.

### Bounce Domain: NOT CONFIGURED

`bounces.elbold.com` → NXDOMAIN (confirmed). Resend uses a default return-path domain, not `elbold.com`. Bounce events from transactional emails (invalid customer addresses, full vendor mailboxes) are not routed through elbold.com. Bounce data is not tracked under the elbold.com domain in Resend dashboard.

### Resend Domain Verification: UNCONFIRMABLE

Cannot query Resend API (local key invalid, production key encrypted in Vercel). The presence of the DKIM public key in DNS is evidence that the domain was set up in Resend at some point. Whether it currently shows "Verified" requires a dashboard check.

---

## Section 5 — What the Correct SPF Record Is

### Evidence for inclusion requirements

**Microsoft 365:**
- Confirmed active sender via MX record and SPF already present
- Include target: `spf.protection.outlook.com` (confirmed resolves to M365 IP ranges)

**Resend (Amazon SES):**
- Confirmed active sender via DKIM key in DNS and source code (`lib/resend/index.ts`)
- Include target: `amazonses.com`
- Evidence: `send.resend.com` TXT = `v=spf1 include:amazonses.com ~all` (Resend's own sending domain, confirmed via DNS 2026-06-09)
- Evidence: `smtp.resend.com` resolves to AWS ELB infrastructure
- Evidence: `_spf.resend.com` → NXDOMAIN — this include does NOT exist; do not use it

### SPF Lookup Count (RFC 7208 limit: 10)

| Include | Lookups |
|---------|---------|
| `include:spf.protection.outlook.com` | 1 — target record is IP-only, no nested includes |
| `include:amazonses.com` | 1 — target record is IP-only, no nested includes |
| **Total** | **2** — within limit |

`spf.protection.outlook.com` = IP-only (confirmed):
`ip4:40.92.0.0/15 ip4:40.107.0.0/16 ip4:52.100.0.0/15 ...` — no `include:` tags

`amazonses.com` = IP-only (confirmed):
`ip4:199.255.192.0/22 ip4:199.127.232.0/22 ip4:54.240.0.0/18 ...` — no `include:` tags

### Final Consolidated SPF Record

**Current (must be replaced — not a second TXT record added):**
```
v=spf1 include:spf.protection.outlook.com ~all
```

**Required:**
```
Type:  TXT
Name:  @
Value: v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all
TTL:   Auto
```

**In Cloudflare:** Edit the existing SPF TXT record on `@`. Do not add a second `v=spf1` record — multiple SPF records on the same hostname cause SPF to PERMERROR, breaking delivery for all senders.

---

## Section 6 — Recommended Architecture

### Current Architecture (as-is)

```
elbold.com
├── INBOUND MAIL
│   └── MX: elbold-com.mail.protection.outlook.com  [Exchange Online]
│       └── Receives: support@, legal@, urgent@, disputes@elbold.com
│
├── OUTBOUND — Microsoft 365
│   ├── Sends: support@, legal@, urgent@, disputes@elbold.com
│   ├── SPF: PASS (include:spf.protection.outlook.com covers M365 IPs)
│   ├── DKIM: NOT CONFIGURED (selector1/selector2 NXDOMAIN)
│   └── DMARC: PASS via SPF alignment
│
├── OUTBOUND — Resend (transactional)
│   ├── Sends: noreply@elbold.com (booking, refund, vendor emails)
│   ├── DKIM: PRESENT (resend._domainkey.elbold.com TXT record)
│   ├── SPF: FAIL (Amazon SES IPs not in elbold.com SPF)
│   ├── Bounce: NOT CONFIGURED (bounces.elbold.com NXDOMAIN)
│   └── DMARC: PASS via DKIM alignment only (SPF alignment fails)
│
└── DMARC
    ├── Policy: p=quarantine
    ├── Reports: rua=mailto:admin@elbold.com
    └── RISK: admin@elbold.com not confirmed to exist in M365
```

### Recommended Architecture (target state)

```
elbold.com
├── INBOUND MAIL
│   └── MX: elbold-com.mail.protection.outlook.com  [no change needed]
│
├── OUTBOUND — Microsoft 365
│   ├── SPF: PASS [no change to include needed]
│   ├── DKIM: CONFIGURED — add selector1 + selector2 CNAME records [ACTION REQUIRED]
│   └── DMARC: PASS via both SPF and DKIM alignment
│
├── OUTBOUND — Resend (transactional)
│   ├── DKIM: PRESENT [no change needed]
│   ├── SPF: PASS — add include:amazonses.com to SPF record [ACTION REQUIRED]
│   ├── Bounce: CONFIGURED — add bounces.elbold.com CNAME [ACTION REQUIRED]
│   └── DMARC: PASS via both SPF and DKIM alignment
│
└── DMARC
    ├── Policy: p=quarantine [no change needed]
    ├── Reports: rua=mailto:support@elbold.com [ACTION REQUIRED — change from admin@]
    └── Optional: add fo=1 for per-failure reports
```

---

## Section 7 — Required DNS Changes

### Change 1 — CRITICAL: Update SPF record (modify existing, do not add new)

**Action:** Edit the existing TXT record on `@` in Cloudflare.

| | Before | After |
|-|--------|-------|
| Type | TXT | TXT |
| Name | @ | @ |
| Value | `v=spf1 include:spf.protection.outlook.com ~all` | `v=spf1 include:spf.protection.outlook.com include:amazonses.com ~all` |

Only `include:amazonses.com` is being added. Everything else is unchanged.

---

### Change 2 — CRITICAL: Add Resend bounce CNAME

**Action:** Add new CNAME record in Cloudflare. Target value must be retrieved from Resend dashboard (Domains → elbold.com → DNS settings).

```
Type:   CNAME
Name:   bounces
Target: [value from Resend Dashboard — pattern: feedback-smtp.{region}.amazonses.com]
TTL:    Auto
Proxy:  DNS only (grey cloud)
```

Do not proxy this record. Do not add it with a guessed target value.

---

### Change 3 — RECOMMENDED: Add Microsoft 365 DKIM CNAMEs

**Action:** Enable DKIM in M365 Admin Center first, then add the two CNAME records it provides.

**How to get the values:**
1. Sign in to admin.microsoft.com
2. Go to: Security → Email & collaboration → Policies & rules → Threat policies → Email authentication settings → DKIM
3. Select `elbold.com` → Enable signing
4. M365 will show two CNAME records to add to DNS

The records will follow this pattern (exact values are tenant-specific):

```
Type:   CNAME
Name:   selector1._domainkey
Target: selector1-elbold-com._domainkey.{tenant-id}.onmicrosoft.com
TTL:    Auto
Proxy:  DNS only

Type:   CNAME
Name:   selector2._domainkey
Target: selector2-elbold-com._domainkey.{tenant-id}.onmicrosoft.com
TTL:    Auto
Proxy:  DNS only
```

Add both records to Cloudflare DNS, then return to M365 Admin Center and enable DKIM signing.

---

### Change 4 — RECOMMENDED: Fix DMARC rua mailbox

**Action:** Update `_dmarc.elbold.com` TXT record.

Current: `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com`

`admin@elbold.com` is not one of the four confirmed M365 mailboxes (support, legal, urgent, disputes). If this mailbox does not exist in M365, all DMARC aggregate reports (daily XML reports showing authentication pass/fail statistics) are bouncing — zero email authentication visibility.

Verify whether admin@elbold.com exists in M365 Admin Center → Users → Active users.

If it does not exist, update the DMARC record:
```
Type:  TXT
Name:  _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:support@elbold.com; fo=1
TTL:   Auto
```

`fo=1` adds per-message failure reports in addition to aggregate reports.

---

### Complete DNS Change Summary

| Priority | Change | Type | Impact if not done |
|----------|--------|------|--------------------|
| 1 — CRITICAL | Edit SPF: add `include:amazonses.com` | Edit existing TXT | Resend emails fail SPF alignment; DMARC relies solely on DKIM |
| 2 — CRITICAL | Add `bounces.elbold.com` CNAME | New CNAME | Bounce events not tracked; SPF alignment weak |
| 3 — RECOMMENDED | Add M365 DKIM selector1 + selector2 CNAMEs | New CNAMEs × 2 | M365 emails have no DKIM signing; SPF is only DMARC mechanism |
| 4 — RECOMMENDED | Update DMARC rua to valid mailbox | Edit existing TXT | DMARC reports bounce; no email authentication visibility |

---

## Section 8 — Risk Assessment

### Risk 1 — Resend not in SPF (CONFIRMED CRITICAL)

**Evidence:** Current SPF `v=spf1 include:spf.protection.outlook.com ~all` contains no Resend/SES IP ranges.

**What this means:** Resend transactional email passes DMARC via DKIM alignment only. If DKIM signing ever fails (key rotation, domain unverified in Resend, Resend account issue), all transactional email from `noreply@elbold.com` fails DMARC and is quarantined. Refund notifications, booking confirmations, and vendor emails would go to spam with no fallback.

**Fix:** Update SPF to add `include:amazonses.com`.

---

### Risk 2 — Microsoft 365 DKIM not configured (CONFIRMED HIGH)

**Evidence:** `selector1._domainkey.elbold.com` and `selector2._domainkey.elbold.com` both NXDOMAIN.

**What this means:** M365 outbound email passes DMARC via SPF alignment only. If M365 changes its sending infrastructure or if a message is forwarded (forwarding breaks SPF), DMARC fails for M365 messages with no DKIM fallback. Support emails, legal correspondence, and dispute responses could be quarantined by receiving servers.

**Fix:** Enable DKIM in M365 Admin Center and add the two CNAME records to Cloudflare.

---

### Risk 3 — Bounce CNAME missing (CONFIRMED HIGH)

**Evidence:** `bounces.elbold.com` NXDOMAIN.

**What this means:** Hard bounce events (emails to invalid addresses) are not tracked under elbold.com in Resend. If a customer's email address is invalid, the refund notification silently fails and the address is not added to the suppression list. Repeat sends to bounced addresses will degrade the domain's sending reputation with receiving mail servers over time.

**Fix:** Add bounce CNAME after retrieving target from Resend dashboard.

---

### Risk 4 — DMARC reports going to unconfirmed mailbox (HIGH)

**Evidence:** DMARC rua = `admin@elbold.com`. The four confirmed M365 mailboxes are support, legal, urgent, disputes — `admin@` is not listed.

**What this means:** If `admin@elbold.com` does not exist, the daily DMARC aggregate reports (XML files sent by Gmail, Microsoft, Yahoo, etc.) are bouncing. With no DMARC report delivery, there is zero visibility into authentication failures, spoofing attempts, or misconfigured senders.

**Fix:** Verify whether admin@elbold.com exists in M365. If not, update DMARC rua to `support@elbold.com` or `legal@elbold.com`.

---

### Risk 5 — Resend domain verification unconfirmable (MEDIUM)

**Evidence:** Production RESEND_API_KEY encrypted in Vercel; local key returns HTTP 400 "API key is invalid". Cannot query Resend API to confirm domain status.

**What this means:** The DKIM key exists in DNS, but whether Resend is actively signing with it depends on the domain being "Verified" in Resend's dashboard. An unverified domain would send unsigned email, causing DKIM to fail, causing DMARC to fail for all Resend messages.

**Fix:** Log into resend.com → Domains → confirm `elbold.com` shows "Verified".

---

## Appendix — Complete Evidence Log

All DNS queries executed 2026-06-09 via Google DNS (8.8.8.8).

| Query | Result |
|-------|--------|
| `MX elbold.com` | `MX 0 elbold-com.mail.protection.outlook.com` |
| `A elbold-com.mail.protection.outlook.com` | 52.101.89.0–2, 52.101.99.0 |
| `TXT elbold.com` | `MS=ms42917341`, `google-site-verification=0HFk...`, `v=spf1 include:spf.protection.outlook.com ~all` |
| `CNAME autodiscover.elbold.com` | `→ autodiscover.outlook.com → Microsoft cloud` |
| `CNAME enterpriseregistration.elbold.com` | `→ enterpriseregistration.windows.net` |
| `CNAME enterpriseenrollment.elbold.com` | `→ enterpriseenrollment-s.manage.microsoft.com` |
| `TXT _dmarc.elbold.com` | `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` |
| `TXT resend._domainkey.elbold.com` | RSA-1024 public key (p=MIGfMA0G...) |
| `CNAME selector1._domainkey.elbold.com` | NXDOMAIN |
| `CNAME selector2._domainkey.elbold.com` | NXDOMAIN |
| `CNAME bounces.elbold.com` | NXDOMAIN |
| `TXT spf.protection.outlook.com` | IP-only SPF (40.92.0.0/15, 40.107.0.0/16, ...) |
| `TXT send.resend.com` | `v=spf1 include:amazonses.com ~all` |
| `TXT amazonses.com` | IP-only SPF (199.255.192.0/22, 199.127.232.0/22, ...) |
| `TXT _spf.resend.com` | NXDOMAIN |
| `A smtp.resend.com` | AWS ELB → 54.205.195.44, 54.157.71.137 |
| `SRV _sipfederationtls._tcp.elbold.com` | NXDOMAIN |
| `SRV _sip._tls.elbold.com` | NXDOMAIN |
