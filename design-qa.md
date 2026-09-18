# NOVA admin dashboard visual QA

## Reference

- Source visual truth: `C:\Users\Asus\Downloads\13ad5a5f-71be-4f67-8be1-06ad9fe4aded.png`
- Source format: supplied composite reference showing the desktop dashboard and a phone layout.
- Source dimensions: 1536 × 1024 px.
- Implemented state: `#admin` in the local web preview.

## Implementation captures

- Preview URL: `http://127.0.0.1:5175/#admin`
- Desktop verification: Codex in-app browser at 1280 × 720 CSS px.
- Narrow verification: Codex in-app browser at 764 × 958 CSS px.
- The available in-app browser did not expose a way to force an exact 390 px viewport, so the narrow comparison validates responsive structure and overflow behavior at the available narrow width rather than claiming pixel-perfect phone dimensions.

## Comparison checklist

- [x] Light editorial admin shell with white content surfaces and a soft gray page background.
- [x] Left desktop navigation rail with NOVA wordmark, descriptor, burgundy active dashboard item, grouped navigation, profile, and logout.
- [x] Desktop utility bar with search, notification, account/date context, and theme action.
- [x] Responsive mobile utility bar with menu, centered NOVA mark, and notification action.
- [x] RTL Persian welcome heading and supporting copy.
- [x] Four KPI cards with the reference ordering, icon treatment, values, and green trend chips.
- [x] Sales/revenue chart with a burgundy primary series and muted comparison series.
- [x] Order-status donut with the reference legend and total order count on desktop.
- [x] Latest-orders table, new-customers list, popular-products list, and campaign banner on desktop.
- [x] Mobile 2 × 2 KPI layout, sales chart, latest-orders list, and fixed bottom navigation.
- [x] Desktop and narrow layouts show no horizontal overflow in the verified captures.
- [x] Dashboard navigation reaches `#admin/products` and displays the products heading before returning to `#admin`.

## Findings

No actionable P0, P1, or P2 visual issues remain in the verified dashboard state.

Expected fidelity limitations are intentionally retained:

- The supplied composite uses specific avatar photography, product photography, and a campaign image that are not available as exact project assets. The implementation uses existing local NOVA assets and does not generate replacement images, following the project instruction to request page imagery from the user rather than inventing it.
- The exact source phone viewport could not be reproduced in the available in-app browser. The responsive layout was still checked at the available narrow viewport, including header order, card stacking, chart visibility, bottom navigation, and overflow.
- The screenshot-faithful work is scoped to the `#admin` dashboard state. Other admin routes continue to use the existing static preview until their own page references are supplied.

## Interaction and runtime checks

- Browser console error check: no errors reported in the verified dashboard session.
- Dashboard-to-products navigation: passed.
- Desktop responsive shell check: passed.
- Narrow responsive shell check: passed.

## Follow-up polish

If exact page-level screenshots for the remaining admin routes are supplied, use them as the next visual truth and apply the same inspect → implement → compare workflow. Do not create substitute reference images without the user's direction.

final result: passed

---

# NOVA admin products visual QA

## Source and implementation

- Source visual truth: `C:\Users\Asus\Documents\ChatGPT\online store\apps\web\public\design-references\atelier-admin-operations.png`
- Source dimensions: `1568 × 1003 px`.
- Implementation: `http://localhost:5173/#admin/products`.
- Implementation capture: Codex In-app Browser inline capture, rendered at approximately `1265 × 768 px`; the browser did not expose the CSS viewport or a persistent screenshot path.
- State: default products route, light theme, no filters applied, desktop shell.

## Comparison evidence

- Full view: the source and the live route were both opened and inspected. The implementation now uses the source composition: right-side oxblood navigation, a light operations canvas, a filter toolbar, a wide product table, and low-stock/orders queues.
- Focused regions: the navigation rail, toolbar, product table, low-stock card, and order card were inspected in the live capture. A browser-composed side-by-side comparison was attempted, but the in-app browser rejected the temporary comparison URL under its security policy. No substitute browser or indirect capture was used.
- Mobile: responsive rules were inspected in source and a narrow CUA runtime capture was observed at `879 × 942` image pixels. The browser did not expose the CSS viewport metadata or a controllable target width, so an exact 390 px rendered capture remains unverified.

## Comparison history

1. Initial render: P2 layout mismatch — the navigation rail was on the left and the product table received the narrow grid track. Fix: changed the operations shell to the RTL reference order and assigned the table the larger grid track.
2. Post-fix render: the rail is on the right, the table is the larger left region, and all desktop table columns fit in the live capture. The separate visual inspection found no remaining P0/P1/P2 issue in the captured desktop state.

