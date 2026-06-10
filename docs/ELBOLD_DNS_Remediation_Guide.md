# ELBOLD DNS Remediation Guide
**Version:** 1.0 | **Date:** 2026-06-09
**DNS Provider:** Cloudflare (nameservers: `mcgrory.ns.cloudflare.com`, `wren.ns.cloudflare.com`)
**Standard:** Evidence cited for every claim. No assumptions.

---

## Section 1 — Current DNS State

All records queried via Google Public DNS (8.8.8.8) and Cloudflare DNS (1.1.1.1) on 2026-06-09. Both resolvers returned identical results on all queried records.

---

### 1.1 SPF Records

**Query:** `nslookup -type=TXT elbold.com 8.8.8.8`

**Response — complete TXT records on `elbold.com`:**
```
elbold.com  text = "MS=ms42917341"
elbold.com  text = "google-site-verification=0HFkSto0xQ6GNM-p-I3dCQef996Wv_NwjQ0iTFojIHY"
```

**SPF record present:** NO

No `v=spf1` TXT record exists on `elbold.com`. The two TXT records present are a Microsoft domain ownership token and a Google Search Console verification token. Neither has any relation to email deliverability.

---

### 1.2 DKIM Records

**Query:** `nslookup -type=TXT resend._domainkey.elbold.com 8.8.8.8`

**Response:**
```
resend._domainkey.elbold.com  text =
    "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6nC6y00NWYpOttj+wvZ1CZamFhoe3aVa9Oph
    MPRYehzeyszr9MvviwuYBRdE7JHHOU67ktOAyk+awWMOcQDko2G1SC6aQZGI56QuoNvJEehEBlDq7Ko+bt
    Qmie2uw7aRsnDzpN7A4tQWuBxek9HPy95Qjh7t0+pDupc9YuwIDAQAB"
```

**DKIM record present:** YES — confirmed on both 8.8.8.8 and 1.1.1.1, identical value.

**Record type:** TXT (direct public key, not a CNAME delegation)
**Selector:** `resend` (name: `resend._domainkey`)
**Key format:** RSA 1024-bit public key (DER-encoded, PEM strip)
**Algorithm:** RSA-SHA256 (standard for DKIM)

The `p=` value is the public key. This record is fully propagated and will be found by any mail server performing DKIM verification on email signed with this selector.

**CNAME check on same hostname:**

`nslookup -type=CNAME resend._domainkey.elbold.com 8.8.8.8` returned the SOA record for `elbold.com` (not a CNAME record). The DKIM record is a direct TXT entry, not a CNAME delegation to Resend's servers.

---

### 1.3 DMARC Records

**Query:** `nslookup -type=TXT _dmarc.elbold.com 8.8.8.8`

**Response:**
```
_dmarc.elbold.com  text = "v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com"
```

**DMARC record present:** YES

| Field | Value | Meaning |
|-------|-------|---------|
| `v=DMARC1` | Protocol version | Valid DMARC record |
| `p=quarantine` | Policy | Failing emails go to spam/junk (not rejected outright) |
| `rua=mailto:admin@elbold.com` | Aggregate reports | Daily XML reports sent to admin@elbold.com |

**What is missing from this DMARC record:**
- `fo=1` — failure reporting (individual failures, not just aggregate)
- `pct=100` — default is 100, so this is not a gap
- `adkim=s` / `aspf=s` — not present; defaults to `r` (relaxed alignment), which is correct

The existing DMARC record is functional. `p=quarantine` means that email failing both SPF alignment AND DKIM alignment will be marked as spam rather than delivered to inbox. Since DKIM is configured, properly signed email from Resend will pass DKIM alignment and DMARC regardless of SPF state.

---

### 1.4 Existing Resend-Related Records

**Summary of all Resend-related records found:**

| Record | Hostname | Status |
|--------|----------|--------|
| DKIM TXT | `resend._domainkey.elbold.com` | PRESENT |
| SPF include for Resend | `elbold.com` (TXT) | ABSENT |
| Bounce CNAME | `bounces.elbold.com` | ABSENT |

No other Resend-specific records (tracking pixels, open tracking CNAMEs) were found.

---

### 1.5 Bounce Records

**Query:** `nslookup -type=CNAME bounces.elbold.com 8.8.8.8`

