# NOVA UI style and action audit

Audit started 2026-09-30; final verification 2026-10-01. Scope: storefront and standalone admin route families, shared controls, Persian RTL, responsive layouts, and material user actions. The saved execution plan is [docs/ui-action-audit-plan.md](docs/ui-action-audit-plan.md).

## Evidence and boundaries

Reviewed the Atelier Editorial design document and available desktop/phone page references. Applied its approved Soft Modern pearl, rosewood, linen, control-size, and readable UI text tokens. The document's referenced `atelier-editorial-homepage-soft-modern.png` is absent, so visual comparison uses the available `atelier-editorial/home.png` and `home-mobile.png` plus the written tokens.

Screenshots come from Chromium running the actual local storefront (`127.0.0.1:5173`) and admin (`127.0.0.1:5174`) applications. Browser fixtures intercept API requests and keep test mutations inside the browser. They demonstrate rendering, UI state transitions, validation, and request contracts; they do not demonstrate real authentication delivery, database persistence, inventory reservation, refunds, or payment-provider acceptance.

Structural discovery used the current codebase graph with source confirmation. Material UI scopes had no recorded parse gaps; metadata freshness warnings were handled by reading current source. Graph coverage is a best-effort signal, not proof that every possible state exists in the graph.

## Fixed findings

| Priority | Reproduced problem | Result |
| --- | --- | --- |
| P1 | Privacy disclosures looked actionable but did not expand. | Native keyboard-operable disclosure sections now render the published policy blocks. |
| P1 | Editorial layouts dropped published body/heading/link blocks and showed invented product prices or policy details. | Supported published blocks remain visible; editorial product rails use actual catalog item names, prices, images, and destinations. |
| P1 | Admin navigation exposed unsupported marketing/settings/promotions destinations; header controls were inert. | Navigation uses supported route families; catalog search submits a query; notifications link to their permitted view; decorative controls are removed. |
| P1 | Direct admin inventory detail read the wrong URL segment; its mobile panel was also hidden. | Direct routes select the requested variant, and the detail/action panel is visible at both tested widths. |
| P1 | An unauthorized staff-session query was removed while its observer remained active, causing repeated session requests. | Clear protected data while retaining the failed current-session query; the customer-to-staff boundary now settles with one request. |
| P2 | Mobile admin inventory/order layouts expanded the document beyond the viewport. | Shared containers and local table scroll boundaries keep the document within the phone viewport. |
| P2 | Header icons were squeezed by primary-button padding and cart targets were below 44px. | Explicit icon/ghost variants and 44px header targets restore clear, operable controls. |
| P2 | Both desktop and mobile home layouts appeared at the tablet breakpoint; phone category rail overflowed. | Scoped breakpoint/grid rules show one home layout and contain the category rail. |
| P2 | Catalog product badge intercepted wishlist clicks; product detail wishlist state lacked truthful labels. | Decorative badges ignore pointer events; wishlist labels and pressed state reflect the current selection. |
| P2 | `/search?q=...` left the search dialog closed. | Search deep links open the dialog with their query and submit to the filtered catalog. |
| P2 | Mobile cart checkout summary controls overlapped content. | A dedicated summary action container separates totals and checkout navigation. |
| P2 | Desktop address content was compressed into the sidebar-sized column. | Address content gets the wide column with the customer navigation on the right. |
| P2 | Address cards exposed an inert menu; empty addresses repeated the same CTA; returns lacked cancellation navigation. | Removed misleading/repeated controls and added the return cancellation link. |
| P2 | Checkout radios inherited text-input minimum height and padding. | Text-field rules exclude radios/checkboxes; checked radios retain compact geometry and their label-sized target. |
| P2 | About-page image banner text inherited a dark link color. | Scoped banner color keeps its copy readable on the dark overlay. |
| P2 | Important storefront labels/helper text used 8–11px sizes. | The harmonization styles use at least 12px for these UI labels and 14px for text inputs. |
| P2 | Home social links led to unsupported internal routes; unavailable products exposed quick-add; shipping copy asserted an unsupported threshold. | Removed unconfigured social destinations, disabled unavailable quick-add, and tied shipping copy to checkout's authoritative quote. |
| P2 | Overlapping mobile CSS clipped the home hero copy and made the story CTA text match its background. | Scoped reference rules reset inherited positioning and preserve readable CTA colors; browser assertions check hero-copy containment. |
| P2 | Home's featured card could show a non-accessory product, and the home error did not identify the unavailable service. | Prefer a real accessories item for the featured card, keep an honest collection card when no product is available, and explain the product-service failure with a working retry. The hero links have explicit pointer feedback, and the atelier note now includes its botanical illustration. |
| P2 | Newsletter signup collected an email before revealing it had no service. | Disabled the unavailable controls and displayed the availability message before interaction. |
| P2 | Return progress connectors overflowed the phone viewport, the submit button overlapped bottom navigation, and an attachment area had no upload implementation. | Contained the connectors, positioned a readable 44px submit control above navigation, and removed the inert attachment prompt. |
| P2 | Dashboard styling discarded the successful-refund total from the existing summary contract. | Render all summary metrics, including the authoritative refund total. |

## Route and action coverage

