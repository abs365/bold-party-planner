# Launch Readiness Final Report — ELBOLD Events

**Version:** 1.0  
**Date:** June 2026  
**Method:** Five-persona walkthrough — Bride, Parent, Corporate Event Planner, Vendor, Founder  
**Purpose:** Determine if ELBOLD is ready for its first 20 real users

---

## Executive Summary

ELBOLD is launch-ready for a controlled pilot of 20 vendors and early customer enquiries, with conditions.

**Verdict: GO WITH CAUTION**

The platform foundation is strong. The design, trust systems, booking infrastructure, and SEO architecture are all in place. Two critical manual actions must be completed before a real user is allowed to pay money. Four medium-priority issues should be resolved within the first two weeks of pilot operation.

---

## Persona 1 — The Bride

**Profile:** Emma, 29, planning her wedding in Essex. Engaged 3 months ago. Budget: £8,000–£12,000. Has browsed Hitched and Instagram. Is worried about vendors cancelling or not being what they appear.

### Journey Walkthrough

**Discovery:** Searches "wedding photographer Essex ELBOLD" — ELBOLD does not yet rank organically. Emma arrives via direct link from a friend or social post.

**Homepage:**
- ✅ Immediately understands the platform is for finding event professionals
- ✅ Trust bar visible: "individually reviewed · Stripe-secured · verified reviews only" — addresses her core fear about vendor legitimacy
- ✅ Occasion pill "Weddings" takes her to filtered browse
- ⚠️ If vendor count is low (e.g. 3 wedding photographers in Essex), the browse page feels sparse. Trust erodes quickly.

**Vendor Profile:**
- ✅ Verified badge with verification level label reassures her
- ✅ Reviews marked "from a verified booking" — she notices this is different from normal testimonials
- ⚠️ If vendor has zero reviews, she hesitates — needs a message explaining why there are none yet
- ✅ Packages clearly listed with prices

**Quote Request:**
- ✅ Clear form — she understands what she's asking for
- ⚠️ After submission, she receives no email. She isn't sure it worked. **HIGH PRIORITY FIX.**

**Quote Acceptance:**
- ✅ Vendor responds with full quote including deposit amount
- ⚠️ She doesn't understand what "accepting" means — is she committing? There's no explanation before she clicks. **MEDIUM PRIORITY.**

**Payment:**
- ✅ Stripe checkout is professional and trustworthy
- ✅ Receives email confirmation with booking reference
- ✅ Booking dashboard shows confirmed status

**Scores:**
| Criterion | Score (1–5) |
|---|---|
| Understanding what ELBOLD is | 5 |
| Trust in the platform | 4 |
| Ease of use | 4 |
| Professional appearance | 5 |
| Likelihood to complete booking | 3 (drops if vendor supply is sparse or quote confirmation email is missing) |

**Overall: 4.2/5 — Ready with conditions**

---

## Persona 2 — The Parent

**Profile:** Marcus, 45, planning his daughter's 18th birthday party in London. Budget: £1,500–£2,500. Wants a DJ and a decorator. Has used Bark before and got burned by no-shows.

### Journey Walkthrough

**Discovery:** Searches "verified DJ hire London" — ELBOLD does not yet rank for this. Arrives via Facebook recommendation or founding vendor's social post.

**Homepage:**
- ✅ Understands the platform immediately — "find professionals for your event"
- ✅ The word "verified" in the trust strip matters to him — he had a bad experience with unverified vendors before
- ✅ Quick-start pill "Birthdays" → relevant filtered browse

**Browse:**
- ✅ Filters for London DJs
- ⚠️ If there are no London DJs yet, he sees an empty result. No "coming soon" message with contact option. **HIGH PRIORITY for vendor supply.**

**Quote Flow:**
- ✅ Smooth if vendor exists and responds
- ⚠️ He tries to request quotes from two vendors simultaneously — the system supports this, but it's not obvious how to compare them. Quote comparison page exists but is not well-signposted.

