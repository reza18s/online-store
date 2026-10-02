# Category Page Reference Fix Plan

## Goal and acceptance criteria

Align `/category/women`, `/category/men`, and `/category/children` with the supplied Atelier Editorial category references while keeping NOVA's shared visual tokens, RTL layout, existing routes, and real catalog data. The category navigation must show the active audience, editorial hero and category links must navigate to the correct live listing, and sorting/filter controls, product cards, wishlist, cart, search, and mobile menu actions must remain usable.

Acceptance is based on fresh desktop and phone captures for all three category routes, no horizontal overflow, working primary navigation and catalog actions, passing web typecheck/unit checks, and a passing reference comparison in the project design QA report. Catalog counts and products remain server-derived; no fake product records will be added to fill the visual grid.

## Scope and owners

- `apps/web/src/features/catalog/components/category-discovery.tsx`: category hero, supporting category links, toolbar, product results, and category-specific copy/data.
- `apps/web/src/shared/ui/header.tsx` and `apps/web/src/app/App.tsx`: category-aware active navigation and reference-aligned header variant, preserving other route behavior.
- `apps/web/src/styles/storefront-reference.css`: responsive category and category-header styling, continuing the existing reference-style ownership.
- Focused category tests and browser evidence; existing catalog APIs, URL filter helpers, shared product cards, and icon library remain the source of behavior and controls.

## Steps

1. Capture the current category routes at desktop and phone sizes and record the reference mismatches.
2. Trace the existing catalog query, URL filter, header, and route behavior; reuse those contracts.
3. Implement the reference hierarchy for women, men, and children, with real category destinations and working filter/sort state.
4. Add focused regression coverage and compare fresh rendered captures to the supplied visual targets; fix actionable differences.
5. Run the web typecheck, tests, browser checks, review the scoped diff, then commit, integrate, and push through the repository workflow.

## Risks and constraints

- Supplied boards are presentation composites, so compare the page regions and phone screen content rather than decorative device frames.
- The local API may return fewer products than the reference board; show truthful returned items and counts.
- Existing worktree edits and newly supplied untracked reference images belong to the user and must not be staged, overwritten, or removed.
- Keep the shared header's current behavior on non-category routes unless a category-only presentation variant is needed.
