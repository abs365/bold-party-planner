# Bold Party Planner — Environment Discipline

**Version:** 1.0

---

## Environment Overview

| Environment | Purpose | Supabase Project | Vercel Target | Seed Data |
|---|---|---|---|---|
| **Local** | Development, feature work | Dev/shared Supabase | `npm run dev` | Demo + E2E seed |
| **CI** | Automated test gate | Dev/shared Supabase | `npm start` (built artifact) | E2E seed via global.setup |
| **Staging** | Pre-production validation | Separate staging project | Vercel preview or dedicated | Demo seed only |
| **Production** | Live user traffic | Production Supabase project | Vercel production | None — real user data only |

---

## Isolation Rules

### Secrets isolation

Each environment must use **separate, non-overlapping** secrets:

| Secret | Local | Staging | Production |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Dev project URL | Staging project URL | Production project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Dev service role | Staging service role | Production service role |
| `STRIPE_SECRET_KEY` | Stripe test key | Stripe test key | Stripe live key |
| `RESEND_API_KEY` | Resend test key | Resend test key | Resend production key |

**Rules:**
- Production service role key must never exist in `.env.local`, CI secrets for non-production runs, or staging configs
- Staging must use Stripe test keys — never live keys
- Local `.env.local` must never reference the production Supabase URL

### Supabase project isolation

- **One Supabase project per environment tier** (local dev, staging, production)
- Migrations tested on local/staging before applying to production
- RLS policies validated on staging before production
- Never run `supabase/migrations/019_force_demo_auth_cleanup.sql` on production

### Storage bucket isolation

- Each Supabase project has its own isolated `vendor-media` and `verification-documents` buckets
- Staging uploads do not pollute production storage
- Production storage URLs are never referenced from staging or local

### Analytics isolation

- `analytics_events` in the staging project captures staging traffic only
- Do not use production analytics data for dev/test queries
- Do not seed fake analytics events into production

---

## Seed Data Discipline

### What can be seeded where

| Seed type | Local | CI | Staging | Production |
|---|---|---|---|---|
| Demo users (9 fixed accounts) | ✅ | ✅ | ✅ | ❌ |
| E2E fixture data (packages, bookings, etc.) | ✅ | ✅ | ❌ | ❌ |
| Real user data | ❌ | ❌ | ❌ | Organic only |

### Seed endpoint guards

`/api/dev/seed-e2e` enforces:
```typescript
if (process.env.NODE_ENV === "production" && !process.env.CI) {
  return NextResponse.json({ error: "Not available in production" }, { status: 403 });
}
```

`CI=true` bypasses this guard for automated test runs. The `CI` env var is **never set on real Vercel production deployments**.

`/api/auth/create-demo-users` is guarded by a demo secret (`BOLD_PARTY_DEMO_2026`) and only creates the 9 fixed demo accounts. It does not delete or modify real users.

### Protection against accidental production seeds

1. The seed endpoint requires `CI=true` in production mode — Vercel never sets this
2. Demo user creation is idempotent and scoped to `*@boldparty.demo` emails only
3. Seed data uses fixed UUIDs (`a0000001-...`, `b0000001-...`) — never overlapping with real user UUIDs

---

## Preventing Local → Production Writes

### Environment variable hygiene

- Never copy production `.env` values into `.env.local`
- Use separate Supabase projects for dev and production (different URLs, different keys)
- If you must inspect production data: use the Supabase Dashboard SQL Editor directly — never connect a local client to the production Supabase URL

### Code-level guard

Any destructive or seeding operation must check environment:

```typescript
// Before any destructive dev operation
if (process.env.NODE_ENV === "production" && !process.env.CI) {
  throw new Error("This operation is not allowed in production");
}
```

---

## Environment Variable Checklist

### Required for local development (`.env.local`)

```bash
# Supabase (dev project)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Payments (Stripe test keys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# AI
OPENAI_API_KEY=sk-...

# Auth
ADMIN_EMAILS=admin@boldparty.demo,your-real-email@example.com

# Cron
CRON_SECRET=any-local-secret

# Sentry (optional for local)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_DSN=
```

### Required Vercel environment variables (production)

Same variables as above, with production values. Set in:
**Vercel Dashboard → Project → Settings → Environment Variables**

Scope each secret to the correct environment (Production / Preview / Development) in Vercel.

---

## Adding a New Environment Variable

1. Add to `.env.local` for local development
2. Document in `docs/github-actions.md` → Required GitHub Secrets
3. Add to `.github/workflows/ci.yml` (both `build` and `e2e` jobs if needed)
4. Add to Vercel Dashboard for staging and production deployments
5. Update this file with the new variable's isolation rules if relevant
