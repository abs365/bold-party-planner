# ELBOLD Master Asset Register

**Date:** 2026-06-08
**Compiled by:** Automated audit of local filesystem, git repository, and project memory.
**Scope:** Complete inventory of all documentation, pages, migrations, assets, and deployment state.

---

## Status Key

| Symbol | Meaning |
|---|---|
| ACTIVE | In use, current, maintained |
| DRAFT | Created, not finalised |
| SUPERSEDED | Replaced by a newer document |
| ARCHIVED | Historical, no longer in use |
| NOT APPLIED | Migration exists locally, not yet run in Supabase |
| APPLIED | Confirmed executed in Supabase |
| UNKNOWN | Cannot confirm from local data alone |

---

## Section 1 — Documentation Inventory

### 1A — docs/ folder (57 files)

#### Engineering and Technical

| Document | Path | Created | Purpose | Status |
|---|---|---|---|---|
| architecture.md | docs/architecture.md | 2026-05-30 | System architecture overview | ACTIVE |
| engineering-standards.md | docs/engineering-standards.md | 2026-05-30 | Code standards and conventions | ACTIVE |
| auth-configuration.md | docs/auth-configuration.md | 2026-06-03 | Supabase Auth redirect URLs, env vars, SMTP config | ACTIVE |
| environments.md | docs/environments.md | 2026-05-31 | Environment variable reference (dev/preview/prod) | ACTIVE |
| disaster-recovery.md | docs/disaster-recovery.md | 2026-05-31 | DR procedures and rollback steps | ACTIVE |
| incident-response.md | docs/incident-response.md | 2026-05-31 | On-call and incident escalation guide | ACTIVE |
| runbooks.md | docs/runbooks.md | 2026-05-31 | Operational runbooks for common tasks | ACTIVE |
| production-checklist.md | docs/production-checklist.md | 2026-05-31 | Pre-deployment production checklist | ACTIVE |
| test-failure-classification.md | docs/test-failure-classification.md | 2026-05-31 | Playwright/CI test failure triage guide | ACTIVE |
| monitoring.md | docs/monitoring.md | 2026-05-30 | Sentry/Vercel monitoring setup | ACTIVE |
| performance-audit.md | docs/performance-audit.md | 2026-05-30 | Core Web Vitals audit findings | ACTIVE |
| performance-guidelines.md | docs/performance-guidelines.md | 2026-05-30 | Frontend performance rules | ACTIVE |
| github-actions.md | docs/github-actions.md | 2026-05-30 | CI/CD pipeline documentation | ACTIVE |
| vendor-email-confirmation-qa.md | docs/vendor-email-confirmation-qa.md | 2026-06-03 | Manual QA sign-off gate for Tests A-D (email flows) | ACTIVE |

#### Mobile / App Store

| Document | Path | Created | Purpose | Status |
|---|---|---|---|---|
| app-store-assets.md | docs/app-store-assets.md | 2026-05-30 | App Store / Play Store asset requirements | DRAFT |
| mobile-deployment.md | docs/mobile-deployment.md | 2026-05-30 | Capacitor iOS/Android deployment guide | DRAFT |
| mobile-performance-audit.md | docs/mobile-performance-audit.md | 2026-05-30 | Mobile performance findings | DRAFT |

#### Design Sprint

| Document | Path | Created | Purpose | Status |
|---|---|---|---|---|
| Design_Phase2_Visual_Audit.md | docs/Design_Phase2_Visual_Audit.md | 2026-06-07 | Before/after overlay analysis (benchmark: Airbnb 25-40%) | ACTIVE |
| Design_Phase2_Before_After_Mockups.md | docs/Design_Phase2_Before_After_Mockups.md | 2026-06-07 | Visual comparison mockups | ACTIVE |
| Design_Phase2_Conversion_Impact.md | docs/Design_Phase2_Conversion_Impact.md | 2026-06-07 | Estimated conversion impact of visual changes | ACTIVE |
| Design_Phase2_Priority_Improvements.md | docs/Design_Phase2_Priority_Improvements.md | 2026-06-07 | Backlog for Design Phase 3 (not yet implemented) | ACTIVE |
| Design_Phase3_Conversion_Audit.md | docs/Design_Phase3_Conversion_Audit.md | 2026-06-07 | Conversion audit scores by page | ACTIVE |
| Conversion_Fix_Validation.md | docs/Conversion_Fix_Validation.md | 2026-06-07 | Validation report for conversion improvements | ACTIVE |
| Homepage_Visual_Audit.md | docs/Homepage_Visual_Audit.md | 2026-06-07 | Homepage visual issues: fixed vs not-bugs | ACTIVE |
| Image_Integrity_Report.md | docs/Image_Integrity_Report.md | 2026-06-07 | All category/occasion image analysis and fallback map | ACTIVE |

#### Launch and Readiness

| Document | Path | Created | Purpose | Status |
|---|---|---|---|---|
| Launch_Readiness_Report.md | docs/Launch_Readiness_Report.md | 2026-06-07 | Earlier readiness report | SUPERSEDED |
| Launch_Readiness_Final_Report.md | docs/Launch_Readiness_Final_Report.md | 2026-06-07 | 5-persona walkthrough, GO WITH CAUTION verdict | ACTIVE |
| Phase1_Launch_Freeze.md | docs/Phase1_Launch_Freeze.md | 2026-06-07 | Launch Freeze policy: unlock gate, milestones, exceptions | ACTIVE |
| Phase4_LaunchReadinessReport.md | docs/Phase4_LaunchReadinessReport.md | 2026-06-07 | Phase 4 readiness findings | SUPERSEDED |
| Phase4_CustomerTrustLayer_Proposal.md | docs/Phase4_CustomerTrustLayer_Proposal.md | 2026-06-07 | Trust layer architecture proposal | ACTIVE |
| Phase4_TestJourneys.md | docs/Phase4_TestJourneys.md | 2026-06-07 | Phase 4 test journey scripts | ARCHIVED |
| Phase5_LaunchKPIFramework.md | docs/Phase5_LaunchKPIFramework.md | 2026-06-07 | 3-tier KPI framework: supply/transaction/trust | ACTIVE |
| Phase5_TrustFirstHomepageReview.md | docs/Phase5_TrustFirstHomepageReview.md | 2026-06-07 | Homepage trust recommendations (no code changes) | ACTIVE |
| Phase5_SuccessStoryFramework.md | docs/Phase5_SuccessStoryFramework.md | 2026-06-07 | How to collect success stories, what NOT to do | ACTIVE |
| Phase5_VerificationEnforcementPolicy.md | docs/Phase5_VerificationEnforcementPolicy.md | 2026-06-07 | Badge grant rules, 4 verification levels, revocation | ACTIVE |
| PreLaunch_P1_ConciergeSystemTest.md | docs/PreLaunch_P1_ConciergeSystemTest.md | 2026-06-07 | Pre-launch concierge system test protocol | ACTIVE |
| PreLaunch_P2_VendorCohortReview.md | docs/PreLaunch_P2_VendorCohortReview.md | 2026-06-07 | Vendor cohort review checklist | ACTIVE |
| PreLaunch_P3_VerificationActions.md | docs/PreLaunch_P3_VerificationActions.md | 2026-06-07 | Verification system actions before invite | ACTIVE |
| PreLaunch_P4_FoundingVendorReview.md | docs/PreLaunch_P4_FoundingVendorReview.md | 2026-06-07 | Founding vendor slot review | ACTIVE |
| PreLaunch_P5_ConciergeJourneyTest.md | docs/PreLaunch_P5_ConciergeJourneyTest.md | 2026-06-07 | Concierge user journey test | ACTIVE |
| PreLaunch_P6_FirstBookingMission.md | docs/PreLaunch_P6_FirstBookingMission.md | 2026-06-07 | First real booking mission protocol | ACTIVE |
| support-operations.md | docs/support-operations.md | 2026-05-30 | Support team procedures | ACTIVE |

