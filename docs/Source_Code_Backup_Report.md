# ELBOLD Source Code Backup Report

**Date:** 2026-06-08
**Status:** CRITICAL — Immediate action required
**Compiled by:** Automated git audit

---

## Summary

| Metric | Value |
|---|---|
| Branch | design/phase-2-visual-improvements |
| Last pushed commit (GitHub) | 6fc5c8a — fix(images): replace dead DJ Unsplash photo ID |
| Commits ahead of GitHub | 4 (committed locally, not pushed) |
| Uncommitted modified files | 75 |
| Uncommitted untracked files/dirs | 10 |
| **Total at-risk assets** | **85 entries** |
| Risk level | CRITICAL — sole copy on local machine |

---

## Commits Ahead of GitHub (Not Pushed)

These 4 commits exist on the local machine only. A hard drive failure would destroy all 4.

| Commit | Message | Risk |
|---|---|---|
| 9663b79 | ops(pre-launch): operational sprint — 7 priorities, geographic positioning, readiness report | LOST |
| 072100e | feat(phase-5): founding vendor programme, concierge mode, recruitment, trust docs | LOST |
| 31a3062 | feat(phase-4): marketplace validation sprint — all 8 missions | LOST |
| 59eb544 | feat(phase-3): vendor readiness, activation, founder dashboard, trust badges | LOST |

---

## Uncommitted Modified Files (75)

Files tracked by git that have been changed since the last commit, not yet staged or committed.

### App Pages (31 files)

| File | Sprint Group |
|---|---|
| app/page.tsx | Brand & Homepage |
| app/(auth)/login/page.tsx | Launch & Auth |
| app/(locations)/location-page.tsx | Brand & Homepage |
| app/about/page.tsx | Brand & Homepage |
| app/actions/password.ts | Launch & Auth |
| app/admin/launch-freeze/page.tsx | Launch & Pilot |
| app/admin/launch/page.tsx | Launch & Pilot |
| app/admin/operations/page.tsx | Admin Ops |
| app/admin/page.tsx | Admin Ops |
| app/admin/payouts/page.tsx | Admin Ops |
| app/admin/pilot-testing/submissions/page.tsx | Launch & Pilot |
| app/admin/quotes/page.tsx | Admin Ops |
| app/admin/seo/page.tsx | Launch & Pilot |
| app/admin/trust-audit/page.tsx | Trust & Verification |
| app/admin/vendor-activation/page.tsx | Vendor Activation |
| app/admin/vendor-growth/page.tsx | Vendor Acquisition |
| app/booking-protection/page.tsx | Trust & Verification |
| app/brand/page.tsx | Brand & Homepage |
| app/browse/page.tsx | Brand & Homepage |
| app/categories/[category]/page.tsx | Brand & Homepage |
| app/help/page.tsx | Support & PWA |
| app/how-it-works/page.tsx | Brand & Homepage |
| app/how-we-verify/page.tsx | Trust & Verification |
| app/inspire/page.tsx | Brand & Homepage |
| app/our-commitments/page.tsx | Trust & Verification |
| app/support/page.tsx | Support & PWA |
| app/trust/page.tsx | Trust & Verification |
| app/vendor-spotlights/page.tsx | Brand & Homepage |
| app/vendor-standards/page.tsx | Trust & Verification |
| app/why-elbold/page.tsx | Brand & Homepage |

### Components (35 files)

| File | Sprint Group |
|---|---|
| components/CookieConsent.tsx | Support & PWA |
| components/admin/AdminBookingsView.tsx | Admin Ops |
| components/admin/AdminCustomerTable.tsx | Admin Ops |
| components/admin/AdminDisputesView.tsx | Admin Ops |
| components/admin/AdminGovernanceDashboard.tsx | Admin Ops |
| components/admin/AdminPayoutsQueue.tsx | Admin Ops |
| components/admin/AdminPayoutsView.tsx | Admin Ops |
| components/admin/AdminQuotesView.tsx | Admin Ops |
| components/admin/AdminVendorTable.tsx | Admin Ops |
| components/admin/PilotCRM.tsx | Launch & Pilot |
| components/customer/CreateEventWizard.tsx | Customer Journey |
| components/customer/CustomerBookingDetail.tsx | Customer Journey |
| components/customer/CustomerEventsView.tsx | Customer Journey |
| components/customer/CustomerQuotesView.tsx | Customer Journey |
| components/customer/QuoteComparisonView.tsx | Customer Journey |
| components/customer/QuoteDetailView.tsx | Customer Journey |
| components/guests/GuestListView.tsx | Customer Journey |
| components/layout/DashboardLayout.tsx | Vendor Acquisition |
| components/layout/Navbar.tsx | Brand & Homepage |
| components/messaging/MessagingView.tsx | Customer Journey |
| components/pilot/LaunchReadinessDashboard.tsx | Launch & Pilot |
| components/pilot/SubmissionsView.tsx | Launch & Pilot |
| components/pwa/InstallPrompt.tsx | Support & PWA |
| components/pwa/ServiceWorkerRegistration.tsx | Support & PWA |
| components/smart/SmartTipsWidget.tsx | Support & PWA |
| components/ui/BookingPromise.tsx | Trust & Verification |
| components/ui/ShowcaseGrid.tsx | Brand & Homepage |
| components/vendor/ProfileStrengthWidget.tsx | Vendor Journey |
| components/vendor/VendorApplyForm.tsx | Vendor Journey |
| components/vendor/VendorBookingDetail.tsx | Vendor Journey |
| components/vendor/VendorGovernanceWidget.tsx | Vendor Journey |
| components/vendor/VendorMarketplace.tsx | Vendor Journey |
| components/vendor/VendorMediaManager.tsx | Vendor Journey |
| components/vendor/VendorOnboardingWizard.tsx | Vendor Journey |
| components/vendor/VendorProfileEditor.tsx | Vendor Journey |
| components/vendor/VendorProfileView.tsx | Vendor Journey |
| components/vendor/VendorQuotesView.tsx | Vendor Journey |
| components/vendor/VendorReviewsView.tsx | Vendor Journey |
| components/vendor/VendorServicesManager.tsx | Vendor Journey |
| components/vendor/VendorSubscriptionView.tsx | Vendor Journey |
| components/vendor/VendorTrustBadges.tsx | Trust & Verification |
| components/vendor/VendorVerificationView.tsx | Trust & Verification |