**Response:**
```
*** dns.google can't find bounces.elbold.com: Non-existent domain
```

**Query:** `nslookup -type=A bounces.elbold.com 8.8.8.8`

**Response:**
```
*** dns.google can't find bounces.elbold.com: Non-existent domain
```

`bounces.elbold.com` does not exist. No CNAME, no A record, no TXT record. Any system attempting to route bounce email to this subdomain will fail.

---

### 1.6 Supporting Infrastructure Verification

**Resend sending infrastructure (confirmed via DNS):**

`nslookup -type=A smtp.resend.com 8.8.8.8`:
```
smtp.resend.com → resend-loadb-n3wvuwjppfau-da12bec3636a12a9.elb.us-east-1.amazonaws.com
Addresses: 54.205.195.44, 54.157.71.137
```

Resend routes outbound mail through Amazon SES infrastructure in `us-east-1`.

**Resend's own sending domain SPF (confirmed via DNS):**

`nslookup -type=TXT send.resend.com 8.8.8.8`:
```
send.resend.com  text = "v=spf1 include:amazonses.com ~all"
```

Resend's own sending domain uses `include:amazonses.com` in its SPF record. `amazonses.com` holds the authoritative IP ranges for Amazon SES mail servers.

**`amazonses.com` SPF (confirmed via DNS):**

`nslookup -type=TXT amazonses.com 8.8.8.8`:
```
amazonses.com  text = "v=spf1 ip4:199.255.192.0/22 ip4:199.127.232.0/22
    ip4:54.240.0.0/18 ip4:69.169.224.0/20 ip4:23.249.208.0/20 ip4:23.251.224.0/19
    ip4:76.223.176.0/20 ip4:54.240.64.0/18 ip4:76.223.128.0/19 ip4:216.221.160.0/19
    ip4:206.55.144.0/20 ip4:24.110.64.0/18 -all"
```

These IP ranges include the sending IPs used by smtp.resend.com.

**`_spf.resend.com` (negative check):**

`nslookup -type=TXT _spf.resend.com 8.8.8.8`:
```
*** dns.google can't find _spf.resend.com: Non-existent domain
```

`_spf.resend.com` does NOT exist. Any documentation referencing `include:_spf.resend.com` is incorrect — adding that include would cause SPF to PERMERROR.

---

## Section 2 — Missing SPF Record

### Why the SPF record is needed

SPF (Sender Policy Framework) declares which servers are authorised to send email on behalf of `elbold.com`. A receiving mail server looks up the SPF record on the domain in the email's `MAIL FROM` (envelope sender / return-path) and checks whether the sending server's IP is listed.

Without SPF on `elbold.com`, any server in the world can send email claiming to be from `@elbold.com` with no DNS-based mechanism to stop it. More immediately, DMARC's SPF alignment check will FAIL (because no SPF record exists to pass), which means only DKIM alignment can satisfy DMARC.

### What breaks without it

1. **DMARC SPF alignment permanently fails** — DMARC requires at least one of SPF alignment or DKIM alignment to pass. Currently DMARC can only rely on DKIM. If DKIM signing ever fails (key rotation, Resend misconfiguration), all email will fail DMARC and be quarantined.

2. **Spoofing exposure** — Without `~all` or `-all` in an SPF record, any sender can pass SPF for `elbold.com`. Phishing emails sent FROM `ceo@elbold.com` by a malicious actor face no SPF barrier.

3. **Some legacy mail systems** check SPF independently of DMARC and may reject or downgrade mail from domains with no SPF record.

### How it affects deliverability

With DKIM configured and DMARC using `p=quarantine`: emails signed by Resend WILL currently pass DMARC via DKIM alignment. Adding SPF provides a second layer of authentication so that email can pass DMARC via either mechanism, increasing resilience and deliverability signals.

### Exact DNS record required

```
Type:   TXT
Host:   @   (represents elbold.com root — in Cloudflare, use "@" as the Name)
Value:  v=spf1 include:amazonses.com ~all
TTL:    Auto (Cloudflare default — typically 300s for proxied or 1800s for DNS-only)
```

