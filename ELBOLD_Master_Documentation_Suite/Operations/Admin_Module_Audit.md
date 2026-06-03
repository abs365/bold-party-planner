# ELBOLD Admin Module Audit

**Date:** 2026-06-03
**Purpose:** Record the purpose, current status, data readiness, and pilot-safety of every admin module.
**Scope:** All 21 admin routes plus the Overview page.

---

## Status Key

| Label | Meaning |
|---|---|
| **Live** | Feature is functional, wired to real data, tested end-to-end |
| **Pilot Ready** | Feature works for pilot scale; may have rough edges acceptable for 10-vendor launch |
| **In Progress** | Partially built; some functionality missing or not wired up |
| **Placeholder** | Route exists, page renders, but no real data or actions yet |
| **Needs Data** | UI is complete but has no data to show (empty tables) |
| **Needs Integration** | Code exists but requires external service (e.g. Stripe, Twilio) to be fully active |

---

## Group A — Marketplace

### 1. Overview (`/admin`)
| Field | Value |
|---|---|
| **Purpose** | ELBOLD Command Centre — operational KPIs, activity feed, quick actions |
| **Current Route** | `/admin` |
| **Status** | **Live** |
| **Data Source** | profiles, vendors, bookings, quotes, events, reviews, admin_alerts, pilot_vendors |
| **What Works** | Core Platform KPIs (10), Pilot Launch KPIs, Operations Alerts, Recent Activity, Revenue Summary, Vendor Approvals widget, Booking Activity widget, Quick Actions, System Alerts |
| **What Is Missing** | Feedback items counter requires pilot_feedback table population; Bug tracking is external |
| **Safe for Pilot** | Yes |
| **Priority** | Highest — primary operational view |

---

### 2. Vendors (`/admin/vendors`)
| Field | Value |
|---|---|
| **Purpose** | View, search, approve, reject, suspend all platform vendors |
| **Current Route** | `/admin/vendors` |
| **Status** | **Live** |
| **Data Source** | vendors, profiles, vendor_media, packages |
| **What Works** | Search, status filter, bulk approve/reject/suspend, rejection reason, email notifications on approve/reject (Resend), audit logging |
| **What Is Missing** | Nothing critical; vendor email templates could be improved |
| **Safe for Pilot** | Yes |
| **Priority** | Critical — gatekeeper for all vendor access |

---

### 3. Customers (`/admin/customers`)
| Field | Value |
|---|---|
| **Purpose** | Search and inspect customer accounts, view booking/event history |
| **Current Route** | `/admin/customers` |
| **Status** | **Live** |
| **Data Source** | profiles, events, bookings, payments |
| **What Works** | Name search, aggregated event/booking/payment counts, role display |
| **What Is Missing** | No direct customer action (suspend, email) — admin can't act on customer from here |
| **Safe for Pilot** | Yes |
| **Priority** | Medium |

---

### 4. Bookings (`/admin/bookings`)
| Field | Value |
|---|---|
| **Purpose** | All-platform booking oversight — status, value, parties |
| **Current Route** | `/admin/bookings` |
| **Status** | **Live** |
| **Data Source** | bookings, events, profiles (customer), vendors |
| **What Works** | Full booking list with all relations, sorted newest first |
| **What Is Missing** | No admin action on bookings directly (cancel, refund) — handled via disputes or Stripe |
| **Safe for Pilot** | Yes |
| **Priority** | High |

---

### 5. Quote Pipeline (`/admin/quotes`)
| Field | Value |
|---|---|
| **Purpose** | Monitor the full quote lifecycle — from request to conversion |
| **Current Route** | `/admin/quotes` |
| **Status** | **Live** |
| **Data Source** | quotes, events, profiles, vendors |
| **What Works** | Quote table with status breakdown, conversion rate calculation, vendor/customer info |
| **What Is Missing** | No admin intervention on quotes; read-only oversight |
| **Safe for Pilot** | Yes |
| **Priority** | High — key pilot success metric |

---

### 6. Reviews (`/admin/reviews`)
| Field | Value |
|---|---|
| **Purpose** | Review moderation — approve, flag, remove customer reviews |
| **Current Route** | `/admin/reviews` |
| **Status** | **Live** |
| **Data Source** | reviews, profiles, vendors, review_reports |
| **What Works** | Tab views (all/flagged/removed), approve/flag/remove actions, moderation_notes, closes related review_reports, audit + analytics tracking |
| **What Is Missing** | Nothing critical |
| **Safe for Pilot** | Yes |
| **Priority** | Medium |

