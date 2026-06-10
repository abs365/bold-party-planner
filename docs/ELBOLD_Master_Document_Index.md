# ELBOLD Master Document Index
**Version:** 1.0 | **Date:** 2026-06-09 | **Phase:** 8
**Total documents:** 113 | **Location:** `docs/`

This index categorises all documents in the `docs/` directory by function. Each entry shows the filename and a one-line description.

---

## 1. Engineering & Infrastructure

| File | Description |
|------|-------------|
| `architecture.md` | System architecture overview |
| `auth-configuration.md` | Supabase auth setup and configuration |
| `engineering-standards.md` | Code standards and review guidelines |
| `environments.md` | Staging and production environment configuration |
| `github-actions.md` | CI/CD pipeline documentation |
| `monitoring.md` | Monitoring, alerting, and observability setup |
| `performance-audit.md` | Performance baseline and benchmarks |
| `performance-guidelines.md` | Frontend and API performance standards |
| `production-checklist.md` | Pre-deployment production gate checklist |
| `mobile-deployment.md` | Mobile app deployment procedures |
| `mobile-performance-audit.md` | Mobile-specific performance review |
| `app-store-assets.md` | App Store submission assets and metadata |
| `disaster-recovery.md` | Disaster recovery procedures |
| `incident-response.md` | Incident classification and response playbook |
| `runbooks.md` | Operational runbooks for common procedures |
| `support-operations.md` | Customer and vendor support procedures |
| `test-failure-classification.md` | Test failure taxonomy and resolution guide |
| `Deployment_Status_Report.md` | Point-in-time deployment status summary |
| `Source_Code_Backup_Report.md` | Code backup verification report |

---

## 2. Database & Migrations

| File | Description |
|------|-------------|
| `Migration_Status_Report.md` | Migration history and applied state |
| `Migration_Safety_Report_041_042_043.md` | Safety review for migrations 041, 042, 043 |
| `Migration_046_Safety_Report.md` | Pre-run safety review for migration 046 |
| `Migration_046_Verification_Report.md` | Post-run verification of migration 046 |

---

## 3. Revenue, Payments & Financial Controls

| File | Description |
|------|-------------|
| `Revenue_Flow_Architecture_Report.md` | Stripe payment flow architecture |
| `Revenue_Flow_Validation_Report.md` | Payment flow end-to-end validation |
| `Revenue_Ready_Final_Report.md` | Revenue readiness gate report |
| `Revenue_Readiness_Final_Verification.md` | Final revenue configuration verification |
| `Revenue_Reconciliation_Runbook.md` | How to reconcile platform revenue |
| `Revenue_Risk_Register.md` | Known revenue-related risks and mitigations |
| `First_Revenue_Validation_Report.md` | First live payment validation |
| `Refund_Integrity_Report.md` | Refund flow audit |
| `BUG_002_Refund_Integrity_Fix_Report.md` | BUG-002 fix — refund void bug resolution |
| `Stripe_Connect_Feasibility_Report.md` | Stripe Connect feasibility analysis |
| `Stripe_Connect_Migration_Plan.md` | Stripe Connect implementation plan |
| `Stripe_Operations_Guide.md` | Stripe dashboard operational procedures |
| `Payment_Messaging_Audit.md` | Payment UI copy and messaging review |

---

## 4. Launch Readiness

| File | Description |
|------|-------------|
| `Launch_Readiness_Report.md` | Initial launch readiness assessment |
| `Launch_Readiness_Final_Report.md` | Final launch readiness gate |
| `Launch_Blocker_Report.md` | Launch blockers identified and tracked |
| `Launch_Execution_Readiness.md` | Operational launch execution checklist |
| `Phase1_Launch_Freeze.md` | Phase 1 launch freeze scope definition |
| `ELBOLD_Launch_Command_Centre.md` | Live launch coordination document |
| `ELBOLD_30_Day_Execution_Plan.md` | 30-day post-launch execution plan |
| `Configuration_Verification_Report.md` | Live service configuration verification |
| `Go_Live_Configuration_Checklist.md` | Go-live configuration checklist (Verified/Missing) |

---

## 5. Vendor Operations

