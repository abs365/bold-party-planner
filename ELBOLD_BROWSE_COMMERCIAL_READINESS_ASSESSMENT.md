# ELBOLD Browse Commercial Readiness Assessment

**Status:** Assessment only. No implementation. No code changed.
**Origin:** Reclassified from Homepage Hotfix H2 (`ELBOLD_ENTERPRISE_EXPERIENCE_ARCHITECTURE.md` homepage arc), which stopped short of implementation after discovering the reported defect was one symptom of a broader commercial-honesty problem, not a contained code bug.
**Programme:** Commercial Readiness Programme for Browse (new, separate from the now-frozen Homepage Transformation Programme).
**Relationship to the homepage freeze:** None. This assessment does not touch `app/page.tsx` or homepage architecture. The homepage remains frozen regardless of what happens with Browse.

**Objective:** Ensure Browse behaves honestly and consistently with the platform's commercial state.

**Evidence tags used throughout:** Verified / Observation / Assumption / Recommendation — never blended, per this transformation's standing convention.

---

## 1. Executive Summary

Browse's occasion/event-type filter is not a single bug. It is four separate, genuinely independent problems that happen to surface through the same user action (clicking an occasion tile). Fixing any one of them alone, in isolation, makes the visible outcome *worse*, not better, at the platform's current commercial state. This is the finding that triggered the reclassification from a hotfix to a programme.

**Verified, decisive fact governing this entire assessment:** production holds exactly 2 vendor records total (1 approved, 1 rejected). Neither has ever had a value in `event_types`. Zero vendors, of any status, in the platform's full history, have populated this field. This is not a partial data-quality gap to backfill — it is total, and it changes what "safe sequencing" means: there is no real vendor behavior to analyze, and correcting it means asking one real vendor a question, not running a data migration.

---

## 2. The Four Areas, Reviewed Separately

### 2.1 Vendor Event-Type Data Quality

| | |
|---|---|
| **What was checked** | Live production `vendors` table, all statuses, `event_types` column, via direct read-only query. |
| **Finding** | **Verified.** 2 vendors total (1 approved, 1 rejected). 0 of 2 have any value in `event_types`. The column exists, is wired into the onboarding wizard (`VendorOnboardingWizard.tsx`) and profile editor (`VendorProfileEditor.tsx`), and is read by one working consumer (`app/api/vendor/matching/route.ts:72`) — the plumbing is real and precedented, the data simply was never entered by the platform's only two vendors. |
| **Why it matters here** | Any Browse-side filter fix operates on data that doesn't exist yet. Filtering an empty field is not the same defect as filtering a populated field incorrectly — the correct fix depends entirely on which one this is, and it's the former. |
| **Recommendation** | Not a Browse-code problem at all. Before any filter logic changes, either (a) directly ask the one approved vendor to set `event_types` via the profile editor that already exists for this, or (b) treat "no vendor has event-type data" as a durable near-term state and design Browse's behavior around that reality (see 2.3) rather than around data that isn't coming soon. |

### 2.2 Browse Event Filtering

| | |
|---|---|
| **What was checked** | `components/vendor/VendorMarketplace.tsx`, the `filtered` `useMemo` (lines ~110-168) and the `eventType` state it's supposed to consume. |
| **Finding** | **Verified.** `eventType` is set from the incoming URL param, drives the Event Type `<select>`, and is counted in `activeFilterCount` — but it is never applied inside `filtered`'s filter chain, and is missing from that `useMemo`'s dependency array. Every sibling filter (`category`, `city`, `verifiedOnly`, `minRating`, `budgetMax`) follows set-state → apply-in-filtered → include-in-deps; this is the one filter where the middle step was never written. A correct reference implementation of the same match logic already exists and works elsewhere: `app/api/vendor/matching/route.ts:72`, `vendor.event_types.includes(eventType)`. |
| **Why it matters here** | This is the only one of the four areas that is a pure code defect with a known-correct fix pattern already in the codebase. It is also the one area where fixing it *alone*, right now, actively regresses the current experience (see 2.1 and 2.3 — today the param is silently ignored and the visitor sees the one approved vendor unfiltered; fixing only this would make every occasion tile show zero results instead). |
| **Recommendation** | The code fix itself is low-risk and small (mirrors the existing `category` pattern exactly). Sequencing risk, not implementation risk, is what blocks it — see §3. |

### 2.3 Empty-State Messaging

| | |
|---|---|
| **What was checked** | `VendorMarketplace.tsx:443-471`, the `filtered.length === 0` branch. |
| **Finding** | **Verified.** The zero-results state renders "Founding Vendor Applications Now Open" / "We are currently onboarding our first verified event professionals across the UK" — this is a *platform-has-no-vendors-yet* message, not a *no-vendors-match-this-filter* message. There is only one empty state; it does not distinguish the two situations. |
| **Why it matters here** | This is the load-bearing reason 2.2 can't ship alone. At 1 approved vendor, a fixed event-type filter would trigger this same message for every occasion tile, and the message would misrepresent the platform's actual state (it does have an approved vendor — just not one tagged for that occasion) as having none at all. This is a live Commercial Honesty concern (`ELBOLD_CONSTITUTION.md` Principle 11): the message would state something false about supply that a visitor would reasonably read literally. |
| **Recommendation** | Needs a second, distinct copy variant for "no vendors match this specific filter yet" vs the existing "no vendors on the platform yet" — reusing the same section's structure, not a redesign. This is a small, self-contained content fix, but it has to land *before or with* 2.2, not after. |

