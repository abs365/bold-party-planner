# ELBOLD Phase 1 Launch Freeze

**Status:** ACTIVE  
**Effective:** 2026-06-07  
**Owner:** Founder  
**Review:** After each unlock gate is met

---

## Objective

Prevent feature development from outpacing market validation. Every engineering hour before the unlock gate is met must go toward proving ELBOLD works with real users — not building capabilities that may never be used.

Real users validate ELBOLD. Internal assumptions do not.

---

## Unlock Gate

No new major features until ALL four conditions are met simultaneously:

| # | Condition | Target | Tracker |
|---|---|---|---|
| 1 | Real approved vendors | 20 | /admin/launch-freeze |
| 2 | Real customer quote requests | 20 | /admin/launch-freeze |
| 3 | Completed bookings | 10 | /admin/launch-freeze |
| 4 | First vendor payout completed | 1 | /admin/launch-freeze |

Once all four are met, the gate opens and Phase 2 features can be scheduled.

---

## Milestone Targets

### Vendor Targets
- [ ] 20 approved vendors
- [ ] 50 approved vendors

### Customer Targets
- [ ] 20 quote requests
- [ ] 10 bookings
- [ ] 20 bookings

### Revenue Targets
- [ ] First £100 gross revenue
- [ ] First £1,000 gross revenue
- [ ] First £5,000 gross revenue

### Trust Targets
- [ ] First verified customer review
- [ ] First vendor payout completed
- [ ] First successful refund processed
- [ ] First dispute resolved

---

## What is Frozen

During Phase 1:

- No new product features
- No new integrations (SMS, Twilio, AI upgrades)
- No new vendor-facing tools
- No new customer-facing flows
- No dashboard redesigns
- No A/B testing infrastructure
- No marketplace automation

---

## What is Always Allowed

These are never blocked by the freeze:

1. **Critical bugs** — anything preventing users from completing a journey
2. **Security fixes** — authentication, data exposure, injection vulnerabilities
3. **Trust issues** — false verification claims, badge integrity, escrow language
4. **Payment issues** — any flow involving real money moving incorrectly
5. **Compliance issues** — legal, FCA-adjacent, GDPR, PCI

---

## Focus Areas During Phase 1

**Vendor Acquisition**
- Outreach: 15+ contacts/day
- Target mix: 5 photographers, 5 decorators, 3 DJs, 3 caterers, 2 cake designers, 2 event planners
- Locations: Essex, Kent, London
- Tools: /admin/pilot/outreach, /admin/pilot/vendors

**Customer Acquisition**
- Outreach to real potential customers in target locations
- Social presence: Instagram, Facebook, WhatsApp groups
- SEO: monitor /admin/seo roadmap

**Operational Excellence**
- Approve vendor applications within 24 hours
- Respond to support within 48 hours
- Monitor /admin/launch for risk alerts daily
- Reconcile payments weekly via /admin/finance

**Trust**
- Verify every vendor document manually
- Follow up on unreviewed verifications within 48 hours
- Monitor suspicious flags in /admin/verifications

**Revenue**
- Ensure every booking reaches payment completion
- Monitor stuck bookings (>2h pending payment)
- Process vendor payouts within stated SLA

**Feedback**
- Read every feedback submission at /admin/feedback
- Contact unhappy users directly (rating < 3)
- Document recurring friction points

**Market Validation**
- Track which vendor categories get the most quote requests
- Track which locations generate the most activity
- Identify the highest-converting vendor profiles

---

## Success Definition

Phase 1 succeeds when real users — not the founder — complete the core ELBOLD loop:

1. A real customer finds a real vendor
2. A real customer submits a real quote request
3. A real vendor responds with a real quote
4. A real customer accepts and pays a real deposit
5. A real event takes place
6. A real vendor receives a real payout
7. A real customer leaves a real review

When this loop has happened 10 times, the platform is validated.

---

## Gate Unlock Process

When all four unlock conditions are met:

1. Verify counts in /admin/launch-freeze are live DB values (not estimates)
2. Confirm at least one complete end-to-end loop (vendor → quote → booking → payment → payout → review) has been observed
3. Review /admin/feedback for any unresolved P0/P1 issues
4. Document Phase 1 learnings before starting Phase 2 planning

---

*Live tracker: https://www.elbold.com/admin/launch-freeze*
