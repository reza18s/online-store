# QA-001 integrated responsive / RTL / accessibility / visual regression audit

**Audit status:** `PARTIAL / BLOCKED`

The repository-backed logic and source audit completed. The original audit did
not have browser interaction, exact viewport, screenshot, pixel-diff, or
assistive-technology evidence because the checkout had no Playwright/browser
dependency and no live API or storefront server. Later parent rechecks added
bounded live runtime evidence: Chrome CDP exact-size captures, route/overflow
checks, the staff-login default and invalid-email states, a source-covered safe
session-expiry marker, and a no-request validation check without entering
credentials. Full authenticated, provider,
assistive-technology and formal pixel-diff gates remain open. The original
audit routes findings to owners and the later parent fixes are recorded below.

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
| Web focused tests | `PASS` | The current checkout reran `bun test`: **510 pass, 0 fail** across 105 files, including the staff-login validation and safe session-expiry route regressions. |
| Web typecheck | `PASS` | `bun run --cwd apps/web typecheck` exited successfully. |
| Deterministic integration matrix | `PASS` | The parent recheck ran `bun run test:integration`: all 8 deterministic suites passed with no failures. |
| Live API/storefront smoke | `PASS` (unauthenticated) / `NOT RUN` (authenticated) | The 2026-09-11 continuation ran the API and Vite storefront against isolated PostgreSQL 16/Redis 7: `/health/live` and `/health/ready` returned `200` with `database: "ok"`, public catalog endpoints returned seeded data, the default `test:e2e` root-shell preflight passed, and CUA observed live home/catalog content plus the unauthenticated admin guard. Authenticated data-backed operations remain unrun. |
| Browser harness | `PARTIAL` | CUA supplied default-viewport AX evidence; the parent also used an isolated headless Chrome CDP runner for exact CSS viewports and bounded route/state checks. No full Playwright journey or screen-reader/AT run exists, so this is not authenticated E2E coverage. |
| Screenshot/pixel regression | `PARTIAL` | Exact `1440x900` and `390x844` default/invalid-email captures were generated and visually inspected, then removed after QA. Formal crop registration and pixel-diff tolerance against the composite artifact remain open. |
| Production code changes | `PASS` (bounded follow-up) | The current parent follow-up removes the mobile `.site-nav` display override regression, adds localized field-specific staff-login validation with accessible error associations, and preserves the safe session-expiry route marker after protected-cache clearing. No provider, package/lockfile, generated output or shared contract changed. |

## Required responsive widths

The source contains responsive rules for the requested width family. The
parent's exact CDP matrix verifies page-level layout/overflow bounds; formal
pixel comparison remains a separate gate.

| Width | Static source contract | Runtime / pixel gate |
| ---: | --- | --- |
| `1440` | `PASS` — shell max-width is `1280px`, matching the Atelier primary desktop contract. | `PASS` for bounded route/overflow and staff-login capture; formal pixel diff `NOT RUN` |
| `1280` | `PASS` — compact desktop uses the same bounded shell and desktop layout rules. | `PASS` for bounded route/overflow; formal pixel diff `NOT RUN` |
| `1024` | `PASS` — source has an explicit `max-width: 1024px` rule for navigation, hero, product detail, admin rail, and page padding. | `PASS` for bounded route/overflow; formal pixel diff `NOT RUN` |
| `768` | `PASS` — source switches to mobile navigation, stacked commerce layouts, mobile bottom navigation, and compact admin layout at `max-width: 768px`. | `PASS` for bounded route/overflow; formal pixel diff `NOT RUN` |
| `390` | `PASS` as a declared target — source has `max-width: 480px` refinements and a `16px` shell gutter. | `PASS` for bounded route/overflow and staff-login default/invalid-email capture; formal pixel diff `NOT RUN` |
| `360` | `PASS` as a declared target — source has an explicit `max-width: 360px` refinement. | `PASS` for bounded route/overflow; formal pixel diff `NOT RUN` |

The requested no-horizontal-overflow assertion was executed for the bounded
route matrix and all audited pages stayed within the emulated viewport. The
source still intentionally uses horizontal scrolling for mobile category,
support-card, and subcategory rails; the assertion proves page-level
containment, not a formal pixel or full component-state sign-off.

