# QA-001 integrated responsive / RTL / accessibility / visual regression audit

**Audit status:** `PARTIAL / BLOCKED`

The repository-backed logic and source audit completed. The original audit did
not have browser interaction, exact viewport, screenshot, pixel-diff, or
assistive-technology evidence because the checkout had no Playwright/browser
dependency and no live API or storefront server. A later parent recheck added
bounded default-viewport CUA evidence without entering credentials; exact-size,
authenticated, assistive-technology and pixel gates remain open. The original
audit routes findings to owners and did not modify storefront production code;
the later parent cleanup is recorded separately below.

## Baseline and scope

- Baseline: commit `465ce070cbdb31e9ab1dbad8c6b2f21bc06d12bb` on
  `codex/integration`.
- Integrated route composition: `apps/web/src/app.tsx` and
  `apps/web/src/shared/hash-route.ts`.
- Reviewed route groups: public home/category/listing/product/cart, auth,
  checkout and confirmation/payment recovery, account/address/order/return,
  editorial and published content, admin login/dashboard/catalog/inventory/
  orders/payments/customers/content/audit/operations, and fallback/not-found
  and preview-state routes.
- Design references: `arch.md`, `CONTEXT.md`,
  `docs/designs/atelier-editorial.md` (primary selected direction),
  `docs/designs/nova-atelier-editorial.md`,
  `docs/designs/quiet-grid.md`,
  `apps/web/public/design-references/atelier-admin-operations.png`, and
  `output/design-artifacts/auth-staff-login-atelier.png`.
- Existing focused tests were inspected and run. For the original audit, the
  stale remaining-work ledger was not used as evidence and was not edited.
- Pre-existing worktree state preserved: untracked
  `.worktrees/web-004-checkout-recovery/` was not opened, changed, or removed.
- At the original audit's final inspection, unrelated concurrent changes were present in
  `.agents/project-memo.md`, `docs/remaining-work-plan-optimized.md`,
  `docs/remaining-work-status.md`, and `output/`; this audit did not edit or
  revert them.

### Structural-discovery note

The indexed code graph was available for route ownership tracing, but its
generation was `2026-09-09` while this audit baseline is `2026-09-11`. Coverage
reported `metadata_changed` for `apps/web/src/app.tsx` and `styles.css` and
`not_tracked` for several feature files. The graph also reported one deliberately
ignored reference image. Therefore all material implementation claims in this
report were verified against current checked-out source with targeted search and
line reads; graph results were used only as orientation and are not treated as
current rendered evidence.

## Structured status

| Gate | Status | Evidence / boundary |
| --- | --- | --- |
| Requested baseline | `PASS` | The original audit matched `465ce07` on `codex/integration`; the later parent recheck ran from the current integration checkout. |
| Route integration ownership | `PASS` | `RouteView` dispatches the integrated public, auth, commerce, account, content, admin, and fallback route kinds; `hash-route.test.ts` passed. |
| Web focused tests | `PASS` | The parent recheck ran `bun test apps/web/src test/e2e/run.test.ts`: **134 pass, 0 fail** across 31 files. |
| Web typecheck | `PASS` | `bun run --cwd apps/web typecheck` exited successfully. |
| Deterministic integration matrix | `PASS` | The parent recheck ran `bun run test:integration`: all 8 deterministic suites passed with no failures. |
| Live API/storefront smoke | `PARTIAL / BLOCKED` | The local Vite storefront rendered through the CUA browser, including `#admin/login` and the protected `#admin/catalog` route; API liveness/readiness and authenticated data-backed smoke remain unavailable. |
| Browser harness | `PARTIAL` | The available CUA browser captured the default viewport and accessibility tree. No Playwright/Puppeteer/Cypress dependency or exact viewport control exists in the checkout, so browser journeys remain deferred and are not represented as passing E2E coverage. |
| Screenshot/pixel regression | `PARTIAL / NOT RUN` | Inline CUA screenshots were observed at the available default viewport, but no `1440x900`/`390x844` capture, saved artifact, or pixel diff was generated. |
| Production code changes | `PASS` | The original audit changed no production files. The later parent cleanup, committed as `c54817b`, changed only unreachable legacy declarations/imports in `apps/web/src/app.tsx`; no provider, package/lockfile, generated output or shared contract changed. |

