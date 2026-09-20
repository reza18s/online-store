# Admin, Web, UI, and API Client Refactoring Plan

Status: complete for the requested admin/web/UI/API-client scope; root lint retains an unrelated baseline failure in `scripts/script.js`  
Scope: `apps/admin`, `apps/web`, `packages/ui`, `packages/api-client`, and any remaining package or test issue that materially affects these surfaces.

## Goal

Improve maintainability, feature ownership, type safety, and consistency while preserving current product behavior, API contracts, permissions, RTL presentation, and responsive behavior.

## Current architectural baseline

- `apps/admin` is a standalone staff frontend with its own Vite entry point and staff-aware query client.
- `apps/web` owns the public storefront, customer account, checkout, content, and SSR shell.
- `packages/ui` owns the low-level interactive primitives used by both frontends.
- `packages/api-client` owns shared transport, endpoint contracts, query keys, and API-facing types.
- The backend, database, and worker remain outside the primary refactor scope; they will only be changed if a verified client contract or security issue requires it.

## Findings and priorities

### High — separate page orchestration from feature state and rendering

**Problem:** `apps/admin/src/components/admin/admin-products-page.tsx` is a large page that combines staff/session state, server queries, preview filtering, derived data, navigation shell, filters, side panels, and product table/mobile rendering.

**Why it matters:** Changes to one concern require reasoning about the entire page and make state behavior harder to test independently.

**Plan:** Extract the product-page controller/state boundary first, then extract only meaningful UI sections where the resulting props remain cohesive. Preserve the existing preview/authentication behavior and route links.

**Risk:** Medium. The page has several permission, loading, and preview branches; validation must cover those branches and the admin build.

### High — isolate checkout orchestration from presentation

**Problem:** `apps/web/src/components/checkout/checkout-page-functions/checkout-page-content.tsx` combines address state, quote expiry, mutations, retry/idempotency behavior, route transitions, error mapping, and the complete checkout layout. The graph reports high cognitive complexity for this component.

**Why it matters:** Checkout is a sensitive stateful flow. Keeping orchestration and rendering together increases regression risk when adding payment, address, or quote behavior.

**Plan:** Move the stateful checkout controller into a feature-owned hook/module with an explicit result shape, leaving the page component responsible for composition and conditional rendering. Keep all existing retry, quote-expiry, payment, and route behavior unchanged.

**Risk:** High. Validate focused checkout tests, web typecheck, web build, and the relevant browser flows.

### Medium — consolidate confirmed duplicated frontend formatting logic

**Problem:** Admin and web contain repeated `Intl.NumberFormat('fa-IR')` and Toman formatter implementations across feature folders even though each app already has an app-level formatter seam.

**Why it matters:** Formatting behavior can drift and feature modules carry utilities that are not truly feature-specific.

**Plan:** Keep one formatter owner per app, update real consumers to use it, and remove only confirmed duplicate implementations. Do not promote these into a new shared package unless the current package boundaries require it.

**Risk:** Low. Add or preserve focused formatter coverage and run typecheck/lint.

### Medium — audit and strengthen shared UI and API-client boundaries

**Problem:** The shared packages are high fan-out boundaries. They need a targeted audit for duplicated types, overly broad exports, unsafe casts, inconsistent response/error typing, and primitives that contain application-specific behavior.

**Plan:** Inspect consumers before changing exports. Make only contract-preserving improvements, such as explicit exports, tighter types, consistent query-key/response helpers, or primitive accessibility fixes supported by existing usage.

**Risk:** Medium to high because both frontends consume these packages. Every shared change requires both app typechecks and relevant contract/UI tests.

### Low — review the remaining workspace for material follow-up issues

**Problem:** The API, database, worker, config, and test packages may contain adjacent issues, but broad cleanup would expand scope without evidence.

**Plan:** Run a bounded dependency and quality scan. Fix only issues that affect admin/web/UI/API-client behavior, create a separate follow-up note for unrelated findings, and leave backend redesign out of this change.

## Dependency-aware execution order

1. Record the clean baseline and confirm existing validation commands.
2. Audit `packages/ui` and `packages/api-client` consumers and contracts.
3. Consolidate safe, app-owned formatting duplication.
4. Extract the admin product-page controller and validate admin behavior.
5. Extract the web checkout controller and validate checkout behavior.
6. Apply any justified shared UI/API-client fixes discovered in steps 2–5.
7. Review remaining packages for blocking or materially related issues.
8. Run final diff review, targeted tests, typechecks, lint, builds, and relevant browser checks where the local runtime permits.

## Validation gates

- `git diff --check`
- focused tests for changed admin/web/UI/API-client modules
- workspace typecheck
- workspace lint
- web and admin production builds
- API-client contract tests
- full test suite when the focused checks are green
- browser or live checks for changed flows when the local services are available

Known environmental limits will be reported separately; no check will be described as passing unless it actually runs successfully.

## Change-control rules

- Preserve existing behavior, API response shapes, permissions, and route contracts.
- Do not move code solely for stylistic consistency.
- Do not introduce a new dependency or shared abstraction without a demonstrated consumer need.
- Keep mobile, worker, database, and provider behavior unchanged unless a verified dependency requires an update.
- Update this plan with completed work, validation results, and remaining issues.

## Completed in this pass

- Consolidated duplicated admin/web Toman and Persian-number formatters into each app's `src/utils/app` owner and corrected those pure utility filenames from `.tsx` to `.ts`.
- Extracted admin product-page state/query orchestration into `use-admin-products-page.ts`.
- Split the admin product surface into `AdminProductsPageFrame`, `AdminProductsFilters`, `AdminProductsDataState`, `AdminProductsOverview`, and `AdminProductsTable` so shell, controls, state feedback, overview panels, and responsive table rendering have separate ownership.
- Extracted checkout orchestration into `use-checkout-page-controller.ts` and moved the main step layout into `checkout-step-panel.tsx`; the page file now owns route-level loading, address, and invalid-state composition.
- Audited `packages/ui` and `packages/api-client` and found no contract-preserving change justified by current consumers; both remain unchanged.
- Scanned the remaining workspace for material frontend/API-client blockers. No related blocker was found; worker and database complexity findings remain outside the requested scope.

## Final validation

- `bun run typecheck` — passed.
- `bun run test` — 489 passed, 1 existing MinIO integration test skipped, 0 failed.
- Focused admin/web/UI/API-client tests — 226 passed, 0 failed.
- Targeted ESLint for `apps/admin/src`, `apps/web/src`, `packages/ui/src`, and `packages/api-client/src` — passed.
- Targeted Prettier check for changed/refactored files — passed.
- `git diff --check` — passed; Git emitted only existing Windows LF/CRLF normalization warnings.
- `bun run build` — passed for packages, API, web client/SSR, admin, and worker. Vite emitted the existing CJS API deprecation warning and a web chunk-size advisory.
- Full `bun run lint` remains red only because unrelated `scripts/script.js` has 16 pre-existing ESLint errors; no changed admin/web/UI/API-client file is implicated.
