# NOVA Sitewide Reference QA

**Date:** 2026-10-01

**Branch:** `codex/category-reference-fidelity`

## Result

The supplied Atelier Editorial references were checked against the running storefront and admin applications. The full Playwright browser suite completed with **153 passed** across desktop, tablet, and phone viewports. It exercised navigation, catalog filters, product actions, cart updates, checkout and payment recovery, customer addresses and returns, editorial disclosures, admin route access, login, and staff operations.

The implementation changes in this pass align the shared storefront header with the reference, update the homepage phone category shortcuts and compact product row, complete the customer order-detail hierarchy, and keep long LTR customer email addresses inside admin summary cards on narrow screens. The search control’s existing accessible name and lazy-loaded images are now represented correctly in the browser checks.

## Reference coverage and captures

| Page family            | Checked routes and states                                                                                                                                        | Runtime captures                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Home and shared shell  | Home, hero/category actions, search and menu dialogs, empty/error/retry states                                                                                   | `test-results/ui-audit/editorial/{1440,768,390}/home.png`; `test-results/ui-audit/sitewide/home/` |
| Categories and catalog | Women, men, children, listings, sale/new/accessory filters, product detail and variants, cart, search                                                            | `test-results/ui-audit/category-final/`; `test-results/ui-audit/catalog/{desktop,mobile}/`        |
| Account and checkout   | Login/OTP, account and profile, orders/detail, address list/create/edit, return request/status, confirmation and payment recovery                                | `test-results/ui-audit/account/{1440,390}/`; `test-results/ui-audit/checkout/`                    |
| Editorial and service  | Campaign, guide, article, lookbook, about, trust, size/shipping/returns/care guides, FAQ, contact, privacy, terms, support, content and system states            | `test-results/ui-audit/editorial/{1440,768,390}/`                                                 |
| Admin                  | Login, dashboard, orders/detail, payments, customers, notifications, audit, catalog/categories/products, inventory, content/SEO/redirects, permission boundaries | `test-results/ui-audit/admin/{1440,390}/`; `test-results/ui-audit/admin-populated/`               |

The component-library boards were compared with the shared storefront and admin controls through those flows: buttons and links, product cards, filters, forms, dialogs, navigation, status chips, tables, empty/error/retry states, and focus behavior. Screen captures in `test-results` are local ignored QA artifacts, not checked-in production assets.

## Changes made

- The storefront desktop header now places the navigation to the right of the centered NOVA wordmark and the account/search/cart actions to its left, matching the supplied boards. Phone header ordering remains responsive.
- The homepage phone shortcut rail now uses accessories, newest, and sale. Its selected-products row uses the compact horizontal card treatment shown in the phone reference; the newest-products row retains its larger card treatment.
- Customer order tracking now presents the status path, ordered items, price summary, delivery address, payment, shipment, and available cancel/return/support actions together. The existing server-backed rules and mutations remain authoritative.
- The account dashboard now shows up to three recent server-backed orders, two saved addresses, and clear links into personal information, order tracking, and support. Its phone welcome card and shortcut row use the reference’s compact hierarchy so the first order stays clear of bottom navigation. Loading, error/retry, and empty states are retained for both data sections.
- The admin order summary renders customer email values left-to-right and wraps them inside the card on phones instead of clipping the value at the viewport edge.
- Browser coverage now loads lazy images before image-health assertions, skips background page images while the search modal makes that page inert, and targets the search button by its existing descriptive accessible name.

## Data and product limitations

- The local catalog API returned six products during the live check, with no homepage product-load alert. The initial load error was not reproducible. Controlled API failure tests confirm the visible retry path settles correctly.
- Current local category data contains fewer products than the reference boards, leaving intentional whitespace in category product grids. No product records were fabricated or inserted.
- Customer order responses do not include product image URLs. Order items therefore use the neutral product icon instead of invented thumbnails until the API exposes an authoritative image.
- The personal-information page remains a read-only account summary because the current customer API does not expose a profile-update operation. The form shown in the design board cannot safely persist changes yet.
- The newsletter has no submission endpoint in the current app; its inactive state remains explicit instead of implying a successful subscription.

## Validation

- `bun run test:e2e:browser -- --workers=1`: **153 passed**.
- Final account-dashboard browser rerun after the phone-layout polish: **2 passed** at desktop and phone capture sizes.
- `bun run typecheck`: **passed** for all workspace packages/apps and browser-test types.
- `bun run --cwd apps/web build`: **passed** (Vite emitted its existing chunk-size advisory).
- `bun run --cwd apps/admin build`: **passed**.
- Targeted ESLint over changed implementation and browser-test files: **passed**.
- `bun run test`: **not green**. It reported 284 passed, 1 skipped, 40 Bun test-runner `@/` alias resolution errors across existing web/admin unit tests, and 1 unrelated coupon assertion failure in the API suite. These modules were not changed in this UI pass; the result is recorded as a remaining repository-level validation gap.

## Git integration

Implementation is on `codex/category-reference-fidelity`. The existing category-reference commit is already on the branch. The new sitewide changes still need a scoped commit and push. The existing pull request’s required check was previously reported failing on the untouched `scripts/script.js`; do not merge while that required check remains red. The local deletion/change state of the `scripts/script.js` / `scripts/script.ts` pair is user-owned and was preserved.