**Trust moment — What happens if vendor cancels?**
- ⚠️ He asks himself: "What if they cancel?" The answer is on `/our-commitments` (C-03: full refund if vendor cancels confirmed booking) but this is not mentioned on the booking confirmation page.
- **Recommendation:** Add a short "What if something goes wrong?" section to the booking confirmation page linking to /our-commitments.

**Scores:**
| Criterion | Score (1–5) |
|---|---|
| Understanding what ELBOLD is | 5 |
| Trust in the platform | 4 |
| Ease of use | 4 |
| Professional appearance | 4 |
| Likelihood to complete booking | 4 |

**Overall: 4.2/5 — Ready**

---

## Persona 3 — Corporate Event Planner

**Profile:** Priya, 34, events coordinator at a mid-size company in London. Planning a 60-person company away day. Budget: £5,000–£8,000 for venue + catering. Needs a contract, clear pricing, and a paper trail.

### Journey Walkthrough

**Homepage:**
- ✅ Quick-start pill "Corporate" → browse filtered by event type
- ✅ Professional appearance: navy, gold, clean typography reads as professional

**Browse / Profile:**
- ✅ Stripe-secured payments is a key trust signal for corporate use
- ⚠️ No formal quote / invoice system visible from the browsing experience. She needs to know she can get a proper quote document. The platform generates invoices (in DB) but they are not prominently surfaced to customers.
- ⚠️ No way to see if vendor has public liability insurance — this is a standard corporate requirement. The verification system checks for this (Level 4: Business Verified) but it's not communicated on the vendor profile.

**Quote and Booking:**
- ✅ Quote response includes a structured price, services list, and deposit amount
- ⚠️ Booking confirmation has no downloadable contract or reference document. A "Download booking summary as PDF" would serve her corporate needs.
- ⚠️ For a £6,000 booking, a 10% deposit is £600. She may need approval to pay a deposit before the full amount is confirmed. The deposit payment flow has no "save for later / share with approver" option.

**Scores:**
| Criterion | Score (1–5) |
|---|---|
| Understanding what ELBOLD is | 4 |
| Trust in the platform | 3 |
| Ease of use | 3 |
| Professional appearance | 5 |
| Likelihood to complete booking | 2 (would need invoice/contract feature and insurance verification surfaced) |

**Overall: 3.4/5 — Not ready for corporate users yet**

**Recommendation:** Do not actively target corporate buyers in Phase 1. Focus on weddings, birthdays, and cultural events where personal purchase decisions are made without procurement approval. Corporate is a Phase 2 market.

---

## Persona 4 — Vendor

**Profile:** Jordan, 27, freelance DJ based in Chelmsford, Essex. Active on Instagram (3,200 followers). Currently gets bookings through word of mouth and occasional Bark leads. Frustrated with Bark's credit system.

### Journey Walkthrough

**Discovery:** Sees ELBOLD post in Essex DJ Facebook group, clicks through to `/founding-vendors`.

**Founding Vendors page:**
- ✅ Comparison table: "ELBOLD vs Social Media vs Directories" immediately addresses his experience with Bark
- ✅ "Free to list, commission only when you earn" — this is his primary objection answered immediately
- ✅ "20 founding places" creates urgency — he applies the same day

**Application:**
- ✅ Form is simple (5 minutes as promised)
- ✅ Receives confirmation email immediately
- ⚠️ After submitting, he doesn't know how long to wait. Email says "we'll be in touch" but gives no timeline. **Should say: "We aim to respond within 24 hours."**

**Approval + Onboarding:**
- ✅ Approval email received with next steps
- ⚠️ Onboarding page lists tasks but has no visual progress indicator — he doesn't know how "complete" his profile is
- ⚠️ No prompt to share his profile on social media after going live — a "Your profile is live — share it!" prompt would generate free traffic

**First Quote Request:**
- ✅ In-app notification and email received
- ✅ Quote form is clear
- ⚠️ He has to decide his price with no context on what other DJs are charging on ELBOLD — he may underprice or overprice

