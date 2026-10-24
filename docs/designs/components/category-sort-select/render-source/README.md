# Category Sort Select design reference

This package documents the category page sort control used by `/category/:audience`. The control remains a native HTML select. Browsers supporting customizable selects receive the Atelier open-picker styling; other browsers keep their operating-system menu.

## Package contents

- `01-Visual-Design-Board.png`: annotated 1536 × 1024 component board.
- `02-Clean-Reference.png`: clean desktop open-state reference at 560 × 420.
- `03-Clean-Reference-Mobile.png`: clean mobile open-state reference at 390 × 460.
- `04-Live-Open-State-desktop.png` and `04-Live-Open-State-mobile.png`: captures from the actual local storefront branch.
- `design-spec.json` and `design-spec.schema.json`: canonical component contract and JSON Schema.
- `scene-graph.json`: board and runtime frame map.
- `source-index.json`, `authority-map.json`, and `conflicts.json`: evidence, authority, and design decisions.
- `design-tokens.json`, `coverage-matrix.json`, `qa-report.json`, `asset-registry.json`, `manifest.json`, and `component-handoff.md`: tokens, acceptance coverage, QA and reproducibility metadata, and implementation handoff.
- `render-source`: source HTML/CSS and the Playwright renderer for the three repeatable design-board images.

## Re-render the design board

From the repository root, run:

    node docs/designs/components/category-sort-select/render-source/render-board.mjs

The renderer opens the local static source page in Playwright Chromium, uses keyboard input to open the select, verifies the customizable picker and selected row, writes the three board images, and updates `render-source/render-report.json`. It makes no network requests.

The board is a design handoff, not a live-storefront screenshot. The two `04-Live` images are separately captured from the branch runtime. The runtime check covered Chromium 147 at desktop and mobile sizes on `/category/men`, `/category/women`, and `/category/children`; all four sort values updated the query. The local catalog API did not return product data during that review.

## Compatibility

The wine selected row is available only in browsers supporting CSS customizable selects. Older browsers continue to use their native operating-system menu, which may keep its system highlight color. That older-runtime fallback was not independently exercised here.