## Required responsive widths

The source contains responsive rules for the requested width family, but the
rendered behavior at each width is not verified without a browser.

| Width | Static source contract | Runtime / pixel gate |
| ---: | --- | --- |
| `1440` | `PASS` — shell max-width is `1280px`, matching the Atelier primary desktop contract. | `NOT RUN` |
| `1280` | `PASS` — compact desktop uses the same bounded shell and desktop layout rules. | `NOT RUN` |
| `1024` | `PASS` — source has an explicit `max-width: 1024px` rule for navigation, hero, product detail, admin rail, and page padding. | `NOT RUN` |
| `768` | `PASS` — source switches to mobile navigation, stacked commerce layouts, mobile bottom navigation, and compact admin layout at `max-width: 768px`. | `NOT RUN` |
| `390` | `PASS` as a declared target — source has `max-width: 480px` refinements and a `16px` shell gutter, but no rendered capture. | `NOT RUN` |
| `360` | `PASS` as a declared target — source has an explicit `max-width: 360px` refinement, but no rendered capture. | `NOT RUN` |

The requested no-horizontal-overflow assertion was therefore not executed.
The source does intentionally use horizontal scrolling for mobile category,
support-card, and subcategory rails; whether those rails remain contained at
all routes and widths requires the blocked browser check.

## RTL, mixed direction, and accessibility gates

| Gate | Status | Evidence / limitation |
| --- | --- | --- |
| Page direction | `PASS` (static) | `apps/web/src/index.html` declares `lang="fa" dir="rtl"`; `App` also sets `dir="rtl"`. |
| Mixed LTR values | `PASS` (static) | Staff email/password/factor fields, newsletter email, phone numbers, order numbers, SKUs, tracking references, payment/coupon-like values, and footer Latin branding use `dir="ltr"` or a dedicated LTR class at the inspected surfaces. |
| Persian customer money | `PASS` (static) | Customer prices use `Intl.NumberFormat('fa-IR')` and append `تومان`; the Atelier contract’s mixed-direction rule is represented in source. |
| Landmarks and labels | `PASS` (source spot-check) | Key route surfaces expose `main`, `header`, `nav`, `footer`, labelled sections/dialogs, labelled icon controls, and form labels. Rendered landmark uniqueness and screen-reader output are `NOT RUN`. |
| Heading order | `PASS` (source spot-check) | Reviewed route components provide a page heading and labelled section headings. Runtime DOM/heading-order audit is `NOT RUN`. |
| Visible focus | `PASS` (static baseline) | Global `:focus-visible` styling covers links, buttons, inputs, selects, and textareas; the shared button uses a visible focus ring. |
| Modal keyboard containment | `FAIL` | Search and menu surfaces close on Escape, but `SearchDialog` and `MenuDrawer` do not trap Tab focus or restore focus to the invoking control. See finding `QA-001-A11Y-001`. |
| Touch target minimum | `FAIL` | The shared button/icon baseline is at least 44px, but product quick-add is 40px by default and 38px at `max-width: 360px`, below the Atelier `44 × 44px` pointer target. See `QA-001-A11Y-002`. |
| Reduced motion | `FAIL` | The reduced-motion block shortens duration and disables smooth scroll, but does not neutralize the product image `scale(1.025)` or quick-add `translateY(-1px)` transforms. See `QA-001-A11Y-003`. |
| Keyboard journeys | `NOT RUN` | No browser harness; tab order, focus visibility in rendered color contexts, Escape behavior, and focus return were not exercised. |
| Assistive technology | `NOT RUN` | No screen-reader or accessibility-tree capture was available. |

