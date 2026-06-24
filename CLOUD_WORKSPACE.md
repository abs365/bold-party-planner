# ELBOLD — Cloud Workspace Guide

This repository is configured for development in **GitHub Codespaces** and **VS Code for the Web** with zero local installation required.

---

## ⚠ ELBOLD PRODUCTION SAFETY NOTICE

ELBOLD processes **real GBP payments** and sends **transactional emails** to real vendors and customers. Before running this app in a Codespace, read this section in full. The app has code-level guards that enforce these rules — they are not just documentation.

---

### Stripe — test keys enforced by code

**Rule: STRIPE_SECRET_KEY must be a test key (`sk_test_*` or `rk_test_*`).**

The app calls `assertStripeKey()` before every Stripe API operation. This function throws an error and aborts the operation if it detects a live key (`sk_live_*` or `rk_live_*`) when `VERCEL_ENV` is not `"production"`. `VERCEL_ENV` is injected by Vercel's build system and is always absent in Codespace — so the live key guard fires in every Codespace, every time.

**What happens if you use a live key in Codespace:**
```
Error: STRIPE_SECRET_KEY is a live key (sk_live_...) but this is not a Vercel
production deployment (VERCEL_ENV is not "production"). Live keys create real
GBP charges. Use a test key (sk_test_* or rk_test_*) in local dev, GitHub
Codespaces, and preview deployments.
Get a test key: Stripe Dashboard → Developers → API Keys → toggle Test mode.
```

**How to get a test key:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys
2. Toggle **Test mode** in the top-right corner
3. Copy the **Secret key** (starts with `sk_test_`)
4. Set it as a Codespace secret: `STRIPE_SECRET_KEY`

**STRIPE_WEBHOOK_SECRET in Codespace:**
Set to any test webhook secret from Stripe Dashboard → Webhooks → Test mode. Stripe does not send real webhook events to Codespace URLs (they are not registered), so this value is only checked if you manually call the webhook endpoint — which you should not need to do in Codespace.

**NEVER** set a live Stripe key (`sk_live_*`) as a Codespace secret.

---

### Resend — emails suppressed by default

**Rule: No real emails are sent from Codespace unless you explicitly opt in.**

The `send()` function in all three Resend modules checks `VERCEL_ENV`. When it is not `"production"`, emails are suppressed by default — the function returns `{ success: true }` immediately without making any network call to Resend. This means:

- All email-triggering flows (booking requests, vendor approvals, payment confirmations, etc.) complete normally with no errors
- No email is delivered to any real address
- No Resend API call is made — `RESEND_API_KEY` is not even needed for suppressed sends

**Safe testing workflow — two options:**

**Option 1 (default): Leave `RESEND_DEV_OVERRIDE_EMAIL` unset**

All emails are suppressed. Use this when you are testing features and do not need to inspect the actual email content. All booking, vendor, and payment flows work normally — only the email delivery step is a no-op.

**Option 2 (opt-in): Set `RESEND_DEV_OVERRIDE_EMAIL=you@yourdomain.com`**

All emails are redirected to your address instead of the real recipient. The subject line is prefixed with `[DEV → original@recipient.com]` so you can see who the intended recipient was:

```
Subject: [DEV → vendor@business.com] New booking request for James's Birthday Party | Elbold
Subject: [DEV → customer@personal.com] Booking Accepted!
```

This lets you test the full email flow — content, formatting, multi-party flows — without any real customer or vendor receiving anything.

To use Option 2:
1. Set `RESEND_API_KEY` to your Resend API key (personal account)
2. Set `RESEND_DEV_OVERRIDE_EMAIL` to your own email address
3. Both must be set as Codespace secrets

**NEVER** set `RESEND_DEV_OVERRIDE_EMAIL` to a real customer or vendor email.

---

### Supabase — use a development project

**Rule: Codespace secrets must point to a dedicated development Supabase project.**

ELBOLD's admin client (`createAdminClient()`) uses the service role key and **bypasses all Row Level Security policies**. If you set production Supabase credentials in your Codespace secrets, any admin route that runs in the Codespace directly affects real user data.

