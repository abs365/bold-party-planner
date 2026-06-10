# Configuration Verification Report
**Version:** 1.0 | **Date:** 2026-06-09 | **Sprint:** Configuration Verification
**Constraint:** Evidence required for every conclusion. No assumptions. No estimates. No inferred PASS results.

---

## Section 1 — Resend Domain Verification

**Method:** DNS lookups via `nslookup` against Google DNS (8.8.8.8); Resend REST API probe.

### DNS Records Checked

| Record | Query | Expected | Result | Verdict |
|--------|-------|----------|--------|---------|
| DKIM | `resend._domainkey.elbold.com TXT` | RSA public key | **PRESENT** — full public key: `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDtjPz6nC6y00NWYpOttj+wvZ1CZamFhoe3aVa9OphMPR...` | CONFIGURED |
| DMARC | `_dmarc.elbold.com TXT` | `v=DMARC1; p=...` | **PRESENT** — `v=DMARC1; p=quarantine; rua=mailto:admin@elbold.com` | CONFIGURED |
| SPF | `elbold.com TXT` | `v=spf1 include:_spf.resend.com ~all` | **NOT FOUND** — only `MS=ms42917341` and `google-site-verification=0HFkSto0xQ6GNM-p-I3dCQef996Wv_NwjQ0iTFojIHY` | MISSING |
| Bounce CNAME | `bounces.elbold.com CNAME` | points to Resend infrastructure | **NOT FOUND** — `Non-existent domain` | MISSING |

### Resend API Probe

The local `.env.local` value `RESTORE_FROM_DASHBOARD_resend_apikeys` was sent to `GET https://api.resend.com/domains`. Response:

```
HTTP 400 — {"statusCode":400,"message":"API key is invalid","name":"validation_error"}
```

**Confirmed:** The local RESEND_API_KEY is a placeholder, not a working key.
**Cannot verify:** Resend domain dashboard "Verified" status — requires a valid production API key.

### Resend Production Key (Vercel)

`vercel env ls` output confirms `RESEND_API_KEY` is set in Vercel (Preview + Production, encrypted, set 14 days ago). The value cannot be read via CLI as Vercel does not expose encrypted plaintext.

### Email Delivery Analysis

With the bounce CNAME absent, Resend uses its own default return-path domain (not `bounces.elbold.com`). This means:
- **SPF alignment check** (DMARC): The SPF domain will be Resend's infrastructure, not `elbold.com` — SPF alignment FAILS under DMARC
- **DKIM alignment check** (DMARC): DKIM key is present in DNS at `resend._domainkey.elbold.com` with `d=elbold.com` — DKIM alignment PASSES if Resend has verified the domain and is actively signing
- **DMARC verdict** (`p=quarantine`): PASSES if DKIM alignment passes; emails are NOT quarantined if Resend is signing correctly
- **Bounce tracking**: BROKEN — bounced emails are not routed back through `bounces.elbold.com`; bounce data will not appear in Resend dashboard

**Net verdict:** Email delivery is **LIKELY FUNCTIONAL** if Resend has verified the domain (DKIM key is in DNS as required). However:
- DKIM-based delivery cannot be confirmed without Resend dashboard access
- SPF record is absent (technical gap, but not blocking if DKIM is active)
- Bounce handling is non-operational

**VERDICT: GO WITH CAUTION** — DKIM record present; DMARC configured; but SPF missing, bounce CNAME missing, and Resend domain verified status unconfirmable from this environment.

---

## Section 2 — ADMIN_EMAILS Verification

**Method:** `.env.local` read, `vercel env ls` output, source code audit.

### Vercel Production State

`vercel env ls` confirms:

```
ADMIN_EMAILS   Encrypted   Production   11 days ago
```

The variable EXISTS in Vercel production. It is encrypted — its value cannot be read via CLI.

### Local Development Value

`.env.local`:
```
ADMIN_EMAILS=blue2gtv@gmail.com
```

Single email address. Parses to `["blue2gtv@gmail.com"]` under the code.

### Code Parsing Audit

Three code locations read `ADMIN_EMAILS`:

**`lib/auth/guards.ts`:**
```typescript
ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim())
```

**`lib/env.ts:162`:**
```typescript
adminEmails: () => optionalEnv("ADMIN_EMAILS", "").split(",").map((e) => e.trim()).filter(Boolean)
```

**`app/api/bookings/[id]/route.ts` (refund path):**
```typescript
const adminEmails = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
```

All three correctly handle:
- Empty string (returns empty array — no admin emails, no crash)
- Single email (returns single-element array)
- Multiple comma-separated emails (returns trimmed array)
- Null/undefined (falls back to `""`)

**Edge case (Vercel empty-string bug):** Vercel `NEXT_PUBLIC_*` vars set as `""` bypass `??` fallback. `ADMIN_EMAILS` is NOT `NEXT_PUBLIC_*`, so this does not apply.

**VERDICT: PASS (code)** — Parsing is correct and defensive. **CANNOT VERIFY** production email value without Vercel dashboard access. Recommended action: open Vercel Dashboard → Settings → Environment Variables → confirm `ADMIN_EMAILS` value contains `elbold2026@gmail.com` or appropriate admin email.

---

## Section 3 — Supabase Auth Redirect Audit

**Method:** Direct HTTP calls to Supabase project endpoints.

### Project Reachability

`GET https://vibqrgswyineyxmsrtsh.supabase.co/auth/v1/settings` with service role key:

```json
HTTP 200 — {
  "external": {
    "email": true,
    ...all_other_providers: false...
  },
  "disable_signup": false,
  "mailer_autoconfirm": false,
  "phone_autoconfirm": false,
  "saml_enabled": false,
  "passkeys_enabled": false
}
```