### 2.4 Occasion Taxonomy Consistency

| | |
|---|---|
| **What was checked** | Every independent event-type/occasion vocabulary in the codebase, by direct grep — not assumed from one source. |
| **Finding** | **Verified — five separate, non-identical lists exist:** ① the shared `EventType` enum (`types/index.ts`, 13 values, the one used by `Event` records and `EVENT_TYPES` labels); ② `VendorOnboardingWizard.tsx`'s local list (14 values — matches ① plus an extra `hen_party` not in the shared enum); ③ `VendorMarketplace.tsx`'s Browse filter dropdown (10 values — missing `naming_ceremony`, `funeral`, `charity`, `conference`, `gender_reveal` from ①, and adds `christmas`, which is in none of the others); ④ the homepage's `OCCASIONS`/`QUICK_STARTS` (7 values — `cultural` and `religious_family_milestone` exist in *no* other list in the codebase); ⑤ `app/concierge/page.tsx` and `app/api/concierge/route.ts`'s free-text options (10 values, including `"Cultural Celebration"` and `"Christening"` as display strings, not matched against any structured field). |
| **Why it matters here** | Even with 2.1's data gap closed and 2.2/2.3 fixed correctly, `cultural` and `religious_family_milestone` specifically can never produce a match — they are not values any vendor can select anywhere in the product, onboarding or profile-edit. This is the same finding disclosed during the E4 homepage work package, confirmed here to be structural rather than incidental: it is one instance of a five-way vocabulary split, not a one-off oversight on two tiles. |
| **Recommendation** | Needs a single canonical taxonomy that all five surfaces read from, or an explicit, documented decision about which surfaces are allowed to diverge and why (e.g., concierge's free-text field may legitimately not need to match the structured enum). This is the largest-scope item of the four and the one most likely to require a product decision rather than a pure code fix — flagged, not solved, here. |

---

## 3. Why These Can't Be Fixed One at a Time

The four areas are coupled through the platform's current near-zero vendor volume, not through their code:

- **2.2 alone** (fix the filter, nothing else): every occasion tile breaks from "shows the one approved vendor" to "tells every visitor the platform has no vendors" — a regression, not a fix, and dishonest given 2.3's current copy.
- **2.3 alone** (fix the empty-state copy, nothing else): cosmetic only; the underlying param is still silently ignored, so the new, more honest copy would still be wrong in the opposite direction — telling visitors "no match" when actually no filter ever ran.
- **2.4 alone** (unify the taxonomy): doesn't change production behavior at all while 2.1 and 2.2 are unresolved — vendors still have no event-type data and Browse still doesn't apply the filter.
- **2.1 alone** (get the one vendor tagged): doesn't produce any visible change without 2.2 shipping, and would sit dormant.

None of the four is safe to ship in isolation at today's volume (2 vendors, 1 approved, near-zero organic traffic — consistent with `ELBOLD_TRANSFORMATION_GATE_2_REVIEW.md`'s standing baseline finding). They are only safe as a sequence.

---

## 4. Recommended Safest Implementation Sequence

This is a recommendation, not an authorisation — nothing below is implemented.

1. **2.3 first, alone:** split the empty state into "no vendors on the platform yet" (existing copy, unchanged) vs "no vendors match this filter yet" (new, honest, reuses the same section's structure). Zero behavior change, zero regression risk, ships independently of everything else.
2. **2.1, in parallel, off-platform:** ask the one approved vendor to set `event_types` via the profile editor that already exists. Trivial at n=1; no code change.
3. **2.2, only after 1 and 2 are both true:** apply the existing `eventType` state in `filtered` (mirroring the `category` pattern) and fix the missing dependency. By this point a zero-match result reads honestly (2.3) and at least one real occasion value has real supply behind it (2.1), so the filter going live is a genuine improvement rather than a new failure mode.
4. **2.4 last, and treated as its own decision, not a code sprint:** propose a single canonical taxonomy (or an explicit, documented exception list) before adding any more homepage- or concierge-side occasion values, and reconcile `cultural` / `religious_family_milestone` against it. This is intentionally sequenced last because it's the one area where the right answer is a product decision, not a verified defect, and because steps 1-3 are safe to ship without waiting for it — the two orphaned values simply continue to behave as they do today (silently ignored, matching the pre-fix behavior of every other tile) until this step lands.

---

## 5. What This Assessment Deliberately Does Not Do

- **No implementation** — no file in this repository was changed to produce this assessment. Two temporary read-only diagnostic scripts were used against production to gather the vendor-count and `event_types` evidence in §1 and §2.1, then deleted; no writes were made.
- **No homepage changes** — the homepage remains frozen per this session's separate authorisation; nothing here revisits `app/page.tsx`.
- **No decision on 2.4's canonical taxonomy** — that is named as the one item genuinely requiring your judgment, not resolved here.
- **No timeline or resourcing estimate** — sequencing only, not scheduling.

---

## 6. Status and Next Step

This assessment is complete. Per this transformation's standing discipline, implementation of any step above requires a separate, explicit authorisation naming the specific step — the same rule that has governed every prior work package in this arc.
