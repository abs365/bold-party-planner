# RLS Policy Matrix

Generated during Phase 21 — AUTH + RLS + DATA FLOW HARDENING

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Full access (SELECT + INSERT + UPDATE + DELETE) |
| 👁️ | Read-only SELECT |
| ✍️ | Write-only or restricted writes |
| 🔒 | No direct client access (service_role only or USING (false)) |
| ❌ | Blocked |
| ⚠️ | Gap or security concern |

---

## Core Marketplace Tables

| Table | Customer | Vendor | Admin (via createAdminClient) | Notes |
|-------|----------|--------|-------------------------------|-------|
| `profiles` | ✅ own row; 👁️ all rows (public read) | ✅ own row; 👁️ all rows | ✅ service role bypasses RLS | `profiles_public_read: USING (true)` — any authed user can read all profiles |
| `vendors` | 👁️ approved vendors only | ✅ own record; 👁️ approved others | ✅ service role bypasses RLS | ⚠️ Customers/vendors CANNOT see pending/rejected vendors — intentional |
| `vendor_media` | 👁️ all | ✅ own vendor's media | ✅ | Public read |
| `vendor_packages` | 👁️ all | ✅ own vendor's packages | ✅ | Public read |
| `vendor_availability` | 👁️ all | ✅ own vendor's availability | ✅ | Public read |
| `events` | ✅ own events only | ❌ | ✅ | Vendors have no direct event read access (they see events via bookings) |
| `bookings` | ✅ own bookings | ✅ bookings for own vendors | ✅ | Both parties see the same booking row |
| `quotes` | ✅ own quotes | 👁️✍️ quotes for own vendors | ✅ | Vendor read + update (respond), customer all |
| `quote_responses` | 👁️ responses to own quotes | ✅ own vendor's responses | ✅ | |
| `payments` | 👁️ own booking payments | 👁️ payments for own vendor's bookings | ✅ | Read-only for both parties |
| `invoices` | 👁️ own | 👁️ own vendor's | ✅ | Read-only |
| `reviews` | 👁️ all; ✍️ write own | 👁️ all; ✍️ respond to own | ✅ | Vendor can only update `response` field |
| `disputes` | ✍️ raise own; 👁️ own bookings' | ✍️ raise; 👁️ own bookings' | ✅ | |
| `contracts` | 👁️ own bookings' | 👁️ own bookings' | ✅ | Read-only for parties |
| `notifications` | ✅ own | ✅ own | ✅ | No cross-user leakage |
| `saved_vendors` | ✅ own | 👁️ count (anonymous) | ✅ | |
| `message_threads` | 👁️ participant | 👁️ participant | ✅ | Participant check via `customer_id OR vendor_id` |
| `messages` | 👁️✍️ participant | 👁️✍️ participant | ✅ | |

---

## Vendor-Specific Tables

| Table | Customer | Vendor | Admin (via createAdminClient) | Notes |
|-------|----------|--------|-------------------------------|-------|
| `vendor_payouts` | ❌ | 👁️ own | ✅ | |
| `vendor_subscriptions` | ❌ | ✅ own | ✅ | |
| `vendor_analytics` | ❌ | 👁️ own | ✅ | Service role inserts analytics |
| `vendor_verifications` | ❌ | 👁️ own | ✅ | |
| `verification_documents` | ❌ | ✅ own (upload/read/delete) | ✅ | Private storage + signed URLs |
| `verification_activity_log` | ❌ | 👁️ own | ✅ | |
| `vendor_onboarding` | ❌ | ✅ own | ✅ | |
| `vendor_daily_stats` | ❌ | 👁️ own | ✅ | |
| `payout_requests` | ❌ | ✅ own | ✅ | |

---

## Admin / Platform Tables

