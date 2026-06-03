# Supabase Auth Configuration

This document records every Supabase Authentication setting required for ELBOLD to work correctly.
Complete ALL settings before running any live user test.

---

## Authentication > URL Configuration

### Site URL

| Environment | Value |
|---|---|
| Local development | `http://localhost:3000` |
| Production | `https://www.elbold.com` |

Set the Site URL to the **current active environment** (swap when promoting to production).

### Redirect URLs

All of these must be present simultaneously. Supabase matches the `emailRedirectTo` value sent
by the signup API against this list. If the URL is not listed, email confirmation silently fails
and the user cannot sign in.

```
http://localhost:3000/api/auth/callback
http://localhost:3000/dashboard
http://localhost:3000/vendor/dashboard
http://localhost:3000/vendor/apply
https://www.elbold.com/api/auth/callback
https://www.elbold.com/dashboard
https://www.elbold.com/vendor/dashboard
https://www.elbold.com/vendor/apply
```

When Vercel preview deployments are active, also add:
```
https://<project-name>-*.vercel.app/api/auth/callback
```

---

## How the callback URL is sent

`app/(auth)/signup/page.tsx` sends:
```typescript
emailRedirectTo: `${window.location.origin}/api/auth/callback`
```

`app/api/auth/callback/route.ts` then:
1. Exchanges the `code` query parameter for a Supabase session
2. Reads `profiles.role` from the DB (with `user_metadata.role` as fallback)
3. Redirects:
   - Admin email → `/admin`
   - `role = vendor`, vendor record exists → `/vendor/dashboard`
   - `role = vendor`, no vendor record → `/vendor/apply`
   - `role = customer` → `/dashboard`
   - Role missing → `/onboarding`

---

## Authentication > Email Templates

Supabase sends the confirmation email using its built-in template by default.
If you have configured a custom SMTP provider (Resend), verify:

1. **Resend Dashboard → Domains** — SPF and DKIM must both show `Verified`
2. **Supabase Auth → SMTP Settings** — host, port, username, password all correct
3. **From address** — must match a verified sender in Resend

If using Supabase's default SMTP (for local/staging), no action needed.

---

## Authentication > Email Confirmation

| Setting | Required value |
|---|---|
| Enable email confirmations | ON |
| Secure email change | ON (recommended) |
| Double confirm email changes | ON (recommended) |

---

## Environment Variables (Vercel + .env.local)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-only) |
| `ADMIN_EMAILS` | Yes | Comma-separated admin emails (e.g. `admin@elbold.com`) |
| `RESEND_API_KEY` | Yes | Resend API key for transactional emails |
| `RESEND_FROM_EMAIL` | Yes | Verified sender address |

---

## Verification Checklist

Run this before each major environment (local → staging → production):

- [ ] Site URL set correctly for this environment
- [ ] All redirect URLs present in Supabase
- [ ] `ADMIN_EMAILS` env var includes at least one admin address
- [ ] Email provider (Resend or Supabase SMTP) tested with a real inbox
- [ ] `handle_new_user` trigger confirmed active (Supabase → Database → Triggers)
- [ ] Migration 009 applied (`schema_grants_fix` — prevents "database error querying schema")
- [ ] Migration 017 applied (`demo_user_fix` — `ON CONFLICT DO NOTHING` in trigger)
- [ ] Manual QA Tests A–D pass (see `docs/vendor-email-confirmation-qa.md`)

---

## Local Development Quick Start

1. Copy `.env.example` to `.env.local` and fill in values
2. In Supabase Dashboard, set Site URL to `http://localhost:3000`
3. Add `http://localhost:3000/api/auth/callback` to Redirect URLs
4. Run `npm run dev`
5. Test signup at `http://localhost:3000/signup`

Supabase sends confirmation emails to the real address in local dev unless you configure
Inbucket (Supabase local development email trap). For simplest local testing, use a real
email address you can access.
