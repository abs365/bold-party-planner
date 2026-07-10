# ELBOLD ENTERPRISE BASELINE v1.0.1 — RELEASE NOTES
**Released:** 2026-07-10 | **Type:** Documentation-only correction release
**Tag:** `elbold-enterprise-baseline-v1.0.1` (previous: `elbold-enterprise-baseline-v1.0`)

---

## Summary

During production verification of the first Programme A implementation item (REG-01, the highest-scored item in the Enterprise Commercial Priority Register), the underlying finding was disproved before any code was written or deployed. This release documents that correction across every affected governing and design document, closes REG-01 in the Priority Register without renumbering it, and promotes REG-02 to the highest-priority open P0 item. Enterprise Baseline v1.0 (tag `elbold-enterprise-baseline-v1.0`) is not modified.

## Documents affected

**New:**
- `ELBOLD_ENTERPRISE_BASELINE_v1.0.1_CORRECTIONS.md` — the full correction record (original statement, why it was believed, production verification performed, actual production behaviour, correct conclusion, commercial impact, engineering impact).
- `ELBOLD_BASELINE_v1.0.1_RELEASE_NOTES.md` — this document.

**Updated (each with a dated, clearly-labelled "Enterprise Baseline v1.0.1 Correction" section added — no prior content silently removed or rewritten):**
- `ELBOLD_2030_STRATEGY.md`
- `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md`
- `ELBOLD_VENDOR_VALUE_BLUEPRINT.md`
- `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md`
- `ELBOLD_EDP_02_VENDOR_ACQUISITION_EXPERIENCE.md`
- `ELBOLD_EDP_03_VENDOR_DAILY_OPERATING_PLATFORM.md`
- `ELBOLD_EDP_05_VENDOR_SUCCESS_JOURNEY.md`
- `ELBOLD_ENTERPRISE_COMMERCIAL_PRIORITY_REGISTER.md` — REG-01 marked "Closed before implementation. Production verification confirmed the issue does not exist." Entry retained in place, unrenumbered, score unmodified. REG-02 marked as the promoted highest-priority open P0 item.

**Not modified:** `ELBOLD_CONSTITUTION.md`, `ELBOLD_MARKET_AND_COMPETITOR_RESEARCH.md`, `ELBOLD_ENTERPRISE_EXPERIENCE_AUDIT.md`, `ELBOLD_EDP_01_CUSTOMER_EXPERIENCE.md`, `ELBOLD_EDP_04_BRAND_AND_LANGUAGE_SYSTEM.md` — none reference the corrected finding.

## Reason for correction

REG-01 claimed `vendors.response_rate` had a schema (0-1) vs. application (0-100) scale mismatch silently blocking every write since inception. This was based on static analysis of migration source files (migration 011 vs. migration 013) by a research agent, tagged **Verified** when it should have been tagged **Observation** — the code-reading step was verified; live production state was not, until this correction.

## Production evidence

Performed via `npx supabase db query --linked --file` against `bold-party-production`, immediately before implementing REG-01's intended fix:

1. `information_schema.columns` — live column is `NUMERIC(5,2)`, `column_default: null`.
2. `pg_catalog.pg_constraint` — zero constraints reference `response_rate` on the `vendors` table.
3. A direct write test (`UPDATE vendors SET response_rate = 85.50 ...`, wrapped in `BEGIN; ... ROLLBACK;`, no production data altered) — succeeded, value round-tripped correctly.

Full detail in `ELBOLD_ENTERPRISE_BASELINE_v1.0.1_CORRECTIONS.md`.

## No application code changed

A migration (`supabase/migrations/073_fix_response_rate_scale.sql`) was drafted to implement REG-01's fix. It was deleted before being committed, once production verification contradicted its premise. No file in `app/`, `components/`, or `lib/` was modified as part of this correction.

## No migrations applied

The drafted migration above was never applied to any database, local or production, and no longer exists in the working tree or git history.

## No deployments performed

No `git push` to any branch other than this documentation commit occurred as part of this correction. No Vercel deployment was triggered by application code, because none changed.

## What happens next

Enterprise Transformation Programme A continues from REG-02 (cron authentication verification), now the highest-priority open P0 item, following the same discipline this correction reinforces: production verification precedes implementation for every remaining item.

---

*Enterprise Baseline v1.0 (tag `elbold-enterprise-baseline-v1.0`) remains the historical record of the baseline as originally believed. This release does not rewrite it — it supersedes one finding within it via the correction mechanism above.*