### Library / Config (3 files)

| File | Sprint Group |
|---|---|
| lib/guides.ts | Brand & Homepage |
| lib/resend/index.ts | Admin Ops |
| lib/resend/vendor-outreach.ts | Vendor Activation |

---

## Untracked Files / Directories (10 entries — new, never committed)

These are brand-new additions, not yet added to git at all.

| Entry | Sprint Group | Risk |
|---|---|---|
| app/admin/vendor-acquisition/ | Vendor Acquisition | UNPROTECTED |
| app/admin/vendor-coverage/ | Vendor Acquisition | UNPROTECTED |
| app/admin/vendor-outreach/ | Vendor Acquisition | UNPROTECTED |
| app/admin/vendor-pipeline/ | Vendor Acquisition | UNPROTECTED |
| app/api/admin/vendor-leads/ | Vendor Acquisition | UNPROTECTED |
| lib/vendor-acquisition/ | Vendor Acquisition | UNPROTECTED |
| supabase/migrations/042_vendor_leads.sql | Vendor Acquisition | UNPROTECTED |
| supabase/migrations/043_vendor_leads_extended.sql | Vendor Acquisition | UNPROTECTED |
| docs/Vendor_Acquisition_System.md | Documentation | UNPROTECTED |
| docs/ELBOLD_Master_Asset_Register.md | Documentation | UNPROTECTED |

---

## Planned Commit Groups

All 85 at-risk items are staged into 10 logical commits, then pushed with the 4 existing unpushed commits.

| # | Commit Message | Files |
|---|---|---|
| 1 | feat(brand): luxury brand transformation — homepage, browse, navbar | 13 |
| 2 | feat(trust): trust and verification sprint — trust pages, badges | 9 |
| 3 | feat(vendors): vendor journey — apply, onboard, profile, services | 13 |
| 4 | feat(customers): customer journey — booking, quotes, events, messages | 8 |
| 5 | feat(admin): admin operations, finance, and moderation | 13 |
| 6 | feat(launch): launch freeze, pilot testing, SEO dashboard | 9 |
| 7 | feat(activation): vendor activation system and growth dashboard | 4 |
| 8 | feat(acquisition): vendor acquisition CRM — leads, pipeline, outreach, coverage | 8 untracked entries |
| 9 | feat(support): support pages, PWA, cookie consent | 6 |
| 10 | docs: master asset register, backup report, vendor acquisition docs | 3 |

**Total: 10 new commits + 4 existing = 14 commits to push to GitHub**

---

## Risk Assessment

| Risk | Status Before This Sprint | Status After |
|---|---|---|
| Disk failure destroys all sprint work | CRITICAL — 15+ sprints local only | RESOLVED after push |
| GitHub out of date | CRITICAL — 4 commits + 85 files missing | RESOLVED after push |
| Vercel production outdated | HIGH — 4+ months behind local | PARTIALLY RESOLVED — Vercel auto-deploys from GitHub push |
| .env.local not backed up | HIGH — not in git (correct, but needs manual backup) | ONGOING — manual action required |

---

## Post-Commit Action Required

After all commits are pushed to GitHub:

1. Verify: https://github.com/abs365/bold-party-planner/tree/design/phase-2-visual-improvements shows all commits
2. Verify: Vercel auto-deployment triggered (check Vercel dashboard)
3. Manual: Back up .env.local to a secure location (password manager, private notes, encrypted drive)
4. Manual: Apply Supabase migrations 041, 042, 043 in Supabase Dashboard SQL Editor