---

## Group B — Trust & Safety

### 7. Disputes (`/admin/disputes`)
| Field | Value |
|---|---|
| **Purpose** | Manage customer-vendor disputes — review evidence, resolve, approve refunds |
| **Current Route** | `/admin/disputes` |
| **Status** | **Pilot Ready** |
| **Data Source** | bookings (status=disputed), events, profiles, vendors |
| **What Works** | Dispute detail view, status tabs (open/investigating/resolved/all), resolution form, refund amount input, close-without-resolution |
| **What Is Missing** | No direct Stripe refund trigger — admin must process manually via Stripe Dashboard |
| **Safe for Pilot** | Yes — dispute volume will be near zero at pilot scale |
| **Priority** | Medium at pilot; High post-launch |

---

### 8. Verifications (`/admin/verifications`)
| Field | Value |
|---|---|
| **Purpose** | Review and act on vendor verification submissions (phone, business docs, identity) |
| **Current Route** | `/admin/verifications` |
| **Status** | **Live** |
| **Data Source** | vendor_verifications, vendors, profiles |
| **What Works** | Status filter, document viewer, approve/reject/request-resubmission, manual level set (L0–L4), flag/unflag, sends email on approve/reject, creates verification_activity_log and audit_logs |
| **What Is Missing** | Nothing critical |
| **Safe for Pilot** | Yes — core trust mechanism |
| **Priority** | Critical |

---

### 9. Moderation (`/admin/moderation`)
| Field | Value |
|---|---|
| **Purpose** | Review user-reported content and moderate vendor media uploads |
| **Current Route** | `/admin/moderation` |
| **Status** | **Live** |
| **Data Source** | content_reports, vendor_media, vendors, profiles |
| **What Works** | Reports tab (open/reviewing/resolved/dismissed), media queue tab (approve/reject images), resolution notes, audit logging |
| **What Is Missing** | No AI-assisted content moderation (intentional — future integration with OpenAI / AWS Rekognition) |
| **Safe for Pilot** | Yes |
| **Priority** | Medium |

---

### 10. Governance (`/admin/governance`)
| Field | Value |
|---|---|
| **Purpose** | Monitor at-risk vendors, issue warnings, flag suspicious accounts |
| **Current Route** | `/admin/governance` |
| **Status** | **Live** |
| **Data Source** | vendors, vendor_warnings, vendor_governance_flags |
| **What Works** | At-risk vendor detection (health score + suspicious_flag), warning issuance, warning resolution, flag/unflag, audit logging |
| **What Is Missing** | Nothing critical |
| **Safe for Pilot** | Yes |
| **Priority** | Medium at pilot; High post-launch |

---

## Group C — Finance

### 11. Payouts (`/admin/payouts`)
| Field | Value |
|---|---|
| **Purpose** | Track vendor payouts owed from completed bookings |
| **Current Route** | `/admin/payouts` |
| **Status** | **Pilot Ready** |
| **Data Source** | bookings, events, vendors |
| **What Works** | Payout table with booking total, commission (10%), vendor payout (90%), payment status, search/filter |
| **What Is Missing** | No automated payout trigger — manual bank transfer or Stripe Dashboard process; Stripe payout automation planned post-pilot |
| **Safe for Pilot** | Yes — manual payouts acceptable at pilot scale |
| **Priority** | High |

---

### 12. Subscriptions (`/admin/subscriptions`)
| Field | Value |
|---|---|
| **Purpose** | View all vendor subscription plans — active, expired, trial |
| **Current Route** | `/admin/subscriptions` |
| **Status** | **Needs Integration** |
| **Data Source** | vendor_subscriptions, vendors |
| **What Works** | Subscription list with plan type, status, period end date, MRR estimation |
| **What Is Missing** | Stripe subscription management integration (cancel, upgrade from admin); currently read-only |
| **Safe for Pilot** | Yes — free tier is default for pilot vendors |
| **Priority** | Low at pilot; Medium post-launch |

---

