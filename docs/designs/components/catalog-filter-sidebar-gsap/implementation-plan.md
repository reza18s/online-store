# Catalog Filter Sidebar GSAP Plan

## Target and outcome

Update the product listing filter rail and its mobile filter sheet in `ListingDiscovery`. Preserve the existing filter query behavior, result actions, Persian copy, RTL layout, focus handling, and responsive breakpoints. Add GSAP motion for desktop and mobile open/close transitions, including exit animations before panels are hidden.

## Acceptance criteria

- Desktop filter rail opens and closes with a short GSAP transition while the results layout follows the rail's presence.
- Mobile filter sheet and backdrop animate in and out; Escape, backdrop, close, and apply actions all complete the same close transition.
- The modal focus trap and page scroll lock remain active through the mobile exit transition, and focus returns to the trigger when it finishes.
- Reduced-motion preference makes state changes immediate.
- Mobile close and reset controls meet the source-defined 44 × 44 px touch target.
- Existing query updates and results behavior remain unchanged.
- Deliver a reproducible design package: visual board, clean desktop/mobile references, canonical JSON model and schema, render source, and evidence report.
- The design schema covers source evidence, authority decisions, tokens, frames, nodes, assets, interactions, artifacts, and QA results.

## Ownership and scope

- UI and animation state: `apps/web/src/features/catalog/components/listing-discovery.tsx`.
- Storefront layout and motion accessibility: `apps/web/src/styles/storefront-reference.css`.
- Web workspace dependency: `apps/web/package.json` and `bun.lock`.
- Design handoff package: `docs/designs/components/catalog-filter-sidebar-gsap/`.

## Decision and tradeoffs

Use GSAP because the request explicitly names it. Add the core package and its React hook integration so animation cleanup follows component lifecycle. CSS-only transitions would avoid dependencies but would not meet the requested animation library. Keep the animation bounded to the rail and sheet; do not alter catalog APIs or filter semantics.

The effective listing cascade sets the desktop grid to RTL with a flexible 280px-minimum rail. Its mobile override presents a centered 358px by 756px dialog in a 390px by 844px viewport. Preserve these source-backed shapes. Animate desktop track collapse together with the rail exit; animate the mobile dialog with a short vertical lift and overlay fade. The earlier filter-select handoff explicitly left rail placement unresolved, and its mobile geometry describes an older reference.

## Work sequence

1. Resolve source-backed layout, token, copy, responsive, RTL, and accessibility rules; define proposal-only motion values in the canonical design model.
2. Generate and validate the design board, clean references, schema, scene graph, and render source before implementation.
3. Add GSAP motion and preserve close lifecycle, focus, scroll lock, and reduced-motion behavior.
4. Run typecheck, lint, production build, render/schema/reference checks, and inspect desktop/mobile runtime states.
5. Review the complete diff and publish through the repository's branch and pull request workflow.

## Risks

- Worktree-specific Git configuration currently requires an explicit `core.bare=false` and `core.worktree` setting; keep that metadata isolated to this task worktree.
- The remote `main` advanced after worktree creation. The task branch was inspected and fast-forwarded to the fetched `origin/main` before source edits.
- Motion durations and distances are not source-defined; mark them PROPOSED and keep reduced-motion behavior explicit.

## Merge-readiness follow-up

- CI runs the root test command from the repository root. Web and admin tests rely on the same `@/` alias with different app-local `tsconfig.json` mappings. Running each test suite from its app directory resolves those aliases; preserve that ownership in the root test orchestration instead of adding conflicting root aliases or rewriting test imports.
- The coupon status test uses a fixed active window that expired before the current CI date. Anchor that fixture window to its own test clock so the asserted ACTIVE status remains time-stable.
- The deterministic integration manifest still referenced transport tests from the previous app layout. Point it at the current feature-owned tests and execute each app group from its package root so each `@/` alias uses the correct app config.
- Validate focused app suites and the coupon test, then rerun the full test suite, typecheck, lint, build, and PR checks before merging.
- Risk: tests that were previously stopped at import resolution may now execute and expose additional existing failures; keep any unrelated production behavior out of this follow-up.
