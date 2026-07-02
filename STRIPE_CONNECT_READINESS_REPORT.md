# STRIPE CONNECT READINESS REPORT

**Date:** 2026-07-02
**Scope:** Wave 3A — vendor-facing Stripe Connect experience, positioned as Secure Business Verification
**Status:** UI implemented and deployed dark (kill switch off, confirmed safe). **Not yet activated.**

---

## What Wave 3A Actually Built

Phase 70B (2026-06-23) already shipped the complete backend: 5 API routes (`onboard`, `status`, `refresh`, `dashboard`, `connect-webhook`) and the full data model (`vendors` Connect columns, `vendor_connect_onboarding`, `financial_ledger` Connect columns reserved for future payout execution). All 4 vendor-facing routes were kill-switched behind `STRIPE_CONNECT_ENABLED` and returned 503 unconditionally. **No vendor ever saw any of this** — there was no UI. That was the actual gap.

Wave 3A built exactly one thing: `components/vendor/StripeConnectCard.tsx`, wired into `/vendor/payouts`, calling the four existing routes as-is. No backend logic was rewritten. The kill switch is untouched.

**Explicitly out of scope for this wave** (and correctly so): actual payout execution — moving money via Stripe transfers. The `financial_ledger` columns for this (`stripe_transfer_id`, `connect_account_id`, etc.) are still unpopulated by any code, exactly as Phase 70B left them, reserved for a future phase. This wave is about *verification and trust positioning*, not automating money movement.

---

## 1. Technical Verification

| Item | Result |
|---|---|
| API contract match (UI ↔ routes) | Verified by reading each route's exact response shape directly (not from memory/docs) — `status` (`{status, chargesEnabled, payoutsEnabled, detailsSubmitted, onboardedAt, latestOnboarding}`), `onboard`/`refresh` (`{url, expiresAt}`), `dashboard` (`{url}`). All match what the UI expects. |
| Kill switch preserved | All 4 routes still check `STRIPE_CONNECT_ENABLED !== "true"` as their first line, unconditionally. Not modified. |
| Build/typecheck/lint | `tsc --noEmit` clean, `next build --webpack` clean, exit 0. One lint warning (`react-hooks/set-state-in-effect`) present — matches an existing pattern already shipped elsewhere in this codebase (`ManualContactNotes.tsx`, `ContactTimeline.tsx`); does not block the actual build. |
| Safe-when-disabled behaviour | Confirmed: current production state has `STRIPE_CONNECT_ENABLED=false` (you confirmed this directly before I pushed). The status route returns 503, and `StripeConnectCard` renders a static "Coming Soon" card with zero interactive elements or API calls — nothing a vendor can click that leads anywhere. |
| **Live end-to-end test (not performed)** | I did **not** click through a real Stripe onboarding flow. Doing so would require flipping `STRIPE_CONNECT_ENABLED=true` in production, which you have not authorized, and which the task explicitly asked me to hold off on ("do not enable public rollout until end-to-end testing passes"). This is a genuine gap between "code verified correct by inspection" and "proven working live" — see §5 for the exact sequence to close it safely. |

---

## 2. Commercial Messaging Review

The brief was explicit: do not position this as "Payout Setup." Verified against the actual shipped copy:

- Heading: **"Secure Business Verification"** — never "Payout Setup" or "Bank Details" anywhere in the new component.
- Benefits list shown on every non-active state: *Secure, bank-grade payouts · Faster payment processing · Trusted business verification · Increased customer confidence · Professional payment infrastructure* — matches all five phrases from your brief verbatim.
- CTA copy: "Start Secure Verification" (not started) → "Continue Verification" (in progress) → "Open Payment Dashboard" (active). No step is labelled with plumbing language.
- Active-state copy: *"Your business is verified. Payouts are processed securely through Stripe's professional payment infrastructure"* — leads with the trust outcome, payouts are the mechanism, not the headline.
- The "Coming Soon" dark-state card carries the same framing (*"bank-grade business verification, powered by Stripe... a stronger trust signal with customers"*) — so even before activation, a vendor who happens to see it gets the correct positioning, not a placeholder.

---

## 3. Vendor Journey Review

Walked through every reachable state:

- **Not started** → clear CTA, benefits visible, one click to Stripe's hosted onboarding.
- **Returned from Stripe with `?connected=1`** → distinct success message ("Verification details submitted... we'll email you once it's complete") rather than silently reverting to the generic "in progress" copy — a vendor gets confirmation their action registered.
- **In progress, link still valid** → same CTA re-triggers a fresh onboarding link via `/refresh` rather than erroring.
- **In progress, link expired** → handled identically (the route itself decides whether to issue a new link; the UI doesn't need to know the difference).
- **Active** → verified badge, single clear action (open Stripe's own Express dashboard).
- **Restricted/disabled** → distinct copy ("needs a bit more information" / "needs attention") rather than a generic error, with the same refresh CTA.
- **API failures** (rate limit, network error, Stripe API error) → surfaced inline near the button, not a silent failure or a full-page crash.

**Known limitation, not fixed in this wave:** the existing "How Payouts Work" section further down the same page still says *"Automated bank payouts via Stripe Connect are planned"* — this remains accurate (payout execution genuinely isn't live yet) but the page now has two payout-related sections (the new verification card and the existing bank-details/beta-notice section) that a vendor would benefit from having explicitly connected in copy (e.g. "verification now, automated payouts next"). Recommend as a P2 copy pass once activation is closer.

---

## 4. Founder Operational Impact

This is where the "reduce operational workload" objective is concrete, even before payout execution ships:

- **KYC/identity verification moves from you to Stripe.** Once active, Stripe's own onboarding collects and verifies the business/individual details Express accounts require — this is work you are not currently doing manually (the existing bank-details flow just stores what a vendor types in, with no verification step at all).
- **Fewer support questions, once live.** The verified/in-progress/restricted states are all vendor-self-serve (refresh their own link, see their own status) rather than requiring you to intervene.
- **No change to your workload today.** Because the switch is off, this deploy adds zero new operational surface right now — no new support queue, no new webhook events to monitor, nothing to reconcile. The operational benefit is deferred until activation.
- **New operational responsibility once active:** someone needs to monitor the `connect-webhook` route's health (it's deliberately not kill-switch-gated, so it always processes `account.updated` events) and the `vendor_connect_onboarding`/`stripe_events` tables for stuck or failed onboarding attempts. No dashboard for this exists yet — worth a small addition (e.g. an admin view of vendors stuck in `pending` beyond N days) before wide rollout, not before initial activation with a handful of vendors.

---

## 5. Rollback Verification

- **Instant, single-point rollback confirmed by code inspection:** all 4 vendor-facing routes check the kill switch as their literal first statement. Setting `STRIPE_CONNECT_ENABLED` back to `false` (or unsetting it) makes every route 503 again immediately, no deploy required — same mechanism already relied on since Phase 70B.
- **The webhook route is intentionally not gated by the switch** (so Stripe's retry mechanism doesn't queue up failures while disabled) — this is correct and unchanged, but means rollback of the *vendor-facing flow* does not stop Stripe from delivering `account.updated` events for any accounts already created. That's expected and safe: the webhook is idempotent (unique-constraint guard on `stripe_events.id`) and only affects vendors who already have a real Connect account, which won't exist until activation happens.
- **No destructive migration involved.** Nothing in this wave altered schema — pure additive UI on top of Phase 70B's existing tables.

---

## What's Genuinely Still Missing Before Activation

Confirmed directly against production (not assumed):

1. **`STRIPE_CONNECT_WEBHOOK_SECRET` is not set in production** (checked via `vercel env ls` — present: `STRIPE_CONNECT_ENABLED`; absent: `STRIPE_CONNECT_WEBHOOK_SECRET`). Without it, `assertConnectWebhookSecret()` will throw and no account will ever transition from `pending` to `active` — vendors would complete Stripe's onboarding and then appear permanently stuck. **This must be configured before flipping the switch, not after.**
2. **Stripe Connect platform application approval status is unknown to me** — this is an external Stripe Dashboard step I have no visibility into and can't check. Needs your confirmation.
3. **Live end-to-end test not yet performed** (§1) — recommend testing with one real account (your own vendor account, following the same pattern already used earlier in this session for other test data) before any wider rollout, specifically to confirm the webhook actually flips status to `active` end to end.

**Recommended activation sequence:** (1) confirm Stripe Connect application is approved → (2) configure `STRIPE_CONNECT_WEBHOOK_SECRET` in the Connect webhook endpoint settings → (3) set `STRIPE_CONNECT_ENABLED=true` → (4) test the full flow on one account you control → (5) confirm the webhook fired and status shows `active` → (6) only then consider it ready for real vendors.

---

*This report does not recommend flipping `STRIPE_CONNECT_ENABLED` — that decision requires the two external confirmations in §5, which sit outside what I can verify from the codebase.*