#### Vendor Operations

| Document | Path | Created | Purpose | Status |
|---|---|---|---|---|
| First_20_Vendor_Activation_Plan.md | docs/First_20_Vendor_Activation_Plan.md | 2026-06-07 | 8-stage activation journey, 30-day timeline, outreach templates | ACTIVE |
| First_50_Vendors_Playbook.md | docs/First_50_Vendors_Playbook.md | 2026-06-07 | 8 categories, 3 locations, 6 sources, DM templates, weekly targets | ACTIVE |
| Vendor_Acquisition_System.md | docs/Vendor_Acquisition_System.md | 2026-06-08 | Full system reference: architecture, scoring, daily routine, compliance | ACTIVE |
| Vendor_Activation_Gap_Report.md | docs/Vendor_Activation_Gap_Report.md | 2026-06-07 | Ballet vendor, approval criteria gap, outreach template | ACTIVE |
| Vendor_End_To_End_Audit.md | docs/Vendor_End_To_End_Audit.md | 2026-06-07 | 10-stage vendor journey map, 3 blockers, 4 friction points | ACTIVE |
| Vendor_Journey_Audit.md | docs/Vendor_Journey_Audit.md | 2026-06-07 | 9-stage vendor journey with HIGH friction items | ACTIVE |
| Vendor_Trust_Protection_Audit.md | docs/Vendor_Trust_Protection_Audit.md | 2026-06-07 | Trust protection audit findings | ACTIVE |
| Verification_Fix_Report.md | docs/Verification_Fix_Report.md | 2026-06-07 | Root cause (migration 039d), fix details, test plan | ACTIVE |
| Customer_Journey_Audit.md | docs/Customer_Journey_Audit.md | 2026-06-07 | 8-stage customer journey map, 3 HIGH friction items | ACTIVE |
| Trust_Integrity_Resolution_Report.md | docs/Trust_Integrity_Resolution_Report.md | 2026-06-07 | Trust integrity audit findings and resolutions | ACTIVE |

#### Finance and Compliance

| Document | Path | Created | Purpose | Status |
|---|---|---|---|---|
| Revenue_Flow_Architecture_Report.md | docs/Revenue_Flow_Architecture_Report.md | 2026-06-06 | All 3 revenue flows traced, 8 findings, 5 SQL queries | ACTIVE |
| Revenue_Flow_Validation_Report.md | docs/Revenue_Flow_Validation_Report.md | 2026-06-07 | Full flow validation Quote->Stripe->Webhook->DB->Ledger | ACTIVE |
| Revenue_Reconciliation_Runbook.md | docs/Revenue_Reconciliation_Runbook.md | 2026-06-06 | 8 SQL query sets, weekly/daily cadence, sign-off checklist | ACTIVE |
| Revenue_Risk_Register.md | docs/Revenue_Risk_Register.md | 2026-06-06 | Revenue risk register with escalation protocols | ACTIVE |
| Stripe_Connect_Feasibility_Report.md | docs/Stripe_Connect_Feasibility_Report.md | 2026-06-06 | Connect vs direct-charge analysis, cost model, migration plan | ACTIVE |
| Stripe_Connect_Migration_Plan.md | docs/Stripe_Connect_Migration_Plan.md | 2026-06-06 | Step-by-step Connect migration plan | ACTIVE |
| Marketplace_Compliance_Assessment.md | docs/Marketplace_Compliance_Assessment.md | 2026-06-06 | FCA PSR 2017, GDPR, PECR assessment | ACTIVE |
| Market_Leadership_Analysis.md | docs/Market_Leadership_Analysis.md | 2026-06-06 | Market positioning analysis | ACTIVE |

**docs/ total: 57 files**

---

### 1B — Root-Level Documents

| Document | Path | Purpose | Status |
|---|---|---|---|
| README.md | README.md | Project overview for GitHub | ACTIVE |
| AGENTS.md | AGENTS.md | Claude Code system guidance | ACTIVE |
| CLAUDE.md | CLAUDE.md | Claude Code project config | ACTIVE |
| LAUNCH_CHECKLIST.md | LAUNCH_CHECKLIST.md | Pre-launch checklist | ACTIVE |
| DEPLOYMENT_GUIDE.md | DEPLOYMENT_GUIDE.md | Vercel deployment guide | ACTIVE |
| AUTH_TEST_CHECKLIST.md | AUTH_TEST_CHECKLIST.md | Auth flow manual test checklist | ACTIVE |
| RLS_POLICY_MATRIX.md | RLS_POLICY_MATRIX.md | Supabase RLS policy reference | ACTIVE |
| TESTER_GUIDE.md | TESTER_GUIDE.md | Beta tester onboarding guide | ACTIVE |
| UX_AUDIT.md | UX_AUDIT.md | UX audit findings | ACTIVE |

---

### 1C — ELBOLD Master Documentation Suite (28 files)

Location: `ELBOLD_Master_Documentation_Suite/`
This is the formal enterprise documentation set, separate from the operational docs/ folder.

#### Launch/ (15 files)

| Document | Purpose | Status |
|---|---|---|
| Beta Command Centre.md | Daily founder operating centre: live metrics, decision framework | ACTIVE |
| Beta_Test_Results.md | QA tracking for beta testers | ACTIVE |
| Vendor_Email_Confirmation_QA.md | Tests A-D sign-off gate for email flows | ACTIVE |
| Beta Operations Pack/01_Customer_Journey_Map.md | Full customer journey with pain points | ACTIVE |
| Beta Operations Pack/02_Vendor_Journey_Map.md | Full vendor journey with pain points | ACTIVE |
| Beta Operations Pack/03_Admin_Journey_Map.md | Admin journey and responsibilities | ACTIVE |
| Beta Operations Pack/04_RFQ_Quote_Workflow.md | End-to-end RFQ and quote process | ACTIVE |
| Beta Operations Pack/05_Vendor_Approval_Workflow.md | Vendor approval decision process | ACTIVE |
| Beta Operations Pack/06_Bug_Escalation_Process.md | Bug triage and escalation protocol | ACTIVE |
| Beta Operations Pack/07_Daily_Beta_Monitoring_Checklist.md | 9-area daily monitoring checklist | ACTIVE |
| Beta Operations Pack/08_6_to_20_Tester_Expansion_Criteria.md | 12 criteria required to expand beyond 6 testers | ACTIVE |
| Pilot CRM/Pilot_Testers.md | Pilot tester register | ACTIVE |
| Pilot CRM/Vendor_Pipeline.md | Vendor acquisition pipeline tracker | ACTIVE |
| Pilot CRM/Customer_Pipeline.md | Customer pipeline tracker | ACTIVE |
| Pilot CRM/Feedback_Log.md | Feedback from testers | ACTIVE |
| Pilot CRM/Bug_Tracker.md | Bug log during pilot | ACTIVE |
| Pilot CRM/Daily_Launch_Report.md | Daily launch status template | ACTIVE |
| Pilot CRM/Weekly_Pilot_Summary.md | Weekly pilot summary template | ACTIVE |

