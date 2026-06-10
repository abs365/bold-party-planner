# Revenue Readiness — Final Verification
**Version:** 1.0 | **Date:** 2026-06-09
**Standard:** Evidence required for every conclusion. No assumptions. No inferred PASS results. Only verified facts.

---

## Scope

This document delivers the final readiness verdict for five operational areas. Each verdict is one of:

- **YES** — all requirements confirmed by verified evidence; no known gaps
- **GO WITH CAUTION** — core function confirmed; specific unverified or missing items noted
- **NO** — confirmed gap or failure that blocks this area

---

## 1. Payment Collection

**Verdict: GO WITH CAUTION**

### Evidence

| Claim | Evidence | Source |
|-------|----------|--------|
| Stripe integration is live | `pi_3Tg8sL6lIKzSGzKL11qTibsO` — GBP 1.00 payment succeeded | Prior session live test |
| STRIPE_SECRET_KEY exists in Vercel production | `vercel env ls` — encrypted, Production, set 15 days ago | CLI output |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY exists in Vercel | `vercel env ls` — confirmed present | CLI output |
| Payment intent creation code | `lib/stripe/index.ts:10-21` — correct `amount × 100`, `currency: "gbp"` | Source code audit |
| Code has no fire-and-forget Stripe calls | All Stripe calls awaited | Source code audit |

### Unverified Items

| Item | Why it matters | Required action |
|------|---------------|-----------------|
| STRIPE_SECRET_KEY prefix (`sk_live_*`) | Code does not validate prefix; a wrong key fails at first API call only | Check Vercel Dashboard |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY prefix (`pk_live_*`) | Wrong key would fail client-side card element silently | Check Vercel Dashboard |
| Stripe webhook endpoint registered | Without webhooks, `payment_intent.succeeded` events are not processed | Check Stripe Dashboard → Developers → Webhooks |
| STRIPE_WEBHOOK_SECRET in Vercel | Without this, all webhooks are accepted without signature verification | Check Vercel Dashboard |

### Condition for YES

