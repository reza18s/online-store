# QA-001 integrated responsive / RTL / accessibility / visual regression audit

**Audit status:** `PARTIAL / BLOCKED`

The repository-backed logic and source audit completed. The original audit did
not have browser interaction, exact viewport, screenshot, pixel-diff, or
assistive-technology evidence because the checkout had no Playwright/browser
dependency and no live API or storefront server. Later parent rechecks added
bounded live runtime evidence: Chrome CDP exact-size captures, route/overflow
checks, the staff-login default and invalid-email states, exact-size session-
expiry/loading/API-error captures, and a no-request validation check without
entering credentials. Full authenticated, provider,
assistive-technology and formal pixel-diff gates remain open. The original
audit routes findings to owners and the later parent fixes are recorded below.

### Current verified status — 2026-09-14

The latest elevated pinned-Chromium Playwright evidence is fixture-backed: the
inventory is `68` tests in `27` files and the one-worker matrix passed `68/68`.
The current live `bun run test:e2e` preflight passed `12/12`; it is limited to
unauthenticated, loopback/local API, dependency-readiness and storefront
root-shell checks. It does not prove real staff password/TOTP/MFA or protected-
route success. Those real-authentication gates are `BLOCKED / NOT RUN`.

Full screen-reader/assistive-technology validation is `BLOCKED / NOT RUN`.
Formal pixel comparison is `BLOCKED / NOT RUN` because the available board is
not composed of exact-size standalone viewport references; resizing or
trimming it would invent geometry. Earlier source, bounded-browser and visual
audit findings remain historical evidence and are not erased by this update.

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
| Web focused tests | `PASS` | The current checkout ran `bun test apps/web/src`: **164 pass, 0 fail** across 33 files, including staff-login validation, safe session-expiry, SSR content-link, admin modal-focus, customer-lookup, and stale payment-recovery-success regressions. |
| Web typecheck | `PASS` | `bun run --cwd apps/web typecheck` exited successfully. |
| Deterministic integration matrix | `PASS` | The parent recheck ran `bun run test:integration`: all 8 deterministic suites passed with no failures. |
| Live API/storefront smoke | `PASS` (`12/12` unauthenticated/local preflight) / `BLOCKED / NOT RUN` (real staff auth and protected-route success) | The current `bun run test:e2e` preflight passed `12/12` against local loopback API/dependency-readiness and storefront root-shell probes. Earlier runtime checks also observed live home/catalog content and the unauthenticated admin guard. No real staff password, TOTP, MFA or protected-route success was exercised. |
| Browser harness | `PASS` (fixture-backed matrix only) / `BLOCKED` (real auth and full AT) | The latest elevated pinned-Chromium Playwright matrix is `68` tests in `27` files and passed `68/68`; its authenticated-looking journeys use synthetic local fixtures. CUA/CDP also supplied bounded route, overflow and state evidence. The matrix does not prove real staff authentication/MFA, protected-route success or screen-reader/AT behavior. |
| Real staff password/TOTP/MFA and protected-route success | `BLOCKED / NOT RUN` | No real credentials or live staff-authentication flow was used. Fixture-backed browser sessions and unauthenticated guards are not evidence of real credential, MFA or protected-route success. |
| Full screen-reader / assistive technology | `BLOCKED / NOT RUN` | Bounded accessibility-tree and keyboard evidence exists for selected states, but no full screen-reader or formal cross-browser AT run is available. |
| Screenshot/pixel regression | `BLOCKED / NOT RUN` | Exact `1440x900` and `390x844` captures were generated and visually inspected for bounded states; formal comparison is blocked because `auth-staff-login-atelier.png` is a presentation board, not exact-size standalone viewport references. |
| Production code changes | `PASS` (bounded follow-up) | The current parent follow-up removes the mobile `.site-nav` display override regression, adds localized field-specific staff-login validation with accessible error associations, and preserves the safe session-expiry route marker after protected-cache clearing. No provider, package/lockfile, generated output or shared contract changed. |

## Required responsive widths

The source contains responsive rules for the requested width family. The
parent's exact CDP matrix verifies page-level layout/overflow bounds; formal
pixel comparison remains a separate gate.

