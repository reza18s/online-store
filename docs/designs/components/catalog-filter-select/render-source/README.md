# Catalog FilterSelect reference package

This package documents the catalog FilterSelect and its list, size, and swatches presentations. Facet labels and swatch colors are illustrative, not catalog API data.

## Files

- 01-Visual-Design-Board.png: annotated component board, 1536 × 1024.
- 02-Clean-Reference.png: isolated desktop component reference, 1536 × 1024.
- 03-Clean-Reference-Mobile.png: mobile sheet reference, 390 × 844.
- design-spec.json and design-spec.schema.json: canonical contract and validation schema.
- source-index.json, authority-map.json, conflicts.json, and design-tokens.json: evidence and decision records.
- coverage-matrix.json, qa-report.json, manifest.json, and component-handoff.md: acceptance coverage, validation status, asset inventory, and implementation guidance.
- render-source: static HTML/CSS source for the board and desktop reference; the phone reference has a deterministic Pillow renderer.

## Mobile reference renderer

Run the following from the repository root with Python 3 and Pillow built with RAQM support:

~~~~powershell
python docs/designs/components/catalog-filter-select/render-source/render-mobile-reference.py
~~~~

It writes the mobile PNG at the package root. The renderer uses the installed Windows Tahoma font and does not make network requests.

## Alignment

The static references are a design handoff, not screenshots of the running storefront. The production rules are in apps/web/src/styles/storefront-reference.css, while markup and radio semantics are in apps/web/src/features/catalog/components/filter-select.tsx. The preferred storefront type stack is Vazirmatn with Tahoma fallback; the static captures use the installed fallback.
