# ELBOLD ENTERPRISE BASELINE v1.0.1 — CORRECTIONS
**Prepared:** 2026-07-10 | **Classification:** Documentation correction, not a strategy revision. Supersedes one specific finding from Enterprise Baseline v1.0; everything else in v1.0 stands unchanged.
**Status:** Documentation-only. No application code changed. No migrations applied. No deployments performed.

---

> Enterprise Baseline v1.0 is not rewritten. This document, plus the dated correction sections it adds to each affected governing document, is the permanent record of what was wrong, how it was found wrong, and what replaces it. The live production database is the source of truth — not a migration file's stated intent, and not a prior audit's inference from reading one.

---

## THE CORRECTION

### Original statement

Reported as **Verified** in `capability_truth_audit.md` (2026-07-10) and propagated as fact into `ELBOLD_2030_STRATEGY.md`, `ELBOLD_COMMERCIAL_EVOLUTION_STRATEGY.md`, `ELBOLD_VENDOR_VALUE_BLUEPRINT.md`, `ELBOLD_EXECUTIVE_BUSINESS_STATUS_REVIEW.md`, `ELBOLD_EDP_02`, `ELBOLD_EDP_03`, `ELBOLD_EDP_05`, and `ELBOLD_ENTERPRISE_COMMERCIAL_PRIORITY_REGISTER.md` (as REG-01, the highest-scored item in the entire register at Priority Score 87):

> "`vendors.response_rate` has a schema/application scale mismatch — migration 011 defines the column as `NUMERIC(4,3)` constrained 0-1; all application write paths (`lib/verification-automation.ts`'s `computeVendorMetrics`) compute and write a 0-100 percentage. Every write since has been silently rejected by the CHECK constraint, freezing the column at its `DEFAULT 0.5` for effectively every vendor — corrupting Business Health scoring, generating false low-response-rate warnings, and blocking Level 3 verification auto-upgrade."

### Why it was believed

The finding was produced by a research agent auditing the codebase via **static analysis of migration source files**, not live production schema. The reasoning was internally sound given only the files: migration `011_marketplace_operations.sql` creates `response_rate` as `NUMERIC(4,3) CHECK (response_rate >= 0 AND response_rate <= 1)`; migration `013_vendor_verification_system.sql` later attempts `ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5,2)` — which, read as a normal sequential migration history, is a no-op against an already-existing column, meaning the restrictive 011 definition would appear to still govern. Every application consumer (`lib/vendor/health.ts`, `lib/vendor/ranking.ts`, `lib/vendor/warnings.ts`, `VendorAnalyticsDashboard.tsx`) consistently treats the field as 0-100, which made the file-based inference look additionally well-corroborated. This is why the finding was tagged **Verified** rather than **Observation** — it should have been tagged Observation, since "verified" was applied to the code-reading step, not to live production state, and the two were conflated.

### Production verification performed

Before implementing REG-01 (the intended fix), live production (`bold-party-production`) was queried directly, via `npx supabase db query --linked --file`, in three steps:

1. `information_schema.columns` for `vendors.response_rate` — returned `data_type: numeric, numeric_precision: 5, numeric_scale: 2, column_default: null`.
2. `pg_catalog.pg_constraint` filtered for any constraint definition referencing `response_rate` on the `vendors` table — returned zero rows. No CHECK constraint of any kind exists on this column in production.
3. A direct write test: `UPDATE vendors SET response_rate = 85.50 WHERE id = '<real vendor row>'`, wrapped in `BEGIN; ... ROLLBACK;` so no production data was altered. The write succeeded and the value round-tripped correctly as `85.50`.

### Actual production behaviour

The live `vendors.response_rate` column is `NUMERIC(5,2)` with **no CHECK constraint**, matching migration 013's intent, not migration 011's. A 0-100 percentage write succeeds without error. Production's actual applied schema does not match the sequential-file inference — consistent with this project's already-documented migration-tracking gap (migrations 051-059 were previously found applied to production out of the tracked `schema_migrations` sequence; the same class of divergence between migration files and live schema applies here, for reasons not further investigated as part of this correction since the corrected conclusion doesn't depend on knowing why).

### Correct conclusion

**No scale-mismatch bug exists in production.** The two current vendor rows both have `response_rate = null`, which is the correct, expected value for a vendor with zero quotes in the trailing 90-day window (`computeVendorMetrics` explicitly returns `null` in that case) — not evidence of a blocked write. Business Health scoring, verification Level 3 auto-upgrade, and governance at-risk detection are not corrupted by this mechanism. REG-01 is closed without implementation.

### Commercial impact

None — no vendor-facing behaviour was ever actually broken by this. The commercial impact is entirely to this document set's own credibility and prioritisation: REG-01 was scored as the single highest-priority item in the Commercial Priority Register (87/100), and its closure promotes REG-02 (cron authentication verification) to the highest remaining P0 priority. No vendor experienced a wrong Business Health score or a blocked Level 3 upgrade because of this specific mechanism.

### Engineering impact

Zero — no code was changed, no migration was applied. A migration (`073_fix_response_rate_scale.sql`) was drafted but deleted before being committed, once production verification contradicted its premise. The engineering time already spent (drafting and then correctly discarding the fix, and performing the three-step production verification above) is the actual cost of this correction, and is the direct justification for the standing rule this correction reinforces: **production verification precedes implementation for every future P0 item, not just this one** — REG-02 onward will each be checked against live state before a fix is written, not after.

---

## STANDING PROCESS CHANGE

Every subsequent Programme A item (REG-02 onward) will have its underlying claim re-verified directly against live production *before* a fix is designed or a migration is written, not only before deployment. This was already partial practice (REG-02's own register entry explicitly calls for verifying cron logs before fixing); this correction extends the same discipline to every remaining item, including the ones currently believed correct on stronger evidence (e.g. REG-03's availability hardcode, which is a direct code citation with a line number, not an inference about schema history — a materially different and stronger form of evidence than REG-01 had, and not doubted by this correction).

---

*Companion documents: this correction is referenced from a new dated section in each of the 7 affected governing/design documents, and from `ELBOLD_BASELINE_v1.0.1_RELEASE_NOTES.md`. Enterprise Baseline v1.0 (tag `elbold-enterprise-baseline-v1.0`) remains unmodified and stands as the historical record of what was believed at that point in time.*
