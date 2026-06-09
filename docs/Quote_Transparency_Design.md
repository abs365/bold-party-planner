# Quote Transparency System Design

**Date:** 2026-06-09
**Sprint:** ELBOLD Trust, Governance & Operational Readiness
**Phase:** 6
**Status:** DESIGN ONLY — do not implement until soft launch phase

---

## Objective

Replace the current freeform quote message system with a structured, itemised quote format that gives customers full visibility of what they are paying for and why, building trust at the moment of highest financial commitment.

---

## Problem Statement

Currently, vendors respond to quote requests with a single price and a freeform message. Customers cannot see what is included in the price, making it impossible to compare quotes fairly or understand value.

This erodes trust. A customer who sees "Decoration: £500" from one vendor and "Decoration: £250" from another cannot tell if these are equivalent offers.

---

## Proposed Data Structure

### Quote Response — Itemised Format

```typescript
interface QuoteLineItem {
  description:  string;    // e.g. "Table Covers"
  quantity:     number;    // e.g. 10
  unit:         string;    // e.g. "pieces", "hours", "sessions"
  unit_price:   number;    // GBP, 2dp
  total:        number;    // quantity * unit_price (validated server-side)
}

interface QuoteBreakdown {
  line_items:     QuoteLineItem[];
  subtotal:       number;   // sum of all line_item totals
  platform_fee:   number;   // ELBOLD commission (10% of subtotal, shown to customer)
  deposit_amount: number;   // required upfront (e.g. 50% of subtotal)
  deposit_pct:    number;   // percentage, e.g. 50
  total:          number;   // subtotal (platform_fee is already ELBOLD's cut — not added to total)
  notes?:         string;   // optional free-text terms or conditions
  valid_until:    string;   // ISO date
}
```

### Database Schema Changes Required (Phase 7 — not yet)

```sql
ALTER TABLE quote_responses
  ADD COLUMN line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN breakdown  JSONB;
```

---

## Example Quote

### Decorator Quote — Children's Birthday Party

| Item | Qty | Unit | Unit Price | Total |
|---|---|---|---|---|
| Table covers (round, white) | 10 | pieces | £1.00 | £10.00 |
| Chair covers (spandex, ivory) | 50 | pieces | £0.50 | £25.00 |
| Balloon arch (3m, custom colours) | 1 | arch | £80.00 | £80.00 |
| Backdrop (7ft printed, custom) | 1 | backdrop | £100.00 | £100.00 |
| Setup and collection | 1 | session | £50.00 | £50.00 |

| | Amount |
|---|---|
| Subtotal | £265.00 |
| Deposit (50%) | £132.50 |
| Balance on day | £132.50 |

Platform fee (10%) is deducted from ELBOLD's share. The customer pays £265.00 total. Vendor receives £238.50.

---

## Customer UI Design

### Quote Card — Expanded View

```
┌─────────────────────────────────────────────────────────┐
│  BALLOON DECOR CO                                       │
│  Quote for: Emma's Birthday Party                       │
├─────────────────────────────────────────────────────────┤
│  WHAT'S INCLUDED                                        │
│                                                         │
│  Table covers (round, white)     10 × £1.00   £10.00   │
│  Chair covers (spandex, ivory)   50 × £0.50   £25.00   │
│  Balloon arch (3m, custom)        1 × £80.00  £80.00   │
│  Backdrop (7ft printed)           1 × £100.00 £100.00  │
│  Setup and collection             1 × £50.00  £50.00   │
├─────────────────────────────────────────────────────────┤
│  Subtotal                                     £265.00   │
│  Deposit required (50%)                       £132.50   │
│  Balance due on day                           £132.50   │
├─────────────────────────────────────────────────────────┤
│  [  Accept Quote  ]   [  Ask a Question  ]              │
│                                                         │
│  Deposit secured by Stripe. Refundable per ELBOLD       │
│  cancellation policy.                                   │
└─────────────────────────────────────────────────────────┘
```

### Quote Comparison View

When a customer has 2+ quotes for the same event, the comparison view should:
1. Show itemised breakdowns side by side
2. Highlight the lowest price per category
3. Show a "Best Value" badge on the best value-for-money quote (not just cheapest)

---

## Vendor UI Design

### Quote Response Form — Itemised

```
ITEMS INCLUDED IN YOUR QUOTE

[+ Add Item]

Item description          Qty    Unit        Price     Total
Table covers              10     [pieces  ]  £1.00     £10.00   [x]
Chair covers              50     [pieces  ]  £0.50     £25.00   [x]
[+ Add another item]

Subtotal:  £35.00

DEPOSIT SETTINGS
Deposit percentage:  [50%]
Deposit amount:      £17.50
Balance on day:      £17.50

TERMS AND CONDITIONS (optional)
[Free text field — e.g. travel surcharge applies if venue >30 miles]

Quote valid until:  [date picker]

[Submit Quote]
```

---

## Trust Signals to Include

1. **Line-by-line visibility** — customer knows exactly what they are buying
2. **Deposit protection notice** — "Your deposit is held securely by Stripe until the event is completed"
3. **Cancellation terms** — clear reference to ELBOLD cancellation policy
4. **Valid until date** — prevents quote bait-and-switch (quote expires → price increase)

---

## Migration Path from Current System

Current `quote_responses` table has: `title`, `description`, `price`, `deposit_amount`, `services` (array), `terms`, `duration_hours`, `valid_until`.

Migration strategy:
1. Add `line_items JSONB DEFAULT '[]'` and `breakdown JSONB` as nullable columns
2. Keep existing fields — vendor can submit either format
3. If `line_items` is populated, render itemised view
4. If not, render legacy single-price view
5. After 60 days, enforce itemised format for new quotes

---

## Open Questions for Founder Decision

1. Should the platform fee be displayed to the customer? (Currently transparent in terms but not shown per-quote)
2. Should vendors be required to use itemised quotes before going LIVE, or allowed freeform at first?
3. Should deposit percentage be vendor-settable (20%–100%) or fixed at 50%?

---

## Estimated Implementation Time

| Component | Estimate |
|---|---|
| DB migration (add line_items/breakdown columns) | 1 hour |
| Vendor quote response form update | 3 hours |
| Customer quote card redesign | 3 hours |
| Quote comparison update | 2 hours |
| API validation (server-side total verification) | 1 hour |
| Testing | 2 hours |
| **Total** | **~12 hours** |
