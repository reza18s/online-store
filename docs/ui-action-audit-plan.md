# UI style and action audit — 2026-09-30

Scope: all storefront and standalone admin route families, their shared components, responsive layouts, and material user actions. Preserve the extensive existing working-tree changes, API contracts, permission boundaries, Persian RTL, and SSR.

1. Map routes and component ownership using the current graph and source; inspect the Atelier Editorial specification and supplied page/component references.
2. Capture current desktop, tablet, and phone screens; exercise existing browser scenarios with deterministic API fixtures. Record coverage, reproduced defects, and live-service limits in `fix-ui-ux.md`.
3. Fix evidenced style, navigation, interaction, form, focus, and responsive defects in their existing production owners. Add meaningful regression checks where needed.
4. Repeat affected browser checks, run frontend tests/typechecks/lint/builds, inspect final diffs, and leave the storefront visible. Distinguish fixture UI evidence from real backend/provider acceptance.

Parallel ownership: parent owns storefront/shared UI and integrated reporting; a focused worker may own admin-only fixes and validation. Both preserve pre-existing changes.
