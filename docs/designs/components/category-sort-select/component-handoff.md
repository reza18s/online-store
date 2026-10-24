# Category Sort Select design handoff

## Purpose and user flow

The sort control lets a shopper choose how the current category list is ordered. The shopper opens the control, selects one of four existing Persian-labeled sort options, and the category page updates its sort state and URL query. The design addresses the open selected row shown in the supplied reference.

## Component contract

- Keep the existing native HTML select and option elements from the shared UI component.
- Keep the values newest, price_asc, price_desc, and name, the default value newest, and the existing onChange query update.
- Keep Persian labels, RTL direction, pointer use, native keyboard behavior, touch use, and assistive-technology semantics.
- Keep the 48px closed control, 120px minimum closed width, 10px corners, existing decorative chevron, and a single 2px keyboard focus outline with a 2px offset.
- Scope the picker styling to .category-sort on category pages. Admin and unrelated selects keep their present styles.

## Open-state visual contract

Where customizable select is supported, use the Atelier surface #FFFCF9, ink #302B29, line rgb(83 61 46 / 13%), and floating shadow 0 18px 50px rgb(58 38 24 / 10%). Give the open picker a 10px radius, 4px inner padding, and at least 176px inline size. Keep option text RTL and aligned to start. Each option has at least 44px block size. The selected row uses wine #7B4B59 with surface-colored text and a checkmark. An unselected hovered option uses soft wine #F2E8EB and dark wine text.

Use appearance: base-select and ::picker(select) only inside the support query. Older browser and operating-system popups remain native and may keep their system highlight color. The supplied blue selected row is evidence of that fallback, not the target color.

## Responsive behavior

The closed control remains at least 48px tall on desktop and mobile. Let the browser anchor and place the open picker so the choices remain visible. Avoid clipping at the page or viewport edges. The clean references show 560 × 420 desktop and 390 × 460 mobile frames.

## Production ownership

- apps/web/src/features/catalog/components/category-discovery.tsx owns the sort values, Persian labels, current selected value, and sort-query update.
- packages/ui/src/select.tsx owns the shared native select semantics and keyboard focus styling.
- apps/web/src/styles/storefront-reference.css owns category-scoped geometry, chevron, and customizable-picker styling.

See category-page-select-polish-plan.md for the implementation decision and validation sequence.

## Validation evidence

- Production open state checked on `/category/men`, `/category/women`, and `/category/children` at desktop (1365 × 900) and mobile (390 × 844) sizes in Chromium 147. The wine selected row, 44px option target, picker surface, focus outline, and pointer-hover state were inspected.
- All four values (`newest`, `price_asc`, `price_desc`, and `name`) updated the query.
- Web typecheck and production build passed. The build emitted Vite deprecation and chunk-size warnings.
- The local product API remained unavailable; product cards stayed in their loading state during visual review.
- Older-browser/system-popup fallback remains unverified and may keep the operating-system highlight color.
