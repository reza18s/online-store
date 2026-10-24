# Catalog filter sidebar reference package

This package documents the current Persian RTL listing rail and centered mobile dialog, with proposed GSAP entry and exit motion.

## Contents

- `01-Visual-Design-Board.png`: annotated design and behavior board, 1536 × 1024.
- `02-Clean-Reference.png`: clean desktop listing reference, 1440 × 900.
- `03-Clean-Reference-Mobile.png`: clean mobile dialog reference, 390 × 844.
- `runtime-desktop-open.png`, `runtime-desktop-closed.png`, and `runtime-mobile-open.png`: actual storefront captures at 1280 × 900 and 390 × 844.
- `runtime-review.json`: measured entry and exit states, close routes, reduced-motion behavior, and runtime limitations.
- `design-spec.json` and `design-spec.schema.json`: canonical handoff model and Draft 2020-12 schema.
- `scene-graph.json`: source nodes, parent relationships, and browser-measured bounds for open and closed frames.
- `source-index.json`, `authority-map.json`, `conflicts.json`, `design-tokens.json`, and `asset-registry.json`: evidence, source authority, resolved conflicts, token values, and assets.
- `coverage-matrix.json`, `qa-report.json`, `manifest.json`, and `component-handoff.md`: acceptance coverage, verification state, checksums, and implementation guidance.
- `render-source`: static HTML/CSS plus the deterministic browser renderer.

## Render and validate

The reference renderer requires the repository's installed Playwright package and a local Chrome browser. From the repository root in PowerShell:

~~~~powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node docs/designs/components/catalog-filter-sidebar-gsap/render-source/render-package.mjs
~~~~

The script captures desktop and mobile pages, captures the board after its references exist, measures annotated DOM nodes in CSS pixels at device scale factor 1, validates the canonical model with Ajv when available, performs structural reference checks, and refreshes source and artifact checksums. Product cards and option counts are illustrative. No network assets or remote fonts are used.

For a full Draft 2020-12 validation when Ajv is not already installed in the repository, run:

~~~~powershell
npm exec --yes --package=ajv-cli -- ajv validate --spec=draft2020 `
  -s docs/designs/components/catalog-filter-sidebar-gsap/design-spec.schema.json `
  -d docs/designs/components/catalog-filter-sidebar-gsap/design-spec.json
~~~~

The static references communicate intended geometry; runtime QA of the actual Vite storefront is recorded separately. The local catalog service was unavailable during this review, so the actual storefront captures show its loading and skeleton state; they do not validate live product or facet data. Re-run the storefront checks after rendering to refresh the implementation status in `qa-report.json`.
