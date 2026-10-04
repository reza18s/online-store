# Filter Component Visual Refinement Plan

## Target and outcome

Use the supplied filter.png component board as the visual source, with the desktop anatomy, selection states, control details, and mobile sheet as the primary references. Refine the live catalog listing filter so shoppers can scan facets quickly, recognize active filters, and change them on desktop or mobile without changing the existing query contract.

## Ownership and decisions

- Facet control owner: apps/web/src/features/catalog/components/filter-select.tsx.
- Listing composition owner: apps/web/src/features/catalog/components/listing-discovery.tsx.
- Shared storefront tokens and responsive rules: apps/web/src/styles/storefront-reference.css, loaded after the base stylesheet.
- Keep each facet's existing scalar URL value and radio-group behavior. Use square visual indicators for list facets, compact size chips, and labeled color swatches; do not imply multi-select within a single facet.
- Connect the listing price controls to the existing minPrice/maxPrice query fields. Use the visible catalog prices to size the slider domain and allow the domain to grow for an active out-of-range value.
- Reuse the audience-specific catalog category mapping so the category facet only shows relevant categories. Present active filters as removable chips and keep the clear-all route behavior.

## Acceptance criteria

1. Desktop listing places the filter panel on the right with the reference hierarchy: panel title and clear-all action, divided facet rows, compact option rows, size chips, color swatches, and a price range control.
2. The product grid sits to the left of the filter panel and uses three columns at the reviewed desktop width.
3. Selected category, size, color, material, price, stock, and sale filters appear as removable chips; removing a chip clears only that query value.
4. Existing URL values, result fetching, sorting, pagination, and single-selection semantics remain intact.
5. The mobile filter opens as a centered 358 by 756 px sheet at the reference phone size, opens its category and price facets, locks background scrolling, keeps keyboard focus within the sheet, and keeps the results action and clear-all control in the footer.
6. Keyboard focus, loading, disabled, hover, empty-option, and reduced-motion states remain legible and accessible.
7. Review the running listing at 1536 by 1024 desktop and 390 by 844 mobile sizes, exercise selection, price, chip removal, and clear-all, and compare the source board with the rendered filter states.

## Work and validation

1. Refine FilterSelect markup and add list, size, and swatch presentations without changing its scalar contract.
2. Update listing composition with the active-filter summary, existing-query price controls, panel heading, and mobile footer.
3. Tune listing-scoped storefront rules for the right-to-left desktop grid, a roughly 30% filter rail, control dimensions, and mobile sheet proportions. Preserve the separate category-page styling.
4. Capture and compare the updated desktop and mobile states, then update design-qa.md with findings and evidence.
5. Run targeted type, lint, and build checks; inspect the final diff and preserve the clean worktree.

## Constraints

The filter endpoint currently supplies scalar values for category, size, color, and material. The implementation will not invent multi-select query behavior or new facet data. The reference images contain denser sample inventory than the live catalog, so product imagery and result counts continue to reflect the actual response.

## Final visual follow-up — 2026-10-04

- Keep catalog filter list rows at 44 px with 20 px indicators, size chips and color swatches at 36 px, and the primary apply action at 52 px to follow the board's component measurements.
- On desktop, keep the filter rail aligned with the three-column grid, allow its facet body to scroll independently, pin the result action and clear-all control, and provide toolbar and panel close controls. Collapse availability options behind a compact section heading.
- At 1536 × 1024, the rendered desktop rail measured about 379 × 600 px at x=1029, y=274; its footer occupied y=774–863 and both price inputs remained visible above it. At 390 × 844, the mobile sheet measured exactly 358 × 756 px at x=16, y=44; its footer occupied y=704–784 while the sheet was open.
- The live women’s catalog returned three products. Keep its real titles, facet options, imagery, and result count; the fuller image-board inventory remains illustrative.
