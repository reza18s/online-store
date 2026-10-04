# NOVA design QA — 2026-10-02

**Status:** Passed for the reviewed visual references and route actions. Live inventory still limits content density and the accessory item shown.

## Final reference follow-up — 2026-10-02

The supplied category boards now match the page composition: the women’s note sits over the full hero photograph, the children’s desktop hero separates copy from image and includes the two reference category cards, and the men’s category rail reads in the correct right-to-left order. Home and category mobile headers now follow their respective boards.

The homepage feature card now selects only a product tagged as an accessory. When the available catalog page contains no accessory, it shows an accessory collection link and a scarf image without a product price or add-to-cart action. Regression checks cover both this fallback and the case where an actual accessory is available.

## Scope and result

Compared the storefront category routes and the admin catalog with the supplied Atelier Editorial boards, then checked the return-request presentation because its order items have no authoritative media URLs. The storefront and admin were observed at 1440px desktop and 390px phone widths. Shared home links, category cards, product actions, return selection, catalog edit navigation, loading/retry behavior, and responsive overflow are covered by the browser suite.

The women, men, and children category hero headings and calls to action match their supplied boards. Link targets expose a hand cursor. The admin catalog keeps its desktop table and uses compact image-and-details rows on phones. Return items use a neutral garment icon instead of an unrelated photo selected by row position.

## Findings

| Priority | Finding | Status |
| --- | --- | --- |
| P0 | None found. | — |
| P1 | None found in the checked routes and actions. | — |
| P2 | Live catalog data is sparser than the reference product grids, and the homepage’s current product response does not contain an accessory. | Data boundary; the UI does not invent products or offer an unrelated item for sale. |

## Runtime evidence

- Category desktop and phone screenshots: `test-results/ui-audit/category-reference/`.
- Home screenshots after the route-specific mobile header fix: `test-results/ui-audit/editorial/1440/home.png` and `test-results/ui-audit/editorial/390/home.png`.
- Admin catalog at desktop and phone sizes: `test-results/ui-audit/admin/1440/admin_catalog.png` and `test-results/ui-audit/admin/390/admin_catalog.png`.
- Return request at desktop and phone sizes: `test-results/ui-audit/account/1440/return-request.png` and `test-results/ui-audit/account/390/return-request.png`.
- The local catalog API currently returns HTTP 200. It has 3 women’s, 1 men’s, and 1 children’s product; reference boards show denser grids. The loading error was not reproducible. Controlled API-error tests verify the visible retry and settled error states.

## Data and service boundaries

- Sparse live category grids reflect the catalog’s current five audience products. Browser-only fixtures verify the denser card/table layout without adding business records.
- Customer order responses do not include product image URLs, so order and return items avoid implying an incorrect product identity.
- The customer profile API has no update operation, and there is no newsletter submission endpoint. Those controls remain read-only or explicitly inactive instead of implying a saved change.

## Validation

- Latest `bun run test:e2e:browser -- --workers=1`: 154 passed, including all storefront, account, admin, desktop, tablet, and phone route sweeps.
- `bun run --cwd apps/web typecheck`: passed.
- `bun run --cwd apps/web build`: passed for client and SSR bundles. Vite emitted its existing Node API deprecation and chunk-size advisories.
- Targeted ESLint passed for the changed implementation and browser-test files.
- The updated PR’s required repository-wide lint checks still fail on 15 existing errors in `scripts/script.js`; this file is outside the UI change and was not modified.
- The full unit-test command was not rerun for these UI-only changes; the preceding sitewide QA report records its existing Bun alias-resolution and unrelated coupon assertion failures.


## FilterSelect component update — 2026-10-04

**Final result: Passed for the FilterSelect scope.**

### Reference and runtime evidence

- Reference: user-provided filter.png, 1536 × 1024, supplied at C:\Users\Asus\Documents\ChatGPT\online store\docs\designs\atelier-editorial\filter.png. The attachment remains in the user’s main checkout and was not copied into this branch.
- Desktop: /products/women, 1536 × 1024 CSS pixels at device scale factor 1. Screenshot: [filter-select-editorial-desktop.png](docs/refactoring/filter-select-editorial-desktop.png).
- Mobile: /products/women, 390 × 844 CSS pixels at device scale factor 1. The centered sheet is 358 × 756 CSS pixels at this viewport. Screenshots: [filter-select-editorial-mobile.png](docs/refactoring/filter-select-editorial-mobile.png) and [filter-select-editorial-mobile-open.png](docs/refactoring/filter-select-editorial-mobile-open.png).
- The screenshots show the desktop category options, compact mobile sheet, and expanded mobile option state.

### Interaction and visual review

- The category disclosure opens on desktop; selecting M updated the existing URL to ?size=M and exposed the selected state.
- The mobile filter button opens the sheet, the category group starts collapsed, expanding a group shows its options in the shared scroll area, and “نمایش نتایج” closes the sheet.
- Pressing Escape and clicking outside close an open desktop facet; Escape returns focus to its trigger.
- The rendered controls use the Atelier ivory surfaces, fine dividers, RTL alignment, square selection marks, and wine accent. Hover, focus, disabled, loading, and reduced-motion styles are included in the component implementation.
- The mobile review first showed a long category list and nested scrolling. The final capture shows the category group collapsed by default on mobile and one scroll container.
- The browser console reported no warnings or errors.

### Findings and scope

| Priority | Finding | Status |
| --- | --- | --- |
| P0 | None. | — |
| P1 | None. | — |
| P2 | The reference board also includes multi-select chips, price range, and facets outside this component’s scalar value/onChange contract. | Kept outside this scoped FilterSelect update; existing query behavior is preserved. |

Loading and disabled states were reviewed in code but were not forced in the live page, where the catalog data loaded successfully.

## Shared header refresh — 2026-10-04

**Final result: Passed for the shared header scope.**

### Reference and runtime review

- Reference: the user-supplied Atelier Editorial header board at `docs/designs/atelier-editorial/header.png` (1536 × 1024).
- Desktop preview: `http://127.0.0.1:5175/`. The header is centered in a rounded shell, with a 68 px primary row and separate 40 px quick-category rail after an 8 px gap. The centered wordmark, right-to-left navigation, action controls, and category rail follow the board’s hierarchy.
- Compact desktop: after scrolling, the quick-category rail is hidden and the sticky header settles to 56 px.
- Mobile: reviewed at a 390 × 844 viewport. The shell uses 16 px side gutters, the main row is 60 px, the quick-category rail is hidden, and menu/search, centered wordmark, favorite, and cart remain visible.
- Mobile search expands inside the header, stays in the page flow, submits to `/products?q=mantou`, and closes with Escape. The existing `/search` route remains reachable from bottom navigation.

### Findings

| Priority | Finding | Status |
| --- | --- | --- |
| P0 | None in the reviewed header states. | — |
| P1 | None in the reviewed header states. | — |
| P2 | Search query `mantou` has no matching catalog items in the current preview. | Existing catalog data; route and empty state render correctly. |

### Validation

- Web TypeScript check: passed.
- Web client and SSR build: passed; Vite emitted its existing Node API deprecation and chunk-size advisories.
- `git diff --check`: passed.
- Desktop, compact desktop, and mobile header states were inspected in the running local preview. This review was limited to the shared header and its search interaction.