### 13. Monetization (`/admin/monetization`)
| Field | Value |
|---|---|
| **Purpose** | Revenue analytics — MRR, ARR, plan distribution, billing events, churn |
| **Current Route** | `/admin/monetization` |
| **Status** | **Needs Data** |
| **Data Source** | vendor_subscriptions, subscription_billing_events, vendors |
| **What Works** | MRR/ARR calculation, plan distribution, revenue trends, at-risk MRR (past-due), configurable date range |
| **What Is Missing** | Will show zeros until vendors begin paid subscriptions; no fake data shown |
| **Safe for Pilot** | Yes — expected to be empty during free-tier pilot |
| **Priority** | Low at pilot; High post-launch |

---

## Group D — Operations

### 14. Support (`/admin/support`)
| Field | Value |
|---|---|
| **Purpose** | User and vendor lookup tooling; audit log viewer; quick links |
| **Current Route** | `/admin/support` |
| **Status** | **Live** |
| **Data Source** | profiles, vendors (via API), audit_logs |
| **What Works** | User lookup by name, vendor lookup by business name, audit log viewer by entity ID, quick links to all governance modules |
| **What Is Missing** | No support ticket system — this is an admin tool, not a helpdesk; no inbound ticket table |
| **Safe for Pilot** | Yes |
| **Priority** | Medium |

---

### 15. System (`/admin/system`)
| Field | Value |
|---|---|
| **Purpose** | Environment health, migration status, API checks, pre-launch checklist |
| **Current Route** | `/admin/system` |
| **Status** | **Live** |
| **Data Source** | process.env (18 vars checked), live Resend API call, migration list |
| **What Works** | 18-key env var audit, build info (NODE_ENV, runtime, Node version), 30-migration status list, API health endpoints, live Resend domain check |
| **What Is Missing** | No Sentry integration yet; no automated smoke test runner |
| **Safe for Pilot** | Yes — critical pre-launch tool |
| **Priority** | Critical |

---

### 16. Analytics (`/admin/analytics`)
| Field | Value |
|---|---|
| **Purpose** | Platform-level analytics — revenue, bookings, vendor categories, payment flow |
| **Current Route** | `/admin/analytics` |
| **Status** | **Needs Data** |
| **Data Source** | platform_stats, bookings, vendors |
| **What Works** | Platform stats display, recent payments, booking status distribution, vendor category breakdown |
| **What Is Missing** | platform_stats table requires data to be populated; will be sparse during pilot |
| **Safe for Pilot** | Yes — shows zeros cleanly |
| **Priority** | Medium |

---

## Group E — Pilot Launch

### 17. Pilot Ops (`/admin/pilot`)
| Field | Value |
|---|---|
| **Purpose** | Pilot launch dashboard — vendor/customer funnels, health metrics, launch targets |
| **Current Route** | `/admin/pilot` |
| **Status** | **Live** |
| **Data Source** | vendors, profiles, bookings, quotes, reviews, vendor_verifications |
| **What Works** | Vendor funnel (registered → approved → verified → won booking), customer funnel, verification level distribution, pilot vendor tracker, revenue metrics, launch targets progress |
| **What Is Missing** | Nothing critical |
| **Safe for Pilot** | Yes — purpose-built for pilot |
| **Priority** | Critical during pilot |

---

### 18. Pilot CRM (`/admin/pilot/vendors`)
| Field | Value |
|---|---|
| **Purpose** | Track every outreach prospect from cold contact to active vendor |
| **Current Route** | `/admin/pilot/vendors` |
| **Status** | **Live** |
| **Data Source** | pilot_vendors (dedicated CRM table) |
| **What Works** | Full CRUD for pilot vendor records, status funnel (prospect → active → lost), acquisition source tracking, notes, phone/email/Instagram/Facebook/website fields, link to platform vendor_id when registered |
| **What Is Missing** | Nothing |
| **Safe for Pilot** | Yes — core pilot workflow tool |
| **Priority** | Critical during pilot |

---

