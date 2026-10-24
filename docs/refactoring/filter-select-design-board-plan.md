# FilterSelect Reference Board and Implementation Plan

## Target and outcome

Create a source-grounded design reference package for the catalog `FilterSelect` component and its `list`, `size`, and `swatches` variants, then align the live component styling to that contract. The package is for `apps/web/src/features/catalog/components/filter-select.tsx`; it does not target the base `packages/ui` `Select` or admin select controls.

## Acceptance criteria

- Preserve the current Persian RTL content, scalar value/onChange contract, native radio semantics, and URL/filter behavior.
- Represent source-defined geometry and visual states in the board and canonical JSON model. Show 44 px list rows with 20 px indicators; keep size chips and swatches visually 36 px while ensuring each interactive target is at least 44 × 44 px.
- Cover default/open, selected, focus, disabled, loading, and empty states, plus desktop and mobile rendering. Mark illustrative options as mock data.
- Include the required clean reference, schema, source and authority indexes, tokens, asset registry, render source, coverage, QA, manifest, and handoff.
- Change only the catalog FilterSelect styles needed to meet the verified component contract; preserve category-page styling and parent filter behavior.

## Ownership and sequence

1. Establish property authority from Atelier Section 18, the target-specific filter plan and references, current component source, and the live CSS.
2. Build and validate the canonical model and reproducible component renderer; produce the annotated board and clean reference.
3. Update listing-scoped FilterSelect geometry, then render the target at the documented desktop and phone viewports and inspect focus/selection states.
4. Validate schema, references, changed-scope type/lint/build checks, final diff, and update the design QA record with evidence.

## Risks and boundaries

- The plan's 36 px visual chips/swatches must coexist with Atelier's 44 × 44 px minimum pointer target; model these as distinct visual and hit-area bounds.
- The prior screenshots show page context and sample content. They are references, not evidence of current runtime geometry or permission to invent product/facet data.
- Keep selected values single-choice and do not alter listing URLs, query keys, fetching, or admin controls.
