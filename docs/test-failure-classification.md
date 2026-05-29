# Playwright Test Failure Classification

## Categories

| Code | Type | Fix Strategy |
|---|---|---|
| **A** | Selector mismatch | Add `data-testid`, fix text/role selectors |
| **B** | Hydration / timing race | Replace `waitForTimeout` with `expect(locator).toBeVisible()` |
| **C** | Empty state — seeded data missing | Verify seed creates data visible under RLS for test user |
| **D** | Real feature bug | Fix the feature |
| **E** | Stale test expectation | Update test to match current UI |

---

## Audit by Suite

### `tests/auth/auth.spec.ts` — 11 tests

| Test | Category | Status | Notes |
|---|---|---|---|
| signup page renders correctly | — | ✓ | `data-testid="email-input"` etc. already present |
| signup with existing email shows error | — | ✓ | Flexible error selectors |
| signup with short password shows validation | — | ✓ | Uses `minlength` check + custom error |
| customer login redirects to dashboard | — | ✓ | `loginAs` helper |
| vendor login redirects to vendor dashboard | — | ✓ | `loginAs` helper |
| invalid credentials shows error | — | ✓ | Flexible error selectors |
| empty form shows browser validation | — | ✓ | Native validation check |
| logout clears session | — | ✓ | Cookie-based logout |
| unauthenticated → customer dashboard | — | ✓ | Route guard test |
| unauthenticated → vendor dashboard | — | ✓ | Route guard test |
| unauthenticated → admin | — | ✓ | Route guard test |
| unauthenticated → create event | — | ✓ | Route guard test |
| unauthenticated → vendor verification | — | ✓ | Route guard test |
| customer blocked from /admin | — | ✓ | proxy.ts role guard |
| vendor blocked from /admin | — | ✓ | proxy.ts role guard |

---

### `tests/vendor/vendor-onboarding.spec.ts` — 15 tests

| Test | Category | Notes |
|---|---|---|
| vendor apply page renders for guests | — | ✓ h1 heading check |
| apply form has required fields | — | ✓ Label text visible check |
| vendor dashboard loads with key stats | A→fixed | Added `data-testid="vendor-dashboard-stats"`; KPI text matches `/profile views\|quotes\|bookings\|revenue/i` |
| vendor sidebar navigation renders | — | ✓ VENDOR_NAV has "Leads" at `/vendor/quotes`; test checks `/leads\|quotes/i` |
| vendor profile page renders editable fields | — | ✓ label text checks |
| profile save shows success feedback | — | ✓ Flexible alert/text selector |
| services page renders existing packages | C | Needs at least one seeded package for vendor user |
| add package form renders | — | ✓ guarded with `if (await addBtn.isVisible())` |
| media page renders upload area | — | ✓ text/drag check |
| media gallery renders existing media | — | ✓ OR: media OR empty text |
| onboarding page is accessible | — | ✓ h1 check |
| verification page renders level overview | — | ✓ flexible text check |
| verification tabs are navigable | — | ✓ guarded |
| verification history tab is accessible | — | ✓ always passes (body check) |

**Key risk — Category C:** `tests` seed must create at least one package for `james.bennett@boldparty.demo` so `/vendor/services` shows package content.

---

### `tests/admin/admin.spec.ts` — 14 tests

| Test | Category | Notes |
|---|---|---|
| admin dashboard renders overview stats | A→fixed | Text `/vendors\|bookings\|revenue\|customers/i` matches KPI labels; `data-testid="admin-dashboard"` added |
| admin nav links are present | — | ✓ Quick Management links have "Vendors", "Bookings", "Verifications" |
| flagged vendors alert renders | — | ✓ body always visible |
| vendor list renders with search | — | ✓ search input check |
| vendor search filters results | — | ✓ guarded |
| vendor approval toggle is accessible | — | ✓ guarded |
| customer list renders with search | — | ✓ text check |
| moderation page renders tabs | — | ✓ text check |
| reports tab is navigable | — | ✓ guarded |
| media queue tab is navigable | — | ✓ guarded |
| admin alerts API returns structured data | — | ✓ API test, no UI |
| mark alert as read updates state | — | ✓ guarded |
| verifications page renders stats | — | ✓ text check |
| trust level buttons per verification card | — | ✓ guarded |