#### Validation/ (5 files)

| Document | Purpose | Status |
|---|---|---|
| Journey_Validation_Tracker.md | 27-step validation checklist | ACTIVE |
| Beta_Test_Results.md | Beta test results record | ACTIVE |
| RFQ_Validation_Report.md | RFQ flow validation | ACTIVE |
| Vendor_Approval_Validation_Report.md | Vendor approval validation | ACTIVE |
| Validation_Readiness_Report.md | Overall validation readiness | ACTIVE |

#### Operations/ (4 files)

| Document | Purpose | Status |
|---|---|---|
| Admin_Module_Audit.md | Admin module completeness audit | ACTIVE |
| Quote_Pipeline_Audit.md | Quote pipeline audit | ACTIVE |
| Launch_Monitoring_Checklist.md | Daily 9-area launch monitoring checklist | ACTIVE |
| Backlog_Storage_Delete_RLS_Mismatch.md | BUG-001 (P3): vendor self-delete media bug | ACTIVE |

#### Security/ (1 file)

| Document | Purpose | Status |
|---|---|---|
| Security_Hardening_Audit.md | Security hardening findings | ACTIVE |

---

## Section 2 — Operational Assets

### Admin Pages

| Name | Route | Type | Purpose | Status |
|---|---|---|---|---|
| Acquisition Dashboard | /admin/vendor-growth | Server | Acquisition funnel, category/location coverage, daily targets from vendor_leads | ACTIVE |
| Lead CRM | /admin/vendor-acquisition | Client | Full CRUD for vendor leads, outreach generation, CSV import | ACTIVE |
| Pipeline Kanban | /admin/vendor-pipeline | Client | 10-column drag-and-drop pipeline board | ACTIVE |
| Outreach Queue | /admin/vendor-outreach | Client | Actionable outreach queue with message generation | ACTIVE |
| Coverage Map | /admin/vendor-coverage | Server | Category and geography coverage vs targets | ACTIVE |
| Vendor Activation | /admin/vendor-activation | Server | 8-stage activation tracker per approved vendor | ACTIVE |
| Launch Freeze | /admin/launch-freeze | Server | Freeze status, 4 unlock conditions, milestone progress | ACTIVE |
| Vendor Growth (old) | /admin/vendor-growth | Server | Funnel + categories + location (now includes vendor_leads metrics) | ACTIVE |
| Founder Dashboard | /admin/founder | Server | Founder-specific metrics and quick actions | ACTIVE |
| Founder Queue | /admin/cohort | Server | Vendor cohort queue for founder review | ACTIVE |
| Recruitment | /admin/recruitment | Server | Recruitment funnel with prospect tracking | ACTIVE |

### Vendor-Facing Admin

| Name | Route | Purpose | Status |
|---|---|---|---|
| Vendor Table | /admin/vendors | Approve/reject vendor applications | ACTIVE |
| Verifications | /admin/verifications | Review verification documents | ACTIVE |
| Verification Audit | /admin/verification-audit | Verification system audit view | ACTIVE |
| Governance | /admin/governance | At-risk vendors, warnings, health distribution | ACTIVE |
| Moderation | /admin/moderation | Content moderation queue | ACTIVE |

### Operations Admin

| Name | Route | Purpose | Status |
|---|---|---|---|
| Launch Readiness | /admin/launch | Founder command centre cockpit | ACTIVE |
| Operations | /admin/operations | Founder ops: action queue, revenue snapshot, payouts | ACTIVE |
| Analytics | /admin/analytics | Platform analytics dashboard | ACTIVE |
| Finance | /admin/finance | GMV, commission, MRR, payout queue, reconciliation | ACTIVE |
| Payouts | /admin/payouts | Vendor payout queue, mark-as-paid | ACTIVE |
| Bookings | /admin/bookings | Platform-wide bookings | ACTIVE |
| Customers | /admin/customers | Customer table | ACTIVE |
| Disputes | /admin/disputes | Dispute management | ACTIVE |
| Reviews | /admin/reviews | Review moderation | ACTIVE |
| Quotes | /admin/quotes | Platform-wide quote pipeline | ACTIVE |
| Subscriptions | /admin/subscriptions | MRR, plan distribution, billing events | ACTIVE |
| Monetization | /admin/monetization | Revenue metrics | ACTIVE |
| Feedback | /admin/feedback | Pilot feedback aggregation | ACTIVE |
| SEO | /admin/seo | 6-phase SEO roadmap and keyword clusters | ACTIVE |
| Support | /admin/support | Support centre overview | ACTIVE |
| System | /admin/system | System health checks | ACTIVE |
| Trust Audit | /admin/trust-audit | Trust system audit view | ACTIVE |
| Events | /admin/events | Platform events overview | ACTIVE |
| Payments | /admin/payments | Payment records | ACTIVE |

### Pilot Programme

| Name | Route | Purpose | Status |
|---|---|---|---|
| Pilot Ops | /admin/pilot | Pilot operations dashboard | ACTIVE |
| Pilot CRM | /admin/pilot/vendors | Pilot vendor CRM (CRUD, acquisition funnel) | ACTIVE |
| Pilot Report | /admin/pilot/report | Weekly pilot report | ACTIVE |
| Outreach Pack | /admin/pilot/outreach | Copyable email/WhatsApp/DM scripts | ACTIVE |
| Concierge Requests | /admin/concierge | Admin view of concierge submissions | ACTIVE |
| Pilot Testing Centre | /admin/pilot-testing | Pilot test submissions | ACTIVE |

### Google Drive Operational Assets

Connected account: elbold2026@gmail.com
Root folder: ELBOLD Master Documentation Suite (`1ODxyEsPI2TB632GDwVVMifo9KsGHkv1m`)

| Asset | Type | Purpose | Status |
|---|---|---|---|
| 00 - ELBOLD HQ (v1.3) | Google Doc | Daily founder operating centre | ACTIVE |
| ELBOLD Master Index | Google Doc | Navigation for all 21 governed docs | ACTIVE |
| ELBOLD Vendor Pipeline | Google Sheet | Status tracker Prospect->Verified | ACTIVE |
| ELBOLD Vendor Lead List | Google Sheet | 100-row pre-outreach research sheet | ACTIVE |
| ELBOLD Daily Outreach Tracker | Google Sheet | 10 contacts/day with auto-counter | ACTIVE |
| ELBOLD Weekly Vendor Acquisition Scorecard | Google Sheet | Response/Registration/Verification rates | ACTIVE |
| ELBOLD First 20 Vendors Plan | Google Sheet | 20 slots by category with live progress | ACTIVE |
| Vendor Acquisition Pack (7 docs) | Google Docs | WhatsApp scripts, DM templates, email, one-pager, FAQ, objection handling | ACTIVE |
| 21 Governed Technical Docs (DOC-001 to DOC-061) | Google Docs | BRD, FRS, NFR, Use Cases, User Stories, Data Model, ERD, Architecture, API docs, Test Strategy, UAT | ACTIVE |