## Interaction checks

- Search interaction: passed; entering `شال` narrowed the table to the matching product and updated the result count.
- Low-stock quick filter: passed; the status selector changed to `موجودی کم`, the active state was visible, and the table narrowed to two rows.
- Row action menu: passed; the menu exposed working edit and storefront links.
- Console errors: not available through the selected CUA surface.

## Findings

- [P2] Comparison artifact unavailable. Location: visual QA workflow. Evidence: the browser security policy blocked the temporary same-input comparison page, and the selected browser’s screenshot API returned inline bytes without a persistent path. Impact: the required normalized side-by-side evidence cannot be archived. Fix: rerun the QA comparison in a permitted visual-capture surface before calling this page visually passed.
- [P2] Exact mobile viewport unverified. Location: responsive products route. Evidence: a narrow CUA runtime capture was observed at `879 × 942` image pixels, but the selected browser did not expose CSS viewport metadata or viewport resizing, so equivalence to the 390 px source state cannot be established. Impact: mobile fidelity is supported by the responsive implementation and a narrow runtime inspection, but not proven by a same-size capture. Fix: capture the route at the target mobile viewport in the user-selected browser when that control is available.

## Implementation checklist

- [x] Existing NOVA tokens, Tailwind utilities, RTL labels, and local product assets reused.
- [x] Desktop navigation, toolbar, product table, low-stock queue, and orders queue implemented.
- [x] Mobile product cards and fixed admin bottom navigation implemented.
- [x] Search, status/category filtering, quick filter, row menus, and edit links implemented.
- [x] TypeScript and formatter checks passed.
- [ ] Persisted normalized side-by-side source/implementation comparison.
- [ ] Exact 390 px mobile runtime capture.

final result: blocked

---

# NOVA lookbook homepage visual QA

## Source and implementation

- Source visual truth: `C:\Users\Asus\Documents\ChatGPT\online store\docs\designs\atelier-editorial\lookbook.png`.
- Source pixels: `1490 × 1090`; the board contains both a desktop composition and a framed mobile composition.
- Implementation URL: `http://127.0.0.1:5173/#home`.
- Browser-rendered implementation evidence: Codex in-app Browser inline captures at `1280 × 720` CSS px desktop (`1265 × 1622` document, device scale factor unavailable) and `390 × 844` CSS px mobile (`375 × 1593` document, device scale factor unavailable).
- Implementation screenshot path: unavailable. The selected browser returned inline screenshot bytes only, and its security policy rejected the attempted local persistence page; no alternate browser or indirect capture was used.
- State: development fixtures, light theme, RTL, seeded cart count `3`, homepage at initial scroll position.

## Full-view and focused comparison evidence

- Full view: the supplied board and the live desktop/mobile homepage were opened and visually inspected. The implementation follows the source hierarchy: centered editorial navigation, wide photographic lookbook hero, four compact style stories, a three-part manifesto band, a six-item shop-the-look strip, and mobile fixed navigation.
- Focused hero: typography, oxblood CTA, warm neutral palette, dark photographic treatment, and left/right editorial notes were checked against the source. The project-owned hero intentionally preserves its existing model and architecture scene rather than copying the reference person.
- Focused story grid: desktop uses four equal split-image cards; mobile exposes compact image-first cards in a horizontal rail, matching the source's denser mobile treatment.
- Focused manifesto and product strip: desktop preserves the source's image/copy/image rhythm and compact product density; mobile collapses the manifesto over photography and keeps products horizontally scrollable.
- A persisted same-input source/implementation composite could not be created because the in-app browser blocked the temporary local comparison page. The two artifacts were inspected separately; this report does not claim pixel-certified side-by-side evidence.

## Required fidelity surfaces

- Fonts and typography: existing NOVA Persian/display families and Georgia wordmark were preserved; hierarchy and wraps match the reference closely at both verified widths.
- Spacing and layout rhythm: hero, story cards, manifesto, and product strip use the compact vertical density and rounded editorial frames visible in the source. No horizontal document overflow was observed at `390 × 844` or `1280 × 720`.
- Colors and tokens: existing warm background, oxblood primary, cream surface, muted ink, borders, and flat translucent image veils were reused.
- Image quality and assets: all visible photography comes from existing project-owned NOVA raster assets; no placeholder art, CSS drawings, or handcrafted SVG imagery was introduced.
- Copy and content: the Persian lookbook headline, editorial story labels, manifesto copy, and shop-the-look messaging follow the source intent while using project catalog data for products and prices.

## Comparison history

