# NOVA mobile search reference

This package documents the mobile product-search results screen at `/products?q=…`. The clean reference is a real local app capture at 390 × 844 CSS pixels; the annotated board is rendered from `board.html`, the clean reference, and the canonical model.

## Contents

- `mobile-search-design.json` — canonical page, flow, responsive, and accessibility model.
- `mobile-search-design.schema.json` — JSON Schema Draft 2020-12 for that model.
- `scene-graph.json` — ordered screen hierarchy and source/token/asset references.
- `tokens.json` — canonical Soft Modern tokens and runtime CSS variable mapping.
- `source-index.json` and `source-index.md` — source ownership and evidence.
- `authority-map.md` and `conflicts.md` — source priority and resolved conflicts.
- `asset-index.json` — fixture and screenshot lineage, including known license limits.
- `board.html` and `render-mobile-search.cjs` — annotated board and render/QA source.
- `01-Visual-Design-Board.png` and `02-Clean-Reference.png` — rendered deliverables.
- `evidence/` — before/after runtime captures and measured QA evidence.

## Re-render

Start the storefront with its documented development server and `VITE_ENABLE_STOREFRONT_FAKE_DATA=true`, then run the script from the repository root:

```powershell
$env:MOBILE_SEARCH_BASE_URL = 'http://127.0.0.1:5175'
node docs/designs/mobile-search/render-mobile-search.cjs
```

The renderer uses the repository's existing `@playwright/test` dependency and an installed Microsoft Edge or Chrome executable. `EDGE_EXECUTABLE_PATH` can point to a different installed Chromium browser. It writes only this package's reference and evidence images.
