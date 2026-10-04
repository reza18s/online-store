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


## Earlier FilterSelect component update — 2026-10-04

**Final result: Passed for the FilterSelect scope.**

This records the earlier component-only pass. The broader listing-level refinement below supersedes its mobile default-state and scope findings.

### Reference and runtime evidence

- Reference: the user-provided `filter.png` (1536 × 1024 px), retained in the local checkout and not copied into this branch.
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

## Filter component refinement — 2026-10-04

**Status:** Visual review passed at the reference desktop and phone sizes. The real women’s catalog is sparser than the board, so product names, facet values, imagery, and result totals come from the catalog response.

### Reference and visual comparison

- Reference: the user-provided `filter.png` board (1536 × 1024 px), retained in the local checkout and not copied into this branch.
- Route reviewed: `/products/women` in the worktree preview.
- Desktop: 1536 × 1024. The filter is on the right beside a three-column grid. Category, price, size, and color are open in the first view. List rows are 44 px with 20 px marks; size chips and swatches are 36 px; the pinned apply action is 52 px. After integrating the current header, the bounded rail measured about 379 × 600 px at x=1029, y=274, with its footer at y=774–863. Both price inputs remain fully visible above the pinned footer. Facets scroll within the rail; availability options are collapsed behind their section heading.
- Phone: 390 × 844. The sheet measured exactly 358 × 756 px at x=16, y=44. Its footer occupied y=704–784. Category and price open by default, the remaining facets scroll in one content area, and apply and clear-all stay pinned in the footer.
- The sheet locks background scrolling while open; closing it restores scrolling and returns focus to the mobile filter button. Fresh desktop and mobile captures were inspected live. The earlier FilterSelect-only PNGs above are not evidence for this broader refinement.
- The women’s response contains three products. The denser sample gallery and broader values in the board are not recreated with invented data.

### Interaction review

- Selecting the `خاکی` swatch updated the existing `color` query and reduced the result count from three to one. Its removable chip appeared above the listing; removing it restored all three results.
- Setting the minimum price updated `minPrice`; clear-all in the mobile sheet returned to `/products/women` and restored all three results.
- The desktop toolbar and panel close controls were exercised. Closing the rail returns keyboard focus to the toolbar; reopening restores the three-column grid. The mobile sheet close and Escape paths restore focus to its filter button.
- Loading, empty, disabled, hover, focus, and reduced-motion states remain supported. Loading and disabled states were not forced because the live catalog loaded successfully.

### Findings and validation

No actionable P0, P1, or P2 finding remains. The only visual density difference is expected from the three-item demo response.

- Web package TypeScript check: passed.
- Web client and SSR build: passed with the existing Vite Node API deprecation and chunk-size advisories.
- Targeted ESLint for the changed catalog components: passed.
- Prettier check for the changed TypeScript and filter plan: passed. A whole-file check of `design-qa.md` reports existing table formatting, and the same check fails at the fetched target; those unrelated tables were left unchanged.
- `git diff --check`: passed.
- Automated test suites were not run for this visual refinement.

## Product card design update — 2026-10-04

final result: passed

### Source, runtime, and capture

- Source visual truth: the user-provided `card.png` (1536 × 1024 px), retained in the primary checkout and not copied into this worktree.
- Implementation route: `http://127.0.0.1:5176/products/women` in the worktree preview.
- The desktop capture used a 1536 × 1024 CSS viewport at `deviceScaleFactor: 1`. The first RTL card was 251.5 × 490.17 CSS px; its component screenshot is 252 × 491 px. The full viewport capture is 1536 × 1024 px.
- The mobile capture used a 390 × 844 CSS viewport at `deviceScaleFactor: 1`. The card was 180.5 × 379.31 CSS px; its component screenshot is 181 × 380 px. The full viewport capture is 390 × 844 px.
- The captured card is `رویه لینن روشن`, available, not wishlisted, with its add button enabled. It is shown in the default light theme without hover or focus. Fonts and the product image were loaded before capture.
- No density scaling was applied. The source board is 1536 × 1024 px; the selected annotated card crop is 304 × 540 px. The implementation card is shown at its captured 252 × 491 px size. The viewport sizes match the board dimensions for desktop, but the source is a design board rather than a browser viewport.