| Width | Static source contract | Runtime / pixel gate |
| ---: | --- | --- |
| `1440` | `PASS` — shell max-width is `1280px`, matching the Atelier primary desktop contract. | `PASS` for bounded route/overflow and staff-login default/invalid-email/session-expiry captures; formal pixel diff `NOT RUN` |
| `1280` | `PASS` — compact desktop uses the same bounded shell and desktop layout rules. | `PASS` for bounded route/overflow; formal pixel diff `NOT RUN` |
| `1024` | `PASS` — source has an explicit `max-width: 1024px` rule for navigation, hero, product detail, admin rail, and page padding. | `PASS` for bounded route/overflow; formal pixel diff `NOT RUN` |
| `768` | `PASS` — source switches to mobile navigation, stacked commerce layouts, mobile bottom navigation, and compact admin layout at `max-width: 768px`. | `PASS` for bounded route/overflow; formal pixel diff `NOT RUN` |
| `390` | `PASS` as a declared target — source has `max-width: 480px` refinements and a `16px` shell gutter. | `PASS` for bounded route/overflow and staff-login default/invalid-email/session-expiry captures; formal pixel diff `NOT RUN` |
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
| Landmarks and labels | `PASS` (source + bounded staff-login browser) | Key route surfaces expose `main`, `header`, `nav`, `footer`, labelled sections/dialogs, labelled icon controls, and form labels. Exact staff-login AX smoke confirmed one `main`, a named form, one heading and all three Persian field names at both target viewports; screen-reader output and whole-route uniqueness remain `NOT RUN`. |
| Heading order | `PASS` (source + bounded staff-login browser) | Reviewed route components provide a page heading and labelled section headings. The exact staff-login AX tree exposed the management heading at both target viewports; whole-route heading-order and screen-reader audit remain `NOT RUN`. |
| Visible focus | `PASS` (static baseline) | Global `:focus-visible` styling covers links, buttons, inputs, selects, and textareas; the shared button uses a visible focus ring. |
| Modal keyboard containment | `CLOSED` (bounded) | Source focus trap/restore is integrated, and the bounded CUA continuation observed search-dialog Tab containment plus Escape/focus restoration. Full AT remains open. See finding `QA-001-A11Y-001`. |
| Touch target minimum | `CLOSED` (source) | `.quick-add` is 44px × 44px at source-level breakpoints; full rendered component geometry remains outside the current state capture. See `QA-001-A11Y-002`. |
| Reduced motion | `CLOSED` (source) | Source neutralizes the identified hover transforms under `prefers-reduced-motion: reduce`; full browser/AT motion verification remains open. See `QA-001-A11Y-003`. |
| Keyboard journeys | `PARTIAL` | Exact staff-login keyboard smoke at `1440x900` and `390x844` reached email → password → factor → submit → return in order, and Shift+Tab from submit returned to factor. A bounded live CUA follow-up also covered the storefront home cycle, search-dialog containment, product option selection, empty cart/payment/account states and the unauthenticated admin guard. The broader storefront/admin tab-order and focus-color journey is not complete. |
| Assistive technology | `PARTIAL` | The exact staff-login AX tree exposed named links, heading, form, button and three textboxes at both target viewports; no screen-reader or formal cross-browser AT run is available. |

## Required state coverage

These statuses distinguish deterministic source/test evidence from the
unavailable rendered-browser gate.

| State | Status | Evidence |
| --- | --- | --- |
| Loading | `PASS` (logic/source) / `PASS` (bounded exact browser) | Catalog, cart, checkout, account, order, content, admin-session, and admin feature paths expose pending/loading states; staff-login loading rendered `در حال بررسی...` with a disabled submit button at exact `1440x900` and `390x844` under a locally intercepted request. |
| Empty | `PASS` (logic/source) / `NOT RUN` (browser) | Empty catalog/cart/account/content/admin branches and safe actions are represented; focused state tests passed. |
| Error | `PASS` (logic/source) / `PASS` (bounded exact browser) | Inline alerts, retry actions, API error mapping, payment failures, and route fallback states are present; the staff-login API-error replay fulfilled a synthetic `503` and rendered the Persian error alert with an enabled submit button at both exact viewports. |
| Offline | `PASS` (logic/source) / `NOT RUN` (browser) | Catalog, content, and admin state helpers classify offline/network failures; tests passed. |
| Validation | `PASS` (logic/source) / `PASS` (staff-login bounded browser state) | Address, return, checkout, staff-auth, content, SEO, redirect, and catalog validation paths are covered by source and focused tests. Exact staff-login invalid-email state rendered a Persian field error, focused the invalid field, preserved the page bounds, and made no login request. |
| Success | `PASS` (logic/source) / `NOT RUN` (browser) | Newsletter, checkout confirmation, mutation success, publish-ready, and saved-state paths exist; no rendered confirmation was captured. |
| Permission denied | `PASS` (logic/source) / `NOT RUN` (browser) | Admin permission-denied page and role matrices are implemented; admin role-boundary tests passed. |
| Session expiry | `PASS` (logic/source) / `PASS` (bounded exact browser) | Staff session failure redirects to the safe `#admin/login?expired=1` marker and supports the expiry message; exact CDP captures at `1440x900` and `390x844` rendered the Persian `role="status"` state with no `/v1/staff/auth` request. Full AT and formal pixel comparison remain open. |
| Stock conflict | `PASS` (logic/source) / `NOT RUN` (browser) | Cart merge conflict and checkout inventory conflict mapping are covered; deterministic checkout/inventory tests passed. |
| Price change | `PASS` (logic/source) / `NOT RUN` (browser) | Checkout failure classification distinguishes `price-change`; deterministic quote/price safety tests passed. |
| Payment pending | `PASS` (logic/source) / `NOT RUN` (browser) | `#checkout/payment-pending` route and recovery copy are present; payment integration tests passed. |
| Payment failed/recovery | `PASS` (logic/source) / `NOT RUN` (browser) | Failed and recovery routes preserve safe retry/continue guidance; focused checkout tests passed. |
| Refund / return | `PASS` (logic/source) / `NOT RUN` (browser) | Customer return states and `REFUNDED` status copy exist; orders/payment refund integration tests passed, but no browser return/refund render was exercised. |