| Family | Routes/states reviewed | Important actions exercised | Screenshot location |
| --- | --- | --- | --- |
| Shared shell/home | `/`; desktop, 1024, 768, 390, 360; reduced motion | Header/menu/search opening, focus trap, Escape/focus return, landmarks, cart size, contrast | `test-results/ui-audit/editorial/{1440,768,390}/home.png` |
| Catalog/search | Products/all/new/sale/accessories, women category, product detail, queried search | Sorting, filters/reset, wishlist, variant selection, unavailable stock, add success/error/pending protection, search submit | `test-results/ui-audit/catalog/{desktop,mobile}` |
| Cart | Populated and empty | Quantity increase/decrease, remove, checkout destination, coupon-stage guidance | `test-results/ui-audit/catalog/{desktop,mobile}/cart.png` |
| Customer sign-in | Request, verification, absent challenge, invalid OTP | Required-field validation, synthetic request/resend/verify, safe error recovery | `test-results/ui-audit/auth` |
| Checkout | Address, shipping, payment, confirmation, local-payment error, pending/failed/timeout/malformed recovery | Address selection, shipping quote changes, order submit, recovery/track links, disabled/missing-order states | `test-results/ui-audit/checkout` |
| Editorial | Campaign, guide, article, lookbook, About, trust, size/shipping/returns/care, FAQ, contact, privacy, terms, support, generic CMS page | Published block/link preservation, policy disclosures, anchored CTAs, true catalog destinations | `test-results/ui-audit/editorial/{1440,768,390}` |
| System | Offline, error, maintenance, missing route | Settled states and recovery destinations | `test-results/ui-audit/editorial/{1440,768,390}` |
| Customer account | Dashboard/profile/orders/order detail, address list/create/edit, return request/status, anonymous/empty/ineligible states | Address validation/save/default/delete confirmation, return validation/submit/cancel, order journey and logout | `test-results/ui-audit/account` and customer fixture suites |
| Admin | Dashboard, catalog/categories/new/detail, inventory/detail, orders/detail, payments, customers, notifications, audit, content/page editor, SEO, redirects, staff login/permissions/loading/errors | Role boundaries, dashboard period/retry, supported navigation/search, table/detail selection, editor controls | `test-results/ui-audit/admin/{1440,390}` and `test-results/ui-audit/admin-populated` |

The 17-route admin sweep includes populated catalog/category/product/inventory/content editors and settled empty support/SEO lists. A separate populated operational scenario captures actual synthetic rows and detail panels for orders, payments, customers, notifications, audit, content, SEO, and redirects. An earlier 503-only sweep was rejected as insufficient populated-page evidence.

## Verification

Final verification on 2026-10-01:

- Complete Playwright suite: **149 passed, 0 failed**. This includes both inventory deep-link widths, staff/customer boundaries, dashboard totals/period/retry, account journeys, catalog/cart, authentication, checkout, editorial disclosures, responsive geometry, focus, and reduced motion.
- After removing the inert return attachment prompt, the affected address/return browser suite passed **7/7** again.
- Storefront source tests: **117 passed**; admin source tests: **81 passed**, including preservation of the failed staff-query identity with stale protected data erased.
- Web, admin, and browser-test TypeScript checks passed. ESLint passed for both frontend source trees and browser tests.
- Storefront client+SSR and standalone admin production builds passed. The storefront build was repeated after the final return-form cleanup.
- Diff whitespace checks passed with Windows CRLF recognized. The final changed-file review preserved the pre-existing working-tree changes.
- Follow-up for the six home-page comments: the focused public-discovery Playwright suite passed **5/5**, including the accessories-card selection, pointer feedback, honest no-product state, and a 503-to-retry recovery. The catalog query-state source tests passed **10/10**; web typecheck and client+SSR builds passed again after the follow-up.
- Fresh live captures at `1395 × 930` and `390 × 844` were inspected. Both fit the viewport width, show the real catalog content, and have no product-service error. The desktop feature card now shows the available accessories item (`textured-scarf`); the atelier botanical mark and CTA are visible.
- The local API readiness endpoint returned 200 with database status `ok`; the Vite-proxied catalog response returned 4 of 6 products, and the rendered page showed those products.

The initial root-level Bun source-test command did not resolve app-local `@/*` aliases; rerunning from each app's directory passed. A browser run made during ongoing edits was discarded as a final gate; the successful complete run followed source stabilization. These failed attempts are not included as successful verification.

Full-page screenshots are retained under `test-results/ui-audit/`. Fresh live home captures are `test-results/ui-audit/live/home-desktop.png` and `test-results/ui-audit/live/home-mobile.png`. Catalog/account/admin screenshots use synthetic populated fixtures; the current live home captures use the local database-backed API. The 503 recovery state is verified separately with a controlled browser fixture.

`/account/wishlist` is not a supported account feature; wishlist interaction belongs to the catalog's client state. No new account route or persistence contract was invented. The project memo records stylesheet ownership, the overlapping mobile CSS constraint, fixture evidence limits, and source-test command context.

## Unrequested issues found

- Existing build/tooling warnings: Vite's CommonJS Node API is deprecated and the storefront JavaScript chunk is approximately 531 kB. Builds succeed, but a separate tooling/performance task can address these warnings.

## Remaining runtime limits

The earlier API process on port 4000 was not ready and could not serve the catalog. It has been replaced by a local process with database readiness verified; live catalog reads now work. This confirms only the local database-backed read path. Authentication delivery, cart persistence, inventory reservation, refunds, and payment-provider acceptance still require their own runtime checks.

The existing working tree already contained a broad design implementation, asset/reference changes, and unrelated script edits. Those changes were preserved. This audit does not claim authorship of the entire working-tree diff.