**Setup:**
1. Create a separate Supabase project at [app.supabase.com](https://app.supabase.com) for development
2. Apply all migrations: `npx supabase db push` (requires Supabase CLI)
3. Use the dev project's URL and keys in your Codespace secrets

Seed the dev project using the built-in seed route (available in non-production):
```
POST /api/auth/create-demo-users  { "secret": "<DEMO_SECRET value>" }
POST /api/dev/seed-e2e            { "secret": "<SEED_SECRET value>" }
```

**NEVER** set production Supabase credentials as Codespace secrets.

---

## Quick Start

1. Go to `github.com/abs365/bold-party-planner`
2. Click **Code → Codespaces → Create codespace on main**
3. Wait ~2 minutes — the container builds and `npm install` runs automatically
4. Set Codespace secrets (see Required Secrets below)
5. **Stop and restart the Codespace** to inject the secrets
6. Run `npm run dev` → click **Open in Browser** when port 3000 appears

On subsequent uses: **resume** the existing Codespace rather than creating a new one. Resuming is instant and retains editor state.

---

## Required Secrets

Set these in: **GitHub → Repository → Settings → Secrets and variables → Codespaces → New repository secret**

After adding or changing any secret, stop the Codespace completely and restart it — secrets are injected at container startup only.

| Secret | Constraint | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dev project only | Supabase → Project → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Dev project only | Supabase → Project → Settings → API → anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev project only | Supabase → Project → Settings → API → service_role key |
| `STRIPE_SECRET_KEY` | ⚠️ **`sk_test_*` ONLY** | Stripe Dashboard → Developers → API Keys → Test mode |
| `STRIPE_WEBHOOK_SECRET` | Test webhook secret | Stripe Dashboard → Webhooks → Test mode |
| `RESEND_API_KEY` | Personal test account | resend.com/api-keys |
| `OPENAI_API_KEY` | Any valid key | platform.openai.com/api-keys |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Set literally to this value |

---

## Optional Secrets

| Secret | Feature | Behaviour when absent |
|---|---|---|
| `RESEND_DEV_OVERRIDE_EMAIL` | Email redirect in dev | Emails suppressed (safe default) |
| `ADMIN_EMAILS` | `/admin` dashboard | Admin routes return 403 |
| `UPSTASH_REDIS_REST_URL` + `_TOKEN` | Rate limiting | Fails open — all requests pass |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Pro subscription | Subscription flows error |
| `STRIPE_FEATURED_PRICE_ID` | Featured listing | Feature returns error |
| `CRON_SECRET` | Cron endpoint auth | Cron routes are unprotected |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` + `VAPID_SUBJECT` | Push notifications | Push silently disabled |
| `TELEGRAM_BOT_TOKEN` | Telegram alerts | Silently disabled |
| `SENTRY_DSN` | Error tracking | Silently disabled |
| `SEED_SECRET` | `/api/dev/seed-e2e` guard | Default fallback used (set own value) |
| `DEMO_SECRET` | `/api/auth/create-demo-users` guard | Default fallback used (set own value) |
| `DEMO_PASSWORD` | Demo user password | Default fallback used (set own value) |

**Secrets to NEVER set in Codespace:**
- `STRIPE_SECRET_KEY` with a live key (`sk_live_*`)
- Production Supabase credentials
- `STRIPE_CONNECT_ENABLED=true` (Stripe Connect platform pending approval)

---

## Dev Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 (Turbopack) |
| `npm run build` | Production build — confirms no type or compile errors |
| `npx tsc --noEmit` | Type-check without building |
| `npm run lint` | ESLint check across all source files |

---

## Workflow

```
1. Resume Codespace (or create one)
2. Confirm npm install ran (check terminal — runs automatically on create)
3. Confirm secrets are set → restart Codespace if you just added them
4. Run: npm run dev
5. Make changes — hot-reloads via Turbopack
6. Stage and commit from the Source Control panel (or terminal)
7. Push: git push
8. Stop the Codespace when done (saves billing minutes)
```

---

## Seeding the Dev Database

Two seed routes are available in non-production (they return 403 in `VERCEL_ENV=production`):

**1. Create demo users**
```bash
curl -X POST http://localhost:3000/api/auth/create-demo-users \
  -H "Content-Type: application/json" \
  -d '{"secret":"<your DEMO_SECRET value>"}'
```

Creates 9 demo users (5 vendors, 3 customers, 1 admin) with fixed UUIDs and the password from `DEMO_PASSWORD`.

**2. Seed E2E data**
```bash
curl -X POST http://localhost:3000/api/dev/seed-e2e \
  -H "Content-Type: application/json" \
  -d '{"secret":"<your SEED_SECRET value>"}'
```

Creates demo vendors, events, bookings, quotes, and messages linked to the demo user UUIDs.

Both routes require the dev Supabase project to have all migrations applied.

---

## Codespace Resources

- **Machine type:** 2-core / 8GB RAM is sufficient for development
- **Storage:** ~1.5–2GB (Node.js image + node_modules)
- **Billing:** GitHub provides 120 free core-hours/month (Free plan). Stop Codespaces when not in use.
- **Ports:** Port 3000 is forwarded automatically. Private by default — make public only if needed.

---

## Troubleshooting

**`STRIPE_SECRET_KEY is a live key` error**
→ You have a live key set as a Codespace secret. Replace it with a test key (`sk_test_*`). Go to Stripe Dashboard → Developers → API Keys → toggle Test mode.

**Stripe checkout returns 500 — `NEXT_PUBLIC_APP_URL is not set`**
→ Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` as a Codespace secret and restart.

**Emails not arriving during testing**
→ Emails are suppressed by default in Codespace. Set `RESEND_DEV_OVERRIDE_EMAIL` to your email address and `RESEND_API_KEY` to your Resend key, then restart the Codespace.

**App crashes on startup — Supabase auth errors**
→ `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is missing. Confirm both are set in Codespace secrets and that you restarted after setting them.

**`SUPABASE_SERVICE_ROLE_KEY` error on admin or seeding routes**
→ The admin client needs the service role key from your dev Supabase project. Set `SUPABASE_SERVICE_ROLE_KEY` as a Codespace secret and restart.

**Secrets not being picked up**
→ Secrets are injected at container startup only. After adding or changing any secret in GitHub, stop the Codespace completely and start it again. Reloading VS Code or the terminal is not sufficient.

**`npm install` didn't run / `node_modules` missing**
→ Run `bash .devcontainer/setup.sh` in the terminal to re-run setup manually.

**TypeScript errors in the editor that don't fail the build**
→ Open Command Palette (`Ctrl+Shift+P`) → "TypeScript: Select TypeScript Version" → "Use Workspace Version". The `typescript.tsdk` setting in `devcontainer.json` handles this on first open.

**Port 3000 not appearing in the Ports tab**
→ Port only appears after `npm run dev` has started and bound to 3000. Start the dev server first.

**Rate limiting not working**
→ Without `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`, rate limiting is disabled and all requests pass. This is intentional for Codespace development. Add Upstash credentials if you need rate limiting behaviour for testing.
