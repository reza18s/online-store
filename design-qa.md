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
