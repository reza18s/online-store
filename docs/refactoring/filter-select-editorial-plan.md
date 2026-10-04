# Filter Select Editorial Redesign Plan

## Scope and outcome

Update the shared storefront FilterSelect control to match the supplied Atelier Editorial filter reference. Shoppers should be able to open a facet, see the current single selection, and change it from a compact list on desktop and mobile without changing the existing URL filter contract.

## Ownership and design direction

- Production owner: apps/web/src/features/catalog/components/filter-select.tsx.
- Shared final storefront visual layer: apps/web/src/styles/storefront-reference.css, imported after the base stylesheet.
- Keep the existing CatalogFacetOption data and onChange(value) behavior. Do not add unsupported filter dimensions or change route/query semantics.
- Use native disclosure and radio semantics, with square selection marks, facet counts, optional color swatches, Persian RTL layout, warm ivory surfaces, fine dividers, and the existing wine accent.
- At the category toolbar, show each facet as a compact popover. In the listing rail and mobile sheet, show a vertical accordion list.

## Acceptance criteria

1. Each FilterSelect exposes its current value and available options accessibly; selecting an option calls onChange with the same scalar value as before.
2. The all option clears the facet, counts remain localized, and color options display their supplied swatches.
3. Desktop popovers and stacked mobile/rail disclosures fit their existing consumers without clipping or changing catalog navigation.
4. Keyboard focus, native disclosure interaction, and narrow mobile layout remain usable.

## Work and validation

1. Update FilterSelect markup and the focused shared styles only.
2. Run the web app type check and production build.
3. Run the storefront and inspect the category/listing filter in desktop and mobile states; verify open, select, and clear interactions.
4. Compare rendered evidence with the supplied reference and record the outcome in design-qa.md.
5. Review the final diff, commit the dedicated branch, and complete the repository integration workflow where policy permits.

## Risks and constraints

The API and URL state currently expose single-choice values. The visual control will retain that contract; it will not imply multi-select behavior. Brand, season, style, rating, and price are outside this component's current option contract and are not added here.
