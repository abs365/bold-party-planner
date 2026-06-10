# Go-Live Configuration Checklist
**Version:** 1.0 | **Date:** 2026-06-09
**Purpose:** Pre-launch verification checklist for all configuration and third-party service states.

Each item is marked: **VERIFIED** (fact confirmed from this environment) | **NEEDS DASHBOARD** (exists but value unreadable via CLI) | **MISSING** (confirmed absent)

---

## 1. Email Delivery (Resend)

| # | Item | Status | Evidence / Action |
|---|------|--------|-------------------|
| 1.1 | DKIM record (`resend._domainkey.elbold.com`) | **VERIFIED PRESENT** | DNS TXT record confirmed: RSA 1024-bit public key |
| 1.2 | DMARC record (`_dmarc.elbold.com`) | **VERIFIED PRESENT** | `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` |
| 1.3 | SPF record on `elbold.com` | **VERIFIED MISSING** | `nslookup -type=TXT elbold.com` — no `v=spf1` record found |
| 1.4 | Bounce CNAME (`bounces.elbold.com`) | **VERIFIED MISSING** | `nslookup bounces.elbold.com` — Non-existent domain |
| 1.5 | Resend domain "Verified" status | **NEEDS DASHBOARD** | Cannot check without valid Resend API key; log in to resend.com → Domains |
| 1.6 | RESEND_API_KEY in Vercel production | **NEEDS DASHBOARD** | Var exists (14 days ago, encrypted); confirm value is a real `re_` key |
| 1.7 | Transactional email test (vendor welcome) | **NOT TESTED** | Manual test required after domain verified |
| 1.8 | Transactional email test (booking confirmation) | **NOT TESTED** | Manual test required |
| 1.9 | Transactional email test (refund processed) | **NOT TESTED** | Manual test required |

**Actions required:**
- [ ] Add SPF TXT record on `elbold.com`: `v=spf1 include:_spf.resend.com ~all`
- [ ] Add Bounce CNAME: `bounces.elbold.com → pm.mtasv.net` (or value shown in Resend dashboard)
- [ ] Log in to resend.com and confirm domain `elbold.com` shows "Verified" status
- [ ] Confirm production RESEND_API_KEY in Vercel Dashboard starts with `re_`
- [ ] Send test emails to confirm delivery

---

## 2. Admin Access (ADMIN_EMAILS)

| # | Item | Status | Evidence / Action |
|---|------|--------|-------------------|
| 2.1 | ADMIN_EMAILS var exists in Vercel production | **VERIFIED EXISTS** | `vercel env ls` — encrypted, Production, set 11 days ago |
| 2.2 | ADMIN_EMAILS value (production) | **NEEDS DASHBOARD** | Cannot read encrypted value; confirm in Vercel Dashboard |
| 2.3 | Admin email is real and monitored | **NEEDS CONFIRMATION** | Local dev value: `blue2gtv@gmail.com`; production value unknown |
| 2.4 | Code parsing handles multiple emails | **VERIFIED CORRECT** | `.split(",").map(e => e.trim()).filter(Boolean)` in all 3 usages |
| 2.5 | Admin receives vendor application alerts | **NOT TESTED** | Depends on ADMIN_EMAILS value being correct |
| 2.6 | Admin receives refund failure alerts | **NOT TESTED** | Depends on ADMIN_EMAILS value and Resend delivery |

**Actions required:**
- [ ] Open Vercel Dashboard → Settings → Environment Variables → confirm ADMIN_EMAILS value
- [ ] Submit a test vendor application and verify admin receives the alert email

---

## 3. Supabase Auth

| # | Item | Status | Evidence / Action |
|---|------|--------|-------------------|
| 3.1 | Project reachable | **VERIFIED** | HTTP 200 from `https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/settings` |
| 3.2 | Email authentication enabled | **VERIFIED** | `external.email: true` from `/auth/v1/settings` |
| 3.3 | Email auto-confirm disabled | **VERIFIED** | `mailer_autoconfirm: false` — users must confirm via email link |
| 3.4 | New user signup enabled | **VERIFIED** | `disable_signup: false` |
| 3.5 | SITE_URL set to `https://www.elbold.com` | **NEEDS DASHBOARD** | Cannot read via service role key; Management API requires PAT |
| 3.6 | Redirect URL: `https://www.elbold.com/api/auth/callback` | **NEEDS DASHBOARD** | Required for email confirmation flow; cannot verify via API |
| 3.7 | Redirect URL: `https://www.elbold.com/confirmed` | **NEEDS DASHBOARD** | Required for post-confirmation landing |
| 3.8 | Email confirmation flow end-to-end | **NOT TESTED** | Register → email → click link → `/confirmed` page |

**Actions required:**
- [ ] Open Supabase Dashboard → Authentication → URL Configuration
- [ ] Set Site URL: `https://www.elbold.com`
- [ ] Add to Redirect URLs: `https://www.elbold.com/api/auth/callback`
- [ ] Add to Redirect URLs: `https://www.elbold.com/confirmed`
- [ ] Register a test account and complete the email confirmation flow