---

## Section 3 — Database Migration Register

**Database:** Supabase (PostgreSQL with RLS)
**Last confirmed applied batch:** Migrations 001-037 (confirmed 2026-06-01)
**039d:** Confirmed applied (verified 2026-06-07 via retest)

| Migration | Purpose | Applied? | Risk if Missing |
|---|---|---|---|
| 001_initial.sql | Core tables: vendors, profiles, events, bookings, quotes, packages | APPLIED | Platform non-functional |
| 002_phase2.sql | stripe_events, checklist_progress, email_log, vendor_payouts, platform_stats view | APPLIED | Payments, payouts broken |
| 003_phase3.sql | quotes, quote_responses, contracts, vendor_onboarding, automation_logs | APPLIED | Quote workflow broken |
| 004_phase4.sql | vendor_subscriptions, message_threads, messages, smart_chat_history, vendor_analytics, vendor_verifications, audit_logs | APPLIED | Messaging, subscriptions, verifications broken |
| 005_phase5.sql | guests, invitations, rsvp_responses, invitation_views, event_guest_stats | APPLIED | Guest management broken |
| 006_phase6.sql | Extended vendor profiles and platform features | APPLIED | Various features broken |
| 007_phase7.sql | Additional platform features | APPLIED | Various features broken |
| 008_data_consistency_fix.sql | Data consistency fixes for earlier tables | APPLIED | Data integrity issues |
| 009_schema_grants_fix.sql | Schema permission grants | APPLIED | API access errors |
| 010_trigger_and_category_fix.sql | Trigger fixes and category constraint corrections | APPLIED | Category validation broken |
| 011_marketplace_operations.sql | Marketplace operational tables | APPLIED | Operations features broken |
| 012_moderation.sql | Moderation tables and policies | APPLIED | Review moderation broken |
| 013_vendor_verification_system.sql | Verification system tables | APPLIED | Verification system broken |
| 014_verification_automation.sql | Automated verification triggers | APPLIED | Verification automation broken |
| 015_demo_password_rpc.sql | Demo password RPC function | APPLIED | Demo user auth broken |
| 016_admin_alerts_rls.sql | Admin alerts RLS policies | APPLIED | Admin alerts inaccessible |
| 017_demo_user_fix.sql | Demo user correction | APPLIED | Demo system issues |
| 018_complete_demo_cleanup.sql | Demo account cleanup | APPLIED | Demo data conflicts |
| 019_force_demo_auth_cleanup.sql | Force cleanup of demo auth records | APPLIED | Auth conflicts |
| 020_restore_robust_trigger.sql | Profile creation trigger restore | APPLIED | New user signup broken |
| 021_analytics_and_audit.sql | Analytics tables and audit log extensions | APPLIED | Analytics broken |
| 022_vendor_governance.sql | vendor_warnings table, last_active_at, suspicious_reason | APPLIED | Governance system broken |
| 023_vendor_reviews_and_reputation.sql | Review extensions, reputation scoring, review_reports | APPLIED | Reviews, reputation broken |
| 024_subscription_infrastructure.sql | subscription_plans seeded (Free/Pro/Premium/Elite), billing_events | APPLIED | Subscriptions broken |
| 025_gdpr_and_production.sql | GDPR compliance tables and production hardening | APPLIED | GDPR compliance broken |
| 026_push_subscriptions.sql | Web push subscription storage | APPLIED | Push notifications broken |
| 027_event_planner_category.sql | Adds 'event_planner' to vendors CHECK constraint | APPLIED | Event planner category rejected |
| 027_profiles_privacy.sql | Profile privacy settings | APPLIED | Privacy controls broken |
| 028_pricing_type.sql | Pricing type column on packages | APPLIED | Package pricing broken |
| 029_storage_policies.sql | Storage bucket RLS policies | APPLIED | Media uploads blocked |
| 030_custom_category.sql | custom_category_description on vendors | APPLIED | Custom category description lost |
| 031_quote_workflow.sql | Quote workflow extensions, quote_events audit table | APPLIED | Quote audit trail broken |
| 032_vendor_bank_details.sql | vendor_bank_details table + RLS | APPLIED | Bank details not saved |
| 033_pilot_operations.sql | pilot_vendors, pilot_feedback tables | APPLIED | Pilot CRM broken |
| 034_identity_hardening.sql | phone_verified column on profiles + vendors | APPLIED | Phone verification missing |
| 035_pilot_testing.sql | Pilot testing submission tables | APPLIED | Pilot testing broken |
| 036_fix_checklist_trigger.sql | Fixes ambiguous 'item' column in checklist trigger | APPLIED | Checklist trigger error |
| 037_storage_buckets.sql | vendor-images + vendor-videos storage buckets | APPLIED | Media upload buckets missing |
| 038_phone_otp.sql | Phone OTP tables and functions | UNKNOWN | Phone OTP non-functional |
| 039b_selective_demo_cleanup.sql | Selective demo account cleanup | UNKNOWN | Demo data conflicts possible |
| 039c_phone_otp_rls_fix.sql | Phone OTP RLS policy corrections | UNKNOWN | Phone OTP access errors |
| 039d_vendor_verifications_rls_fix.sql | Vendor verifications RLS fix (INSERT policy) | APPLIED | Verification documents cannot be submitted |
| 040_financial_ledger.sql | Financial ledger tables for payout tracking | UNKNOWN | Finance dashboard queries may error |
| 041_concierge_requests.sql | concierge_requests table + RLS (anon INSERT) | **NOT APPLIED** | Concierge submissions not stored; email-only |
| 042_vendor_leads.sql | vendor_leads table + RLS + indexes | **NOT APPLIED** | Vendor Acquisition CRM non-functional |
| 043_vendor_leads_extended.sql | Adds status values + Phase 1J intelligence fields | **NOT APPLIED** | Pipeline Kanban, outreach tracking broken |

### Migrations Requiring Immediate Attention

```
CRITICAL — Apply in Supabase Dashboard:

1. 041_concierge_requests.sql    — concierge submissions lost (email-only fallback active)
2. 042_vendor_leads.sql          — Vendor Acquisition CRM non-functional until applied
3. 043_vendor_leads_extended.sql — Must run AFTER 042; extends status + adds intelligence fields

UNKNOWN — Verify in Supabase Dashboard:
4. 038_phone_otp.sql
5. 039b_selective_demo_cleanup.sql
6. 039c_phone_otp_rls_fix.sql
7. 040_financial_ledger.sql
```

---

## Section 4 — Admin Pages Register

**Total admin page directories:** 37