### Comparison evidence

- Full component comparison: `product-card-comparison-final.png` (652 × 632 px), saved in the local Codex visualization workspace. It places the source card crop `(84, 100, 304, 540)` beside the rendered card screenshot at native pixels. The source crop includes reference leader lines; those lines are annotations, not card UI.
- Focused body comparison: `product-card-body-comparison-final.png` (652 × 270 px), saved in the same local workspace. It compares the title, detail row, price, swatches, and CTA using source crop `(84, 436, 304, 197)` and implementation crop `(0, 300, 252, 185)`.
- Rendered component captures: desktop `product-card-desktop-final.png`; mobile `product-card-mobile-final.png`. Full-page context captures are `product-list-desktop-final.png` and `product-list-mobile-final.png` in the same local folder. These visual QA captures are local artifacts and are not committed to the repository.

### Fidelity review

- **Typography:** The title renders in loaded Vazirmatn at 13 px, weight 750, and 21.45 px line-height on desktop; the mobile title is 12 px with a 1.6 line-height and a two-line clamp. Letter spacing is normal. The body fallback is Tahoma/sans-serif; Estedad is loaded for the storefront display token. The reference lists IranYekan/Vazirmatn, so the rendered body face matches one of its listed options. No custom font-smoothing rule applies to the card.
- **Spacing and layout:** The media keeps the reference's annotated 4:5 ratio. The rounded image, corner actions, right-aligned title, detail row, separated price and swatches, and full-width CTA follow the reference hierarchy at desktop and mobile widths.
- **Colors and tokens:** The CTA now uses the reference clay `#B98F86` with a darker hover token. The favorite surface and warm card background remain consistent with the storefront. The red tag is retained for the product's `پیشنهاد ویژه` sale state, matching the reference's sale examples.
- **Imagery:** The card uses the catalog's real product photo with a 4:5 crop. Its subject differs from the reference photo because the captured catalog item is a linen top; the image quality and crop treatment remain appropriate.
- **Copy and content:** The displayed product name, category, availability, price, sale tag, and color swatch come from the catalog item. Category and availability occupy the reference's detail-row position without inventing a rating.
- **Responsive structure:** The desktop listing retains its four-column grid and the 390 px viewport retains two columns. The captured card and action remain within the viewport.
- **Interaction state:** The favorite toggle and add-to-cart action were exercised in the local fixture preview before the final style-only adjustments; the handlers and full-card button target remain intact.

### Validation

- `bun run typecheck`: passed.
- `bun run build`: client and SSR builds passed. Vite reported its existing Node API deprecation and large-chunk advisories.
- `bunx prettier --check` on the two changed TSX components: passed.
- `git diff --check`: passed; Git only reported its existing LF-to-CRLF checkout warnings.
- Automated tests were not run for this visual update; the product actions were exercised in the local fixture preview and their handlers were preserved.

### Findings and comparison history

| Priority | Finding | Status |
| --- | --- | --- |
| P0 | None. | — |
| P1 | None. | — |
| P2 | No actionable P2 remains after the final comparison. | Initial CTA color and RTL control ordering differences were corrected and recaptured. |
| P3 | The existing catalog grid renders the desktop card at 251.5 CSS px versus the reference board's 280 px annotation; the compact CTA is 40 px versus the enlarged example's roughly 50 px. | This follows the current four-column listing and matches the compact-card examples. Changing those dimensions would require a parent-grid redesign. |

The first side-by-side review showed a dark-wine CTA and the swatch row and bag icon on the opposite sides from the RTL reference. The card now uses `#B98F86`, places swatches at the physical left, and places the bag icon at the left of the action label. The final desktop and mobile captures confirm those changes.

The existing `docs/refactoring/card-component-design-plan.md` also calls for using real category and availability details where the reference shows ratings. The final card restores that data-backed row and the skeleton placeholder. The catalog card type has no rating or review-count fields, and the listing adapter supplies a single image rather than a gallery. Rating values, carousel dots, and quick-preview controls therefore remain absent; adding them would require a separate data and interaction change.

The source and final implementation were compared together in the saved full-card and focused-body images. No actionable P0/P1/P2 visual differences remain.
