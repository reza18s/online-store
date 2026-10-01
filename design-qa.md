# NOVA design QA — 2026-10-02

**Status:** Passed. No actionable P0, P1, or P2 visual/action defects remain in the checked routes.

## Scope and result so far

Compared the storefront category routes and the admin catalog with the supplied Atelier Editorial boards, then checked the return-request presentation because its order items have no authoritative media URLs. The storefront and admin were observed at 1440px desktop and 390px phone widths. Shared home links, category cards, product actions, return selection, catalog edit navigation, loading/retry behavior, and responsive overflow are covered by the browser suite.

The women, men, and children category hero headings and calls to action now match their supplied boards. Link targets expose a hand cursor. The admin catalog keeps its desktop table and uses compact image-and-details rows on phones. Return items use a neutral garment icon instead of an unrelated photo selected by row position.

## Findings

| Priority | Finding | Status |
| --- | --- | --- |
| P0 | None found. | — |
| P1 | None found in the checked routes and actions. | — |
| P2 | None found in the checked UI. Remaining image differences come from the live product/order data described below. | — |

## Runtime evidence

- Category desktop and phone screenshots: `test-results/ui-audit/category-reference/`.
- Admin catalog at desktop and phone sizes: `test-results/ui-audit/admin/1440/admin_catalog.png` and `test-results/ui-audit/admin/390/admin_catalog.png`.
- Return request at desktop and phone sizes: `test-results/ui-audit/account/1440/return-request.png` and `test-results/ui-audit/account/390/return-request.png`.
- The local catalog API currently returns HTTP 200. It has 3 women’s, 1 men’s, and 1 children’s product; reference boards show denser grids. The loading error was not reproducible. Controlled API-error tests verify the visible retry and settled error states.

## Data and service boundaries

- Sparse live category grids reflect the catalog’s current five audience products. Browser-only fixtures verify the denser card/table layout without adding business records.
- Customer order responses do not include product image URLs, so order and return items avoid implying an incorrect product identity.
- The customer profile API has no update operation, and there is no newsletter submission endpoint. Those controls remain read-only or explicitly inactive instead of implying a saved change.

## Validation

- Focused category, return, and admin route tests: 16 passed.
- `bun run test:e2e:browser -- --workers=1`: 153 passed, including desktop and phone route sweeps.
- Workspace typecheck and both production builds passed. The admin build required the approved sandbox escalation after an initial `spawn EPERM`; Vite reported existing deprecation/chunk-size advisories on the web build.
- Targeted ESLint passed for the changed implementation and browser-test files.
- The full unit-test command was not rerun for these UI-only changes; the preceding sitewide QA report records its existing Bun alias-resolution and unrelated coupon assertion failures.
