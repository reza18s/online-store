# Category page Select polish plan

## Outcome
Correct both Select controls on `/category/men`: the visible sort control and the category filter controls. Keep Persian RTL labels, native select/radio behavior, and existing URL filter updates.

## Scope and owners
- `apps/web/src/features/catalog/components/category-discovery.tsx`: compose size and color FilterSelect variants and give the sort select a decorative, accessible-hidden chevron wrapper.
- `apps/web/src/styles/storefront-reference.css`: use the existing catalog FilterSelect board contract in category controls and bring category sort styling into the same visual system.
- `docs/designs/components/catalog-filter-select/component-handoff.md` and `qa-report.json`: record the category integration extension and the observed API limitation.
- Leave `packages/ui` behavior, catalog query contracts, admin controls, and unrelated page composition unchanged.

## Acceptance criteria
- Sort remains a native select with unchanged options and URL updates, a visible RTL chevron, a clear keyboard focus state, and a touch target of at least 44 px.
- Category filters keep their existing radio semantics and query updates. Their trigger is at least 52 px; list rows and indicators are at least 44 px and 20 px; size targets are at least 44 px around 36 px chips; swatches use cells at least 58 x 62 px with 36 px circles and 12 px labels.
- Desktop toolbar dropdowns and the mobile filter sheet both render without clipping or overlap.
- Verify the changed-scope web typecheck/build and inspect the local runtime at desktop and phone widths. Do not infer a successful product-data request from the visual check.

## Steps
1. Confirm the new worktree is clean and use its dedicated fix branch.
2. Update category composition for size/color variants and decorate the existing sort select without changing its value contract.
3. Add category-scoped styles following the component handoff and preserve mobile overlay overrides.
4. Run the scoped checks and visually inspect sorting plus filter states at desktop and mobile sizes.
5. Review the final diff, commit the focused change, then integrate and push according to repository policy.

## Risks
- Category page styles differ from `.listing-page` rules; selectors must target the category filter wrapper without changing listing behavior.
- The mobile filter sheet uses a separate overlay cascade; keep its layout and open/close behavior intact.
- The local products API has previously returned an unavailable error, so UI geometry can be verified independently but live catalog data may remain unverified.

## Follow-up: shared Select keyboard focus

### Finding
The supplied `/category/men` and `/category/women` screenshots show two visible focus borders around the native sort Select. The shared component adds a four-pixel focus ring while the storefront focus style adds an outline and soft box-shadow.

### Scope and decision
- Update only `packages/ui/src/select.tsx` focus styling. Keep its native select, props, value, options, dimensions, RTL placement, and query behavior unchanged.
- Replace the box-shadow focus ring with one two-pixel primary-colored `:focus-visible` outline at a two-pixel offset, and suppress the storefront box-shadow for this control. Keep the primary border on focus.
- Keep the separate catalog `FilterSelect` board and its radio-based behavior unchanged; it is a different component.

### Acceptance and validation
- Keyboard focus shows one clear brand-colored outline; pointer focus does not add a second ring.
- Existing sort values and URL updates still work on men and women category pages.
- Check `@nova/ui`, web, and admin typechecks/builds, then inspect the affected storefront pages at phone and desktop widths.

### Validation results (2026-10-24)
- PASS: `@nova/ui`, storefront, and admin typechecks.
- PASS: Storefront and admin production builds. The storefront build retains existing Vite CJS deprecation and chunk-size warnings.
- PASS: Browser inspection at 1200 × 900 on `/category/women` and 560 × 874 on `/category/men` and `/products/men`; keyboard focus shows one 2px brand outline with a 2px offset and no extra shadow.
- PASS: Keyboard sorting on `/products/men` selected `price_asc` and updated the URL to `?sort=price_asc`; the preview was restored to the default route.
- LIMITATION: The local catalog API is unavailable, so product data remained in its loading/error state during visual inspection.

## Follow-up: category sort Select open state

### User evidence and finding
- The supplied open-state screenshot shows the category sort control's selected option using the browser or operating system's default blue highlight. The existing category sort remains a native <select> and the prior change only addressed its closed-state focus outline.
- The category FilterSelect design board covers radio-based facets, not this native sorter. Its contract cannot be reused as the sort menu's authority.

### Decision and tradeoffs
- Keep the native <select>, current options, label, value contract, and query updates.
- Native appearance preserves platform keyboard, touch, and assistive-technology behavior, but its open picker and selected highlight are controlled by the browser or OS and do not reliably take CSS styling.
- A custom React listbox would give full visual control but would require a separate keyboard, focus, dismissal, and screen-reader implementation, and would depart from the established native-select contract.
- Chosen: progressively enhance only the category sorter with CSS appearance: base-select and a styled picker inside @supports; retain the existing native control as the fallback where that feature is unavailable. Style option rows from the existing Atelier palette and keep the RTL chevron behavior.

### Acceptance criteria
- On browsers that support customizable select, opening by pointer and keyboard shows the Atelier surface, fine line border, wine selected row, readable RTL options, a 176px minimum picker width, and 44px minimum option targets. The browser keeps the picker visible at the viewport edge.
- On unsupported browsers, the native select and its current operating-system menu continue to work without losing any option or sort query behavior.
- The closed control remains 48px tall with the existing focus outline and custom chevron; other pages and admin selects remain unchanged.

### Validation
- Check appearance: base-select support in the target runtime by opening the live menu and capturing the rendered picker.
- Run the web typecheck and production build; inspect the open and closed states at desktop and phone widths, and verify each option still updates the sort query.
- Report the browser fallback limitation if the available runtime does not support customizable select.


#### Follow-up verification
- PASS: Live Chromium 147 open-state review at desktop (1365 × 900) and mobile (390 × 844) on `/category/men`, `/category/women`, and `/category/children`; selected row and hover row use the Atelier colors, and option hover preserves the current value.
- PASS: All four sort values (`newest`, `price_asc`, `price_desc`, and `name`) updated the URL query in the production page.
- PASS: `bun run typecheck` and `bun run build` in `apps/web`; build emitted a Vite CJS API deprecation and a large-chunk warning.
- LIMITATION: The local catalog API did not return product data during review, so product cards showed loading placeholders.
- UNVERIFIED: An older browser was unavailable; its native system popup may keep the system highlight color.
