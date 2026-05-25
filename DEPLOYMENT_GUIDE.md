# Bold Party — Deployment Guide

Complete step-by-step guide to deploy Bold Party Event Planner to production.

---

## Prerequisites

- Node.js 18+ installed
- A Vercel account (vercel.com)
- A Supabase account (supabase.com)
- A Stripe account (stripe.com)
- A Resend account (resend.com)
- An OpenAI account (platform.openai.com)
- A domain name (e.g. boldparty.co.uk)

---

## Step 1: Supabase Setup

### 1.1 Create a new Supabase project

1. Go to app.supabase.com → New Project
2. Choose a region close to your users (e.g. eu-west-1 for UK)
3. Set a strong database password — save it securely
4. Wait for provisioning (~2 minutes)

### 1.2 Run Database Migrations

In the Supabase dashboard → SQL Editor, run migrations **in order**:

```
supabase/migrations/001_initial.sql
supabase/migrations/002_phase2.sql
supabase/migrations/003_phase3.sql
supabase/migrations/004_phase4.sql
supabase/migrations/005_phase5.sql
supabase/migrations/006_phase6.sql
supabase/migrations/007_phase7.sql
supabase/migrations/008_data_consistency_fix.sql
supabase/migrations/009_schema_grants_fix.sql   ← REQUIRED: fixes auth errors
supabase/migrations/010_trigger_and_category_fix.sql  ← REQUIRED: robust trigger + 'other' category
supabase/migrations/011_marketplace_operations.sql  ← Adds lead scoring, saved vendors, invitations tables
```

Copy the contents of each file into the SQL Editor and run them one at a time.

> **IMPORTANT — Migration 009 is mandatory.** Without it, PostgREST (the Supabase REST layer) cannot introspect the database schema, causing every auth and data request to fail with "database error querying schema". Migration 009 adds the required `GRANT` statements for the `anon` and `authenticated` roles.
>
> If you see **"database error querying schema"** after running the first migrations: run `009_schema_grants_fix.sql` immediately, then restart the Supabase project (Settings → General → Restart).

### 1.3 Configure Authentication

1. Go to Authentication → Settings
2. Set Site URL to your production domain: `https://yourdomain.co.uk`
3. Add Redirect URLs:
   - `https://yourdomain.co.uk/auth/callback`
   - `https://yourdomain.co.uk/**`
4. Email templates: Go to Authentication → Email Templates and customise if needed.
5. Optional: Enable social providers (Google, Facebook) under Authentication → Providers.

### 1.4 Create Storage Buckets

In Supabase dashboard → Storage → Create bucket:

| Bucket Name     | Public | Purpose                    |
|-----------------|--------|----------------------------|
| vendor-images   | ✅ Yes | Vendor portfolio photos    |
| vendor-videos   | ✅ Yes | Vendor portfolio videos    |
| avatars         | ✅ Yes | User profile photos        |

For each bucket, set these policies in SQL Editor:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Vendors can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vendor-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read
CREATE POLICY "Public read images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'vendor-images');
```

Repeat for `vendor-videos` and `avatars` buckets.

### 1.5 Get Supabase Credentials

Go to Project Settings → API:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** (secret!) → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 2: Stripe Setup

### 2.1 Create Products and Prices

In Stripe Dashboard → Products → Add product:

**Pro Plan:**
- Name: Bold Party Pro
- Price: £29.00 / month (recurring)
- Save the Price ID → `STRIPE_PRO_PRICE_ID`

**Featured Plan:**
- Name: Bold Party Featured
- Price: £79.00 / month (recurring)
- Save the Price ID → `STRIPE_FEATURED_PRICE_ID`

### 2.2 Get API Keys

Stripe Dashboard → Developers → API Keys:
- **Secret key** → `STRIPE_SECRET_KEY`
- **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if needed)

### 2.3 Set Up Webhooks

Stripe Dashboard → Developers → Webhooks → Add endpoint:

- Endpoint URL: `https://yourdomain.co.uk/api/payments/webhook`
- Events to listen to:
  - `checkout.session.completed`
  - `payment_intent.payment_failed`
  - `charge.refunded`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`

Save the **Webhook Signing Secret** → `STRIPE_WEBHOOK_SECRET`

---

## Step 3: Resend (Email) Setup

1. Go to resend.com → Create account
2. Add and verify your domain (yourdomain.co.uk)
   - Add the DNS records Resend provides
   - Verify domain ownership
3. Create an API key → `RESEND_API_KEY`
4. Update the FROM address in `lib/resend/index.ts`:
   ```ts
   const FROM = "Bold Party <noreply@yourdomain.co.uk>";
   ```
5. Test by sending a test email from the Resend dashboard.

---

## Step 4: OpenAI Setup

1. Go to platform.openai.com → API Keys → Create key
2. Save the key → `OPENAI_API_KEY`
3. Set up billing and usage limits to control costs.

The platform uses `gpt-4o-mini` for Smart Planner and Smart Concierge — a low-cost, high-performance model.

---

## Step 5: Environment Variables

Create a `.env.local` file for development (already in .gitignore):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_FEATURED_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...

# OpenAI
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.co.uk
ADMIN_EMAILS=admin@yourdomain.co.uk,admin2@yourdomain.co.uk
```

