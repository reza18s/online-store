# Mobile search page plan

## Outcome

Create a source-grounded mobile reference board and improve the storefront product-search results flow at `/products?q=…` for the mobile breakpoint. The search dialog remains the entry point; submitting a search continues to use the existing product-list route and API.

## Acceptance criteria

- On mobile, the results page gives the query a clear, accessible edit, clear, and submit path; typing alone does not change the URL or request new product results. Desktop keeps its existing live-query behavior.
- Submitting a mobile query preserves supported filters and sort state, resets pagination, and keeps direct links/browser navigation in sync with the field.
- The mobile suggestion strip stays one horizontally scrollable row with 44 px links, so it does not push the first product action below the fixed navigation; search-card favorite and add-to-cart targets are at least 44 px.
- Search-page result count, filter/sort controls, empty/loading/error states, RTL order, two-column cards, and fixed mobile navigation remain readable and usable at 360–430 CSS px without horizontal page overflow.
- Search-page mobile controls meet the 44 CSS px touch-target baseline; non-search product listings remain unchanged.
- The design package includes the canonical specification, scene graph, source/authority/conflict records, tokens, assets, schema, render source, board, clean reference, coverage, and QA evidence required by the board skill.
- Render and inspect the actual app at mobile sizes; validate the JSON schema and semantic references; run only relevant non-test checks (typecheck, lint, build) and report each result.

## Ownership and steps

1. `ListingDiscovery` owns query results and URL-driven filters; `SearchDialog` owns query entry before submit. Inspect route construction and product-card interaction contracts before changes.
2. Record the existing 390 × 844 mobile layout, 33 px suggestion links, 35 px add-to-cart control, and fixed-nav overlap. Create a mobile search design contract under `docs/designs/mobile-search/`, then render its annotated board and clean reference from the canonical model and app output.
3. Implement a responsive query draft/form and search-scoped mobile presentation in the existing catalog owner and reference stylesheet. Preserve route, API, filter, sort, pagination, analytics, RTL, desktop live-query behavior, and shared non-search catalog behavior.
4. Capture actual app output with controlled, labeled fixture data at 390×844 and 360×800; compare measured control sizes, direction, content bounds, and overlay/navigation behavior with the model. Repair the source/model before regenerating dependent artifacts.
5. Validate JSON/schema/references, run the storefront typecheck, lint, and build, inspect the final diff, commit the scoped files, and follow the repository's PR/integration workflow for `main`.

## Risks and constraints

- The query field must follow direct URL changes and browser back/forward without overwriting an in-progress draft unexpectedly.
- Search edits must not issue a catalog request per keystroke; submitted searches reset page while preserving compatible query state.
- Mobile-only selector scoping is required to avoid changing category and general product listings.
- Local product imagery is reference-only; asset license status remains unknown unless repository evidence says otherwise.

## Design decision

Keep the current Soft Modern Atelier palette and two-column product grid. On mobile, replace wrapped suggestion pills with one swipeable RTL row at 44 px minimum height; make query edits explicit through clear and submit controls; and enlarge search-card actions to 44 px. This saves enough vertical space for the first card's add-to-cart action to clear the fixed bottom navigation while retaining desktop behavior.
