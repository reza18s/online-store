# QA-001 integrated responsive / RTL / accessibility / visual regression audit

**Audit status:** `PARTIAL / BLOCKED`

The repository-backed logic and source audit completed. Browser interaction,
exact viewport, screenshot, pixel-diff, and assistive-technology gates were not
completed because this checkout has no Playwright/browser dependency and no live
API or storefront server was running. The report intentionally routes findings
to owners; it does not modify storefront production code.

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
- Existing focused tests were inspected and run. The stale remaining-work
  ledger was not used as evidence and was not edited.
- Pre-existing worktree state preserved: untracked
  `.worktrees/web-004-checkout-recovery/` was not opened, changed, or removed.
- At final inspection, unrelated concurrent changes were present in
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
| Requested baseline | `PASS` | `git rev-parse HEAD` matched `465ce07`; branch was `codex/integration`. |
| Route integration ownership | `PASS` | `RouteView` dispatches the integrated public, auth, commerce, account, content, admin, and fallback route kinds; `hash-route.test.ts` passed. |
| Web focused tests | `PASS` | `bun test apps/web/src test/e2e/run.test.ts`: **132 pass, 0 fail** across 31 files. |
| Web typecheck | `PASS` | `bun run --cwd apps/web typecheck` exited successfully. |
| Deterministic integration matrix | `PASS` | `bun run test:integration`: all 8 suites passed, **131 underlying tests**, with no failures. |
| Live API/storefront smoke | `BLOCKED` | `bun run test:e2e` could not reach `127.0.0.1:4000` or `127.0.0.1:5173`; API liveness, API readiness/database, and storefront root shell were unreachable. |
| Browser harness | `NOT RUN` | No Playwright/Puppeteer/Cypress dependency or executable exists in the checkout. `test/e2e/README.md` explicitly states browser journeys are deferred and must not be represented as passing coverage. |
| Screenshot/pixel regression | `NOT RUN` | No live render, exact viewport capture, or pixel diff was possible. No browser was installed and no screenshot artifact was generated. |
| Production code changes | `PASS` | No `apps/web/src` production file, `app.tsx`, provider, package/lockfile, generated output, remaining-work ledger, or project memo was changed by this audit. |

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
