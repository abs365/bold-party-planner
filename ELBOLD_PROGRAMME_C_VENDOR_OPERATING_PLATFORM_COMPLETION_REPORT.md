# PROGRAMME C — VENDOR DAILY OPERATING PLATFORM: COMPLETION REPORT
**Prepared:** 2026-07-10 | **Classification:** Implementation completion report — Enterprise Transformation Programme
**Scope:** REG-08, REG-17, REG-18, REG-19, REG-20, per work packages WP-C1 through WP-C5. Primary question throughout: *"Why should a vendor begin every working day inside Elbold?"*

---

## Scope validation (performed before any code was written)

Cross-checked the full capability list in the founder's brief against the Priority Register. Confirmed 5 items are pure connect/improve (in scope): REG-08, REG-17, REG-18, REG-19, REG-20. Confirmed 6 items are genuinely new capabilities or carry an external dependency (out of scope, explicitly flagged rather than silently built): REG-13 (subscription tier redesign — commercial/pricing, not daily engagement), REG-14/15/16 (Stripe Connect real payment routing, off-platform payments, invoicing/contracts — external Stripe approval dependency plus genuinely new product surfaces), REG-21 (Google Calendar sync — new OAuth integration), REG-22 (CRM CSV import — new capability).

---

## Outcome summary

| Work package | Outcome | Commit |
|---|---|---|
| WP-C1 (REG-08) | Repositioned the Payouts "Beta" disclosure — shipped | `7e8f769` |
| WP-C2 (REG-17) | Seasonal booking analytics connected to availability action — shipped | `1e71ff9` |
| WP-C3 (REG-19) | CRM-quiet nudge added to Daily Summary email — shipped | `a8aeeca` |
| WP-C4 (REG-18) | Verified missing, deliberately deferred (0 subscriptions to serve it) | n/a |
| WP-C5 (REG-20) | Channel-specific share/QR attribution — shipped | `99e5cfa` |

Four of five items shipped code to production; one was correctly verified-and-deferred rather than built speculatively, consistent with Programme C's own "no speculative engineering" rule.

---

## Production Verification

- **WP-C1**: behind vendor auth, not visually confirmed this session (same limitation noted in Programme B) — confirmed via clean build and the site staying healthy (200) post-deploy.
- **WP-C2**: logic verified by design (requires 3+ dated bookings across 2+ months, which no current vendor has — correctly inert today, will activate once real booking history accumulates). Build/typecheck/lint clean.
- **WP-C3**: verified directly against the one real vendor's data (31 days old, 0 CRM contacts) — confirmed the trigger computes correctly and will next fire on day 35, not immediately (correct, not a bug — avoids an artificial "prove it now" push at the cost of spamming logic).
- **WP-C4**: verification *was* the deliverable — confirmed via direct grep that no login/contact-based churn trigger exists, and via direct query that 0 subscriptions exist in production to apply a renewal summary to.
- **WP-C5**: the only work package requiring a production migration (073). Applied *before* the code deploy specifically to avoid a window where new code calls an RPC signature that didn't exist yet. Verified the new function signature via `pg_proc`, then verified the actual behavior (`metadata: {"ref":"qr"}` stored correctly) via a rolled-back transaction against the real vendor row — no production data altered by the test itself. Live page confirmed rendering 200 with a `?ref=qr` query param post-deploy.

---

## Commercial Impact

