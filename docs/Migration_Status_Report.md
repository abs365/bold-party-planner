# ELBOLD Migration Status Report

**Date:** 2026-06-08
**Database:** Supabase PostgreSQL (production)
**Total migrations:** 43 (001 through 043, with gaps in numbering)

---

## Critical Warning

**Do NOT test the Vendor Acquisition CRM until migrations 042 and 043 are applied.**

The vendor_leads table does not exist in production until 042 is applied. All API routes under /api/admin/vendor-leads/ will return 500 errors. The Kanban pipeline requires the extended status values from 043.

---

## Migration Applied Status

| Migration | Purpose | Applied? | Risk if Missing |
|---|---|---|---|
| 001_initial.sql | Core tables: vendors, profiles, events, bookings, quotes, packages | APPLIED | Platform non-functional |
| 002_phase2.sql | stripe_events, email_log, vendor_payouts, platform_stats | APPLIED | Payments, payouts broken |
| 003_phase3.sql | quotes, quote_responses, contracts, vendor_onboarding, automation_logs | APPLIED | Quote workflow broken |
| 004_phase4.sql | vendor_subscriptions, messages, smart_chat_history, vendor_verifications | APPLIED | Messaging, subscriptions broken |
| 005_phase5.sql | guests, invitations, rsvp_responses | APPLIED | Guest management broken |
| 006_phase6.sql | Extended vendor profiles | APPLIED | Profile features broken |
| 007_phase7.sql | Additional platform features | APPLIED | Various features broken |
| 008_data_consistency_fix.sql | Data consistency corrections | APPLIED | Data integrity issues |
| 009_schema_grants_fix.sql | Schema permission grants | APPLIED | API access errors |
| 010_trigger_and_category_fix.sql | Trigger and category constraint fixes | APPLIED | Category validation broken |
| 011_marketplace_operations.sql | Marketplace operational tables | APPLIED | Operations features broken |
| 012_moderation.sql | Moderation tables and policies | APPLIED | Review moderation broken |
| 013_vendor_verification_system.sql | Verification system tables | APPLIED | Verification broken |
| 014_verification_automation.sql | Automated verification triggers | APPLIED | Verification automation broken |
| 015_demo_password_rpc.sql | Demo password RPC function | APPLIED | Demo auth broken |
| 016_admin_alerts_rls.sql | Admin alerts RLS policies | APPLIED | Admin alerts inaccessible |
| 017_demo_user_fix.sql | Demo user correction | APPLIED | Demo system issues |
| 018_complete_demo_cleanup.sql | Demo account cleanup | APPLIED | Demo data conflicts |
| 019_force_demo_auth_cleanup.sql | Force auth record cleanup | APPLIED | Auth conflicts |
| 020_restore_robust_trigger.sql | Profile creation trigger | APPLIED | New user signup broken |
| 021_analytics_and_audit.sql | Analytics tables, audit log extensions | APPLIED | Analytics broken |
| 022_vendor_governance.sql | vendor_warnings, last_active_at, suspicious_reason | APPLIED | Governance broken |
| 023_vendor_reviews_and_reputation.sql | Review extensions, reputation scoring, review_reports | APPLIED | Reviews, reputation broken |
| 024_subscription_infrastructure.sql | Subscription plans seeded, billing_events | APPLIED | Subscriptions broken |
| 025_gdpr_and_production.sql | GDPR compliance tables, production hardening | APPLIED | GDPR compliance broken |
| 026_push_subscriptions.sql | Web push subscription storage | APPLIED | Push notifications broken |
| 027_event_planner_category.sql | Adds 'event_planner' to vendors CHECK constraint | APPLIED | Category rejected |
| 027_profiles_privacy.sql | Profile privacy settings | APPLIED | Privacy controls broken |
| 028_pricing_type.sql | Pricing type column on packages | APPLIED | Package pricing broken |
| 029_storage_policies.sql | Storage bucket RLS policies | APPLIED | Media uploads blocked |
| 030_custom_category.sql | custom_category_description on vendors | APPLIED | Custom category lost |
| 031_quote_workflow.sql | Quote workflow extensions, quote_events audit | APPLIED | Quote audit broken |
| 032_vendor_bank_details.sql | vendor_bank_details table + RLS | APPLIED | Bank details not saved |
| 033_pilot_operations.sql | pilot_vendors, pilot_feedback tables | APPLIED | Pilot CRM broken |
| 034_identity_hardening.sql | phone_verified column on profiles + vendors | APPLIED | Phone verification missing |
| 035_pilot_testing.sql | Pilot testing submission tables | APPLIED | Pilot testing broken |
| 036_fix_checklist_trigger.sql | Fixes ambiguous 'item' column in checklist trigger | APPLIED | Checklist trigger error |
| 037_storage_buckets.sql | vendor-images, vendor-videos storage buckets | APPLIED | Media upload buckets missing |
| 038_phone_otp.sql | Phone OTP tables and functions | **UNKNOWN** | Phone OTP non-functional |
| 039b_selective_demo_cleanup.sql | Selective demo account cleanup | **UNKNOWN** | Demo data conflicts possible |
| 039c_phone_otp_rls_fix.sql | Phone OTP RLS policy corrections | **UNKNOWN** | Phone OTP access errors |
| 039d_vendor_verifications_rls_fix.sql | vendor_verifications INSERT RLS fix | APPLIED (2026-06-07) | Verification docs rejected |
| 040_financial_ledger.sql | Financial ledger tables for payout tracking | **UNKNOWN** | Finance dashboard errors |
| 041_concierge_requests.sql | concierge_requests table + RLS (anon INSERT) | **NOT APPLIED** | Concierge submissions lost |
| 042_vendor_leads.sql | vendor_leads table + RLS + scoring indexes | **NOT APPLIED** | Acquisition CRM broken |
| 043_vendor_leads_extended.sql | Extended status CHECK + intelligence columns | **NOT APPLIED** | Kanban/outreach broken |