Confirm in Vercel Dashboard: `STRIPE_SECRET_KEY` starts with `sk_live_` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`. Confirm webhook is registered in Stripe Dashboard with matching secret in Vercel.

---

## 2. Refund Processing

**Verdict: GO WITH CAUTION**

### Evidence

| Claim | Evidence | Source |
|-------|----------|--------|
| All refund secondary actions awaited | `app/api/bookings/[id]/route.ts:46-140` — all 7 post-Stripe actions awaited | Source code audit |
| `refund_amount` written to bookings row | Line 63: `.update({ payment_status: "refunded", refund_amount: refundAmount })` | Source code audit (BUG-002 fix) |
| Ledger null-return tracked in `failures[]` | Lines 77-80: `if (ledgerId === null) failures.push("ledger_update")` | Source code audit (BUG-002 fix) |
| Partial failure audit entry written | Lines 126-139: `createAuditLog({ action: "booking.refund.partial_failure", ... })` when `failures.length > 0` | Source code audit |
| `createRefund` GBP → pence conversion | `Math.round(amountGBP * 100)` — correct | Source code audit |
| TypeScript: 0 errors | `npx tsc --noEmit` — PASS | Build output (prior session) |

### Unverified Items

| Item | Why it matters | Required action |
|------|---------------|-----------------|
| End-to-end live refund test | Code is correct; real-world test not yet executed | Execute: payment → cancellation → verify all 8 checks in BUG_002 report |
| `pi_3Tg8sL6lIKzSGzKL11qTibsO` not refunded | Outstanding GBP 1.00 from smoke test | Refund manually in Stripe Dashboard |

### Condition for YES

Execute the live refund test protocol from `docs/BUG_002_Refund_Integrity_Fix_Report.md` Section 7 and verify all 8 SQL/dashboard checks pass.

---

## 3. Email Delivery

**Verdict: GO WITH CAUTION**

### Evidence

| Claim | Evidence | Source |
|-------|----------|--------|
| DKIM record present (`resend._domainkey.elbold.com`) | TXT record with RSA public key confirmed | `nslookup resend._domainkey.elbold.com 8.8.8.8` |
| DMARC record present (`_dmarc.elbold.com`) | `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` | `nslookup -type=TXT _dmarc.elbold.com 8.8.8.8` |
| SPF record ABSENT from `elbold.com` | Only `MS=ms42917341` and `google-site-verification=...` TXT records found — no `v=spf1` record | `nslookup -type=TXT elbold.com 8.8.8.8` |
| Bounce CNAME ABSENT (`bounces.elbold.com`) | `Non-existent domain` | `nslookup bounces.elbold.com 8.8.8.8` |
| Local RESEND_API_KEY is invalid placeholder | HTTP 400 `"API key is invalid"` | Resend API call with local key |
| RESEND_API_KEY exists in Vercel production | `vercel env ls` — encrypted, Preview+Production, 14 days ago | CLI output |

### Unverified Items

| Item | Why it matters | Required action |
|------|---------------|-----------------|
| Resend domain "Verified" status | Resend must internally verify the domain before signing emails with the DKIM key | Log into resend.com → Domains → confirm `elbold.com` shows green "Verified" |
| RESEND_API_KEY production value is a real `re_*` key | Placeholder locally; production value encrypted | Check Vercel Dashboard |

### Missing DNS Records (confirmed gaps)

| Record | Impact | Action |
|--------|--------|--------|
| SPF (`v=spf1 include:_spf.resend.com ~all`) | Without SPF, receiving servers cannot validate Resend as authorised sender for `elbold.com`. DMARC `p=quarantine` may quarantine emails if DKIM also fails. | Add TXT record to `elbold.com` DNS (Cloudflare) |
| Bounce CNAME (`bounces.elbold.com`) | Bounce events are not routed through Elbold's domain; bounce tracking broken; Resend dashboard will not show accurate bounce data | Add CNAME record (Cloudflare): `bounces.elbold.com → pm.mtasv.net`) |

### Net Assessment

DKIM key is configured in DNS — this is the record that Resend requires for email signing. DMARC is configured. If Resend has verified the domain and is actively signing, DMARC should pass via DKIM alignment even without SPF. However:

1. SPF is a missing best-practice record that increases deliverability trust signals
2. Bounce CNAME is missing — bounce handling is non-operational
3. Whether Resend has actually verified and activated the domain cannot be confirmed from this environment

**The DKIM key being present in DNS is a strong signal that domain setup was started.** If that key was added via the Resend dashboard, it is likely the domain was verified at that point. But this cannot be confirmed without dashboard access.

### Condition for YES

1. Add SPF TXT record to elbold.com DNS
2. Add bounce CNAME to elbold.com DNS
3. Confirm Resend dashboard shows `elbold.com` as "Verified"
4. Confirm production RESEND_API_KEY is a real `re_*` key
5. Send a test email and confirm delivery

---

## 4. Vendor Approval

**Verdict: GO WITH CAUTION**

### Evidence

| Claim | Evidence | Source |
|-------|----------|--------|
| ADMIN_EMAILS var exists in Vercel production | `vercel env ls` — encrypted, Production, set 11 days ago | CLI output |
| Code parses ADMIN_EMAILS correctly (3 locations) | `.split(",").map(e => e.trim()).filter(Boolean)` | Source code audit |
| Vendor application form enforces phone (required) | `if (!formData.phone.trim())` guard at step 2 and submit | Source code audit (Phase 7 hardening) |
| Vendor application API enforces phone (required) | `if (!body.business_name || !body.category || !body.city || !body.phone)` | Source code audit (Phase 7 hardening) |
| Bio minimum 30 chars enforced (form) | `if (formData.bio.trim().length < 30)` guard at submit | Source code audit (Phase 7 hardening) |
| Portfolio URL format enforced (form) | `/^https?:\/\/.+\..+/` regex check on all filled links | Source code audit (Phase 7 hardening) |
| Lifecycle state machine: `applied → under_review → approved` | `vendors.lifecycle_state` column + `trg_sync_vendor_lifecycle` trigger | DB schema (migration 046) |

### Unverified Items

| Item | Why it matters | Required action |
|------|---------------|-----------------|
| ADMIN_EMAILS production value | Without correct admin email, no one receives vendor application alerts | Confirm in Vercel Dashboard |
| Admin email delivery | Email delivery depends on Resend being operational | Resolve Section 3 items |
| Admin can log in to approve vendors | `/admin/vendors` page requires ADMIN_EMAILS match | Manual test |

### Condition for YES

Confirm ADMIN_EMAILS in Vercel Dashboard. Submit a test vendor application and verify admin receives the alert. Log in as admin and approve the vendor.

---

## 5. Customer Registration

**Verdict: GO WITH CAUTION**

### Evidence

| Claim | Evidence | Source |
|-------|----------|--------|
| Supabase project is live | HTTP 200 from `https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/settings` | Direct HTTP call |
| Email authentication enabled | `external.email: true` | `/auth/v1/settings` response |
| Auto-confirm disabled | `mailer_autoconfirm: false` | `/auth/v1/settings` response |
| Signup enabled | `disable_signup: false` | `/auth/v1/settings` response |
| Confirmation email is sent on signup | `mailer_autoconfirm: false` means GoTrue sends a confirmation email | Supabase behaviour (auto-confirm OFF = email required) |

### Unverified Items

| Item | Why it matters | Required action |
|------|---------------|-----------------|
| SITE_URL set to `https://www.elbold.com` | Wrong SITE_URL causes confirmation links to point to wrong domain | Check Supabase Dashboard → Authentication → URL Configuration |
| Redirect URL `https://www.elbold.com/api/auth/callback` registered | Without this, clicking the confirmation link fails with "redirect_uri_mismatch" | Add in Supabase Dashboard |
| Redirect URL `https://www.elbold.com/confirmed` registered | Post-confirmation landing page must be in the allowed list | Add in Supabase Dashboard |
| Confirmation email is delivered | Depends on Resend being operational and domain verified | Resolve Section 3 items |
| End-to-end registration flow tested | Register → email → click link → `/confirmed` | Manual test required |

