# Women Category Reference Review and Fix Plan

**Date:** 2026-10-02
**Branch:** `codex/category-reference-fidelity`
**Reference:** `docs/designs/atelier-editorial/category-women.png`
**Route:** `/category/women`

## Findings

- The existing page already shares the reference's warm neutral palette, editorial photo treatment, Persian copy, wine-colored call to action, desktop filter sidebar, four-column product grid, two-column phone grid, and fixed phone navigation.
- At phone width, the women hero is 300px tall. The reference hero is about 320px tall, and its copy and button sit toward the lower-left area; the current implementation anchors them at the right edge.
- The current call-to-action uses the lighter wine token. The reference uses a deeper wine tone.
- The open browser showed 3 products while the design board shows 344 and uses different product photography. The project browser fixture showed 9 products. These are catalog-content differences; product records and photos must not be fabricated to make the screen look fuller.
- The desktop reference includes a favorites action in the header, while the shared header currently exposes search, account, and cart. There is no dedicated wishlist route in the app, so a decorative or misleading header action is outside this fix.

## Plan

1. Add a women-only phone breakpoint override for hero height, copy placement, and CTA contrast. Keep the desktop hero and men/children category styles intact.
2. Add a focused browser assertion for the phone hero geometry and CTA placement so the reference layout does not regress.
3. Re-run the category browser checks, web typecheck, and web build; inspect fresh 1440px and 390px screenshots.
4. Confirm search, filtering, favorites, cart actions, route links, and existing catalog data remain unchanged.

## Acceptance Criteria

- At 390px wide, the women hero is approximately 320px high, its text and CTA occupy the left half, and the text remains legible without clipping or horizontal overflow.
- The hero CTA uses the existing deeper wine design token.
- Desktop layout and shared category behavior remain unchanged.
- Existing interactive category controls still pass their browser checks.
- No product data, unsupported wishlist action, or decorative carousel controls are invented.

## Execution Record

- Updated only the phone-width women hero: height is now 320px, its copy and CTA align to the left half, and the CTA uses `--nova-ref-wine-dark`. Desktop, men, children, catalog records, product actions, and shared navigation behavior remain intact.
- Added browser assertions for the phone hero height, CTA color, and left-side placement.
- The open app tab showed the final phone layout after hot reload. Fresh test screenshots were captured at 1440px and 390px in `test-results/ui-audit/category-reference/`; those automated screenshots use the project's browser-only catalog fixture (9 products). The open app tab currently has 3 live products, so its catalog content remains visibly different from the reference board's 344.
- Validation passed: focused category browser tests (2), web typecheck, browser-test typecheck, web client/SSR build, and ESLint on the changed browser test. The build emitted the existing Vite CJS deprecation and bundle-size warnings.

## Second Comparison After User Review

The first pass only improved the phone hero. A full-page comparison found these larger remaining differences:

- The women page shows a breadcrumb row between the header and hero; the reference begins directly with the hero.
- The desktop header puts search and account/cart together on the left and centers the logo. The reference places account/cart at the left, the logo next, a wide search control after it, and navigation at the right. On phones, the reference header spans the full width while the current header floats as a rounded card.
- The hero's supporting phrases are in the wrong roles: the reference has `TIMELESS · ELEGANT · PERSIAN` under the CTA and `A MORE BEAUTIFUL YOU` in the right note.
- The desktop toolbar repeats category, size, color, material, and stock filters already present in the sidebar. The reference keeps the toolbar compact and lets the sidebar own those filters.
- The results heading says `انتخاب‌های محبوب زنانه`; the reference uses the category name, supporting description, and live result count.
- The phone navigation floats above the bottom edge and orders store/search/cart differently from the reference. Keep all current destinations and make only visual/order changes that preserve working actions.
- Product count and product photography remain catalog-data differences: the live API has 9 women products with packshot images, while the board depicts 344 items with different lifestyle photos. Do not invent SKUs, counts, or product imagery.
- The phone hero keeps the copy at the lower left; the reference centers the copy and call to action over the image.

## Second-Pass Plan

1. Recompose the shared category header for desktop and phone to match the reference alignment while preserving search, account, cart, navigation, and keyboard access.
2. Remove the women breadcrumb from the visual layout, correct the hero phrase hierarchy, and retain its existing real image and destinations.
3. Simplify the women toolbar to sort plus a functional filter affordance; keep the full filters available in the sidebar and phone filter sheet.
4. Update the women results heading to show the actual category name, supporting copy, and API-provided count; tune the phone bottom navigation frame without removing its existing actions.
5. Center the women phone hero copy and CTA to match the reference composition while retaining the real hero asset and current routes.
6. Extend browser checks for desktop and phone alignment, control visibility, result copy/count, and overflow. Inspect fresh screenshots and rerun typecheck/build.

## Second-Pass Execution Record — 2026-10-02

- Reordered the shared category header so utility actions, brand, search, and navigation follow the reference; the phone header now spans the viewport and keeps its logo centered.
- Removed the women breadcrumb, corrected the desktop editorial phrases, centered the phone hero copy and CTA, compacted desktop filtering, and added the category name, description, and API-backed product count above results.
- Reordered the category phone navigation without removing existing destinations. Search, menu, filters, sort, pagination, product favorites, and add-to-cart behavior remain covered by browser checks.
- Reviewed fresh desktop and phone screenshots in `test-results/ui-audit/category-reference/`. The browser fixture uses 9 products; live catalog volume and product photography remain data differences from the reference board and were not fabricated.
- Validation passed: focused Playwright suite (2 tests across women, men, and children routes), web typecheck, browser-test typecheck, changed-source ESLint, Prettier check, `git diff --check`, and web client/SSR build. Build reports the existing Vite CJS deprecation and 550 kB client chunk warning.

## Second-Pass Acceptance

- The header and first viewport follow the reference's structure at desktop and phone widths.
- The women hero uses the reference's distinct supporting phrases in the correct positions.
- Desktop filtering is not duplicated across the toolbar and sidebar; the filter affordance still reaches usable controls.
- The results area carries the reference hierarchy and an accurate live count.
- Search, route navigation, filters, favorites, and cart actions remain usable; there is no horizontal overflow.
- Product records and images remain sourced from the real catalog.