### 19. Pilot Report (`/admin/pilot/report`)
| Field | Value |
|---|---|
| **Purpose** | Weekly structured report — vendor growth, quote activity, revenue, feedback, success criteria |
| **Current Route** | `/admin/pilot/report` |
| **Status** | **Needs Data** |
| **Data Source** | vendors, quotes, bookings, pilot_feedback, vendor_verifications |
| **What Works** | Report structure, period selector, vendor growth section, quote activity, booking/revenue section, success criteria progress bars |
| **What Is Missing** | Feedback sections (onboarding ease, NPS, written comments) require pilot_feedback table to have data; shows zeros cleanly without it |
| **Safe for Pilot** | Yes |
| **Priority** | High during pilot — weekly ops review |

---

### 20. Outreach Pack (`/admin/pilot/outreach`)
| Field | Value |
|---|---|
| **Purpose** | Copy-paste vendor recruitment templates for Instagram DM, email, WhatsApp, and LinkedIn |
| **Current Route** | `/admin/pilot/outreach` |
| **Status** | **Live** |
| **Data Source** | Static — no DB queries |
| **What Works** | Four message templates, target category list, outreach tips and strategy |
| **What Is Missing** | Nothing — intentionally static content |
| **Safe for Pilot** | Yes |
| **Priority** | High pre-pilot — used for vendor acquisition |

---

### 21. Launch Readiness (`/admin/launch`)
| Field | Value |
|---|---|
| **Purpose** | Pre-launch checklist with live scoring across 8 categories |
| **Current Route** | `/admin/launch` |
| **Status** | **Live** |
| **Data Source** | process.env, migration list, Supabase data checks, live Resend API call |
| **What Works** | Environment Variables check (18 keys), Database Migrations (9 key migrations), Data Integrity checks, Email Delivery live verification, Security & Operations, Legal & Compliance, Pre-Launch manual checklist, readiness % score (Green/Amber/Red) |
| **What Is Missing** | Manual tasks (Stripe webhook registration, DNS, Sentry) require human confirmation |
| **Safe for Pilot** | Yes — critical go/no-go tool |
| **Priority** | Critical |

---

## Summary Table

| Module | Route | Status | Safe for Pilot | Priority |
|---|---|---|---|---|
| Overview | `/admin` | Live | ✅ Yes | Highest |
| Vendors | `/admin/vendors` | Live | ✅ Yes | Critical |
| Customers | `/admin/customers` | Live | ✅ Yes | Medium |
| Bookings | `/admin/bookings` | Live | ✅ Yes | High |
| Quote Pipeline | `/admin/quotes` | Live | ✅ Yes | High |
| Reviews | `/admin/reviews` | Live | ✅ Yes | Medium |
| Disputes | `/admin/disputes` | Pilot Ready | ✅ Yes | Medium |
| Verifications | `/admin/verifications` | Live | ✅ Yes | Critical |
| Moderation | `/admin/moderation` | Live | ✅ Yes | Medium |
| Governance | `/admin/governance` | Live | ✅ Yes | Medium |
| Payouts | `/admin/payouts` | Pilot Ready | ✅ Yes | High |
| Subscriptions | `/admin/subscriptions` | Needs Integration | ✅ Yes | Low |
| Monetization | `/admin/monetization` | Needs Data | ✅ Yes | Low |
| Support | `/admin/support` | Live | ✅ Yes | Medium |
| System | `/admin/system` | Live | ✅ Yes | Critical |
| Analytics | `/admin/analytics` | Needs Data | ✅ Yes | Medium |
| Pilot Ops | `/admin/pilot` | Live | ✅ Yes | Critical |
| Pilot CRM | `/admin/pilot/vendors` | Live | ✅ Yes | Critical |
| Pilot Report | `/admin/pilot/report` | Needs Data | ✅ Yes | High |
| Outreach Pack | `/admin/pilot/outreach` | Live | ✅ Yes | High |
| Launch Readiness | `/admin/launch` | Live | ✅ Yes | Critical |

### Status Distribution
- **Live**: 14 modules
- **Pilot Ready**: 2 modules (Disputes, Payouts — functional, manual process acceptable)
- **Needs Data**: 3 modules (Monetization, Analytics, Pilot Report — empty tables, not broken)
- **Needs Integration**: 1 module (Subscriptions — Stripe admin actions pending)
- **Placeholder**: 0 modules
- **In Progress**: 0 modules

### Key Finding
**All 21 modules are safe for pilot.** "Needs Data" and "Needs Integration" modules display clean empty states — they are not broken, just waiting for data. No module should be removed from the sidebar.