**Scores:**
| Criterion | Score (1–5) |
|---|---|
| Understanding what ELBOLD offers | 5 |
| Trust in the platform | 5 |
| Ease of use | 4 |
| Professional appearance | 5 |
| Likelihood to apply | 5 |
| Likelihood to remain active | 4 |

**Overall: 4.7/5 — Strong vendor experience**

---

## Persona 5 — Founder

**Profile:** The person who built this. Knows the system. Now stress-testing it for real-world operation.

### Founder Checklist

**Must be complete before first real customer payment:**
- [ ] Stripe webhook registered at `https://www.elbold.com/api/payments/webhook` in Stripe Dashboard
- [ ] Stripe live mode key (`sk_live_*`) set in production environment
- [ ] `elbold.com` verified in Resend dashboard (DKIM + SPF + DMARC)
- [ ] At least 1 approved vendor with a complete profile in each target category
- [ ] `/admin/launch` cockpit showing 0 risk alerts

**Should be done in week 1 of pilot:**
- [ ] Customer journey: add quote-submitted email (see Customer Journey Audit)
- [ ] Customer journey: add accept-quote confirmation modal
- [ ] Vendor journey: fix auth redirect after signup (preserve `/vendor/apply` destination)
- [ ] Monitor `/admin/feedback` daily — respond to every piece of feedback personally in week 1

**Success signals to watch (via `/admin/launch`):**
- First booking confirmed → screenshot and share
- First successful payment → verify ledger, emails, and notifications all fired
- First vendor review submitted → verify it appears on profile after moderation
- First payout processed → verify bank transfer, update vendor payout page

**Scores:**
| Criterion | Score (1–5) |
|---|---|
| Platform foundation completeness | 5 |
| Payment safety | 4 (webhook not yet registered) |
| Trust system strength | 5 |
| Admin visibility | 5 |
| Launch readiness | 4 |

**Overall: 4.6/5 — Go with conditions**

---

## Aggregate Scores

| Persona | Score |
|---|---|
| Bride (Emma) | 4.2/5 |
| Parent (Marcus) | 4.2/5 |
| Corporate Planner (Priya) | 3.4/5 |
| Vendor (Jordan) | 4.7/5 |
| Founder | 4.6/5 |
| **Average** | **4.2/5** |

---

## Go / No-Go Decision

### ✅ GO — if these are true:
1. Stripe webhook registered and verified with a test event
2. Stripe live key active in production
3. Resend domain verified
4. At least 5 approved vendors on the platform with complete profiles
5. At least 1 vendor per priority category (DJ, photographer, decorator)

### ❌ NO-GO — if any of these are true:
- Stripe webhook not registered
- Stripe still in test mode
- Zero approved vendors
- Email delivery not confirmed working

### ⚠️ GO WITH CAUTION — current state:
The platform is GO WITH CAUTION. The five manual infrastructure items (above) remain unverified. Once those are confirmed, ELBOLD can accept its first real booking.

**Recommended pilot scope:** 5 vendors, 3 customer test users (trusted contacts), monitor every transaction manually. Expand once first real booking completes successfully end-to-end.

---

## Issues for Backlog

Ordered by priority:

| # | Issue | Persona affected | Priority |
|---|---|---|---|
| 1 | No quote-submitted confirmation email | Bride, Parent | HIGH |
| 2 | No accept-quote modal explaining commitment | Bride | HIGH |
| 3 | Auth redirect drops vendor back to homepage | Vendor | HIGH |
| 4 | No onboarding progress indicator | Vendor | MEDIUM |
| 5 | No vendor decline email to customer | Bride | MEDIUM |
| 6 | No "what if something goes wrong?" on booking page | Parent | MEDIUM |
| 7 | Quote comparison not signposted from quote view | Parent | MEDIUM |
| 8 | Insurance verification not surfaced | Corporate | LOW (Phase 2) |
| 9 | No downloadable booking summary | Corporate | LOW (Phase 2) |
| 10 | No market pricing context for vendors | Vendor | LOW |

---

*This report was produced from codebase analysis, persona walkthroughs, and direct platform review. Update after each pilot week with real user observations.*
