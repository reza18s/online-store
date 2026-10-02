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
