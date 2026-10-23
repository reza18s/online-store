# Mobile search visual and interaction QA

**Captured:** 2026-10-23, against the local development storefront with deterministic development fixtures.

**Browser:** Microsoft Edge, CSS viewport at device scale factor 1.
**Primary route:** `/products?q=پیراهن`.

## Baseline findings

The 390 × 844 baseline showed the mobile suggestion links at 33 px, product favorites at 30 px, and add-to-cart buttons at 35 px. The first add-to-cart control began at y=781 under the fixed navigation. The suggestion list wrapped over several rows and pushed the first product action into the navigation area. The source context and baseline screenshots are recorded in `evidence/`.

## Final app measurements

| Viewport  | Document width |    Search panel | Query/clear/submit | Suggestion link |      Grid | First add action | Fixed navigation | Clearance |
| --------- | -------------: | --------------: | ------------------ | --------------- | --------: | ---------------- | ---------------- | --------: |
| 390 × 844 |         390 px | y=160, h=122 px | 44 px each         | 44 px           | 2 columns | y=691–735        | y=768            |     33 px |
| 360 × 800 |         360 px | y=160, h=122 px | 44 px each         | 44 px           | 2 columns | y=671–715        | y=724            |      9 px |

The suggestion strip scrolls horizontally inside its own bounds, while the document has no horizontal overflow at either width. The first favorite and add-to-cart controls each measure 44 × 44 px or larger. The first add action clears the fixed navigation at both sizes.

## Search flow review

- Typing on mobile updates the local draft and leaves the submitted URL and results unchanged.
- Enter submits the draft, preserves `sort` and `size`, and removes the previous `page` parameter.
- The clear control empties the draft without submitting. Submitting the empty draft removes `q` and preserves the other query state.
- Browser Back restores both the URL query and the query field.
- At desktop width, typing continues to update the URL immediately and the mobile submit control remains hidden.

These checks were run through the package's render source against the running local app. They are focused UI and behavior checks, not the repository test suite.

## Artifact and source checks

- `mobile-search-design.json` validates against `mobile-search-design.schema.json` using an Ajv Draft 2020-12 validator.
- The render source's semantic reference check found no missing component, token, scene-graph, source, or asset IDs.
- The code graph reported no recorded gaps, with source freshness marked `metadata_changed`. Relevant files and design literals were read directly; this best-effort graph signal is not treated as a completeness guarantee. See `source-coverage.json`.
- `02-Clean-Reference.png` is the actual app view at 390 × 844. `01-Visual-Design-Board.png` is rendered from `board.html`, the clean reference, the design model, and the token file.

## Asset note

The displayed product photos come from local development fixtures. Their licensing status is unknown in repository evidence; the screenshots are review references only.