- **WP-C1** removes a self-inflicted trust cost on the platform's most money-sensitive page, with zero change to what's actually disclosed.
- **WP-C2** and **WP-C3** both directly answer the programme's primary question — they are the two concrete mechanisms that make the dashboard proactively pull a vendor back in, rather than the vendor having to remember to check pages that might have nothing new.
- **WP-C4's deferral is itself a commercial decision, not an absence of one**: building a subscription-retention mechanism for zero subscribers would have been effort spent with no possible return until real paying vendors exist — correctly sequenced behind actual subscription volume rather than ahead of it.
- **WP-C5** makes a genuinely zero-cost acquisition channel (a vendor's own shared profile link) measurable for the first time — this doesn't create revenue directly, but it's the prerequisite for ever knowing whether investing further in share tooling (a PDF brochure, for instance) would be worth it.

---

## Vendor Value

Every shipped change targets the same underlying goal named in the brief: a vendor should finish this programme believing "this is where I manage my business," not "this is where I occasionally receive enquiries." WP-C2 and WP-C3 in particular convert the dashboard from something that's only informative when the marketplace is active into something that's proactively useful regardless of marketplace volume — directly serving `ELBOLD_2030_STRATEGY.md` §8.1's "subscription MRR per active vendor" thesis.

---

## Component Reuse

- WP-C1: no new components — copy/structure change to an existing page section.
- WP-C2: reuses `allBookings` (already passed into `ControlCentreInput` for revenue/priority calculations) — zero new queries.
- WP-C3: reuses the existing Daily Summary cron and email template (extended, not replaced) and the existing `manual_contacts` table.
- WP-C4: N/A — nothing built.
- WP-C5: reuses `VendorSharePanel`'s existing share-button structure and the existing `?ref=` parameter the destination page already read.

## API Reuse

- WP-C2, WP-C3: zero new API routes — logic added to existing functions (`computeDailyHighestImpactAction`, the daily-summary cron).
- WP-C5: zero new API routes — extended the existing `POST /api/vendor/track-view` route and the existing `increment_vendor_profile_views` RPC (additively, via a default-valued second parameter, not a breaking signature change).

---

## Performance Review

- WP-C2's seasonal computation runs in-memory over `allBookings`, an array already fetched and already bounded (`.limit(20)` in the dashboard query) — no additional database round trip, negligible CPU cost even at that vendor's eventual full history size.
- WP-C3 adds one additional `manual_contacts` query per vendor per cron run (already batched in `Promise.all` alongside 4 existing queries) — the cron already loops per-vendor; this is a proportional, not compounding, cost increase, and the vendor list is capped at 500 per run (pre-existing limit, unchanged).
- WP-C5 adds one additional JSONB write per profile view — negligible; `vendor_analytics` is already an insert-heavy table by design.

No query added in this programme lacks an existing index path: `manual_contacts(vendor_id, ...)` and `vendor_analytics(vendor_id, created_at)` are both already indexed per their original migrations.

---

## Security Review

- WP-C5's new RPC parameter (`p_ref`) is validated against a server-side allowlist (`KNOWN_REFS`) in `app/api/vendor/track-view/route.ts` before being passed to the database — an arbitrary client-supplied string cannot reach `vendor_analytics.metadata` unfiltered, even though this is low-sensitivity analytics data, not access-controlled content.
- The RPC itself remains `SECURITY DEFINER` with `SET search_path = public` (unchanged from the existing, already-hardened function per Phase 70D.5's security remediation) — the new parameter doesn't touch that posture.
- No new write path was added to any financial, PII, or authentication-adjacent table in this entire programme.

---

## Rollback Verification

- WP-C1, WP-C2, WP-C3, WP-C5's application code: each is an isolated commit touching a small, specific set of files; `git revert` cleanly restores prior behavior in every case.
- WP-C5's migration (073) is the one item in this programme with a database-level change. It is additive only (`CREATE OR REPLACE FUNCTION` with a new optional parameter) — it does not drop or alter the pre-existing 1-argument function, which remains callable unchanged. Rollback, if ever needed, would mean reverting the application code (which would simply stop passing `p_ref`) — the extra database function can be left in place harmlessly, or dropped in a follow-up migration if desired.

---

## Remaining Risks

1. **WP-C1's specific visual outcome is unconfirmed** (vendor auth limitation, consistent with Programmes A/B).
2. **WP-C2 and part of WP-C3 have no current data to exercise them** — both are correctly inert today and will only be provably working once real booking/contact volume exists. This is expected, not a defect, but should be spot-checked once that volume arrives.
3. **The old 1-argument `increment_vendor_profile_views` overload still exists in production**, unused by any current call site after this deploy — low-risk dead code, not cleaned up in this pass since removing it carries more risk (in case something outside the audited codebase calls it) than leaving it.
4. **REG-13, REG-14/15/16, REG-21, REG-22 remain open** in the register, explicitly out of Programme C's scope per the validation above — these are candidates for a future programme once their respective preconditions (subscription volume, Stripe Connect approval, demonstrated demand for calendar sync/CSV import) are met, not forgotten items.

---

*Companion documents: `ELBOLD_ENTERPRISE_COMMERCIAL_PRIORITY_REGISTER.md` (REG-08, 17, 18, 19, 20), `ELBOLD_PROGRAMME_A_TRUST_FOUNDATION_COMPLETION_REPORT.md`, `ELBOLD_PROGRAMME_B_VENDOR_CONVERSION_COMPLETION_REPORT.md`, `ELBOLD_EDP_03_VENDOR_DAILY_OPERATING_PLATFORM.md`.*

*Next: Programme D — Founder Operations, per the Enterprise Transformation Programme v1.0 directive.*