1. Initial implementation capture: no visible P0/P1/P2 layout defect was found in the separately inspected desktop and mobile renders. Mobile initially showed the expected three-card rail and fixed navigation without document overflow; desktop showed the reference-like full hero and four-card row.
2. Interaction verification: wishlist toggle changed to the selected state and was reverted; the primary lookbook CTA navigated to `#campaign` and returned to `#home`; both desktop and mobile console checks returned no warnings or errors.

## Findings

- [P2] Persisted normalized comparison artifact unavailable. Location: visual QA evidence. Evidence: source and implementation captures are visible in the session, but the selected browser denied the temporary local persistence/comparison page and exposes no screenshot path. Impact: the implementation is visually verified in-browser but cannot satisfy the workflow's archived same-input comparison requirement. Fix: repeat only the final composite comparison in a permitted capture surface.

## Implementation checklist

- [x] Desktop hero, story grid, manifesto band, and product strip implemented.
- [x] Mobile hero, horizontal content rails, compact manifesto, and fixed navigation verified.
- [x] Wishlist state and primary CTA tested.
- [x] Desktop and mobile console checks passed with no warnings or errors.
- [x] Web typecheck and focused tests passed.
- [ ] Persisted same-input source/implementation comparison.

final result: blocked

---

# Development fixture and imagery QA

## Scope

- Added development-only storefront fixtures in `apps/web/src/shared/dev-store-fixtures.ts`.
- Added generated hero asset `apps/web/public/assets/nova-hero-editorial-v2.png`.

## Verification

- [x] Home renders the generated editorial hero and six seeded product cards.
- [x] Product listing renders six local products with prices, sale labels, images, and add-to-cart controls.
- [x] Product detail renders a seeded product, variants, related products, and interactive add-to-cart feedback.
- [x] Editorial article renders seeded title/body/blocks and the generated hero image.
- [x] Cart renders seeded lines, quantities, subtotal, recommendations, and the updated item count after a local add-to-cart action.
- [x] Focused fixture/catalog/cart/content tests passed: 37/37.
- [x] Web typecheck passed after fixture integration.

## Limitations

- Fixtures are intentionally development-only; production builds remain API-backed.
- Customer account, checkout submission, staff admin, and live CMS persistence remain protected by their real auth/API boundaries and were not replaced with fabricated sessions or orders.
- The local API/Docker runtime remains unavailable, so server-backed behavior still requires the documented local stack.

final result: passed for the development-only public storefront fixture scope

---

# Atelier Editorial reference integration QA

## Scope

- Renamed reference set: `docs/designs/atelier-editorial/` (43 descriptive PNG filenames).
- Shared UI updates: admin login composition, public content hero asset mapping, account navigation promo, and authenticated admin shell styling.
- Runtime preview: `http://127.0.0.1:5173/` in the Codex in-app browser.

## Verification

- [x] Mobile `#admin/login` renders the editorial image panel, branded form, security note, and return link without overflow.
- [x] Mobile `#home` preserves the storefront header, hero imagery, navigation, and existing loading states.
- [x] Mobile `#admin` renders the development dashboard, KPI grid, chart, and fixed admin navigation.
- [x] `#content/article` reaches the controlled loading state while the local API is unavailable; the published hero mapping remains isolated to the published-content component.
- [x] Web typecheck passed.
- [x] Focused storefront/account/content/checkout tests passed: 55/55.
- [x] Production client and SSR build passed with only the existing Vite CJS deprecation and bundle-size warnings.
- [x] Route sweep completed for home, category, listing, product, cart, checkout, account, content, admin, and admin login with no browser console errors.
- [x] Full 43-reference route mapping completed with zero browser console errors, including account address states, returns, editorial utilities, admin detail paths, and order detail.
- [x] Full 43-reference route mapping completed with zero browser console errors, including account address states, returns, editorial utilities, admin detail paths, and order detail.

## Limitations

- The local API was not running during this capture, so published CMS content and authenticated account data could not be rendered from live responses. Direct checks confirmed port `4000` refused connections and the Vite proxy returned HTTP 500 for catalog/content requests.
- Docker Desktop was started, but its Linux engine remained unavailable: `docker version` could not open `dockerDesktopLinuxEngine`. The documented PostgreSQL/Redis/MinIO stack therefore could not be started in this session.
- The selected browser exposed a narrow viewport but not an exact desktop/mobile viewport control or persistent screenshot path; visual checks are structural rather than pixel-certified.
- The final fresh browser route sweep reported no console errors.
- The account shell was corrected to place its navigation column on the right in RTL desktop layouts, matching the supplied account boards.
- The account shell was corrected to place its navigation column on the right in RTL desktop layouts, matching the supplied account boards.

final result: blocked
