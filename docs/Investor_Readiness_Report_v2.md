# Investor Readiness Report v2
**Version:** 2.0 | **Date:** 2026-06-09 | **Sprint:** Operational Excellence
**Supersedes:** `docs/Investor_Readiness_Report.md` (v1.0, 2026-06-09)

---

## What Changed Since v1

| Item | v1 Status | v2 Status |
|------|-----------|-----------|
| BUG-002 (refund void bug) | OPEN — material defect | CLOSED — fix applied and verified |
| Approved vendors | 0 | 2 (Ballet, REV TEST Photography) |
| Live bookings | 0 | 6 bookings in database |
| Live revenue | £0 | £0.50 (test payment processed in Stripe live mode) |
| M365 email mailboxes | Not configured | support@, legal@, urgent@, disputes@elbold.com |
| DKIM | Not confirmed | PASS — `resend._domainkey.elbold.com` confirmed globally |
| DMARC | Not confirmed | PASS — `v=DMARC1; p=quarantine` confirmed |
| SPF | FAIL | FAIL — still needs update to include M365 + Resend |
| Dashboard reconciliation | PASS | PASS — re-verified with live data 2026-06-09 |
| Brand Navbar/Footer | OLD crown mark | NEW clean wordmark |
| Brand Auth pages + Dashboard | OLD crown mark | OLD crown mark (not yet updated) |
| Platform fee rate | 10% (v1 assumed) | UNDEFINED in code — no platform_fee_rate implemented |
| Quote price transparency | Not designed | Blueprint written (Quote_Transparency_Blueprint.md) |
| Company incorporation | Not completed (v1) | COMPLETE — ELBOLD EVENTS LTD registered |

---

## Executive Summary

ELBOLD is a UK event marketplace. As of 2026-06-09:
- **Technical readiness:** HIGH. Next.js 16 on Vercel, Supabase PostgreSQL, Stripe live mode all operational.
- **Traction:** EARLY. 2 approved vendors, 6 bookings, £0.50 processed (test). No completed transactions.
- **Legal:** PASS. Companies House registration complete (ELBOLD EVENTS LTD). Legal mailboxes active (legal@, disputes@).
- **Financial controls:** PASS. BUG-002 closed. Stripe live mode verified. Revenue reconciliation proven.
- **Governance:** GAP. Email-list RBAC functional but no role hierarchy. No audit log.
- **Email infrastructure:** PARTIAL. DKIM and DMARC PASS. SPF needs update. Bounce CNAME missing.

**Overall stage:** Seed. Pre-revenue. Technically credible with demonstrated early traction.

---

## Dimension Scores (0–10)

### 1.1 Vision: 7/10 (unchanged)

| Evidence | Status |
|----------|--------|
| Clear problem: UK event vendors have no quality marketplace | ✓ |
| Revenue model: platform fee on completed bookings | ✓ |
| Competitive positioning: quality-gated, not volume-driven | ✓ |
| UK events market: weddings alone £10bn+ annually | ✓ |
| Platform fee rate undefined in code | Gap |
| No customer/vendor interview data on record | Gap |

**Delta from v1:** No change to score. Platform fee rate is still undefined — this must be fixed before first live transaction.

---

### 1.2 Marketplace Model: 7/10 (unchanged; base unchanged)

| Evidence | Status |
|----------|--------|
| Both sides functional | ✓ |
| Stripe live mode: payment intents, webhooks, idempotency | ✓ |
| BUG-002 (refund void bug) | CLOSED ✓ |
| platform_stats view reconciled (live verification 2026-06-09) | ✓ |
| 6 live bookings in database | ✓ |
| £0.50 test revenue processed in Stripe live mode | ✓ |
| 0 completed bookings | Gap |
| Platform fee undefined in code (no fee taken yet) | Gap |
| Stripe Connect not implemented | Gap |

**Delta from v1:** BUG-002 closed — removes the v1 material defect flag. 6 bookings and £0.50 processed show the payment plumbing works end-to-end. Score held at 7/10 because no completed transactions yet.

---

### 1.3 Vendor Acquisition: 7/10 (up from 6/10)