### Condition for YES

1. Set Supabase SITE_URL to `https://www.elbold.com`
2. Register the two redirect URLs
3. Resolve email delivery (Section 3)
4. Register a real test account and confirm the full flow

---

## Final Verdicts Summary

| Area | Verdict | Primary Gap |
|------|---------|-------------|
| Payment Collection | **GO WITH CAUTION** | Stripe key prefixes and webhook secret unconfirmed without dashboard access |
| Refund Processing | **GO WITH CAUTION** | Code correct; no end-to-end live refund test executed yet |
| Email Delivery | **GO WITH CAUTION** | SPF missing; bounce CNAME missing; Resend domain verified status unconfirmable from CLI |
| Vendor Approval | **GO WITH CAUTION** | Application hardened; ADMIN_EMAILS production value unconfirmed |
| Customer Registration | **GO WITH CAUTION** | Auth live; redirect URLs and SITE_URL cannot be verified without Supabase Management PAT |

**No area achieves YES.** All five require dashboard verification sessions (Vercel, Supabase, Resend, Stripe — approximately 30 minutes total) before any verdict can be upgraded to YES.

**No area is NO.** All five have verified positive signals — live payment, DKIM in DNS, email auth enabled, application hardening complete, Supabase project reachable.

---

## Minimum Required Actions Before Soft Launch

In order of urgency:

1. **Resend DNS** — Add SPF TXT + Bounce CNAME to elbold.com in Cloudflare (15 min)
2. **Resend Dashboard** — Confirm `elbold.com` shows "Verified"; confirm production key is real (5 min)
3. **Supabase Dashboard** — Set SITE_URL + register 2 redirect URLs (5 min)
4. **Vercel Dashboard** — Confirm ADMIN_EMAILS, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET values (10 min)
5. **Stripe Dashboard** — Confirm webhook endpoint registered; refund `pi_3Tg8sL6lIKzSGzKL11qTibsO` (5 min)
6. **End-to-end test** — Register customer account → email confirmation → book vendor → payment → refund (30 min)

**Total unblocking work: ~70 minutes across 4 dashboards + 1 live test.**