---

## 4. Stripe Payments

| # | Item | Status | Evidence / Action |
|---|------|--------|-------------------|
| 4.1 | STRIPE_SECRET_KEY exists in Vercel production | **VERIFIED EXISTS** | `vercel env ls` — encrypted, Production+Preview, set 15 days ago |
| 4.2 | STRIPE_SECRET_KEY is `sk_live_*` prefix | **NEEDS DASHBOARD** | Cannot verify prefix via CLI; local key has non-standard `mk_` prefix |
| 4.3 | NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is `pk_live_*` | **NEEDS DASHBOARD** | Cannot verify; needed for client-side Stripe Elements |
| 4.4 | Stripe webhooks configured | **NEEDS DASHBOARD** | Webhook endpoint `https://www.elbold.com/api/webhooks/stripe` must be registered |
| 4.5 | STRIPE_WEBHOOK_SECRET in Vercel | **NEEDS DASHBOARD** | Required for webhook signature verification |
| 4.6 | Live payment processed | **VERIFIED** | `pi_3Tg8sL6lIKzSGzKL11qTibsO` — GBP 1.00 succeeded in prior session |
| 4.7 | Live refund tested | **NOT TESTED** | Manual refund test required after ADMIN_EMAILS + Resend resolved |
| 4.8 | Pending refund: `pi_3Tg8sL6lIKzSGzKL11qTibsO` | **OPEN ACTION** | Refund GBP 1.00 in Stripe Dashboard |
| 4.9 | `refund_amount` written to bookings row | **VERIFIED (code)** | Fixed in this sprint — BUG-002 resolution |

**Actions required:**
- [ ] Open Vercel Dashboard → confirm STRIPE_SECRET_KEY starts with `sk_live_`
- [ ] Open Vercel Dashboard → confirm NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY starts with `pk_live_`
- [ ] Open Stripe Dashboard → Developers → Webhooks → confirm `https://www.elbold.com/api/webhooks/stripe` is registered
- [ ] Confirm STRIPE_WEBHOOK_SECRET matches the webhook signing secret in Vercel env
- [ ] Manually refund `pi_3Tg8sL6lIKzSGzKL11qTibsO` (GBP 1.00) in Stripe Dashboard

---

## 5. Critical Infrastructure

| # | Item | Status | Evidence / Action |
|---|------|--------|-------------------|
| 5.1 | Supabase service role key in Vercel | **VERIFIED EXISTS** | `vercel env ls` shows `SUPABASE_SERVICE_ROLE_KEY` |
| 5.2 | Supabase anon key in Vercel | **VERIFIED EXISTS** | `vercel env ls` shows `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| 5.3 | Supabase project URL in Vercel | **VERIFIED EXISTS** | `NEXT_PUBLIC_SUPABASE_URL=https://vibqrgswyineyxmsrtsh.supabase.co` |
| 5.4 | Vercel deployment active | **VERIFIED** | Project exists, env vars set, most recent deploy accessible |
| 5.5 | Custom domain `www.elbold.com` → Vercel | **NEEDS CONFIRMATION** | DNS `www` CNAME/A record must point to Vercel |
| 5.6 | SSL certificate for `www.elbold.com` | **NEEDS CONFIRMATION** | Vercel auto-provisions; confirm in Vercel Dashboard → Domains |
| 5.7 | Error monitoring (Sentry) | **NOT CONFIGURED** | No Sentry env vars seen — blocking item for Public Launch |

**Actions required:**
- [ ] Confirm `www.elbold.com` is pointing to Vercel in Vercel Dashboard → Domains
- [ ] Confirm SSL certificate is provisioned and active

---

## Pre-Soft-Launch Sign-Off

All items in rows 1.1–5.4 (excluding NOT TESTED items requiring manual tests) must be either VERIFIED or resolved before soft launch.

| Gate | Status |
|------|--------|
| SPF record added | NOT DONE |
| Bounce CNAME added | NOT DONE |
| Resend domain shows "Verified" | UNCONFIRMED |
| RESEND_API_KEY value confirmed | UNCONFIRMED |
| ADMIN_EMAILS value confirmed | UNCONFIRMED |
| Supabase SITE_URL set to production | UNCONFIRMED |
| Supabase redirect URLs registered | UNCONFIRMED |
| Stripe secret key confirmed `sk_live_` | UNCONFIRMED |
| Stripe webhook registered and secret confirmed | UNCONFIRMED |
| Pending Stripe refund `pi_3Tg8sL6lIKzSGzKL11qTibsO` refunded | OPEN |
| Email confirmation flow tested | NOT TESTED |
| Admin alert email tested | NOT TESTED |

**Dashboard sessions needed:** Resend, Vercel, Supabase, Stripe — total estimated time: 30 minutes.
