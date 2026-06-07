# Phase 5 — Trust-First Homepage Review

**Date:** 2026-06-07
**Page reviewed:** / (homepage)
**Objective:** Shift the page's emotional register from scale and choice toward confidence and curation.

---

## Current State Assessment

The homepage headline reads: "Every Celebration Deserves Extraordinary Professionals."

This is good copy. It is aspirational and emotionally specific. The risk is that the subheadline and subsequent sections lean toward breadth ("DJs, photographers, caterers, decorators and more") before trust is fully established.

Customers booking event professionals are not primarily motivated by variety. They are motivated by confidence. They want to know the person they hire will show up, do what they promised, and not ruin a day that cannot be re-run.

The homepage should answer this question before anything else: "Can I trust these vendors?"

---

## Section-by-Section Recommendations

### Hero

**Current:**
"Every Celebration Deserves Extraordinary Professionals. Individually reviewed DJs, photographers, decorators, caterers and more. Every vendor vetted before they join. Every booking protected."

**What works:** "Every vendor vetted before they join" and "Every booking protected" are strong. They speak directly to the trust gap.

**Recommendation:**
Move the trust statement up. The word "vetted" is doing important work but is buried in the subheadline. Consider leading with it more visibly. The category list (DJs, photographers, etc.) is useful but could be smaller or moved below the primary trust statement.

**Suggested direction:**
"Verified professionals for weddings, birthdays, corporate events and more. Every vendor reviewed by a real person before they can take a booking."

The difference: "reviewed by a real person" is more concrete and more human than "vetted". It implies a process and a team, which adds credibility.

### Trust Bar (below the hero)

**Current:** 5 trust signals rendered as small icon and text combinations.

**What works:** Content is strong. "Full refund if vendor cancels" is specific and reassuring.

**Recommendation:** Consider ordering the signals by emotional weight rather than topical category:
1. Every vendor reviewed by us (most important to establish first)
2. Money held safely by Stripe (addresses financial anxiety)
3. Full refund if vendor cancels (directly removes the biggest fear)
4. Reviews from real bookings only (distinguishes ELBOLD from directories)
5. Based in the United Kingdom (context, not trust)

### Occasion Cards

**Current:** Six editorial photography cards linking to filtered browse results.

**What works:** Beautiful visuals, emotionally resonant categories. No change needed.

**Recommendation:** None. These serve navigation and atmosphere well.

### Featured Vendors Section

**Current heading:** "Trusted by ELBOLD"

**Assessment:** Correct register. The word "trusted" is appropriate here. The vendor cards show trust badges from Phase 3, which is the right implementation.

**Recommendation:** Ensure all featured vendors displayed here have at minimum a phone-verified status. Showing a vendor with no verification badge in the "Trusted by ELBOLD" section undermines the heading. Add a filter in the vendor query: only show featured vendors with verification_level >= 1 and at least one package.

### Concierge Band (new, added in Phase 5)

**New section added:** "Not sure where to start? Tell us about your event."

**Purpose:** Captures customers who are overwhelmed by browsing and would prefer a guided experience. This is particularly valuable during the early marketplace phase when vendor supply is limited. A customer who cannot immediately find what they need should have somewhere to go other than the back button.

**No changes recommended.** The section is positioned correctly and the copy is appropriately human.

### The ELBOLD Promise Section

**Current:** Three cards: "Every vendor is reviewed by a real person", "Your deposit is held safely until your event", "Every review comes from a confirmed booking."

**Assessment:** This is the strongest trust section on the page. The specificity is exactly right.

**Recommendation:** Add one line below each card explaining the consequence for the customer, not just the mechanism. Example: instead of "No automated approvals", add "Which means you will never encounter a fake profile on ELBOLD."

### For Event Professionals Section

**Current:** Positioned near the bottom of the page.

**Recommendation:** Shorten this section or move it to a dedicated vendor page. On the homepage, its primary audience is customers. The vendor recruitment section competes for attention with the customer-facing promise content. If you need it on the homepage, reduce it to a single sentence and a link to the Founding Vendor page.

### Final CTA

**Current:** "Would You Trust ELBOLD With One of the Most Important Events of Your Life?"

**Assessment:** This is a strong, provocative question. It forces the customer to take the brand seriously. Keep it.

---

## Summary of Priority Recommendations

| Recommendation | Effort | Impact | Priority |
|---|---|---|---|
| Reorder trust bar by emotional weight | 30 min | Medium | Do now |
| Featured vendors must have min verification | 1 hour | High | Do now |
| Add "consequence" copy to ELBOLD Promise cards | 1 hour | Medium | Next sprint |
| Shorten or move the vendor recruitment section | 30 min | Low | Optional |
| Update hero subheadline to lead with trust | 30 min | Medium | Next sprint |

---

## What Not to Change

Do not change the hero headline. It is working.

Do not add more sections to this page. The page is already long. Every additional section reduces the chance that the customer reads the most important content.

Do not add social proof numbers that are not real. A "200+ verified vendors" claim on a marketplace with 8 vendors breaks trust permanently if a customer notices.
