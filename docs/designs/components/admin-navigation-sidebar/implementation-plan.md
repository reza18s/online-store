# Admin navigation rail and phone drawer plan

## Goal

Make staff navigation reliable and visually coherent in the authenticated admin workspace on desktop, tablet, and phone. Preserve existing routes, role permissions, the five-item admin quick bar, and the current Atelier Editorial admin visual treatment.

## Baseline evidence

A signed-in neutral admin route was captured at 1440×900, 1024×768, 768×900, 390×844, and 320×568.

- The RTL workspace currently renders its first flex child (the sidebar) at physical left.
- The full 194px rail remains at 768–1024px because the reference stylesheet forces its 194px basis over the shared 72px compact-rail rule.
- Phone hides the rail, renders a 120px wrapped header, and has no full-menu trigger. Its header dashboard shortcut is not permitted for support or operations roles.
- The phone bottom bar is intentionally a quick set; it does not expose every permitted destination.

## Design decisions

- Keep the current target-specific admin palette and typography from apps/admin/src/styles/admin-reference.css and apps/admin/src/styles.css. The broader architecture document describes a dark-green admin shell, while the active admin reference stylesheet and measured runtime use charcoal and warm neutral surfaces; the current target-specific styling wins for this repair.
- Keep the full 194px rail at widths above 1024px and place it on the physical right. Use the existing 72px compact rail at 768–1024px, with visible icons, tooltip titles, and accessible labels.
- At 767px and below, use a compact RTL header with a permission-safe menu trigger, centered NOVA wordmark, and existing role-allowed actions. Retain the bottom quick bar and add a full role-filtered side drawer for the remaining destinations.
- Use the existing GSAP library pattern from the storefront, declared as an admin dependency, for the drawer's short open and close transitions. Keep the native modal dialog mounted through exit, preserve focus containment and scroll locking, close by Escape/backdrop/button, restore focus to the trigger, and honor reduced-motion preferences.
- Reuse the existing navigation definition and role filter. Keep route changes on the current navigateToRoute path.

## Scope and ownership

- Production owner: apps/admin/src/app/layouts/AdminWorkspaceLayout.tsx.
- Responsive visual owner: apps/admin/src/styles/admin-reference.css.
- Dependency contract: apps/admin/package.json and bun.lock.
- Design handoff: this directory's canonical model, responsive boards, renderer, and QA evidence.

## Implementation and verification

1. Build a source-grounded desktop, compact-tablet, and phone navigation specification with measured runtime geometry and source-defined drawer motion.
2. Correct RTL rail placement and compact-tablet styling; add a role-filtered, keyboard-accessible phone drawer and stable phone header.
3. Keep permission and active-state behavior in the existing shared navigation model; do not duplicate role or route logic.
4. Validate the design JSON/schema and referential integrity, then render the board and clean references at their declared viewports.
5. Run admin typecheck and build. Inspect the changed diff and verify the actual runtime at 1440, 1024, 768, 390, and 320px, including drawer open/close, permissions, Escape/backdrop, focus return, and reduced motion. Browser evidence is separate from static checks.

## Risks and boundaries

- Keep dashboard access admin-only; drawer and bottom-nav links must come from existing role-filtered definitions.
- Do not change APIs, page routing, storefront navigation, page content, or the filter sidebar.
- The generated board is a source-backed implementation handoff. Its final geometry is measured from the updated runtime, and its animation timings come from the implemented GSAP timeline.