| File | Description |
|------|-------------|
| `Vendor_Journey_Audit.md` | Initial vendor journey audit |
| `Vendor_Journey_Validation_Report.md` | Code-traced vendor journey validation (this sprint) |
| `Vendor_End_To_End_Audit.md` | Full vendor end-to-end process audit |
| `Vendor_Application_Pipeline_Report.md` | Application pipeline status and health |
| `Vendor_Application_Hardening_Report.md` | Application validation hardening changes |
| `Vendor_Data_Integrity_Audit.md` | Vendor data integrity verification |
| `Vendor_Activation_Gap_Report.md` | Gaps in the vendor activation flow |
| `Vendor_Acquisition_System.md` | Vendor acquisition strategy and system |
| `Vendor_Acquisition_Messaging_Audit.md` | Vendor outreach messaging review |
| `Vendor_Trust_Protection_Audit.md` | Vendor trust and protection mechanisms |
| `Vendor_Lifecycle_Governance.md` | Vendor lifecycle state machine documentation |
| `vendor-email-confirmation-qa.md` | Vendor email confirmation flow QA |
| `First_20_Vendor_Activation_Plan.md` | Activation plan for first 20 vendors |
| `First_50_Vendors_Playbook.md` | Scaling playbook for first 50 vendors |
| `Real_Vendor_Journey_Test.md` | Manual real-world vendor journey test |
| `PreLaunch_P1_ConciergeSystemTest.md` | Pre-launch Phase 1: concierge system test |
| `PreLaunch_P2_VendorCohortReview.md` | Pre-launch Phase 2: vendor cohort review |
| `PreLaunch_P3_VerificationActions.md` | Pre-launch Phase 3: verification actions |
| `PreLaunch_P4_FoundingVendorReview.md` | Pre-launch Phase 4: founding vendor review |
| `PreLaunch_P5_ConciergeJourneyTest.md` | Pre-launch Phase 5: concierge journey test |
| `PreLaunch_P6_FirstBookingMission.md` | Pre-launch Phase 6: first booking mission |
| `Verification_Fix_Report.md` | Vendor verification flow fix report |

---

## 6. Customer Operations

| File | Description |
|------|-------------|
| `Customer_Journey_Audit.md` | Initial customer journey audit |
| `Customer_Journey_Validation_Report.md` | Code-traced customer journey validation (this sprint) |
| `Real_Customer_Journey_Test.md` | Manual real-world customer journey test |

---

## 7. Governance, RBAC & Trust

| File | Description |
|------|-------------|
| `RBAC_Architecture.md` | RBAC design specification |
| `RBAC_Governance_Audit.md` | Code-traced RBAC governance audit (this sprint) |
| `Trust_Integrity_Resolution_Report.md` | Trust layer integrity resolution |
| `Auth_Confirmation_Audit.md` | Auth confirmation flow audit |
| `Governance_Validation_Report.md` | Governance controls validation |
| `Full_System_Test_Report.md` | Full-system integration test report |
| `ELBOLD_Trust_Readiness_Report.md` | Trust readiness overall assessment |

---

## 8. Design & Brand

| File | Description |
|------|-------------|
| `Brand_Simplification_Audit.md` | Brand asset audit — old vs new (this sprint) |
| `Elbold_Wordmark_Design_System.md` | Wordmark design system specification |
| `Founder_Identity_Review.md` | Founder brand identity review |
| `Homepage_Visual_Audit.md` | Homepage visual design audit |
| `Image_Integrity_Report.md` | Image asset integrity report |
| `Design_Phase2_Visual_Audit.md` | Phase 2 visual design audit |
| `Design_Phase2_Before_After_Mockups.md` | Phase 2 before/after design mockups |
| `Design_Phase2_Priority_Improvements.md` | Phase 2 design priority improvements |
| `Design_Phase2_Conversion_Impact.md` | Phase 2 design conversion impact |
| `Design_Phase3_Conversion_Audit.md` | Phase 3 conversion design audit |

---

## 9. Email & DNS Infrastructure

| File | Description |
|------|-------------|
| `ELBOLD_Email_Architecture_Report.md` | Dual-sender email architecture audit (M365 + Resend) |
| `Email_Infrastructure_Readiness_Report.md` | SPF/DKIM/DMARC/Bounce readiness verdicts |
| `ELBOLD_DNS_Remediation_Guide.md` | Exact DNS records required with evidence |

---

## 10. Legal & Compliance

| File | Description |
|------|-------------|
| `Legal_Readiness_Report.md` | Legal readiness assessment |
| `Marketplace_Compliance_Assessment.md` | UK marketplace compliance requirements |
| `Company_Registration_Launch_Gate.md` | Companies House registration gate |
| `Company_Name_Consistency_Report.md` | Company name consistency across platform |
| `Companies_House_Post_Registration_Checklist.md` | Post-incorporation action checklist |
| `Registration_Completion_Audit.md` | Registration completion verification |
| `Company_Information_Registry.md` | Company details registry |
| `Post_Incorporation_Execution_Checklist.md` | Post-incorporation execution checklist |