## Historical parent browser follow-up — 2026-09-13

The current parent checkout now has five bounded, fixture-backed authenticated
dashboard sidecars:

- `authenticated-admin-dashboard-qa.pw.ts` covers the typed six-field summary,
  the 30-to-90 day read-only period change and the support-role denial boundary.
- `authenticated-admin-dashboard-layout-qa.pw.ts` covers RTL/page containment
  at exact `1440x900` and `390x844` viewports.
- `authenticated-admin-dashboard-state-qa.pw.ts` covers a synthetic 503,
  actionable retry and redaction of provider/database/stack details.
- `authenticated-admin-dashboard-accessibility-qa.pw.ts` covers the named
  period combobox, keyboard selection, visible focus and reduced-motion CSS.
- `authenticated-admin-dashboard-empty-qa.pw.ts` covers the localized RTL
  null-summary empty state without metrics or preview content.

The eight dashboard tests pass `8/8` through the installed Chrome channel, and
the complete one-worker pinned-Chromium Playwright matrix passes `66/66` under
the approved elevated local process boundary. Browser discovery is `66` tests
in `26` files. These sidecars use synthetic staff/API fixtures, loopback-only
route guards and read-only GET assertions; they improve bounded rendered
evidence but do not close real staff authentication/MFA, screen-reader AT,
formal pixel comparison, provider, storage-upload or production gates.

The 2026-09-14 repository snapshot supersedes only these matrix counts: the
latest elevated pinned-Chromium fixture-backed inventory is `68` tests in `27`
files with `68/68` passed. The historical dashboard findings and their
limitations remain unchanged.

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
composition and the captured invalid-email, session-expiry, loading and
API-error states; formal pixel runtime remains `NOT RUN` against
`output/design-artifacts/auth-staff-login-atelier.png`:

- The 2026-09-11 owner follow-up aligned the ivory editorial canvas, bordered
  central card, centered lockup, Persian hierarchy, field icons, rectangular
  CTA and return-link divider with the adopted target.
- The 2026-09-12 follow-up adds localized field validation. An invalid email
  now renders `لطفاً یک ایمیل معتبر وارد کنید.` in a `role="alert"`, marks the
  field invalid, associates the message with `aria-describedby`, returns focus
  to the field, and prevents a login request.
- Exact default, invalid-email, session-expiry, loading and API-error captures
  at `1440x900` and `390x844` were visually inspected. Loading/error used a
  browser-local synthetic interception only. The supplied artifact also
  depicts other editorial state details; formal pixel comparison and full AT
  remain separate gates.

The target image remains evidence of intended visual composition, not proof
of pixel parity across every state or browser.

The 2026-09-12 formal-registration audit confirmed why the pixel gate remains
open: `output/design-artifacts/auth-staff-login-atelier.png` is a `1536×1024`
RGB presentation board containing framed desktop/mobile panels and editorial
labels, not two standalone viewport exports. The visible panels are
approximately `1096×895` (aspect `1.2246`) and `353×895` (aspect `0.3944`),
which do not match the required `1440×900` (`1.6`) and `390×844` (`0.4621`)
reference ratios. Resizing or trimming them would invent geometry, so no formal
pixel diff is claimed. Obtain standalone exact-size exports or an authoritative
crop manifest before closing `QA-001-VIS-001`.

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
route safety only. API-error/loading renders, keyboard focus journeys,
assistive-technology output and pixel comparison remain `NOT RUN` or
`BLOCKED`; the CUA screenshot was observed inline and was not promoted to a
pixel-diff artifact.

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
inspected and removed after QA. The staff-login captures covered the untouched
default form, invalid-email state and session-expiry state at `1440x900` and
`390x844`. The invalid state rendered the Persian field error, `aria-invalid`,
the linked alert, focus on `staff-email`, no page-level overflow, and no request
to the staff-login API. The expiry state rendered the Persian `role="status"`
message at both viewports, with no `/v1/staff/auth` request; the loading/API-
error replay used only a browser-local synthetic `503` interception. Mobile
`scrollWidth=375` remained within its `390px` viewport. Formal pixel diff,
authenticated flows and assistive-technology output remain open. No real
credentials or provider calls were used.