## Required state coverage

These statuses distinguish deterministic source/test evidence from the
unavailable rendered-browser gate.

| State | Status | Evidence |
| --- | --- | --- |
| Loading | `PASS` (logic/source) / `NOT RUN` (browser) | Catalog, cart, checkout, account, order, content, admin-session, and admin feature paths expose pending/loading states; focused tests passed. |
| Empty | `PASS` (logic/source) / `NOT RUN` (browser) | Empty catalog/cart/account/content/admin branches and safe actions are represented; focused state tests passed. |
| Error | `PASS` (logic/source) / `NOT RUN` (browser) | Inline alerts, retry actions, API error mapping, payment failures, and route fallback states are present; focused tests passed. |
| Offline | `PASS` (logic/source) / `NOT RUN` (browser) | Catalog, content, and admin state helpers classify offline/network failures; tests passed. |
| Validation | `PASS` (logic/source) / `NOT RUN` (browser) | Address, return, checkout, staff-auth, content, SEO, redirect, and catalog validation paths are covered by source and focused tests. |
| Success | `PASS` (logic/source) / `NOT RUN` (browser) | Newsletter, checkout confirmation, mutation success, publish-ready, and saved-state paths exist; no rendered confirmation was captured. |
| Permission denied | `PASS` (logic/source) / `NOT RUN` (browser) | Admin permission-denied page and role matrices are implemented; admin role-boundary tests passed. |
| Session expiry | `PASS` (logic/source) / `NOT RUN` (browser) | Staff session failure redirects to login and supports an expiry message; customer checkout/auth expiry mapping is tested. |
| Stock conflict | `PASS` (logic/source) / `NOT RUN` (browser) | Cart merge conflict and checkout inventory conflict mapping are covered; deterministic checkout/inventory tests passed. |
| Price change | `PASS` (logic/source) / `NOT RUN` (browser) | Checkout failure classification distinguishes `price-change`; deterministic quote/price safety tests passed. |
| Payment pending | `PASS` (logic/source) / `NOT RUN` (browser) | `#checkout/payment-pending` route and recovery copy are present; payment integration tests passed. |
| Payment failed/recovery | `PASS` (logic/source) / `NOT RUN` (browser) | Failed and recovery routes preserve safe retry/continue guidance; focused checkout tests passed. |
| Refund / return | `PASS` (logic/source) / `NOT RUN` (browser) | Customer return states and `REFUNDED` status copy exist; orders/payment refund integration tests passed, but no browser return/refund render was exercised. |

## Visual regression status

### Atelier storefront direction

`NOT RUN` for pixel comparison. The source is aligned with the primary Atelier
contract at the token and layout-rule level: warm ivory surfaces, oxblood
actions, Persian RTL, `1280px` shell, mobile two-column product grid, and
reduced-motion intent are represented. Exact composition, image crop, text
wrap, visual hierarchy, and overflow remain unverified without a render.

### Admin operations reference

`NOT RUN` for pixel comparison against
`apps/web/public/design-references/atelier-admin-operations.png`. Static source
review confirms an RTL admin shell, desktop rail, mobile bottom navigation,
product filtering, low-stock/order panels, and labelled operational controls;
the reference-to-render comparison and exact mobile viewport remain unverified.

### Staff-login target

`PRE-EXISTING` static visual variance, with pixel runtime `NOT RUN`, against
`output/design-artifacts/auth-staff-login-atelier.png`:

- The target presents an ivory editorial canvas with a bordered central card;
  `AdminLoginPage` currently uses a full oxblood background and an unbordered
  surface card (`apps/web/src/app.tsx:4346-4352`).
- The target shows the illustrated invalid-email/error treatment and input
  affordances in the supplied error composition; the current source only
  renders the session-expired notice or API error after those states occur and
  has no target-matching leading/trailing field icon treatment
  (`apps/web/src/app.tsx:4358-4418`).