| Page | Route | Purpose | Complete? | Production? | Requires Testing? |
|---|---|---|---|---|---|
| Admin Home | /admin | Command centre cockpit with live DB metrics | Yes | No (local only) | Yes |
| Vendors | /admin/vendors | Approve/reject vendor applications | Yes | No | Yes |
| Customers | /admin/customers | Customer table | Yes | No | Light |
| Bookings | /admin/bookings | Platform-wide booking list | Yes | No | Light |
| Quotes | /admin/quotes | Quote pipeline with 8-stat bar | Yes | No | Yes |
| Verifications | /admin/verifications | Document review workflow | Yes | No | Yes |
| Verification Audit | /admin/verification-audit | Audit view of verification system | Yes | No | Light |
| Governance | /admin/governance | At-risk queue, warnings, health | Yes | No | Yes |
| Reviews | /admin/reviews | Flag/approve/remove reviews | Yes | No | Light |
| Disputes | /admin/disputes | Dispute management | Yes | No | Yes |
| Payments | /admin/payments | Payment records | Yes | No | Light |
| Payouts | /admin/payouts | Payout queue + mark-as-paid | Yes | No | Yes |
| Analytics | /admin/analytics | Platform analytics | Yes | No | Light |
| Finance | /admin/finance | GMV/commission/MRR/reconciliation | Yes | No | Yes |
| Subscriptions | /admin/subscriptions | MRR/plan distribution | Yes | No | Light |
| Monetization | /admin/monetization | Revenue metrics | Yes | No | Light |
| Operations | /admin/operations | Ops command centre | Yes | No | Light |
| Moderation | /admin/moderation | Content moderation | Yes | No | Light |
| Events | /admin/events | Events overview | Yes | No | Light |
| Feedback | /admin/feedback | Pilot feedback aggregation | Yes | No | Light |
| SEO | /admin/seo | SEO roadmap + keyword clusters | Yes | No | No |
| Support | /admin/support | Support centre overview | Yes | No | No |
| System | /admin/system | System health | Yes | No | Light |
| Trust Audit | /admin/trust-audit | Trust system audit | Yes | No | Light |
| Cohort | /admin/cohort | Vendor cohort queue | Yes | No | Light |
| Founder | /admin/founder | Founder metrics | Yes | No | Light |
| Recruitment | /admin/recruitment | Recruitment funnel | Yes | No | Light |
| Launch | /admin/launch | Launch readiness cockpit | Yes | No | Yes |
| Launch Freeze | /admin/launch-freeze | Freeze status + milestone tracker | Yes | No | Light |
| Pilot Ops | /admin/pilot | Pilot operations | Yes | No | Light |
| Pilot Testing Centre | /admin/pilot-testing | Pilot test submissions | Yes | No | Light |
| Concierge | /admin/concierge | Concierge request inbox | Yes | No (needs migration 041) | Yes |
| Vendor Acquisition (CRM) | /admin/vendor-acquisition | Lead CRUD, outreach generator, CSV import | Yes | No (needs migration 042) | Yes |
| Vendor Pipeline | /admin/vendor-pipeline | 10-column Kanban drag-and-drop | Yes | No (needs migration 042+043) | Yes |
| Outreach Queue | /admin/vendor-outreach | Actionable outreach queue | Yes | No (needs migration 042+043) | Yes |
| Coverage Map | /admin/vendor-coverage | Category + geography targets vs reality | Yes | No (needs migration 042) | Yes |
| Vendor Activation | /admin/vendor-activation | 8-stage vendor activation tracker | Yes | No | Yes |
| Vendor Growth | /admin/vendor-growth | Acquisition dashboard with daily targets | Yes | No | Yes |

**Production deployed:** 0 of these pages are live in current Vercel production.
All admin pages exist only locally and in Git commits not yet pushed to GitHub/Vercel.

---

## Section 5 — Production Deployment Status

### Vercel Production: https://www.elbold.com

| Sprint | Key Commit | Deployment ID | GitHub | Vercel Production | Status |
|---|---|---|---|---|---|
| P1-04/05 Launch Hardening | af4acb19 | dpl_GNGzCxRRE1sGhunC7AzBfiPqDJQH | Yes | Yes | DEPLOYED |
| Design Phase 2 (visual overlays) | dccee26 | dpl_Ad2pKm4sukvQKy5tbSJfK231edcV | Yes | Yes | **LATEST PRODUCTION** |
| Design Phase 2 DJ fix | 6fc5c8a | (auto-deployed from push) | Yes | Yes | DEPLOYED |
| Phase 3 — Vendor Readiness, Activation, Founder Dashboard | 59eb544 | None | **No** | **No** | LOCAL ONLY |
| Phase 4 — Market Validation, Concierge, Outreach | 31a3062 | None | **No** | **No** | LOCAL ONLY |
| Phase 5 — Founding Vendor, Trust Docs, Recruitment | 072100e | None | **No** | **No** | LOCAL ONLY |
| Pre-Launch Ops Sprint | 9663b79 | None | **No** | **No** | LOCAL ONLY |
| Luxury Brand Transformation | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Market Leadership Sprint | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Real Market Validation | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Revenue Integrity Sprint | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Launch Excellence Sprint | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Pilot Operations Excellence | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Real World Validation | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Trust / Verification Sprint | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Design Phase 2 (visual) | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Phase 5 (Concierge page) | (uncommitted) | None | **No** | **No** | UNCOMMITTED |
| Vendor Acquisition System (Phase 1A-1K) | (uncommitted) | None | **No** | **No** | UNCOMMITTED |

### Deployment Gap Summary

```
Production (www.elbold.com): reflects commit 6fc5c8a (DJ photo fix from 2026-06-07)
GitHub remote:               reflects commit 6fc5c8a (same, remote matches)
Local branch HEAD:           9663b79 (4 commits ahead of GitHub)
Uncommitted local changes:   84 files (all sprint work since Design Phase 2)

Gap: The entire platform evolution since June 2026-06-07 morning exists
     only on the local machine. None of it is backed up to GitHub.
     None of it is live on production.
```

---

## Section 6 — File Storage Audit

### Local Machine

| Location | Assets | Types | Risk |
|---|---|---|---|
| C:\Users\Admin\Workspace\projects\bold-party-planner\ | Full project (all code) | TypeScript, SQL, Markdown, SVG, PNG | HIGH — 84 files uncommitted, sole copy |
| C:\Users\Admin\Workspace\projects\bold-party-planner\docs\ | 57 documents | Markdown | HIGH — Local only, not in last GitHub push |
| C:\Users\Admin\Workspace\projects\bold-party-planner\ELBOLD_Master_Documentation_Suite\ | 28 documents | Markdown | HIGH — Local only |
| C:\Users\Admin\Workspace\projects\bold-party-planner\public\brand\ | 14 SVG brand files | SVG | MEDIUM — In git history |
| C:\Users\Admin\Workspace\projects\bold-party-planner\public\icons\ | 9 icon files | PNG, SVG | MEDIUM — In git history |
| C:\Users\Admin\.claude\projects\...\ | Project memory files | Markdown | MEDIUM — Claude memory only |
| .env.local | Environment variables | Text | CRITICAL — Never commit, must be backed up separately |

### Git Repository (Local)

| Branch | Commits ahead of remote | Status |
|---|---|---|
| design/phase-2-visual-improvements | 4 commits | Not pushed |
| main | 0 (diverged earlier) | Not the active branch |

### GitHub (Remote)

| Item | Status |
|---|---|
| Repository | https://github.com/abs365/bold-party-planner.git |
| Latest commit on remote | 6fc5c8a (DJ photo fix) |
| Missing from GitHub | 4 commits: 59eb544, 31a3062, 072100e, 9663b79 |
| Missing uncommitted work | 84 files across all recent sprints |
| Backup status | PARTIAL — significant work not yet pushed |

### Vercel Deployment