| Table | Customer | Vendor | Admin | Notes |
|-------|----------|--------|-------|-------|
| `admin_alerts` | ⚠️ all rows (NO RLS) | ⚠️ all rows (NO RLS) | ✅ | ⚠️ RLS not enabled — API endpoint guards via ADMIN_EMAILS check |
| `content_reports` | ✍️ file own; 👁️ own | ✍️ file own; 👁️ own | 🔒 service_role via API | |
| `platform_announcements` | 👁️ published | 👁️ published | 🔒 service_role manages | |
| `platform_settings` | 👁️ all | 👁️ all | ✅ | Public read via `USING (true)` |
| `audit_logs` | ❌ | ❌ | 👁️ requires `profiles.role = 'admin'` | Only place in DB that uses role-based check |
| `error_logs` | ❌ | ❌ | 🔒 USING (false) — service_role only | |
| `platform_events` | ✍️ insert only | ✍️ insert only | 🔒 no SELECT | |
| `automation_logs` | 🔒 | 🔒 | 🔒 service_role only | |

---

## Event Invitations (Phase 5)

| Table | Customer | Vendor | Admin | Notes |
|-------|----------|--------|-------|-------|
| `guests` | ✅ own events' guests | ❌ | ✅ | |
| `invitations` | ✅ own events' invitations | ❌ | ✅ | |
| `rsvp_responses` | ✅ own | ❌ | ✅ | |
| `checklist_progress` | ✅ own | ❌ | ✅ | |

---

## Security Gaps Identified

### 1. `admin_alerts` has no RLS
- **Risk**: Any authenticated customer/vendor can call `SELECT * FROM admin_alerts` directly.
- **Current mitigation**: The `/api/admin/alerts` endpoint checks `ADMIN_EMAILS` before returning data.
- **Fix**: `ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY; CREATE POLICY "admin_only" ON admin_alerts FOR ALL USING (false);` and grant to service_role only.

### 2. Admin pages used `createClient()` for data queries (FIXED in Phase 21)
- All admin Server Component pages now use `createAdminClient()` (service role) for data queries.
- Auth check still uses `createClient()` to verify session and ADMIN_EMAILS.

### 3. No database-level admin role check on most tables
- Admin access is enforced at the application layer (ADMIN_EMAILS env var + createAdminClient).
- Only `audit_logs` has a DB-level admin check (`profiles.role = 'admin'`).
- This is acceptable since `createAdminClient()` uses the service role key which is server-side only.

### 4. `profiles_public_read: USING (true)` exposes all profile emails
- Any authenticated user can read all profiles including emails.
- **Risk**: Enumeration of user emails.
- **Acceptable**: Email is not sensitive at this platform level, but worth noting.

---

## Admin Page Data Source Summary

| Page | Auth Check | Data Source |
|------|-----------|-------------|
| `/admin` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` for all data |
| `/admin/vendors` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` |
| `/admin/customers` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` |
| `/admin/bookings` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` |
| `/admin/disputes` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` |
| `/admin/moderation` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` ← fixed Phase 21 |
| `/admin/verifications` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` ← fixed Phase 21 |
| `/admin/analytics` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` |
| `/admin/payouts` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` |
| `/admin/subscriptions` | `createClient()` getUser + ADMIN_EMAILS | `createAdminClient()` |
| `/api/admin/alerts` | `createClient()` getUser + ADMIN_EMAILS | `createClient()` (no RLS on table) |

---

## Outstanding: Migration 015 Required

Seed users (james.bennett, sofia.martinez, et al.) have a malformed bcrypt hash
(`$2a$10$abc...XYZ012` — 57 chars, needs 60) that causes GoTrue to return
"Database error querying schema" for ALL authentication attempts.

**Apply migration 015 in Supabase Dashboard SQL Editor:**
```
https://supabase.com/dashboard/project/vibqrgswyineyxmsrtsh/editor
```
Then paste the contents of `supabase/migrations/015_demo_password_rpc.sql` and click Run.

After applying, run `npm run test:e2e:auth` to verify auth tests pass.