---

## Dependency Chain

The 3 pending migrations must be applied in order:

```
042_vendor_leads.sql
  |
  └──> 043_vendor_leads_extended.sql
         (depends on vendor_leads table existing from 042)
         (ALTER TABLE vendor_leads — will fail if 042 not applied)
```

Migration 041 is independent and can be applied at any time.

---

## What Each Pending Migration Creates

### 041_concierge_requests.sql

```sql
-- Creates:
CREATE TABLE concierge_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  email       text NOT NULL,
  phone       text,
  event_type  text,
  event_date  text,
  budget      text,
  message     text,
  source      text DEFAULT 'website',
  status      text DEFAULT 'new',
  created_at  timestamptz DEFAULT now()
);

-- Enables anonymous INSERT (public can submit concierge forms)
-- Admin SELECT/UPDATE (admin can view and action requests)
```

**Impact of not applying:** Concierge form submissions send an email to the founder but store nothing in the database. All concierge data is email-only. The /admin/concierge page shows a "no requests yet" notice.

---

### 042_vendor_leads.sql

```sql
-- Creates the vendor_leads table:
CREATE TABLE vendor_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name       text NOT NULL,
  category            text NOT NULL,
  city                text,
  region              text,
  website_url         text,
  instagram_handle    text,
  facebook_page       text,
  email               text,
  phone               text,
  google_rating       numeric(3,1),
  google_reviews_count integer,
  source              text,
  source_notes        text,
  score               integer DEFAULT 0,
  score_breakdown     jsonb,
  status              text DEFAULT 'new',
  outreach_sent_at    timestamptz,
  next_follow_up_at   timestamptz,
  notes               text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- Plus RLS policies, indexes, and update trigger
```

**Impact of not applying:** All /api/admin/vendor-leads/* routes return 500 errors. The Vendor Acquisition CRM, Pipeline Kanban, Outreach Queue, and Coverage Map all fail to load data.

---

### 043_vendor_leads_extended.sql

```sql
-- Extends vendor_leads with full pipeline status values:
ALTER TABLE vendor_leads DROP CONSTRAINT IF EXISTS vendor_leads_status_check;
ALTER TABLE vendor_leads ADD CONSTRAINT vendor_leads_status_check CHECK (status IN (
  'new','researched','approved_for_outreach','outreach_sent','follow_up_due',
  'responded','interested','registered','verified','approved','active',
  'rejected','not_suitable'
));

-- Adds Phase 1J founder intelligence fields:
ALTER TABLE vendor_leads
  ADD COLUMN IF NOT EXISTS objections      text,
  ADD COLUMN IF NOT EXISTS interest_level  text CHECK (interest_level IN ('high','medium','low','unknown')),
  ADD COLUMN IF NOT EXISTS contact_outcome text;

-- Adds performance index:
CREATE INDEX IF NOT EXISTS vendor_leads_follow_up_idx
  ON vendor_leads (next_follow_up_at) WHERE next_follow_up_at IS NOT NULL;
```

**Impact of not applying:** Kanban board limited to basic statuses. Founder intelligence fields (objections, interest_level, contact_outcome) not available. Follow-up query performance degraded.

---

## How to Apply Pending Migrations

### In Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select the ELBOLD project
3. Click "SQL Editor" in the left sidebar
4. Open migration file from local: `supabase/migrations/041_concierge_requests.sql`
5. Paste the SQL content into the editor
6. Click "Run"
7. Verify: no error in output, table visible in "Table Editor"
8. Repeat for 042, then 043 (in order)

### Verify After Applying

After 042 and 043 are applied, visit:
- /admin/vendor-acquisition — should load with empty table (no 500 error)
- /admin/vendor-pipeline — should show 10 empty columns
- /admin/vendor-coverage — should show all categories at 0% with targets

After 041 is applied:
- /admin/concierge — should show "no requests yet" (not an error)
- Submit the concierge form on the website — verify it appears in admin

---

## Unknown Migrations — How to Verify

For migrations 038, 039b, 039c, 040, run this SQL in Supabase SQL Editor to check what tables/columns exist:

```sql
-- Check if phone_otp table exists (038):
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'phone_otp_verifications'
);

-- Check if financial_ledger exists (040):
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'financial_ledger'
);

-- Check RLS policies on vendor_verifications (039c/039d):
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'vendor_verifications';
```

---

## Rollback Risk Assessment

| Migration | Rollback Risk | Rollback Method |
|---|---|---|
| 041 | LOW | DROP TABLE concierge_requests CASCADE |
| 042 | LOW | DROP TABLE vendor_leads CASCADE |
| 043 | MEDIUM | DROP CONSTRAINT + DROP COLUMN for each added column |
| 038-040 | UNKNOWN | Depends on table structure — verify before applying |

All 3 pending migrations (041, 042, 043) create new tables or add new columns only. They do NOT modify existing tables with data. Rollback risk is low.

---

## Status After This Report

- Migrations 001-037, 039d: APPLIED (confirmed)
- Migration 041: NOT APPLIED — apply to activate concierge storage
- Migration 042: NOT APPLIED — apply to activate Vendor Acquisition CRM
- Migration 043: NOT APPLIED — apply AFTER 042
- Migrations 038, 039b, 039c, 040: UNKNOWN — verify in Supabase SQL Editor