- The target’s button and return link include the illustrated directional
  treatment; the source uses the shared button and text-link composition
  (`apps/web/src/app.tsx:4416-4422`).

This is a QA finding for the parent owner, not a redesign performed in this
pass. The target image is evidence of intended visual composition, not proof
that the current live route renders differently at every pixel.

### Parent follow-up — 2026-09-11

Commit `03ed76f` addressed the source-level composition variance in the
available owner surface. A live CUA capture of `#admin/login` at the harness's
default viewport now shows the ivory canvas, bordered centered card, centered
logo/copy, mail/eye/shield field icons, rectangular full-width CTA and return
link divider aligned with the target's composition. This is a bounded
composition check, not exact `1440x900`/`390x844` evidence: invalid/expired,
loading and API-error renders, keyboard/AT behavior and pixel comparison
remain unverified, and no credentials were entered.

### Parent recheck — 2026-09-11

The local Vite server was inspected through the available CUA browser at its
default viewport (`668 × 958`, device pixel ratio `1`); the harness does not
provide the requested `1440 × 900` or `390 × 844` viewport controls. The
following bounded runtime states were observed without entering credentials:

- `#admin/login` rendered the current ivory, bordered-card composition. An
  empty submit was attempted only to exercise native validation; the browser
  reported `Please fill out this field.` and returned focus to the organization
  email field. No password, OTP, recovery code or API-authenticated request
  was submitted.
- `#admin/catalog` first rendered the staff-session loading state and then
  resolved to `ورود به پنل مدیریت لازم است` with a link back to the admin login
  route. No static catalog/inventory content was exposed without a staff
  session.

This improves the evidence for the default-viewport validation and protected
route safety only. Exact target-size captures, API-error/session-expiry
renders, keyboard focus journeys, assistive-technology output and pixel
comparison remain `NOT RUN` or `BLOCKED`; the CUA screenshot was observed
inline and was not promoted to a pixel-diff artifact.

### Public content route recheck — 2026-09-11

The parent route correction in commit `6b86354` removes the static
`EditorialPage` preview and sends legacy editorial hash aliases through the
published-content owner, `PublicContentSystemPage`. The route-level regression
test confirms that a cached published API response renders and that the old
preview copy is absent.

With the local API and Vite server running, the available CUA browser inspected
`#article` at the same default viewport (`668 × 958`, device pixel ratio `1`).
Because PostgreSQL was unavailable, the route rendered the API error state
`محتوا موقتاً در دسترس نیست`, exposed the retry action, and contained neither
of the removed preview messages. The API liveness probe returned `200`, the
readiness probe returned `503` for the missing database, and the temporary
listeners were stopped after the check.

This is evidence for route ownership and fail-closed behavior only. It does
not prove a published page response, authenticated CMS mutation, crawler
output, exact target viewport, assistive-technology behavior, or pixel parity.

### Admin dashboard safety follow-up — 2026-09-11

Source inspection found that the API and `@nova/api-client` expose no
dashboard, analytics, revenue, or metrics contract. The static `AdminDashboard`
therefore remains a development design preview only: commit `3dd004c` makes
`AdminPage` render it only when `import.meta.env.DEV` is true and no staff
session exists. A staff session now receives the existing non-operational
state, which prevents hardcoded metrics from appearing in an authenticated
panel. The focused app tests pass `4/4`, and the full web/e2e suite passes
`136/136`; no authenticated browser render, exact viewport capture, AT tree,
or pixel comparison was claimed.

## Findings for parent routing

### `QA-001-A11Y-001` — modal focus is not trapped or restored