| Evidence | Status |
|----------|--------|
| Application flow operational and hardened | ✓ |
| Vendor lifecycle state machine active | ✓ |
| 2 approved vendors confirmed in live database | ✓ |
| 7 pending vendor applications in pipeline | ✓ |
| M365 email active — support@, legal@, urgent@, disputes@elbold.com | ✓ |
| Resend transactional emails firing | ✓ |
| SPF record incomplete (M365 + Resend not unified) | Gap |
| No outreach pipeline documented | Gap |

**Delta from v1:** 2 approved vendors and 7 in pipeline is meaningful early-stage traction. Score up from 6 to 7.

---

### 1.4 Vendor Activation: 6/10 (up from 5/10)

| Evidence | Status |
|----------|--------|
| Lifecycle state machine in production | ✓ |
| Both approved vendors have lifecycle_state = 'approved' | ✓ |
| Dashboard shows pending status and next steps to vendors | ✓ |
| Approval emails firing | ✓ |
| No vendor has completed full flow to lifecycle_state = 'live' | Gap |
| Profile completion not end-to-end validated | Gap |

**Delta from v1:** 2 approved vendors confirm the approval path works. Neither has reached 'live' state — this is the next milestone to achieve for investor traction narrative.

---

### 1.5 Governance: 6/10 (up from 5/10)

| Evidence | Status |
|----------|--------|
| Admin panel: vendor management, status changes, review | ✓ |
| Email-list RBAC operational | ✓ |
| RBAC governance audit completed (RBAC_Governance_Audit.md) | ✓ |
| Vendor journey audit completed (Vendor_Journey_Validation_Report.md) | ✓ |
| Customer journey audit completed (Customer_Journey_Validation_Report.md) | ✓ |
| RBAC gap: `requireVendor()` does not check status | Gap |
| No audit log of admin actions | Gap |
| Single admin email model — no role hierarchy | Gap |
| ADMIN_EMAILS env var not confirmed in Vercel | Unverified |

**Delta from v1:** Governance audit completed and gaps are now documented with evidence. Score up from 5 to 6 for operational maturity (documented gaps are more investable than unknown gaps).

---

### 1.6 Financial Controls: 8/10 (up from 6/10)

| Evidence | Status |
|----------|--------|
| Stripe live mode operational | ✓ |
| Webhook idempotency (stripe_events.id unique constraint) | ✓ |
| BUG-002 (refund void bug) — CLOSED | ✓ |
| Revenue reconciliation proven (approved+pending+rejected+suspended=total) | ✓ |
| £0.50 live payment processed and recorded | ✓ |
| platform_stats view mathematically reconciled | ✓ |
| Manual refund pi_3T... pending (pre-fix, requires manual Stripe action) | Gap |
| Platform fee rate not defined in code | Gap |
| No automated financial reporting or export | Gap |

**Delta from v1:** BUG-002 closed removes the largest financial control gap. Score up from 6 to 8. Remaining gap: the pre-BUG-002 refund `pi_3T...` still needs to be issued manually in Stripe Dashboard.

---

### 1.7 Data Integrity: 8/10 (unchanged)

| Evidence | Status |
|----------|--------|
| TypeScript strict mode, 0 errors | ✓ |
| Supabase RLS configured | ✓ |
| Migration 046 applied and verified | ✓ |
| platform_stats reconciliation re-verified with live data | ✓ |
| vendors.status CHECK constraint (DB-level integrity) | ✓ |
| Admin dashboard live integrity check | ✓ |
| No audit log table | Gap |
| No row-level change history | Gap |

**Delta from v1:** No score change. Reconciliation re-verified against live data confirms integrity is maintained as database grows.

---

### 1.8 Legal: 8/10 (NEW dimension)

| Evidence | Status |
|----------|--------|
| ELBOLD EVENTS LTD incorporated at Companies House | ✓ |
| Registered address confirmed | ✓ |
| M365 business email mailboxes (support@, legal@, disputes@elbold.com) | ✓ |
| Legal mailbox active for any legal correspondence | ✓ |
| Terms of service in codebase | ✓ |
| Privacy policy in codebase | ✓ |
| ICO registration (data controller) — status unverified | Unverified |
| FCA authorisation (if handling payments > £85k FSCS threshold) | Not yet applicable |

