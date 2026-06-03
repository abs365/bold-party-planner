# Daily Beta Monitoring Checklist — ELBOLD

**Version:** 1.0  
**Date:** 2026-06-03  
**Owner:** Founder  
**Cadence:** Every morning during active beta period

---

> Print or copy this checklist each day.
> Mark each item: ✅ OK / ⚠️ Warning / ❌ Fail
> Any ❌ triggers the bug escalation process immediately.

---

## Section A — Platform Health (5 minutes)

Run these checks first. If any fail, investigate before doing anything else.

| # | Check | How to check | Expected | Result |
|---|---|---|---|---|
| A1 | Site is live | `curl -s -o /dev/null -w "%{http_code}" https://www.elbold.com` | `200` | |
| A2 | Login page loads | Visit https://www.elbold.com/login in browser | Clean form, no demo credentials visible | |
| A3 | Signup page loads | Visit https://www.elbold.com/signup | Both role tabs visible | |
| A4 | Browse page loads | Visit https://www.elbold.com/browse | Vendor cards visible | |
| A5 | API health check | Visit https://www.elbold.com/api/health | `{"status":"ok"}` or equivalent | |
| A6 | Admin dashboard | Visit https://www.elbold.com/admin | Loads without error | |
| A7 | Vercel deployment | Check Vercel dashboard last deploy status | Latest deploy = Ready | |
| A8 | No new Sentry alerts | Check Sentry dashboard | No new critical errors in last 24h | |

---

## Section B — Tester Activity (5 minutes)

| # | Check | Where | Expected | Result |
|---|---|---|---|---|
| B1 | New vendor applications | `/admin/vendors` → Pending tab | Any new applications to review | |
| B2 | Admin alerts unread | `/admin` → alert bar | Review and clear any new alerts | |
| B3 | New vendor verifications | `/admin/verifications` | Any pending document reviews | |
| B4 | Active tester sessions | Supabase Auth → Users | Any new signups in last 24h | |
| B5 | New quotes created | `/admin/quotes` | Quote count changed from yesterday | |
| B6 | New bookings | `/admin/bookings` | Any new bookings | |
| B7 | Reported reviews | `/admin/reviews` | Any flagged content needing review | |

---

## Section C — Email Health (5 minutes)

Check these only when a tester reports a flow that triggers an email.

| # | Check | Trigger | Verify |
|---|---|---|---|
| C1 | Signup confirmation email | New user registered | Email received within 90 seconds |
| C2 | Vendor application received | Vendor submitted apply form | Vendor got "Application received" email |
| C3 | Vendor approval email | Admin clicked Approve | Vendor got "You're approved!" email |
| C4 | Quote request email | Customer sent quote | Vendor got "New quote request" email |
| C5 | Quote response email | Vendor responded | Customer got "New response" email |
| C6 | Booking confirmed email | Customer accepted quote | Both parties got confirmation email |
| C7 | Password reset email | User clicked Forgot Password | Email received, link opens correctly |

**How to verify email delivery:** Ask the tester directly. Check Resend dashboard → Logs for send status.

---

## Section D — Vendor Quality (3 minutes)

| # | Check | Where | Action if failing |
|---|---|---|---|
| D1 | Approved vendors visible in Browse | `/browse` | If 0 vendors: check vendor status in DB |
| D2 | Vendor profile photos showing | `/vendors/[id]` | If broken: check storage bucket policies |
| D3 | Vendor packages listed | `/vendors/[id]` → Packages | If missing: guide vendor to `/vendor/services` |
| D4 | Vendor completion score > 60% | `/vendor/dashboard` | Guide vendor through profile completion steps |

---

## Section E — Bug Review (5 minutes)

| # | Check | Action |
|---|---|---|
| E1 | Review any bug reports received since yesterday | Log in `Beta_Test_Results.md` Section 8 |
| E2 | Any P0 or P1 bugs open? | Fix immediately before proceeding |
| E3 | Any P2 bugs open > 72 hours? | Prioritise fix today |
| E4 | Any tester waiting on a fix? | Notify them of status |

---

## Section F — Pilot CRM Update (5 minutes — once per day)

| # | Check | Where | Action |
|---|---|---|---|
| F1 | Any new vendor responses to outreach? | WhatsApp / Email | Update status in `/admin/pilot/vendors` |
| F2 | Any vendors moved from Interested → Applied? | `/admin/pilot/vendors` | Confirm application received |
| F3 | Today's outreach target (10/day) | Daily Outreach Tracker in Drive | Send 10 contacts from the lead list |
| F4 | Overall founding vendor progress | `/admin/pilot` | Count: Applied / Approved / Verified |

---

## Section G — Weekly Checks (Fridays only)

| # | Check | Where | Notes |
|---|---|---|---|
| G1 | Weekly pilot report | `/admin/pilot/report` | Vendor growth, quotes, bookings, feedback |
| G2 | Vendor acquisition scorecard | Google Drive — Weekly Vendor Acquisition Scorecard | Response rate / Registration rate / Verification rate |
| G3 | Founding vendor slot progress | `/admin/pilot` | 5 Photographers, 5 Decorators, 3 DJs, 3 Caterers, 2 Cake, 2 Event Planners |
| G4 | Any open beta blockers? | `Beta_Test_Results.md` Section 8 | All P0/P1 must be closed before weekly report |
| G5 | Review beta tester feedback | `Beta_Test_Results.md` Section 7 | Capture key themes |
| G6 | Governance check | `/admin/governance` | Any at-risk vendors? Issue warnings if needed |
| G7 | Update `Beta_Test_Results.md` | Local file | Record weekly summary |

---

## Daily Monitoring Log

Use this to record the outcome of each daily check session.

```
Date: _______________
Checked by: _______________
Time taken: ___ minutes

Section A — Platform Health:   ✅ All OK / ⚠️ Issues / ❌ Failure
Section B — Tester Activity:   ✅ All OK / ⚠️ Issues / ❌ Failure
Section C — Email Health:      ✅ All OK / ⚠️ N/A / ❌ Failure
Section D — Vendor Quality:    ✅ All OK / ⚠️ Issues / ❌ Failure
Section E — Bug Review:        ✅ All OK / ⚠️ Open bugs / ❌ P0/P1 open
Section F — Pilot CRM:         ✅ Updated / ⚠️ Behind / ❌ Not done

New bugs found today: _______________
Actions taken: _______________
Follow-ups needed: _______________
```

---

## Quick Reference — Key URLs

| Purpose | URL |
|---|---|
| Homepage | https://www.elbold.com |
| Admin dashboard | https://www.elbold.com/admin |
| Admin vendors | https://www.elbold.com/admin/vendors |
| Admin verifications | https://www.elbold.com/admin/verifications |
| Admin quotes | https://www.elbold.com/admin/quotes |
| Admin reviews | https://www.elbold.com/admin/reviews |
| Pilot CRM | https://www.elbold.com/admin/pilot/vendors |
| Weekly report | https://www.elbold.com/admin/pilot/report |
| System health | https://www.elbold.com/admin/system |
| API health | https://www.elbold.com/api/health |
| Vercel dashboard | https://vercel.com/dashboard |
| Resend logs | https://resend.com/emails |
| Supabase dashboard | https://supabase.com/dashboard |
| Stripe dashboard | https://dashboard.stripe.com |
