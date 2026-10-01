# Design QA: NOVA homepage at desktop and phone sizes

**Reference:** `docs/designs/atelier-editorial/home.png` and `docs/designs/atelier-editorial/home-mobile.png`
**Implementation:** `apps/web/src/features/catalog/components/home-discovery.tsx`, `apps/web/src/features/catalog/components/home-discovery.reference.css`, and the shared storefront styles
**Evidence:** fresh live captures at `test-results/ui-audit/live/home-desktop.png` (`1395 × 930`) and `test-results/ui-audit/live/home-mobile.png` (`390 × 844`)

## Result

**Visual QA passed for the home page at both tested sizes.** The page stays within the viewport width, the desktop hero keeps its three-part editorial composition, and the phone layout moves to the compact story and two-column product grid. The local API returned six catalog products and the page rendered product names, prices, images, and actions without the product-service error state.

## Reference comparison

- **Hierarchy:** Both sizes lead with the autumn campaign, then category shortcuts and new arrivals. The desktop composition matches the reference's main story, two supporting collections, and featured-product card. On phone, supporting categories and products stack into compact rows.
- **Featured card:** The local catalog has no handbag matching the reference image, so the card uses a real available accessories item (the textured scarf) with its actual title, image, price, and add-to-cart action. If the catalog is empty or unavailable, the card changes to an honest accessories collection link instead of inventing product data.
- **Atelier note:** The botanical line art and note appear beside the editorial story on desktop and as part of the stacked story on phone.
- **Actions:** Hero links and their nested text show pointer feedback. The primary hero action retains white text on rosewood. Product actions remain attached to catalog-backed items. When the service returns an error, a clear service-specific message and retry control remain available.
- **Responsive geometry:** The document width was exactly `1395 px` on desktop and `390 px` on phone. No horizontal page overflow appeared. The persistent bottom navigation follows the design specification and remains available on phone.
- **Type and color:** Persian copy remains RTL and readable at both sizes; the pearl, rosewood, linen, and warm-charcoal palette matches the selected Atelier direction.

The screenshots establish rendered layout and live catalog visibility. The controlled Playwright suite separately verifies pointer styles, the no-product fallback, accessories selection, and retry after a 503 response. It does not establish production API availability or payment/authentication provider behavior.