| Item | Status |
|---|---|
| Production URL | https://www.elbold.com |
| Latest production build | 91 pages (from dccee26 / 6fc5c8a) |
| Missing from production | All sprint work from Phase 3 onwards (approx 15+ sprints) |
| Admin pages live | 0 of 37 admin pages exist in production (admin is behind firewall via ADMIN_EMAILS) |

### Supabase

| Item | Status |
|---|---|
| Project | Live, production database |
| Migrations applied | 001-037, 039d (confirmed), others unknown |
| Migrations pending | 041, 042, 043 (critical), 038, 039b, 039c, 040 (unknown) |
| Storage buckets | vendor-images, vendor-videos (created by migration 037) |
| Auth | Live with redirect URLs |

### Stripe

| Item | Status |
|---|---|
| Mode | LIVE (sk_live_* keys set in Vercel) |
| Price IDs | 6 set (Pro/Premium/Elite x Monthly/Annual) |
| Webhook | Registered in Stripe Dashboard |
| Payouts | Manual process (Stripe Connect not yet implemented) |

### Resend (Email)

| Item | Status |
|---|---|
| Domain | noreply@elbold.com |
| DNS | SPF/DKIM/DMARC status unknown — verify in Resend dashboard |
| Functions | 15+ email functions in lib/resend/index.ts |

### Google Drive

See Section 7.

### Other Locations

| Location | Content | Risk |
|---|---|---|
| OneDrive | No ELBOLD assets confirmed | N/A |
| Desktop | No ELBOLD assets confirmed | N/A |
| Documents folder | No ELBOLD assets confirmed | N/A |
| Downloads folder | No ELBOLD assets confirmed | N/A |
| Temporary folders | C:\Users\Admin\AppData\Local\Temp\pw-results.json (Playwright) | LOW |
| Exported PDFs | None confirmed | N/A |
| Exported DOCX | None confirmed | N/A |
| Exported spreadsheets | None (Drive sheets are online only) | N/A |

---

## Section 7 — Google Drive Audit

### Connection Status

**Yes — ELBOLD is connected to Google Drive.**

Account: elbold2026@gmail.com (owner of all files)
Root folder: ELBOLD Master Documentation Suite
Folder ID: `1ODxyEsPI2TB632GDwVVMifo9KsGHkv1m`

### Folder Structure (9 primary folders + archive)

| Folder | Folder ID | Purpose |
|---|---|---|
| 01_Business | 1sRI3DqYHeHz0wEadF38yAFRH8udy_Tx0 | BRD, Product Vision, Business Case, Roadmap |
| 02_Requirements | 1iYQSkytsFDySbMZF6QxgYbeURIrywy_7 | FRS, NFR, Business Rules, RTM |
| 03_Analysis | 1gfxRM6M5amvaXar9eZ8tULfT1pHMKBTN | Acceptance Criteria, Use Cases, User Stories, Process Flows |
| 04_Data | 1w-dNaxhx1mOfja4t5VsxRB8vViv6VuAj | Data Dictionary, Data Model, ERD, Integration Mapping |
| 05_Testing | 1lvGMUkmKeKD0suYMXmM1l1Q1U3XRb6vU | Test Strategy, UAT Scripts, Test Cases, Defect Log, RTM |
| 06_Architecture | 11Bb33XXcnrxyFtj0zot8qiTSgDX9mTE3 | API Docs, Solution Architecture, Deployment Guide, Environments |
| 07_Branding | 10K3a9nKe-_TmABqbhn8p63V0wnQW9deW | Brand Guidelines, Logos, Marketing Assets, Vendor Acquisition Pack |
| 08_Operations | 1qM3K1wv0wKtV37IU5usHUNcLSzBXftMC | Customer Support, Marketplace Governance, Policies, Vendor Management |
| 99_Archive | 1agXz5HhWrHdXxmglkqTz_6P5rMmvgLHc | Release_2026.1 baseline (21 governed documents) |

### Files in Google Drive

**Root-level files (7):**

| File | Type | ID | Purpose |
|---|---|---|---|
| 00 - ELBOLD HQ (v1.3) | Google Doc | 1UfnbNEvFzlRbeU8duLyZn23WR7q9AatUZCTdCl7CzSc | Daily founder operating centre |
| ELBOLD Master Index | Google Doc | 1IXfzf3EIn_r46vYJlWcEtM21Dw5kYWrFa7sFBlDhY-w | Navigation for all governed docs |
| ELBOLD Vendor Pipeline | Google Sheet | 1yE8Oe-nITRSDv95elGHfxevI3AC4VRv4d8m6qH7_S3U | Vendor status tracker |
| ELBOLD Vendor Lead List | Google Sheet | 1ZTbaMOkddiTOrIMIRrmXbGV8gpv9TkOLHM2pNqEfHVs | 100-row outreach research list |
| ELBOLD Daily Outreach Tracker | Google Sheet | 1hfyaET7UeAS6sqwRHLzrHAhwPcd44snKB3p0elG1U-A | Daily outreach with 10-contact target |
| ELBOLD Weekly Vendor Acquisition Scorecard | Google Sheet | 1goJtaPSP_HqkO8u4TO8ZB4XT1Egh9Vzihq1xZiJWGLk | Weekly acquisition metrics |
| ELBOLD First 20 Vendors Plan | Google Sheet | 1X2oiDCwHUPhqvWgDPBKyOHswPutyohUbUrGVsy_JA-8 | 20 founding vendor slots with progress |

**Governed documents (21 in Release_2026.1):**

| Doc | ID | Location |
|---|---|---|
| DOC-001 ELBOLD-Document-Register | 10oNWKK2yg07ZuzXmSKKkAT95NnawQu9p | Root |
| DOC-002 Version-Control-Register | 1Wo-6vx28xEekRA-C0tPBYw11lt1rsO4T | Root |
| DOC-003 Requirements-Catalogue | 1KFwk9ot7j0KQ2fsuSVTjZb_rrMZZfxLG | Root |
| DOC-004 Master-RTM | 1DgdDmsPE4T6HeSeYDxw_GqHrSfQJWr2b | Root |
| DOC-010 BRD | 1XLq05PKSU-VQntK7j2QfRoi7-Z4yhnUW | 01_Business/BRD |
| DOC-020 Product-Vision | 1zH7w9JqfR5fXX1ILwGS10dmIiPkEgBKi | 01_Business/Product_Vision |
| DOC-021 NFR | 1Ph-OThDJBG0N2Mz87uNARCdolCVgBDTq | 02_Requirements/Non_Functional |
| DOC-024 FRS | 1V0bhv8mlukoR87DCjMF2WiYx2eSUdK5h | 02_Requirements/Functional |
| DOC-030 Use-Case-Catalogue | 1-Mc1LWtQu5oSuV9SU69CyBniWSYORzbN | 03_Analysis/Use_Cases |
| DOC-031 User-Story-Catalogue | 17uT-g9R9lsfz1l0V8lAXQub_upbUhiP2 | 03_Analysis/User_Stories |
| DOC-032 Acceptance-Criteria | 1HyfjqdAyrE62o0hJKCA8Evskz3gzechC | 03_Analysis/Acceptance_Criteria |
| DOC-040 Data-Model | 1bYy7Nes6O_6eQKab8EQ7H-Xgkyqnjq3c | 04_Data/Data_Model |
| DOC-041 ERD | 1gTk8fcs_0OYUuQg2_w0EYzWwTWAvowT7 | 04_Data/ERD |
| DOC-042 Data-Dictionary | 16eMDmAgiBFZdhhYqFyqg5bL1M_pBfpAp | 04_Data/Data_Dictionary |
| DOC-043 Integration-Mapping | 1v5tiz314r1QzeAdGNQz0yyHLulPMTQzf | 04_Data/Integration_Mapping |
| DOC-034 Test-Strategy | 1JBmfIXzNKZP294vhVJj9QhW3zFvq-rlT | 05_Testing/Test_Strategy |
| DOC-035 UAT-Test-Pack | 1iCrnbZfpPYMJXaEUkXlmkcsFgDGnY9l7 | 05_Testing/UAT_Scripts |
| DOC-060 Solution-Architecture | 1Kf6JR-YxXKz0sESzYMr2hiD5-QGpquSr | 06_Architecture/Solution_Architecture |
| DOC-061 API-Documentation | 1eKMom5LWWnCtrUikcs5K7gg7efxmjLfo | 06_Architecture/API_Documentation |
| BASELINE_MANIFEST_Release_2026.1 | 1JjnUZAk09nihfhOuCCZUOfbEen2RVUIf | 99_Archive/Release_2026.1 |
| RELEASE_NOTES_Release_2026.1 | 1TUZ2m_a3py6oqq-BSuvC8bK_2pawceU5 | 99_Archive/Release_2026.1 |