---

## Step 6: Vercel Deployment

### 6.1 Connect Repository

1. Go to vercel.com → Add New Project
2. Import your GitHub/GitLab repository
3. Framework: Next.js (auto-detected)
4. Build command: `npm run build` (default)
5. Output directory: `.next` (default)

### 6.2 Add Environment Variables

In Vercel → Project → Settings → Environment Variables, add all variables from Step 5.

Set the environment for each variable:
- Most variables: **Production** + **Preview** + **Development**
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`: **Production** only (use test keys for Preview)

### 6.3 Configure Custom Domain

1. Vercel → Project → Settings → Domains
2. Add your domain: `boldparty.co.uk` and `www.boldparty.co.uk`
3. Update your domain registrar's DNS records as instructed by Vercel

### 6.4 Deploy

Click **Deploy** or push to your main branch. Vercel builds and deploys automatically.

---

## Step 7: Post-Deployment Setup

### 7.1 Create Admin Account

1. Sign up at `yourdomain.co.uk/signup` with the email address in `ADMIN_EMAILS`
2. Confirm the email
3. You will now have admin access to `/admin`

### 7.2 Seed Demo Data (Optional)

To make the platform look alive during demos:
1. Log in as admin
2. Create a few vendor profiles via `/vendor/apply`
3. Approve them in `/admin/vendors`
4. Add media, packages, and services to each vendor profile

See `LAUNCH_CHECKLIST.md` for sample demo data recommendations.

### 7.3 Configure Stripe Webhook in Production

After deploying, update the Stripe webhook endpoint URL to your production domain and verify the first webhook delivery succeeds.

### 7.4 Test End-to-End Flow

1. Create a customer account and plan an event
2. Browse vendors and request a booking
3. Switch to vendor account and accept the booking
4. Pay the deposit (use Stripe test card `4242 4242 4242 4242`)
5. Verify webhook fires and booking is confirmed
6. Verify email notifications arrive

---

## Step 8: DNS and Domain

Ensure the following DNS records are set:
- `A` record or `CNAME` pointing to Vercel (provided during domain setup)
- `MX` records for Resend email (provided by Resend during domain verification)
- `TXT` records for Resend DKIM (provided by Resend)
- SSL certificate: Vercel handles this automatically via Let's Encrypt

---

## Step 9: Production Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is **never** exposed to the client
- [ ] All admin API routes check `requireAdminUser()` from `lib/admin.ts`
- [ ] Stripe webhooks verify the signature before processing
- [ ] Rate limiting is applied to AI, upload, and payment routes
- [ ] `ADMIN_EMAILS` is set to your real admin email address(es)
- [ ] Supabase RLS policies are enabled on all tables
- [ ] Storage buckets have correct public/private settings
- [ ] `.env.local` is in `.gitignore` (default)

---

## Monitoring

- **Vercel**: check deployment logs at vercel.com/your-project
- **Supabase**: database logs in Supabase dashboard → Logs
- **Stripe**: webhook delivery logs in Stripe dashboard → Developers → Webhooks
- **Resend**: email delivery reports in Resend dashboard → Emails

---

## Support

- Vercel docs: vercel.com/docs
- Supabase docs: supabase.com/docs
- Stripe docs: stripe.com/docs
- Resend docs: resend.com/docs

For platform-specific issues: review `LAUNCH_CHECKLIST.md`.
