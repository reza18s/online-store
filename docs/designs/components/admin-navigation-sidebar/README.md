# Admin navigation reference board

This source-grounded package documents the observed desktop RTL placement issue, tablet width conflict, phone header wrapping, and incomplete role-specific mobile access.

## Files

- design-spec.json: canonical component model, measured frame geometry, motion, source references, and implementation contract.
- design-spec.schema.json: Draft 2020-12 schema for the model and frame geometry.
- source-index.json, authority-map.json, conflicts.json: source evidence and precedence decisions.
- design-tokens.json, asset-registry.json: existing visual tokens and asset record.
- scene-graph.json, coverage-matrix.json: scene structure and verified acceptance coverage.
- board.html and board.css: deterministic visual board with no remote asset requests.
- render-source/render-admin-navigation.cjs: repeatable schema validation, runtime capture, measurement, and QA report generation.
- renders/: reference PNGs, live viewport captures, and the runtime QA report.
- implementation-plan.md: scoped implementation and validation plan.

## Behavior

The full rail is 194px on the right above 1024px. The 72px icon rail is used from 768px through 1024px. At 767px and below, a stable phone header and quick nav work with a complete role-filtered drawer. GSAP animates the right-side modal drawer and reduced-motion mode opens and closes it immediately.

## Reproduce the evidence

With dependencies installed and the admin app running at http://127.0.0.1:5174, run this from the repository root:

    node docs/designs/components/admin-navigation-sidebar/render-source/render-admin-navigation.cjs

The renderer mocks only the staff session response, captures the board and responsive app viewports, measures the navigation rectangles, checks scene/schema references, and writes renders/qa-report.json plus the measured geometry into design-spec.json. The runtime captures use the neutral unavailable-route page so unrelated dashboard data does not affect navigation review.

Open board.html locally to review the static proposal. It makes no external requests.