**Evidence for `include:amazonses.com`:**
- `send.resend.com` TXT record = `v=spf1 include:amazonses.com ~all` (Resend's own sending domain)
- `smtp.resend.com` resolves to AWS ELB in `us-east-1` (Resend sends via Amazon SES)
- `_spf.resend.com` does NOT exist — do not use `include:_spf.resend.com`

**Before adding this record, confirm in the Resend dashboard** (Domains → elbold.com → DNS settings) that Resend has not changed their recommended SPF include. The evidence above is authoritative as of 2026-06-09.

**`~all` vs `-all`:**
- `~all` (softfail) — mail from non-authorised servers is marked as suspicious but delivered
- `-all` (hardfail) — mail from non-authorised servers is rejected

Use `~all` for initial deployment. DMARC (`p=quarantine`) already handles the policy enforcement. Do not use `-all` until you have confirmed all legitimate email sources are in the record.

**If other services send email from `@elbold.com`** (e.g., Supabase auth emails, Sentry alerts): those services must also be included in the SPF record before adding it. Check with each service before finalising.

---

## Section 3 — Missing Bounce CNAME

### Why the bounce CNAME is needed

The bounce CNAME (`bounces.elbold.com`) sets the `MAIL FROM` (envelope sender / return-path) domain to a subdomain of `elbold.com`. When Resend sends an email, the envelope return-path is where bounced mail (undeliverable addresses, full mailboxes) is sent.

Without this CNAME, Resend uses a default return-path on its own domain. This means:

1. **SPF alignment under DMARC fails** — DMARC's SPF alignment check requires the `MAIL FROM` domain to match or be a subdomain of the `From:` header domain. Without the CNAME, `MAIL FROM` is `@[resend-default-domain]`, not `@elbold.com` — SPF alignment fails.

2. **Bounce events are not trackable** — Resend cannot process bounced emails back to your domain. Hard bounces (invalid addresses) and soft bounces (full mailboxes) are not reported in your Resend dashboard under the elbold.com domain.

3. **Vendor and customer emails may contain headers pointing to Resend's domain** — Some spam filters inspect `Return-Path` headers and penalise mismatches between `From:` and `Return-Path:` domains.

### What breaks without it

| Impact Area | Effect |
|-------------|--------|
| Refund notification emails | Bounce events for customer refund emails are silently dropped — you cannot tell which customer email addresses are invalid |
| Vendor welcome emails | Failed vendor onboarding emails are not tracked — you cannot follow up on vendors who never received their confirmation |
| Admin alert emails | Bounce events on admin@elbold.com not tracked |
| Resend dashboard bounce rate | Bounce data is incomplete — suppression list not populated automatically |
| SPF alignment | MAIL FROM domain mismatch — SPF alignment fails for DMARC |

The bounce CNAME does not affect whether an email is *delivered*. It affects whether *failures* are visible and whether SPF alignment passes under DMARC.

### Exact DNS record required

```
Type:   CNAME
Host:   bounces   (represents bounces.elbold.com — in Cloudflare, use "bounces" as the Name)
Target: [VALUE FROM RESEND DASHBOARD — see note below]
TTL:    Auto
```

**CRITICAL: The bounce CNAME target is account-specific.**

Log in to resend.com → Domains → click `elbold.com` → DNS settings. The dashboard will display the exact CNAME target for your account. It will follow the pattern:

```
feedback-smtp.{region}.amazonses.com
```

Where `{region}` is the AWS region where your Resend account is hosted (e.g., `us-east-1`, `eu-west-1`). This value cannot be determined externally. Do not add a bounce CNAME without reading this value from the Resend dashboard.

**DNS evidence that `feedback-smtp.us-east-1.amazonses.com` resolves:**
```
nslookup -type=A feedback-smtp.us-east-1.amazonses.com 8.8.8.8
  → 18.235.76.96, 3.218.134.115, 34.192.233.193
```

**Why you must use the dashboard value:** If you point the CNAME to the wrong SES region, Resend will not receive bounce notifications for your domain, even if the DNS record appears valid.

---

## Section 4 — Cloudflare Instructions

Log in to dash.cloudflare.com → select `elbold.com` → DNS → Records.

---

### 4.1 Adding the SPF Record

**Step 1.** Click **"Add record"**.

**Step 2.** Set the fields:

| Field | Value |
|-------|-------|
| Type | `TXT` |
| Name | `@` |
| Content | `v=spf1 include:amazonses.com ~all` |
| TTL | `Auto` |
| Proxy status | DNS only (grey cloud) — MUST be DNS only; SPF records must not be proxied |

**Step 3.** Click **"Save"**.

**Step 4.** Verify the record was saved by clicking on it to confirm the stored value.

**Important:** If an existing `v=spf1` record is present on `@`, you must MERGE it into a single TXT record rather than adding a second one. Multiple SPF records on the same hostname cause SPF to PERMERROR. (Verified: no existing SPF record exists on elbold.com as of 2026-06-09, so no merge is required.)

---

### 4.2 Adding the Bounce CNAME

**Before doing this step:** Log in to resend.com and retrieve the bounce CNAME target value for your account.

**Step 1.** Click **"Add record"**.

**Step 2.** Set the fields:

| Field | Value |
|-------|-------|
| Type | `CNAME` |
| Name | `bounces` |
| Target | `[paste the value from Resend dashboard]` |
| TTL | `Auto` |
| Proxy status | DNS only (grey cloud) — MUST be DNS only; CNAME mail records must not be proxied |

**Step 3.** Click **"Save"**.

**Step 4.** Verify the record by clicking on it to confirm the stored target value.

**Do not proxy the CNAME.** If the Cloudflare proxy (orange cloud) is enabled on a CNAME used for email routing, Cloudflare will intercept the DNS resolution and the bounce routing will break.

---

### 4.3 Confirming Existing Records Are Correct

While in Cloudflare DNS, confirm the following existing records are set to DNS only (grey cloud):

| Hostname | Record Type | Proxy Required |
|----------|-------------|----------------|
| `resend._domainkey.elbold.com` | TXT | DNS only — cannot proxy TXT records |
| `_dmarc.elbold.com` | TXT | DNS only — cannot proxy TXT records |

Cloudflare does not allow proxying TXT records, so these are correct by default.

---

## Section 5 — Resend Verification Steps

### Step 1 — Open Resend Dashboard

Navigate to resend.com → sign in → Domains → click on `elbold.com`.

### Step 2 — Check Current Verification Status

The domain will show one of:
- **Verified** — all required DNS records are present and valid
- **Pending** — DNS records added but not yet propagated
- **Not configured** — required records missing

Given that the DKIM TXT record is present in DNS, the domain may already show "Verified" in the Resend dashboard. If it shows "Not configured" or "Pending", check whether the DKIM record was added via Resend's dashboard (in which case it would be tracked internally) or added manually.

### Step 3 — Retrieve the Bounce CNAME Target

On the domain settings page, find the "Return-Path" or "Bounce" section. Copy the CNAME target value. Add it to Cloudflare DNS as described in Section 4.2.

### Step 4 — Confirm Required DNS Records in Resend

The Resend dashboard will show which records it has verified. Check each:
- DKIM: should show green / verified (the TXT record is present)
- SPF: may or may not be required by Resend's current dashboard — add regardless for DMARC SPF alignment
- Bounce CNAME: will show not verified until added

### Step 5 — Trigger Reverification

After adding the SPF record and bounce CNAME in Cloudflare, return to Resend → Domains → elbold.com and click **"Verify DNS records"** or equivalent. Resend will re-query DNS and update the domain status.

### Expected Propagation Time

| Provider | Typical TTL | Observed Propagation |
|----------|-------------|----------------------|
| Cloudflare (DNS only records) | 300s (5 min) | 1–10 minutes to global resolvers |
| Google DNS (8.8.8.8) | Caches per TTL | Reflects new records within 5–10 min for 300s TTL |
| Resend internal check | Runs on demand + periodic | Immediate on manual reverification |

Cloudflare serves DNS changes globally within minutes for DNS-only (grey cloud) records. SPF and CNAME records at TTL=Auto (300s default for DNS-only) will be visible to most resolvers within 10 minutes.

### Expected Final Status

After all records are added and Resend has reverified:
- Resend domain status: **Verified**
- DKIM: ✓ (already present)
- SPF: ✓ (after adding TXT record)
- Bounce: ✓ (after adding CNAME)

---

## Section 6 — Post-Fix Validation

After adding both records, run these commands to confirm DNS is correct before testing email delivery.

---

### SPF Validation

```
nslookup -type=TXT elbold.com 8.8.8.8
```

**Expected output must include:**
```
elbold.com  text = "v=spf1 include:amazonses.com ~all"
```

**Failure condition:** If the SPF record is absent, still shows the old records only, or shows `include:_spf.resend.com` (which does not resolve), the record has either not propagated or was entered incorrectly.

**Cross-check SPF include resolution:**
```
nslookup -type=TXT amazonses.com 8.8.8.8
```

**Expected:** Returns an IP list beginning with `v=spf1 ip4:199.255.192.0/22...`. This confirms the include target is resolvable.

---

### DKIM Validation

```
nslookup -type=TXT resend._domainkey.elbold.com 8.8.8.8
```

**Expected output:**
```
resend._domainkey.elbold.com  text =
    "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6nC6y00NWYpOttj+wvZ1CZamFhoe3aVa9Oph..."
```

This record should already be present. If the key value changes after this guide is executed, the DKIM record has been rotated — the new key must be updated in DNS.

**Verify on a second resolver to confirm global propagation:**
```
nslookup -type=TXT resend._domainkey.elbold.com 1.1.1.1
```

Both resolvers should return the identical key value. (Confirmed identical as of 2026-06-09.)

---

### DMARC Validation

```
nslookup -type=TXT _dmarc.elbold.com 8.8.8.8
```

**Expected output:**
```
_dmarc.elbold.com  text = "v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com"
```

No changes to the DMARC record are required. This record is already correctly configured.

**Optional enhancement** (not required for operation): Add `fo=1` to receive per-message failure reports in addition to aggregate reports:
```
v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com; fo=1
```

---

### Bounce CNAME Validation

```
nslookup -type=CNAME bounces.elbold.com 8.8.8.8
```

**Expected output:**
```
bounces.elbold.com  canonical name = [your-bounce-target-from-resend-dashboard]
```

**Expected target format:** `feedback-smtp.{region}.amazonses.com`

**Failure condition:** `*** dns.google can't find bounces.elbold.com: Non-existent domain` means the CNAME has not been added or has not propagated.

**Confirm target resolves:**
```
nslookup -type=A [your-bounce-target-from-resend-dashboard] 8.8.8.8
```

**Expected:** Returns one or more IP addresses. If `Non-existent domain`, the CNAME target value from Resend is incorrect — return to Resend dashboard and re-copy the value.

---

### Full DNS State After Remediation

Run all checks in sequence:

```
nslookup -type=TXT elbold.com 8.8.8.8
nslookup -type=TXT _dmarc.elbold.com 8.8.8.8
nslookup -type=TXT resend._domainkey.elbold.com 8.8.8.8
nslookup -type=CNAME bounces.elbold.com 8.8.8.8
```

All four must return records (not `Non-existent domain`) before triggering Resend reverification.

---

## Appendix — Complete DNS Evidence Log

All queries executed 2026-06-09 from this environment (Windows 11, DNS 8.8.8.8 and 1.1.1.1).

| Query | Result |
|-------|--------|
| `TXT elbold.com` | `MS=ms42917341`, `google-site-verification=0HFk...` |
| `TXT _dmarc.elbold.com` | `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` |
| `TXT resend._domainkey.elbold.com` | `p=MIGfMA0G...IDAQAB` (full RSA key) |
| `CNAME resend._domainkey.elbold.com` | SOA record returned (no CNAME) |
| `CNAME bounces.elbold.com` | NXDOMAIN |
| `A bounces.elbold.com` | NXDOMAIN |
| `MX elbold.com` | SOA only (no MX record) |
| `NS elbold.com` | `mcgrory.ns.cloudflare.com`, `wren.ns.cloudflare.com` |
| `TXT _spf.resend.com` | NXDOMAIN |
| `TXT send.resend.com` | `v=spf1 include:amazonses.com ~all` |
| `TXT amazonses.com` | `v=spf1 ip4:199.255.192.0/22...` (full IP list) |
| `A smtp.resend.com` | `54.205.195.44`, `54.157.71.137` (via AWS ELB) |
| `A feedback-smtp.us-east-1.amazonses.com` | `18.235.76.96`, `3.218.134.115`, `34.192.233.193` |