---

## 11. Investor & Market Intelligence

| File | Description |
|------|-------------|
| `Investor_Readiness_Report.md` | Investor readiness v1 (2026-06-09) |
| `Investor_Readiness_Report_v2.md` | Investor readiness v2 — updated (this sprint) |
| `Market_Leadership_Analysis.md` | Market leadership analysis |
| `Marketplace_Review_Round2_Report.md` | Round 2 marketplace competitive review |

---

## 12. Quotes & Pricing

| File | Description |
|------|-------------|
| `Quote_Transparency_Design.md` | Quote transparency initial design |
| `Quote_Transparency_Blueprint.md` | Quote transparency design blueprint (this sprint) |

---

## 13. Dashboard & Reconciliation

| File | Description |
|------|-------------|
| `Dashboard_Reconciliation_Report.md` | Initial dashboard reconciliation report |
| `Dashboard_Reconciliation_Final_Report.md` | Final reconciliation — live data proof (this sprint) |

---

## 14. Operations & Playbooks

| File | Description |
|------|-------------|
| `ELBOLD_MASTER_PLAYBOOK.md` | Master operational playbook |
| `ELBOLD_DOCUMENT_REGISTRY.md` | Document registry (earlier version) |
| `ELBOLD_Master_Asset_Register.md` | Platform asset register |
| `ELBOLD_Document_Master_Register.md` | Document master register |
| `ELBOLD_Founder_Commandments.md` | Founder decision-making principles |
| `Documentation_Protection_Report.md` | Documentation integrity and protection report |

---

## 15. Phase-Specific Reports

| File | Description |
|------|-------------|
| `Phase4_CustomerTrustLayer_Proposal.md` | Phase 4: customer trust layer proposal |
| `Phase4_LaunchReadinessReport.md` | Phase 4: launch readiness |
| `Phase4_TestJourneys.md` | Phase 4: test journey scripts |
| `Phase5_LaunchKPIFramework.md` | Phase 5: launch KPI framework |
| `Phase5_SuccessStoryFramework.md` | Phase 5: success story framework |
| `Phase5_TrustFirstHomepageReview.md` | Phase 5: trust-first homepage review |
| `Phase5_VerificationEnforcementPolicy.md` | Phase 5: verification enforcement policy |
| `Conversion_Fix_Validation.md` | Conversion fix validation results |

---

## 16. Operational Excellence Sprint (this sprint — 2026-06-09)

Documents produced in the Operational Excellence Sprint, all timestamped 2026-06-09:

| File | Phase | Description |
|------|-------|-------------|
| `Vendor_Journey_Validation_Report.md` | 1 | Code-traced vendor journey with evidence |
| `Customer_Journey_Validation_Report.md` | 2 | Code-traced customer journey with evidence |
| `Dashboard_Reconciliation_Final_Report.md` | 3 | Live DB reconciliation proof |
| `RBAC_Governance_Audit.md` | 4 | Full RBAC code audit with gaps |
| `Quote_Transparency_Blueprint.md` | 5 | Design-only quote transparency spec |
| `Investor_Readiness_Report_v2.md` | 6 | Updated investor readiness scores |
| `Brand_Simplification_Audit.md` | 7 | Old vs new brand asset audit |
| `ELBOLD_Master_Document_Index.md` | 8 | This file — full document registry |
| `ELBOLD_Operational_Readiness_Report.md` | Final | GO/NO-GO operational readiness verdict |

---

## Document Count by Category

| Category | Count |
|----------|-------|
| Engineering & Infrastructure | 19 |
| Database & Migrations | 4 |
| Revenue, Payments & Financial | 13 |
| Launch Readiness | 9 |
| Vendor Operations | 22 |
| Customer Operations | 3 |
| Governance, RBAC & Trust | 7 |
| Design & Brand | 10 |
| Email & DNS | 3 |
| Legal & Compliance | 8 |
| Investor & Market | 4 |
| Quotes & Pricing | 2 |
| Dashboard & Reconciliation | 2 |
| Operations & Playbooks | 6 |
| Phase-Specific Reports | 8 |
| Operational Excellence Sprint | 9 |
| **Total** | **113** |