**Vendor Acquisition Pack (8 files in 07_Branding/Vendor_Acquisition):**

| File | ID |
|---|---|
| 00 - Phase 28A Pack INDEX | 12FD1Nb7MLowA-wW_8qBfY2jyuNxakkk4SS3_BTk0URg |
| 1 - WhatsApp Outreach Scripts | 1V0mgVxD2-QEk8q3qjZ8Z1BDK1WWu_rOZP0OyU6zL2gQ |
| 2 - Instagram DM Templates | 1SD6V7PR8_ZB5OGhRMLitDt-7p4_up_7WN6kAIBEjin4 |
| 3 - Facebook Group Post Templates | 1-3bodikNdyscyl4aNrjXCXWikNjDNmm1nSLcfpVwyx0 |
| 4 - Vendor Invitation Email | 1-6mnBlmfaeJ8EMd-TJ_vShA3VFP7L8ByF3M9ClVM68E |
| 5 - Founding Vendor One-Pager | 1U4RfELVKNGYpGEvOMy4lx1mPTQQxZy5t_X8cpTsVX18 |
| 6 - Vendor FAQ | 1DEQd8tx_bQk3cUsOWxa6TSNs5CpC8VXKSv5qjH8YWeg |
| 7 - Vendor Objection Handling Guide | 1ViTJtBLn0Rezhx-xAbvSaxDVVnnkvu9PJvEXiPwmyb8 |

**Last updated:** Google Drive documents reflect the Release_2026.1 baseline from 2026-06-02. Documents created after this date (Vendor Acquisition System, PreLaunch series, Phase 5 docs) have NOT been uploaded to Drive.

---

## Section 8 — Missing Assets

### Migrations Referenced But Unapplied

| Migration | Referenced In | Status |
|---|---|---|
| 041_concierge_requests.sql | Phase 5 Sprint, admin/concierge page | NOT APPLIED |
| 042_vendor_leads.sql | Vendor Acquisition System | NOT APPLIED |
| 043_vendor_leads_extended.sql | Vendor Acquisition System | NOT APPLIED |
| 038, 039b, 039c, 040 | P0 Stabilisation Sprint | UNKNOWN — verify in Supabase |

### Documents Created But Not in Google Drive

The following local docs have NOT been uploaded to Google Drive (created after Release_2026.1):

- docs/Vendor_Acquisition_System.md
- docs/First_20_Vendor_Activation_Plan.md
- docs/First_50_Vendors_Playbook.md
- docs/Phase1_Launch_Freeze.md
- docs/Phase5_* (4 files)
- docs/PreLaunch_P1-P6 (6 files)
- docs/Revenue_*.md (4 files)
- docs/Stripe_Connect_*.md (2 files)
- docs/Design_Phase2_*.md (5 files)
- docs/Customer_Journey_Audit.md
- docs/Vendor_Journey_Audit.md
- docs/Verification_Fix_Report.md
- docs/Vendor_Activation_Gap_Report.md
- docs/Vendor_End_To_End_Audit.md
- docs/Trust_Integrity_Resolution_Report.md
- docs/Launch_Readiness_Final_Report.md
- docs/Marketplace_Compliance_Assessment.md
- All ELBOLD_Master_Documentation_Suite/ documents (Beta Operations Pack, Pilot CRM, Validation, Operations, Security)

### Pages Referenced But Dependency Unmet

| Page | Dependency | Impact |
|---|---|---|
| /admin/concierge | Migration 041 not applied | Shows graceful notice, but no data stored |
| /admin/vendor-acquisition | Migration 042 not applied | API will error on all requests |
| /admin/vendor-pipeline | Migrations 042+043 not applied | API will error, Kanban empty |
| /admin/vendor-outreach | Migrations 042+043 not applied | Queue will error |
| /admin/vendor-coverage | Migration 042 not applied | Will show 0 leads in pipeline |

### Code Changes Not Yet Committed

84 files modified or new, not yet committed to git. These include all sprint work from the Luxury Brand Transformation through to the Vendor Acquisition System. Key uncommitted files:

- All new admin pages (vendor-pipeline, vendor-outreach, vendor-coverage)
- DashboardLayout nav updates
- All page rewrites (homepage, browse, vendor profiles, trust pages)
- lib/vendor-acquisition/* (scoring, outreach engines)
- supabase/migrations/042 and 043
- docs/ (most recent documents)
- components/ (84+ component changes)

### Known Technical Debt

| Item | Location | Risk |
|---|---|---|
| BUG-001 Storage Delete RLS Mismatch | Suite/Operations/Backlog_Storage_Delete_RLS_Mismatch.md | P3 — only matters when vendor self-delete feature built |
| Stripe webhook must be verified live | Stripe Dashboard | CRITICAL — payment flow depends on this |
| Resend DNS (SPF/DKIM/DMARC) | Resend dashboard | HIGH — emails may be rejected |
| Supabase Auth redirect URLs | Supabase Auth config | HIGH — auth callbacks may fail |
| mk_ Stripe key prefix (non-standard) | Stripe Dashboard | MEDIUM — verify key is valid sk_live_ |
| SENTRY_ORG/SENTRY_PROJECT slugs | Vercel env vars | LOW — source maps not uploading |
| OG image placeholder | /icons/icon-512.png (wrong size) | LOW — social sharing looks poor |
| Stripe Connect not implemented | Documented in Stripe_Connect_Migration_Plan.md | MEDIUM — manual payouts currently |

---

## Section 9 — Recommended Final Structure

Recommended canonical structure for all ELBOLD documentation. Every existing document is assigned to a home.

```
ELBOLD_Master_Documentation_Suite/
|
|-- /Strategy
|   |-- Product_Vision.md               (from Drive DOC-020)
|   |-- Business_Requirements.md        (from Drive DOC-010)
|   |-- Market_Leadership_Analysis.md   (from docs/)
|   |-- Marketplace_Compliance_Assessment.md (from docs/)
|   |-- Phase1_Launch_Freeze.md         (from docs/)
|   |-- Phase5_LaunchKPIFramework.md    (from docs/)
|
|-- /Operations
|   |-- Admin_Module_Audit.md
|   |-- Quote_Pipeline_Audit.md
|   |-- Launch_Monitoring_Checklist.md
|   |-- Revenue_Reconciliation_Runbook.md
|   |-- Revenue_Risk_Register.md
|   |-- Backlog_Storage_Delete_RLS_Mismatch.md
|   |-- ELBOLD HQ (v1.3)               (Google Drive primary)
|   |-- Beta_Command_Centre.md
|   |-- Daily_Launch_Report.md         (template)
|   |-- Weekly_Pilot_Summary.md        (template)
|
|-- /Legal
|   |-- Marketplace_Compliance_Assessment.md
|   |-- GDPR_Notice.md                 (to create)
|   |-- Privacy_Policy.md              (to create)
|   |-- Terms_and_Conditions.md        (to create)
|
|-- /Marketing
|   |-- Market_Leadership_Analysis.md
|   |-- Phase5_TrustFirstHomepageReview.md
|   |-- Phase5_SuccessStoryFramework.md
|   |-- Design_Phase2_Visual_Audit.md
|   |-- Design_Phase2_Conversion_Impact.md
|   |-- Design_Phase3_Conversion_Audit.md
|   |-- UX_AUDIT.md
|
|-- /Vendor_Acquisition
|   |-- Vendor_Acquisition_System.md   (primary reference)
|   |-- First_50_Vendors_Playbook.md
|   |-- First_20_Vendor_Activation_Plan.md
|   |-- Vendor_Activation_Gap_Report.md
|   |-- Vendor_End_To_End_Audit.md
|   |-- Vendor_Journey_Audit.md
|   |-- Vendor_Trust_Protection_Audit.md
|   |-- Phase5_VerificationEnforcementPolicy.md
|   |-- WhatsApp_Scripts.md            (from Drive)
|   |-- Instagram_DM_Templates.md      (from Drive)
|   |-- Vendor_Invitation_Email.md     (from Drive)
|   |-- Founding_Vendor_OnePager.md    (from Drive)
|   |-- Vendor_Objection_Handling.md   (from Drive)
|
|-- /Vendor_Activation
|   |-- Vendor_Activation_System.md   (to create — mirrors acquisition doc)
|   |-- First_20_Vendor_Activation_Plan.md
|   |-- Vendor_Activation_Gap_Report.md
|
|-- /Launch
|   |-- Beta_Command_Centre.md
|   |-- Launch_Readiness_Final_Report.md
|   |-- Phase1_Launch_Freeze.md
|   |-- Beta_Test_Results.md
|   |-- Vendor_Email_Confirmation_QA.md
|   |-- Journey_Validation_Tracker.md
|   |-- PreLaunch_P1-P6.md (6 files)
|   |-- Beta Operations Pack (8 files)
|   |-- Pilot CRM (7 files)
|   |-- Validation (5 files)
|
|-- /Trust_and_Safety
|   |-- Trust_Integrity_Resolution_Report.md
|   |-- Vendor_Trust_Protection_Audit.md
|   |-- Phase5_VerificationEnforcementPolicy.md
|   |-- Verification_Fix_Report.md
|   |-- Security_Hardening_Audit.md
|   |-- RLS_POLICY_MATRIX.md
|
|-- /Finance
|   |-- Revenue_Flow_Architecture_Report.md
|   |-- Revenue_Flow_Validation_Report.md
|   |-- Revenue_Reconciliation_Runbook.md
|   |-- Revenue_Risk_Register.md
|   |-- Stripe_Connect_Feasibility_Report.md
|   |-- Stripe_Connect_Migration_Plan.md
|
|-- /Technical
|   |-- architecture.md
|   |-- engineering-standards.md
|   |-- auth-configuration.md
|   |-- environments.md
|   |-- monitoring.md
|   |-- disaster-recovery.md
|   |-- incident-response.md
|   |-- runbooks.md
|   |-- production-checklist.md
|   |-- performance-audit.md
|   |-- performance-guidelines.md
|   |-- DEPLOYMENT_GUIDE.md
|   |-- github-actions.md
|   |-- API_Documentation.md           (from Drive DOC-061)
|   |-- Solution_Architecture.md       (from Drive DOC-060)
|   |-- Data_Model.md                  (from Drive DOC-040)
|   |-- ERD.md                         (from Drive DOC-041)
|   |-- Data_Dictionary.md             (from Drive DOC-042)
|   |-- Integration_Mapping.md         (from Drive DOC-043)
|   |-- Migration_Register.md          (this document, Section 3)
|
|-- /Archive
|   |-- Launch_Readiness_Report.md     (superseded by Final)
|   |-- Phase4_LaunchReadinessReport.md (superseded)
|   |-- Phase4_TestJourneys.md         (archived)
|   |-- app-store-assets.md            (mobile project on hold)
|   |-- mobile-deployment.md           (mobile project on hold)
|   |-- Release_2026.1 baseline        (Google Drive)
```

---

## Section 10 — Immediate Action Plan

The following actions are required before any further development.

### Priority 1 — CRITICAL (Data Loss Risk)

```
1. git add . && git commit -m "feat: all sprint work — phases 3-5, brand, trust, launch, acquisition"
   Then: git push origin design/phase-2-visual-improvements
   
   Risk: 84 files and all sprint work exists ONLY on local machine.
   A disk failure would permanently destroy 15+ sprints of work.

2. Apply Supabase migrations in order:
   - Run 041_concierge_requests.sql (concierge submissions being lost)
   - Run 042_vendor_leads.sql (Acquisition CRM non-functional)
   - Run 043_vendor_leads_extended.sql (Pipeline Kanban non-functional)
   - Verify: 038, 039b, 039c, 040 — check in Supabase SQL Editor
```

### Priority 2 — HIGH (Production Gap)

```
3. Deploy to Vercel production:
   After committing and pushing, trigger a Vercel deployment.
   Production is approximately 15 sprints behind local.
   
4. Verify in production:
   - Stripe webhook registered and receiving events
   - Resend SPF/DKIM/DMARC DNS records active
   - Supabase Auth redirect URLs include https://www.elbold.com/api/auth/callback
   - NEXT_PUBLIC_APP_URL=https://www.elbold.com confirmed in Vercel
```

### Priority 3 — MEDIUM (Documentation)

```
5. Upload post-Release_2026.1 documents to Google Drive:
   Approximately 30+ local docs not yet in Drive.
   
6. Mark old Drive docs as superseded where newer versions exist locally.

7. Delete older versions of "00 - ELBOLD HQ" from Drive root
   (keep only v1.3: 1UfnbNEvFzlRbeU8duLyZn23WR7q9AatUZCTdCl7CzSc)
```

### Priority 4 — LOW (Organisation)

```
8. Reorganise docs/ folder to match the recommended structure in Section 9.
9. Add ELBOLD_Master_Asset_Register.md to Google Drive.
```

---

*This register was compiled 2026-06-08 by automated audit. It reflects the state of the local filesystem, git repository, and project memory at the time of compilation. Supabase migration applied status for migrations 038, 039b, 039c, and 040 must be manually verified in the Supabase Dashboard.*