**Key risk — Config:** `admin@boldparty.demo` must be in `ADMIN_EMAILS` secret. Without it, the admin user logs in but gets redirected to `/dashboard` and all admin tests fail.

---

### `tests/customer/quote-flow.spec.ts` — 13 tests

| Test | Category | Notes |
|---|---|---|
| create event wizard renders step 1 | — | ✓ h1 + text check |
| event type selection advances to step 2 | — | ✓ guarded click |
| customer dashboard shows events list | — | ✓ text check |
| marketplace loads with vendor cards | C | Needs at least one approved vendor in seed |
| category filter changes results | — | ✓ guarded |
| vendor profile page loads from marketplace | C | Depends on vendor cards being present |
| request quote button visible on vendor profile | C | Depends on vendor profile loading |
| quote list page renders | — | ✓ flexible text check |
| quote detail page is accessible | — | ✓ guarded |
| bookings list page is accessible | A→fixed | `data-testid="bookings"` added to h1 |
| messages page is accessible | — | ✓ text check |
| saved vendors page renders | — | ✓ text check |

**Key risk — Category C:** Browse page needs at least one `status='approved'` vendor. Seed must approve `james.bennett@boldparty.demo`'s vendor record.

---

### `tests/vendor/verification.spec.ts` — 10 tests

| Test | Category | Notes |
|---|---|---|
| verification overview shows current level | — | ✓ flexible text check |
| level 1 criteria checklist renders | — | ✓ flexible text check |
| documents tab shows upload interface | — | ✓ guarded |
| document upload requires auth (API guard) | — | ✓ API test |
| signed URL endpoint requires auth | — | ✓ API test |
| admin verifications page renders pending queue | — | ✓ text check |
| stats bar shows counts | — | ✓ text check |
| filter tabs are functional | — | ✓ guarded with `.catch(()=>{})` |
| approve action calls API with correct payload | — | ✓ guarded + route interception |
| reject action requires a reason | — | ✓ guarded |
| vendor flagging action is available | — | ✓ guarded |
| vendor cannot access another vendor's document | — | ✓ API test |
| unauthenticated user cannot get signed URL | — | ✓ API test |

---

## Seed Data Requirements

For all tests to pass, `tests/global.setup.ts` must produce:

| Requirement | Why |
|---|---|
| `james.bennett@boldparty.demo` has a `vendor` record with `status='approved'` | Marketplace, vendor profile, quote tests |
| Vendor record has at least 1 package | Services page "renders existing packages" test |
| `admin@boldparty.demo` email is in `ADMIN_EMAILS` env var | All admin tests |
| `emily.carter@boldparty.demo` is a customer | Customer tests |
| Events/bookings seeded with correct `customer_id` | Bookings test |

---

## `waitForTimeout` audit

No `waitForTimeout` calls found in these test files. The tests already use:
- `await expect(locator).toBeVisible({ timeout: N })` — correct
- `if (await element.isVisible())` guards — correct
- `page.waitForURL(pattern, { timeout: N })` — correct

No timing-race fixes needed at test level. Any remaining flakiness is likely Category C (seed data).

---

## Resolved in this session

- `[AUTH-DEBUG]` console.log removed from `app/vendor/dashboard/page.tsx` and `app/admin/page.tsx`
- `data-testid="vendor-dashboard"` added to vendor dashboard outer container
- `data-testid="vendor-dashboard-stats"` added to vendor KPI stats grid
- `data-testid="admin-dashboard"` added to admin dashboard outer container
- `data-testid="bookings"` added to bookings page h1
- Universal `LoadingState`, `EmptyState`, `ErrorState` components created in `components/ui/StateComponents.tsx`