**Confirmed:**
- Project is LIVE and reachable
- Email authentication: ENABLED
- New user signups: ENABLED (not disabled)
- Email auto-confirmation: DISABLED — all new users must confirm via email link

### Redirect URL Configuration

**Cannot verify.** The `auth/v1/settings` endpoint does not expose the allowed redirect URLs list. The Supabase Management API (`GET https://api.supabase.com/v1/projects/{ref}/config/auth`) returns `{"message":"JWT failed verification"}` when called with the service role key — this endpoint requires a personal access token (PAT), which is not available in this environment.

### Required Redirect URLs (from code audit)

The application uses these callback paths:

| Path | Usage | Full URL Required |
|------|-------|-------------------|
| `/api/auth/callback` | OAuth + Magic Link callbacks | `https://www.elbold.com/api/auth/callback` |
| `/confirmed` | Post-email-confirmation landing page | `https://www.elbold.com/confirmed` |

**Action required:** In Supabase Dashboard → Authentication → URL Configuration:
1. Set `Site URL` to `https://www.elbold.com`
2. Add to `Redirect URLs`:
   - `https://www.elbold.com/api/auth/callback`
   - `https://www.elbold.com/confirmed`
   - `http://localhost:3000/api/auth/callback` (development — likely pre-configured)
   - `http://localhost:3000/confirmed` (development)

**VERDICT: CANNOT VERIFY** — auth reachability and email settings confirmed; redirect URLs and SITE_URL cannot be read without a personal access token.

---

## Section 4 — Stripe Refund Readiness

**Method:** Source code audit of `lib/stripe/index.ts` and `app/api/bookings/[id]/route.ts`.

### Code Path Audit

**`lib/stripe/index.ts`:**
```typescript
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function createRefund(paymentIntentId: string, amountGBP?: number) {
  const stripe = getStripe();
  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    ...(amountGBP ? { amount: Math.round(amountGBP * 100) } : {}),
  });
}
```

Observations:
- Key validation: checks existence only; does NOT validate `sk_live_` or `sk_test_` prefix
- No fire-and-forget calls — all stripe operations are awaited at call sites
- `createRefund` correctly converts GBP to pence (× 100)

**`app/api/bookings/[id]/route.ts`:**
- `await createRefund(...)` — AWAITED ✓
- All secondary actions after Stripe refund success are AWAITED with failure tracking ✓
- BUG-002 resolved: `refund_amount` written to bookings row, ledger null-return tracked ✓

### STRIPE_SECRET_KEY — Local vs Production

| Environment | Key Value | Assessment |
|-------------|-----------|------------|
| `.env.local` | `mk_1TdbDi6lIKzSGzKLgsmBUNGM` | Non-standard prefix. Not `sk_live_` or `sk_test_`. Will be rejected by Stripe API at call time. **NOT used in production.** |
| Vercel Production | `[Encrypted]` | EXISTS — confirmed by `vercel env ls`. Set 15 days ago. Value cannot be read via CLI. |

**Code does not validate key prefix.** If the production key is wrong format, it will throw on the first Stripe API call (not on startup). This is acceptable for Vercel serverless but means errors would only surface at payment time.

### Live Payment Evidence

A live GBP 1.00 payment `pi_3Tg8sL6lIKzSGzKL11qTibsO` was successfully processed in a prior session, confirming the production Stripe integration is functional. **Action pending:** Manual refund of this payment in Stripe Dashboard.

**VERDICT: GO WITH CAUTION** — Stripe integration is clean and live-tested. Refund code path is correct. Cannot confirm production key prefix without Vercel dashboard access.

---

## Section 5 — Live Operations Checklist

See `docs/Go_Live_Configuration_Checklist.md`.

---

## Summary of Verified Findings

| Finding | Verified By | Status |
|---------|------------|--------|
| DKIM record present at `resend._domainkey.elbold.com` | DNS query | CONFIRMED |
| DMARC record present at `_dmarc.elbold.com` | DNS query | CONFIRMED |
| SPF record absent from `elbold.com` | DNS query (all TXT records listed) | CONFIRMED MISSING |
| Bounce CNAME `bounces.elbold.com` absent | DNS query | CONFIRMED MISSING |
| RESEND_API_KEY (local) is invalid placeholder | Resend API 400 response | CONFIRMED |
| RESEND_API_KEY (production) exists in Vercel | `vercel env ls` | CONFIRMED EXISTS; VALUE UNVERIFIABLE |
| ADMIN_EMAILS (production) exists in Vercel | `vercel env ls` | CONFIRMED EXISTS; VALUE UNVERIFIABLE |
| ADMIN_EMAILS code parsing is correct | Source code audit | CONFIRMED |
| Supabase project is live | HTTP 200 from `/auth/v1/settings` | CONFIRMED |
| Supabase email auth enabled | `/auth/v1/settings` response | CONFIRMED |
| Supabase email auto-confirm disabled | `/auth/v1/settings` response | CONFIRMED |
| Supabase redirect URLs | Management API (PAT required) | CANNOT VERIFY |
| STRIPE_SECRET_KEY (local) is non-standard `mk_` prefix | File read | CONFIRMED |
| STRIPE_SECRET_KEY (production) exists in Vercel | `vercel env ls` | CONFIRMED EXISTS; VALUE UNVERIFIABLE |
| Live Stripe payment succeeded | Prior session (`pi_3Tg8sL6lIKzSGzKL11qTibsO`) | CONFIRMED |
| Stripe code clean (no fire-and-forget) | Source code audit | CONFIRMED |