## RTL, mixed direction, and accessibility gates

| Gate | Status | Evidence / limitation |
| --- | --- | --- |
| Page direction | `PASS` (static) | `apps/web/src/index.html` declares `lang="fa" dir="rtl"`; `App` also sets `dir="rtl"`. |
| Mixed LTR values | `PASS` (static) | Staff email/password/factor fields, newsletter email, phone numbers, order numbers, SKUs, tracking references, payment/coupon-like values, and footer Latin branding use `dir="ltr"` or a dedicated LTR class at the inspected surfaces. |
| Persian customer money | `PASS` (static) | Customer prices use `Intl.NumberFormat('fa-IR')` and append `تومان`; the Atelier contract’s mixed-direction rule is represented in source. |
| Landmarks and labels | `PASS` (source spot-check) | Key route surfaces expose `main`, `header`, `nav`, `footer`, labelled sections/dialogs, labelled icon controls, and form labels. Rendered landmark uniqueness and screen-reader output are `NOT RUN`. |
| Heading order | `PASS` (source spot-check) | Reviewed route components provide a page heading and labelled section headings. Runtime DOM/heading-order audit is `NOT RUN`. |
| Visible focus | `PASS` (static baseline) | Global `:focus-visible` styling covers links, buttons, inputs, selects, and textareas; the shared button uses a visible focus ring. |
| Modal keyboard containment | `CLOSED` (bounded) | Source focus trap/restore is integrated, and the bounded CUA continuation observed search-dialog Tab containment plus Escape/focus restoration. Full AT remains open. See finding `QA-001-A11Y-001`. |
| Touch target minimum | `CLOSED` (source) | `.quick-add` is 44px × 44px at source-level breakpoints; full rendered component geometry remains outside the current state capture. See `QA-001-A11Y-002`. |
| Reduced motion | `CLOSED` (source) | Source neutralizes the identified hover transforms under `prefers-reduced-motion: reduce`; full browser/AT motion verification remains open. See `QA-001-A11Y-003`. |
| Keyboard journeys | `PARTIAL` | Exact staff-login invalid-state submission returned focus to `staff-email`; the broader storefront/admin tab-order and focus-color journey is not complete. |
| Assistive technology | `PARTIAL` | CUA AX trees and semantic labels were observed for bounded routes; no screen-reader or formal cross-browser AT run is available. |

## Required state coverage

These statuses distinguish deterministic source/test evidence from the
unavailable rendered-browser gate.

| State | Status | Evidence |
| --- | --- | --- |
| Loading | `PASS` (logic/source) / `NOT RUN` (browser) | Catalog, cart, checkout, account, order, content, admin-session, and admin feature paths expose pending/loading states; focused tests passed. |
| Empty | `PASS` (logic/source) / `NOT RUN` (browser) | Empty catalog/cart/account/content/admin branches and safe actions are represented; focused state tests passed. |
| Error | `PASS` (logic/source) / `NOT RUN` (browser) | Inline alerts, retry actions, API error mapping, payment failures, and route fallback states are present; focused tests passed. |
| Offline | `PASS` (logic/source) / `NOT RUN` (browser) | Catalog, content, and admin state helpers classify offline/network failures; tests passed. |
| Validation | `PASS` (logic/source) / `PASS` (staff-login bounded browser state) | Address, return, checkout, staff-auth, content, SEO, redirect, and catalog validation paths are covered by source and focused tests. Exact staff-login invalid-email state rendered a Persian field error, focused the invalid field, preserved the page bounds, and made no login request. |
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

The original static variance is `SUPERSEDED` for the bounded current
composition and invalid-email state; formal pixel runtime remains `NOT RUN`
against `output/design-artifacts/auth-staff-login-atelier.png`:

- The 2026-09-11 owner follow-up aligned the ivory editorial canvas, bordered
  central card, centered lockup, Persian hierarchy, field icons, rectangular
  CTA and return-link divider with the adopted target.
- The 2026-09-12 follow-up adds localized field validation. An invalid email
  now renders `لطفاً یک ایمیل معتبر وارد کنید.` in a `role="alert"`, marks the
  field invalid, associates the message with `aria-describedby`, returns focus
  to the field, and prevents a login request.