- **Status:** `FAIL` (source-proven; pre-existing at baseline)
- **Suggested severity:** P1 accessibility
- **Owner surface:** `apps/web/src/shared/site-shell.tsx`
- **Evidence:** `SearchDialog` focuses its input when opened and listens for
  Escape, while `MenuDrawer` listens for Escape; neither implementation traps
  Tab focus within the modal nor returns focus to the opening search/menu
  button on close (`site-shell.tsx:117-133`, `site-shell.tsx:177-206`,
  `site-shell.tsx:300-329`).
- **Impact:** Keyboard users can move focus behind an open dialog/drawer and
  lose their place after dismissal, contrary to the Atelier dialog/sheet
  contract in `docs/designs/atelier-editorial.md`.
- **Browser status:** Not independently exercised because the browser gate is
  blocked.

### `QA-001-A11Y-002` — product quick-add is below the touch-target contract

- **Status:** `FAIL` (source-proven; pre-existing at baseline)
- **Suggested severity:** P1 responsive accessibility
- **Owner surface:** `apps/web/src/styles.css`
- **Evidence:** `.quick-add` is `40px × 40px` at `styles.css:725-736`, then
  becomes `38px × 38px` in the `max-width: 360px` rule at
  `styles.css:3165-3169`; the Atelier contract requires a minimum `44 × 44px`
  pointer target (`docs/designs/atelier-editorial.md`, component contract).
- **Impact:** The primary product-card purchase affordance is undersized at
  mobile widths, especially the required 360px viewport.
- **Browser status:** Not independently exercised because the browser gate is
  blocked.

### `QA-001-A11Y-003` — reduced motion leaves transforms active

- **Status:** `FAIL` (source-proven; pre-existing at baseline)
- **Suggested severity:** P2 accessibility
- **Owner surface:** `apps/web/src/styles.css`
- **Evidence:** Product media scales to `1.025` on hover
  (`styles.css:610-617`) and quick-add translates on hover
  (`styles.css:725-741`). The reduced-motion rule at `styles.css:3178-3186`
  shortens animation/transition duration but does not reset those transforms.
- **Impact:** Users requesting reduced motion can still receive abrupt image
  zoom and control translation instead of the Atelier requirement to remove
  translation/zoom while retaining only meaningful short opacity feedback.
- **Browser status:** Not independently exercised because the browser gate is
  blocked.

### `QA-001-VIS-001` — staff-login implementation is not yet target-matched

- **Status:** `PRE-EXISTING` static variance; pixel runtime `NOT RUN`
- **Suggested severity:** P2 visual fidelity
- **Owner surface:** `apps/web/src/app.tsx` (`AdminLoginPage`)
- **Evidence:** See the staff-login target section above. The source and target
  use the same RTL fields and general hierarchy, but the canvas/card treatment,
  error composition, and field/action affordances differ materially.
- **Impact:** The staff-login route is not visually comparable to the supplied
  Atelier target even though the underlying auth fields and state plumbing are
  present.
- **Browser status:** Exact screenshot comparison is blocked; this finding is
  intentionally limited to source-versus-reference variance.

## Commands and results

```text
git rev-parse HEAD
  465ce070cbdb31e9ab1dbad8c6b2f21bc06d12bb

bun test apps/web/src test/e2e/run.test.ts
  PASS — 132 pass, 0 fail, 31 files

bun run --cwd apps/web typecheck
  PASS — tsc -p tsconfig.json --noEmit

bun run test:integration
  PASS — 8 deterministic suites, 131 underlying tests, 0 failures

bun run test:e2e
  BLOCKED — API liveness/readiness at 127.0.0.1:4000 and storefront root
  shell at 127.0.0.1:5173 were unreachable; this runner explicitly does not
  claim browser or authenticated coverage
```

## Unrequested issues found

None beyond the QA findings and validation limitations listed above. No
production fix was attempted in this audit.

**Final QA-001 result:** deterministic source/test gates `PASS`; responsive
runtime, browser accessibility, exact-width, and pixel-regression gates
`NOT RUN`/`BLOCKED`; four parent-routable findings recorded, three of them
accessibility failures and one target-matching visual variance.