The follow-up exact-viewport keyboard/AX smoke at `1440x900` and `390x844`
started focus on the branded home link and observed the expected Tab order:
email, password, factor, submit and return link. Shift+Tab from submit returned
to the factor field. The AX tree exposed one `main`, the management heading, a
form, named links, the named submit button and all three Persian field names;
both viewports were RTL and had no horizontal overflow. This is bounded browser
evidence only; screen-reader and full cross-browser AT remain open.

A further default-viewport CUA follow-up found that the seeded
`knit-cardigan` product returned normalized option groups plus legacy `size` /
`color` fields, and the PDP rendered both representations. That duplicated the
color and size controls in the accessibility tree and left the legacy controls
disconnected from structured variant resolution. The product page now derives
its displayed option groups from the variant `optionValueIds` and suppresses
the legacy fallback controls whenever structured options are active. The live
route now exposes one color group and one size group; keyboard activation of
`قهوه‌ای` and `M` reports `موجود` and enables `افزودن به سبد خرید`, while the
page remains within its viewport. The focused catalog test passes `6/6` and
the web typecheck/targeted format checks pass. Full AT and formal pixel
comparison remain separate gates.

The subsequent bounded parallel audits found two additional owner-level admin
issues and one SSR content issue. Commit `e27953f` shares the bounded public
content-block normalizer between the client and SSR so supported site-relative
links are present and escaped in initial HTML. Commit `0915763` traps Tab and
Shift+Tab within the admin order-operation modal while preserving Escape and
focus restoration, and passes the encoded customer lookup query through the
admin route so the intended customer filter is initialized. The focused admin
suite passed `11/11`; the full workspace suite passed `518/518`. These source
fixes do not close the separate authenticated browser, full AT, provider, or
formal pixel gates. The route-wiring regression was then covered by the app
render test (`8/8`), bringing the full workspace suite to `518/518`.

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

- **Status:** `SUPERSEDED` for the bounded exact-size default/invalid-email/session-expiry/loading/API-error composition; formal pixel runtime remains `NOT RUN`
- **Suggested severity:** P2 visual fidelity
- **Owner surface:** `apps/web/src/app.tsx` (`AdminLoginPage`)
- **Evidence:** Commit `03ed76f` aligns the source composition with
  `output/design-artifacts/auth-staff-login-atelier.png`; the 2026-09-12 CDP
  captures at `1440x900` and `390x844` showed the default, invalid-email,
  session-expiry, loading and API-error states, including the Persian
  error/status treatments and field focus. Crop registration, pixel tolerance
  and full AT remain unverified.
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
  PASS — historical parent snapshot: 8 deterministic suites, 131 underlying
  tests, 0 failures; current 2026-09-14 recheck: 8 suites, 146 underlying
  tests, 0 failures

bun run test:e2e
  PASS — 12/12 current unauthenticated/local runtime preflight probes covering
  API/dependency readiness and the storefront root shell on loopback origins;
  this runner does not claim real staff password/TOTP/MFA or protected-route
  success

Latest pinned-Chromium fixture-backed Playwright matrix (2026-09-14)
  PASS — 68/68 with discovery of 68 tests in 27 files under the approved
  elevated local process boundary; synthetic fixtures do not claim real auth,
  full screen-reader/AT or formal pixel comparison
```

## Unrequested issues found

None beyond the QA findings and validation limitations listed above. No
production fix was attempted in this audit.

**Final QA-001 result:** deterministic source/test gates `PASS`; exact-width
layout/overflow evidence for the audited route matrix is now `PASS`, and the
three accessibility findings remain `CLOSED` at source/bounded-runtime scope.
The visual finding is `SUPERSEDED` for the audited default/exact composition,
but the latest evidence still leaves real staff password/TOTP/MFA and
protected-route success `BLOCKED / NOT RUN`, full screen-reader/AT
`BLOCKED / NOT RUN`, and formal pixel comparison `BLOCKED / NOT RUN` because
the available board is not an exact-size standalone reference set.