- Exact default and invalid-email captures at `1440x900` and `390x844` were
  visually inspected. The supplied artifact also depicts session-expired and
  other editorial state details; formal pixel comparison, session-expiry/
  loading/API-error captures and full AT remain separate gates.

The target image remains evidence of intended visual composition, not proof
of pixel parity across every state or browser.

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

### Live runtime continuation — 2026-09-11

After Docker Desktop recovered, the parent started only the new isolated
Compose project `nova-pg-check-now-20260911` on host ports `55433` and `56380`.
Both exact images, `postgres:16-alpine` and `redis:7-alpine`, reported healthy.
All six Prisma migrations applied, `prisma migrate status` reported the schema
up to date, and the idempotent seed produced 9 categories, 6 products, 14
variants, 6 media records and 14 inventory records. API liveness/readiness and
seeded public catalog reads returned 200; the protected staff session endpoint
returned 401 without credentials, as expected.

The default `test:e2e` preflight initially exposed that Vite was listening only
on IPv6 localhost while the runner defaulted to `127.0.0.1`. The bounded config
fix in `apps/web/vite.config.ts` binds Vite to `127.0.0.1`; after restart, the
unmodified default `bun run test:e2e` passed its API, database-readiness and
storefront root-shell checks. CUA then observed the live public home/catalog
content and the unauthenticated `#admin/catalog` login guard on that origin.

The same continuation also ran the worker against the isolated database. The
worker health command connected and executed `SELECT 1`; the long-lived worker
logged an initial empty batch, then a synthetic outbox row was claimed and
recorded as `retried=1` with `notification-delivery-failed` because the
provider sender is intentionally unconfigured. A separate one-shot check used
the real `NotificationService.enqueue` producer and `processNotificationBatch`
consumer with a local no-op sender and observed `PENDING → SENT`, one delivery,
`attempts=1` and a non-null `processedAt`. Each synthetic row was deleted and
verified absent before cleanup. This proves worker connectivity and the
provider-independent outbox state transitions only; it does not prove external
notification delivery.

A bounded CUA continuation additionally observed the staff-login semantic tree
(one heading, three labelled fields, submit and return actions), native empty
form validation with focus returning to `#staff-email`, the basic keyboard tab
order, and search-dialog Tab containment/Escape focus restoration. These are
default-viewport or source-level checks, not full responsive or AT sign-off.

This closes unauthenticated live runtime/root-shell and provider-independent
worker evidence. It does not claim Playwright journeys, authenticated OTP/MFA
flows, external provider delivery, concurrency races, exact target viewports,
full assistive-technology output or pixel comparison.

### Parent recheck — 2026-09-12 exact viewport and route matrix

The parent recheck used Chrome DevTools Protocol emulation rather than the
default CUA viewport. It set CSS viewports to `1440x900`, `1280x900`,
`1024x768`, `768x900`, `390x844`, and `360x768`, then verified that
`document.documentElement.scrollWidth` and `document.body.scrollWidth` never
exceeded the corresponding viewport. A route matrix covering home, category,
listing, filtered listing, product, cart, checkout, payment-pending, account,
account orders, admin login, protected admin catalog, and the editorial alias
returned the expected heading/guard states at `390`, `360`, and `1440` with no
page-level horizontal overflow.

The recheck found and fixed one real responsive regression in
`apps/web/src/shared/site-shell.tsx`: the mobile media rule hid `.site-nav`,
but the same element also carried Tailwind's `flex` display utility, which
overrode the component rule and left the desktop navigation visible at mobile
widths. Removing the redundant utility restored the intended hamburger/bottom
navigation composition. The exact 390px DOM metrics now report
`.site-nav: none`, `.site-header__menu: flex`, and `.mobile-bottom-nav: flex`;
the exact 1440px metrics report the inverse desktop composition.

Temporary exact-viewport captures of home and staff login were visually
inspected and removed after QA. The staff-login captures covered both the
untouched default form and the invalid-email state at `1440x900` and `390x844`.
The invalid state rendered the Persian field error, `aria-invalid`, the linked
alert, focus on `staff-email`, no page-level overflow, and no request to the
staff-login API. The artifact also depicts session-expired/error composition;
formal pixel diff, loading/expiry/API-error captures, authenticated flows and
assistive-technology output remain open. No credentials or provider calls were
used.