**Delta from v1:** This dimension was not scored in v1. Company registration complete. Legal infrastructure (mailboxes, ToS, privacy policy) in place.

---

### 1.9 Email Infrastructure: 5/10 (NEW dimension)

| Evidence | Status |
|----------|--------|
| DKIM (`resend._domainkey.elbold.com`) — PASS | ✓ |
| DMARC (`p=quarantine`) — PASS | ✓ |
| M365 Exchange Online Protection active (MX → protection.outlook.com) | ✓ |
| Production RESEND_API_KEY set (encrypted in Vercel) | ✓ |
| SPF — FAIL (needs include:spf.protection.outlook.com + include:amazonses.com) | FAIL |
| Bounce handling CNAME — FAIL (bounces.elbold.com NXDOMAIN) | FAIL |
| M365 DKIM (selector1/selector2) — NOT CONFIGURED | FAIL |
| Resend "Verified" status — cannot confirm from this environment | Unverified |

**Delta from v1:** Email infrastructure properly audited. SPF and bounce handling are not configured. Two DNS changes required (estimated 5 minutes in Cloudflare). Score 5/10 — infrastructure exists but two critical DNS records missing.

---

### 1.10 Brand: 6/10 (NEW dimension)

| Evidence | Status |
|----------|--------|
| New wordmark design: clean "ELBOLD" sans-serif | ✓ |
| Navbar: new wordmark deployed | ✓ |
| Footer: new wordmark deployed | ✓ |
| Favicon: "E" lettermark deployed | ✓ |
| Login, Signup, Forgot Password, Reset Password pages: OLD crown mark | FAIL |
| Dashboard sidebar (DashboardLayout): OLD crown wordmark | FAIL |
| Admin-only reference files: crown + EB monogram | Admin-only, acceptable |

**Delta from v1:** Brand audit completed. 2 changes required to achieve full brand compliance (overwrite elbold-mark.svg, update DashboardLayout.tsx:165).

---

## Score Summary

| Dimension | v1 Score | v2 Score | Delta |
|-----------|----------|----------|-------|
| Vision | 7/10 | 7/10 | — |
| Marketplace Model | 7/10 | 7/10 | — |
| Vendor Acquisition | 6/10 | 7/10 | +1 |
| Vendor Activation | 5/10 | 6/10 | +1 |
| Governance | 5/10 | 6/10 | +1 |
| Financial Controls | 6/10 | 8/10 | +2 |
| Data Integrity | 8/10 | 8/10 | — |
| Legal | — | 8/10 | NEW |
| Email Infrastructure | — | 5/10 | NEW |
| Brand | — | 6/10 | NEW |
| **Composite (scored dims)** | **6.57/10** | **6.8/10** | **+0.23** |

---

## Required Actions Before Investor Conversation

| Priority | Action | Effort | Blocks |
|----------|--------|--------|--------|
| 1 | Fix SPF record (add M365 + Resend) | 5 min | Email deliverability |
| 2 | Add bounce CNAME | 5 min | Bounce handling, DMARC alignment |
| 3 | Update auth pages + DashboardLayout to new brand | 5 min | Brand consistency |
| 4 | Define platform fee rate in `platform_config` | 30 min | First live transaction |
| 5 | Issue manual refund `pi_3T...` in Stripe Dashboard | 5 min | Clears pre-fix refund debt |
| 6 | One vendor to complete full lifecycle to 'live' | hours | Activation proof point |
| 7 | Confirm Resend domain "Verified" status | 2 min | Email confidence |
| 8 | Confirm ADMIN_EMAILS env var in Vercel | 2 min | Admin access |

---

## Disclosure Items for Investor Conversations

| Item | Disclosure |
|------|-----------|
| Revenue | £0.50 test payment only — no commercial revenue |
| Completed bookings | 0 completed; 6 bookings exist |
| Stripe Connect | Not implemented; vendor payouts currently manual |
| Platform fee | Not yet enforced in code |
| Governance | Email-list admin access — no role hierarchy |
| Refund | One pre-fix refund `pi_3T...` requires manual action |
| Email SPF | Two DNS records missing — email deliverability not fully secured |
