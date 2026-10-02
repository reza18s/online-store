# NOVA Sitewide Reference Match Plan

## Goal and acceptance criteria

Bring every routed storefront and admin page represented by the Atelier Editorial reference boards into the same visual language while preserving each board's page hierarchy, responsive behavior, real content, and working actions. Inspect the full-page experience at desktop and phone widths; correct the largest visual differences and any broken controls encountered. Completion means every supplied board is mapped to its live route, all mapped routes have been compared against fresh runtime captures, material gaps are either fixed or recorded with an explicit external/data limitation, and all affected checks pass.

## Reference and route coverage

- Storefront discovery: `home.png`, `home-mobile.png`, and the three category references.
- Account and purchase: account dashboard, orders, profile, address list/create/edit, order tracking, return request, and return status.
- Editorial and service: about, article, campaign, care guide, contact, content page, FAQ, guide, lookbook, privacy, returns policy, shipping policy, size guide, support, terms, and trust.
- Admin: login, dashboard, orders, order detail, payments, customers, notifications, audit, catalog, categories, new product, product edit, inventory, inventory detail, content pages, page editor, SEO, and redirects.
- Shared components: all four component-library boards, checked against live navigation, buttons, forms, cards, filters, dialogs, tables, empty/error/loading states, and mobile navigation.

The board imagery is visual evidence, not product or workflow data. Product counts, prices, account/order records, staff access, and permissions must remain sourced from the application or its existing fixtures; do not invent persistent business data to fill a reference layout.

## Ownership and execution

- Use the existing routed page components and their owning stylesheets in `apps/web` and `apps/admin`; reuse shared UI and design tokens where the live application already defines them.
- Keep storefront routes, API contracts, authentication, role checks, URL state, RTL, and existing local edits intact.
- Capture representative routes first, then group fixes by shared shell/component and page family so each shared change improves its actual consumers.
- Work through storefront home and shared components, account/purchase, editorial/service, then admin. For each family, compare supplied boards with desktop and phone captures, implement cohesive fixes, and recheck interactions.
- Preserve user-owned untracked design references and unrelated dirty files. Stage only this plan and task-owned implementation/QA files.

## Validation

- Map each supplied board to a concrete route/state and note any board with no corresponding route or data state.
- Use the running apps and approved automated browser checks to capture full pages at desktop and phone sizes, inspect console/network/image failures, and test the visible primary actions, navigation, forms, filters, and dialogs for each family.
- Run the documented focused tests, type checks, lint, and builds for each changed app. Re-run affected checks after shared component changes.
- Record screenshot locations, tested actions, real-data limitations, and any unresolved route or reference gap in the sitewide QA report.
- Keep merge and publication behind the repository's required checks; do not integrate a candidate with failing required CI.

## Risks and constraints

- Some boards combine desktop and phone designs or show seeded records unavailable from the live local API. Compare equivalent regions and preserve honest empty/low-data states.
- Some admin routes require staff authentication or permissions. Verify access-safe unauthenticated and authorized states without bypassing existing gates.
- Current remote CI has a known lint failure in the untouched `scripts/script.js`; keep that unrelated dirty-file issue isolated while completing independent visual work and report its impact on merge readiness.