## Findings for parent routing

### `QA-001-A11Y-001` — modal focus is not trapped or restored

- **Status:** `CLOSED` for the implemented source and bounded default CUA state; full AT remains `NOT RUN`
- **Suggested severity:** P1 accessibility
- **Owner surface:** `apps/web/src/shared/site-shell.tsx`
- **Evidence:** `useDialogFocus` in `site-shell.tsx:158-198` cycles Tab within
  the active dialog and restores the invoking element on close. The bounded
  CUA continuation observed containment and Escape/focus restoration for the
  live search dialog. Full screen-reader and cross-browser AT behavior remain
  outside the available harness.
- **Impact:** The previously recorded source defect is resolved; exact target
  viewport and formal AT evidence remain separate gates.

### `QA-001-A11Y-002` — product quick-add is below the touch-target contract

- **Status:** `CLOSED` at source level; exact 390px/360px runtime geometry remains `NOT RUN`
- **Suggested severity:** P1 responsive accessibility
- **Owner surface:** `apps/web/src/styles.css`
- **Evidence:** `.quick-add` is `44px × 44px` in `styles.css:725-736`, and
  the mobile override at `styles.css:3165-3169` preserves the same minimum.
  Exact viewport geometry and product-card rendering still require a runner
  with explicit viewport control.
- **Impact:** The previously recorded source defect is resolved; responsive
  overflow and target-size runtime evidence remain open.

### `QA-001-A11Y-003` — reduced motion leaves transforms active

- **Status:** `CLOSED` at source level; reduced-motion runtime emulation remains `NOT RUN`
- **Suggested severity:** P2 accessibility
- **Owner surface:** `apps/web/src/styles.css`
- **Evidence:** The reduced-motion rule at `styles.css:3178-3186` now resets
  product-media and quick-add transforms to `none !important` while preserving
  the broader reduced-motion transition rules.
- **Impact:** The previously recorded source defect is resolved; runtime
  `prefers-reduced-motion` emulation remains outside the available CUA surface.

### `QA-001-VIS-001` — staff-login implementation is not yet target-matched

- **Status:** `SUPERSEDED` for the bounded exact-size default/invalid-email composition; formal pixel runtime remains `NOT RUN`
- **Suggested severity:** P2 visual fidelity
- **Owner surface:** `apps/web/src/app.tsx` (`AdminLoginPage`)
- **Evidence:** Commit `03ed76f` aligns the source composition with
  `output/design-artifacts/auth-staff-login-atelier.png`; the 2026-09-12 CDP
  captures at `1440x900` and `390x844` showed the default and invalid-email
  states, including the Persian error treatment and field focus. Crop
  registration, pixel tolerance, session-expiry/loading/API-error states and
  full AT remain unverified.
- **Impact:** The original static-variance finding no longer describes the
  current source or bounded exact-size render. Authenticated states and formal
  visual parity remain separate release gates.

## Commands and results

```text
git rev-parse HEAD
  465ce070cbdb31e9ab1dbad8c6b2f21bc06d12bb (HEAD during the parent QA recheck; later live-runtime evidence was recorded on 2026-09-11)

bun test apps/web/src test/e2e/run.test.ts
  PASS — 132 pass, 0 fail, 31 files

bun run --cwd apps/web typecheck
  PASS — tsc -p tsconfig.json --noEmit

bun run test:integration
  PASS — 8 deterministic suites, 131 underlying tests, 0 failures

bun run test:e2e
  PASS — default API liveness/readiness and storefront root-shell preflight on
  127.0.0.1:4000 and 127.0.0.1:5173 after the Vite IPv4 bind correction;
  this runner still does not claim browser or authenticated coverage
```

## Unrequested issues found

None beyond the QA findings and validation limitations listed above. No
production fix was attempted in this audit.

**Final QA-001 result:** deterministic source/test gates `PASS`; exact-width
layout/overflow evidence for the audited route matrix is now `PASS`, and the
three accessibility findings remain `CLOSED` at source/bounded-runtime scope.
The visual finding is `SUPERSEDED` for the audited default/exact composition,
but formal pixel comparison, full assistive-technology output, authenticated
state coverage and provider-backed journeys remain `NOT RUN`/`BLOCKED`.
