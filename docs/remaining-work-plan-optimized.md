# NOVA — Remaining Work Plan (Token-Optimized)

> Compact execution source of truth for multi-agent delivery. Shared rules appear once; each task contains only its task-specific delta. Do not expand task prompts by repeating this file.

## 0) Current status

Baseline: `master @ 93495aa9ee250c8cce964a76dfdf992ed7d6a1c5` (latest verified merged baseline; DB-001 and SEC-001 are included).

Remote sync update (2026-09-12): read-only GitHub access is available again. `origin/master` resolves to `56f301fc79e1cebf57cf272f2a7750429bf9be50`; local `codex/integration` is ahead and has no remote branch, with the exact ahead count kept in live Git status; only PR #5 is currently open. No remote write was performed because push/PR mutation requires explicit authorization.

- `DB-001` — ✅ completed and merged through PR #1; exact `postgres:16-alpine` runtime was verified on 2026-09-10 in isolated Compose project `nova-pg-check-20260910`.
- `SEC-001` — ✅ completed and merged through PR #3; merge commit `93495aa9ee250c8cce964a76dfdf992ed7d6a1c5`.
- `API-001` — 🟡 follow-up contract revision is complete locally at `1f0237a19a8c4e0046af4cac3170e90433d080cb`; the existing PR #2 remains open at remote `17c0de0` because GitHub DNS prevented pushing the new commit.
- `WEB-001` — ✅ accepted and merged into local `codex/integration` at `dc54fee66f2100414e23c20077f532f8ea36e239` from Darwin's task commit `e998c08`; no remote PR was created because repository export/push access is blocked.
- `AUTH-001` — 🟡 functional slice plus bounded follow-up are implemented locally: `03261b0` contains the factor-aware staff/session behavior, `1d67976` completes legacy-shell mobile logout coverage, `c2a32d7` gates unfinished authenticated routes, `03ed76f` aligns the staff-login composition with the concrete design target, and `8aabae3` preserves the safe `expired=1` marker through the 401 redirect/route boundary. The current follow-up adds localized field validation and accessible invalid-email treatment. Chrome CDP captured default, invalid-email, session-expiry, loading and API-error states at exact `1440x900`/`390x844`; the expiry run recorded no `/v1/staff/auth` request and the error run used a browser-local synthetic `503`, while formal pixel comparison, full AT and authenticated login sign-off remain open.
- `ADMIN` route safety — ✅ authenticated unfinished admin routes are now gated behind an explicit non-operational state in `c2a32d7`; development-only unauthenticated preview remains available for Atelier review. Real API-backed admin page work is still open.
- `ADMIN-001` — 🟡 page-local catalog/inventory slice is implemented at task commit `0daabff` and locally integrated into `codex/integration` via cherry-pick `a0146b7` plus parent route/fix commit `ba864c6`. The bounded direct product-by-ID follow-up is now implemented in API commit `79ba858` and web commit `4e29bc2`: staff-role-protected `GET /v1/admin/catalog/products/{productId}` and a per-product browser query replace the old list-only lookup. Focused API/web tests, contract check, package typechecks, full web tests, builds and integration checks pass. Live authenticated operations and mobile/pixel QA remain open.
- `ADMIN-002` — 🟡 page-local order-operations slice is implemented at task commit `e11e087` and locally route-integrated on `codex/integration` via `2f533f2`; focused API/page tests and web validation pass, while live authenticated operations and pixel-level mobile QA remain open.
- `ADMIN-003` — 🟡 page-local support/finance inspection slice is implemented at task commit `3b9f58d` and locally integrated via `89cf11b` plus the shared route wiring `2f533f2`; focused tests and web validation pass, while live authenticated inspection and mobile/pixel QA remain open.
- `ADMIN-004` — 🟡 page-local content/SEO/redirect slice is implemented at task commit `e525ac8` and locally integrated into `codex/integration` via cherry-pick `ede0745` plus parent route/fix commit `ba864c6`. Focused page tests, web typecheck, targeted lint/format, diff-check and the client+SSR build pass. Live authenticated mutations and mobile/pixel QA remain open.
- `TEST-001` — ✅ deterministic follow-up commit `44dad93` passed both independent review axes and parent validation, then was merged locally in `f34cbb5`; the 2026-09-11 live recheck on isolated project `nova-pg-check-now-20260911` verified exact PostgreSQL 16/Redis 7, migrations, seed, Redis/API health, the default storefront root-shell preflight, worker health/startup and both provider-independent outbox paths: fail-closed retry and local-sender `PENDING → SENT`. The 2026-09-12 explicit-`DATABASE_URL` `test:concurrency` run against healthy PostgreSQL 16 verified one-success/one-conflict reservation behavior with exact cleanup and baseline restoration; the live `test:e2e` preflight verified API health/readiness plus the temporary Vite root shell; and the built SSR smoke verified robots, sitemap, public category/product routes and private/unknown noindex behavior. Playwright journeys, authenticated flows and external provider delivery remain explicitly blocked or not run.
- `OPS-002` — ✅ the bounded CI prerequisite plus provider-independent backup-verification slice is accepted and merged locally into `codex/integration` as `c4f2aa6` (verifier task head `05b5c89`). Two final independent review axes accepted the verifier/runbook. No remote PR was created because repository export/push access is blocked; live PostgreSQL restore and the broader deployment, encryption, retention, WAL, media, monitoring and rollback scope remain open.
- `OPS-001` — ✅ accepted and merged locally into `codex/integration` as `808dd7634a357eb45eb61da4e9b320c7146f2d62` from task commit `9e69d54d1dbec8355d308418ca61ebae9b4f284d`; focused worker validation passed. No remote PR was created because repository export/push access is blocked. The batched live gate now includes worker health and provider-independent outbox state-transition evidence; external provider delivery remains PROVIDER-002-owned.
- `SEO-001` — ✅ final content-sitemap follow-up `770c96e` passed both independent review axes and was merged locally into `codex/integration` as `27116b72`; the published-content consumer, catalog-boundary validation, safe failure behavior and deterministic sitemap limits are now integrated. The deadline follow-up `e6ca5e6` bounds document and sitemap API reads with a shared five-second default deadline and abort signal, and `5c468df` serializes public route data into the initial context and primes the matching TanStack Query keys before client mount to prevent duplicate public catalog/content reads. Focused tests (50/50 before the deadline follow-ups; 35/35 after them), package typechecks, lint/format and web client+SSR build passed. The 2026-09-12 live SSR smoke rechecked robots, catalog sitemap, home, public category/product routes and private/unknown noindex behavior against the user-started API; published CMS content and full browser/crawler coverage remain open.
- `CONTENT-001` — ✅ commit `a147aed` passed both independent review axes and parent validation, then was merged locally into `codex/integration` as `ba5bddc`; its published summary endpoint is now consumed by the SEO-001 sitemap integration. No visual reference is required; remote push/PR creation remains blocked by repository-export access.
- `WEB-002` — 🟡 discovery/cart slices are locally integrated through `36efd32` and `47cb203`, with parent route integration in `465ce07`; the bounded guest-cart conflict recovery follow-up is integrated in `b091396`, `4b0aa61` and `382fec4`; focused tests and web typecheck pass, while live/browser/mobile QA remains open.
- `WEB-003` — 🟡 account/orders/returns slice is locally integrated through `5df3fb8` and `465ce07`; focused tests and web typecheck pass, while live/authenticated/mobile QA remains open.
- `WEB-004` — 🟡 checkout/payment-recovery slice is locally integrated through `b7e18b4` and `465ce07`; the cart-scoped idempotency follow-up is integrated in `075b7bd`; focused tests and web typecheck pass, while provider/live-payment/browser QA remains open.
- `WEB-005` — 🟡 public content/system slice is locally integrated through `e4b756b` and `465ce07`; focused tests and web typecheck pass. The live built-SSR/API smoke on 2026-09-12 rechecked catalog-backed home/product/category rendering, robots and sitemap responses, plus private/unknown noindex behavior; published CMS content, authenticated admin mutation, mobile and pixel QA remain open.
- Current local integration — `codex/integration` contains the locally integrated storefront, admin, content and SEO slices plus the ADMIN-001 direct-detail contract follow-up (`79ba858` + `4e29bc2`) and the checkout/cart safety follow-ups (`075b7bd`, `1683bc1`, `b091396`, `4b0aa61`). Verify the exact branch tip and ahead count with live Git status; the parent branch has not been pushed because repository export/remote synchronization remains unavailable.
- Visual QA limitation — the supplied Atelier admin reference was adopted for the admin slices, and `output/design-artifacts/auth-staff-login-atelier.png` provides the AUTH-001 desktop/mobile design target. The parent now has exact `1440x900`/`390x844` captures for default, invalid-email, session-expiry, loading and API-error `#admin/login` states plus exact route/overflow evidence across `1440/1280/1024/768/390/360`; the expiry run recorded no staff-auth request and the error run used a browser-local synthetic `503`, while full AT verification and formal Chromium pixel comparison remain open gates. No external design artifact or source was transmitted to 12ui.
- CI — 🟡 the local workflow fix `32d105a` now generates the Prisma client before `Typecheck`; the current clean-checkout-equivalent sequence (`bun run db:generate` followed by `bun run typecheck`) passes. The historical `master`/PR #2 failures remain tied to remote revisions and cannot be re-confirmed or synchronized while repository export/remote access is blocked.
- Live execution ledger: [`docs/remaining-work-status.md`](remaining-work-status.md). Update it after every merge, dispatch, resume/stop, PR state change, validation result or blocker.
- Feature/provider/SEO/ops/test/QA/release tasks follow the dependency graph below.

Existing implementation already covers most backend/domain foundations, Prisma migrations/seed, catalog/search/facets, cart/merge, customer/staff auth backend, checkout/order/payment logic, inventory, coupons, notification outbox, fulfillment/returns, content/SEO APIs, browser transport, admin dashboard and admin products. Main remaining work is production-connected UI, provider adapters, remaining published-CMS-content and full browser/crawler coverage, runtime/E2E, QA, observability/recovery and launch readiness.

- `QA-001` — 🟡 audit and bounded owner fixes are integrated in `1bad6aa`; report `docs/design-qa.md` records the three findings, deterministic gates pass, and exact route/overflow plus staff-login keyboard/AX browser evidence is now available. Full AT and formal pixel gates remain unavailable.

---

## 1) Shared execution contract — applies to every task

### Git / ownership

1. Start from the **latest merged integration branch**; default is `master`.
2. Never branch from another agent's unmerged branch.
3. Run `git status --short` and `git branch --show-current` before editing; preserve pre-existing changes.
4. One task = one branch = one focused commit/PR unless the integration owner explicitly splits it.
5. Branch format: `codex/<TASK-ID>-<slug>`.
6. PR targets the current integration branch. Sub-agents **do not merge**.
7. Touch only `Own:` paths. Anything else => stop that edit and report `BOUNDARY ISSUE`.
8. No unrelated cleanup, global formatting, dependency upgrades or lockfile churn.
9. If remote/PR access is unavailable, preserve branch+commit, return exact PR title/body and report `PR BLOCKED`.

### Architecture / frontend

- Use the repository-pinned Bun version from `package.json/packageManager`; do not hard-code a Bun version in prompts.
- Preserve existing React/Vite, NestJS, Prisma/PostgreSQL, Redis, TanStack Query, Tailwind and `packages/ui` conventions.
- Reuse existing production contracts, query/mutation layers and design primitives; no duplicate client/state/design system.
- Server state stays in TanStack Query; transient UI state stays in React/Zustand.
- No scattered raw API calls inside visual components.
- Tailwind + existing tokens/primitives are the styling authority.
- Use logical CSS properties for RTL. Render phone/SKU/order/tracking/URL/payment-reference/coupon values in isolated `dir="ltr"` containers.
- Preserve Persian display copy unless the task explicitly owns copy changes.
- Require semantic HTML, heading order, keyboard/focus-visible, reduced motion, WCAG 2.2 AA and >=44px touch targets.
- Never replace a production path with mock/fixture/static preview data.

### Visual design gate

A task marked `Visual: required` follows this rule for every **new or materially changed** page/flow/state/component family:

1. Define the exact page, states, content and target viewport(s).
2. Inspect a user-supplied screenshot/reference when one exists; it is the primary fidelity constraint for that screen/state.
3. Create one concrete design image/mockup before visual implementation. If no exact user reference exists, generate the artifact from the relevant product/architecture brief with the available image/design capability; do not block only because the user did not supply an image.
4. Review the artifact in desktop and the relevant mobile RTL composition, then implement it with existing Tailwind/primitives and real contracts.
5. Render at the target viewport(s), compare against the design artifact/reference, and iterate until materially aligned.
6. Attach the artifact path/reference and same-viewport comparison evidence to the PR. The generated artifact is a visual target, not production data or runtime proof.
7. Keep one primary artifact per design decision; do not generate speculative variants or artifacts for non-visual work. If the required design capability or a necessary product constraint is genuinely unavailable, report the precise blocker before visual implementation.

### Security / data

- Never commit `.env`, production credentials, OTPs, tokens, secrets or raw provider payloads.
- Do not weaken auth, role, CSRF, money, inventory, payment or order-state semantics without a separate approved architectural change.
- Provider-unconfigured paths stay fail-closed; never present them as successful.
- Public/API breaking changes require an explicit report/versioning decision.
- Behavior changes require focused regression tests.

### Shared-file locks

Only one active owner may edit these at a time:

- `package.json` / lockfile
- Prisma migrations/schema
- `apps/web/src/app.tsx`
- global styles / Tailwind config
- `packages/ui/**`
- shared route registry

`WEB-001` owns the frontend shared-file window. Later page agents should remain page-local.

Narrow exception: SEO-001 may touch `apps/web/src/app.tsx`, `apps/web/src/shared/hash-route.ts` and their focused tests only to preserve the public content alias and metadata parity. It must not change unrelated shell/UI behavior; WEB-001 remains the owner of general shared frontend changes.

**SEC/API parallel lock:** while `SEC-001` and `API-001` run in parallel, these are owned by `SEC-001` and read-only to `API-001`:

- `apps/api/src/common/http/**`
- `apps/api/src/modules/auth/**`
- `apps/api/src/modules/staff-auth/**`
- `apps/api/src/modules/orders/orders-admin.controller.ts`

If API contract metadata is required there, `API-001` records `CONTRACT FOLLOW-UP`; apply it after SEC merge via the integration owner or a focused follow-up commit.

### Validation

Run the narrowest relevant validation during implementation. Before PR, select only the applicable root checks below; this is an option set, not a mandatory checklist:

```powershell
bun run typecheck
bun run lint
bun test
bun run build
bun run docker:config
```

For DB/API/worker tasks when applicable:

```powershell
bun run db:generate
bunx prisma migrate deploy
bun run db:seed
```

Rules:

- Before each command, report, artifact, delegation or review, identify the concrete question it answers and use the narrowest action that can answer it. Skip it when fresh trustworthy evidence already answers that question.
- Use one targeted discovery pass, one bounded implementation pass, one focused validation pass and one actual-diff review by default. Revisit a step only when relevant code/configuration/runtime state changes, a check fails, or risk requires stronger evidence.
- Select validation by changed surface: focused checks for isolated work; affected package/boundary checks for shared work; only the affected broader or runtime checks for integration/high-risk work. Full suites, builds, browser/render, Docker/DB and repeated audits are not ceremony to run on every task.
- Batch broad checks at merge-wave, release, visual or high-risk gates. Reuse passing evidence only after confirming that the later diff cannot affect its scope; rerun only invalidated checks.
- Never lower required coverage to save tokens. Narrow, batch or defer a required check to its correct gate, or report the exact blocker; do not mark an unrun check as PASS.
- Stop when the task acceptance criteria and required evidence are satisfied. Do not continue exploratory work "just in case" without a new question or risk signal.
- Never mark an unrun/failed check PASS.
- Separate sandbox/permission/network failures from code failures.
- `test:integration` / `test:e2e` may be reported PASS only after a real harness exists and executes.
- Exact PostgreSQL 16 runtime evidence is required where a task says so; another major version is not a substitute.

### Agent return contract

Return exactly:

```text
STATUS: completed | partial | blocked | failed
SUMMARY:
FILES CHANGED:
IMPLEMENTATION DETAILS:
TESTS / QA:
VALIDATION RUN:
VALIDATION RESULT:
ARCHITECTURE IMPACT:
ASSUMPTIONS:
RISKS / FOLLOW-UP:
PR:
BOUNDARY ISSUES:
```

---

## 2) Dependency graph

```text
BASELINE
  ├─ DB-001 ✅
  ├─ SEC-001 ───────────────┐
  └─ API-001 ──> WEB-001 ──┼─> AUTH-001
                            │      │
                            │      ├─> ADMIN-001..004
                            │      └─> WEB-003
                            │
                            ├─> WEB-002 / WEB-004 / WEB-005
                            ├─> SEO-001
                            └─> PROVIDER-003

DB-001 ─> PROVIDER-001 / PROVIDER-002 / PROVIDER-004
API-001 ─> PROVIDER-001 / PROVIDER-003 / TEST-001(start)
DB-001 + API-001 ─> CONTENT-001
PROVIDER-002 + DB-001 ─> OPS-001
DB-001 + provider decisions ─> OPS-002

Feature/provider merges ─> TEST-001(final)
CONTENT-001 ─> SEO-001(sitemap completion)
All UI + SEO ─> QA-001
TEST-001 + QA-001 + OPS-002 + accepted security/provider work ─> REL-001
REL-001 + provider/launch decisions ─> LAUNCH-001
```

### Waves

- **Wave 0 now:** review/merge `DB-001`; run `SEC-001` + `API-001` in parallel under the ownership lock.
- **Wave 1:** merge API; run/merge `WEB-001`; after SEC+API+WEB merge, run `AUTH-001`.
- **Wave 2:** run `ADMIN-001..004`, `WEB-002..005`, and selected `PROVIDER-001..004` in parallel where their dependencies/inputs are satisfied.
- **Wave 3:** `SEO-001`, `OPS-001`, `OPS-002`; `TEST-001` may build its skeleton earlier but can only finish against the integrated feature/provider runtime.
- **Wave 4:** `QA-001` -> `REL-001`.
- **Wave 5:** `LAUNCH-001` staging/reversible scope only.

---

## 3) Task index

| ID           | Depends on                                                        | Visual                       | Branch                                 |
| ------------ | ----------------------------------------------------------------- | ---------------------------- | -------------------------------------- |
| DB-001       | —                                                                 | no                           | `codex/db-001-prisma-runtime`          |
| SEC-001      | —                                                                 | no                           | `codex/sec-001-api-admin-boundary`     |
| API-001      | —                                                                 | no                           | `codex/api-001-contract-parity`        |
| WEB-001      | API-001                                                           | only if visuals change       | `codex/web-001-frontend-foundation`    |
| AUTH-001     | SEC-001, API-001, WEB-001                                         | required for new login UI    | `codex/auth-001-staff-session`         |
| ADMIN-001    | AUTH-001                                                          | required                     | `codex/admin-001-catalog-inventory`    |
| ADMIN-002    | AUTH-001, API-001                                                 | required                     | `codex/admin-002-orders-operations`    |
| ADMIN-003    | AUTH-001, SEC-001                                                 | required                     | `codex/admin-003-support-finance`      |
| ADMIN-004    | AUTH-001, API-001                                                 | required                     | `codex/admin-004-content-seo`          |
| WEB-002      | WEB-001, API-001                                                  | required for changed screens | `codex/web-002-discovery-cart`         |
| WEB-003      | WEB-001, AUTH-001                                                 | required                     | `codex/web-003-account-orders`         |
| WEB-004      | WEB-001, API-001                                                  | required                     | `codex/web-004-checkout-recovery`      |
| WEB-005      | WEB-001, API-001                                                  | required                     | `codex/web-005-content-system`         |
| PROVIDER-001 | DB-001, API-001, gateway decision                                 | no                           | `codex/provider-001-payment`           |
| PROVIDER-002 | DB-001, provider decision                                         | no                           | `codex/provider-002-sms-notifications` |
| PROVIDER-003 | API-001, shipping policy                                          | no                           | `codex/provider-003-shipping`          |
| PROVIDER-004 | DB-001, storage decision                                          | no                           | `codex/provider-004-media-storage`     |
| SEO-001      | API-001, WEB-001                                                  | no redesign                  | `codex/seo-001-ssr-indexability`       |
| CONTENT-001  | DB-001, API-001                                                 | no                           | `codex/content-001-published-index`    |
| OPS-001      | DB-001, PROVIDER-002                                              | no                           | `codex/ops-001-worker-observability`   |
| OPS-002      | DB-001, provider decisions                                        | no                           | `codex/ops-002-backup-restore`         |
| TEST-001     | DB-001, API-001 to start; integrated features/providers to finish | no                           | `codex/test-001-commerce-e2e`          |
| QA-001       | all UI + SEO tasks                                                | uses supplied refs           | `codex/qa-001-responsive-rtl`          |
| REL-001      | TEST-001, QA-001, OPS-002 + accepted security/provider work       | no                           | `codex/rel-001-release-audit`          |
| LAUNCH-001   | REL-001, providers, launch decisions                              | no                           | `codex/launch-001-staging-readiness`   |

---

# 4) Task deltas

> Give an agent **Section 1 + its task section only**. The head agent keeps Sections 0–6. Do not paste every task into each sub-agent prompt.

## DB-001 — Prisma/PostgreSQL/Redis runtime ✅

**Status:** ✅ completed and merged in PR #1; exact `postgres:16-alpine` is now verified healthy in isolated Compose project `nova-pg-check-20260910` on host port `55432`. All six Prisma migrations applied, seed completed, and PostgreSQL 16.15 returned the expected base counts. Earlier Docker Hub access failures are resolved for this run; the unrelated `docker-postgres-1` container remains untouched.

**Goal:** prove a clean machine can start exact `postgres:16-alpine` + `redis:7-alpine`, generate Prisma, deploy migrations in order, seed, and pass readiness checks.

**Own:** `packages/db/prisma/**`, `packages/db/prisma.config.ts`, safe DB scripts in package files, `infra/docker/**`, `docs/runbooks/local-development.md`, focused DB/infra tests.

**Must:** compose config; isolated exact-version startup; `db:generate`; `migrate deploy`; seed; migration history/seed counts; `/health/live`; `/health/ready`; Redis connectivity. External image/proxy/permission failure => exact `BLOCKED` evidence, never substitute another Postgres major.

**Accept:** reproducible clean workflow or reproducible external blocker; migrations not reordered/deleted/destructively changed; Prisma config/seed work with declared repo version.

**PR:** `chore(DB-001): verify Prisma and local runtime workflow`

---

## SEC-001 — API/admin security boundary

**Status:** completed and merged in PR #3; admin order responses redact `payment.redirectUrl` and the focused security regression coverage passed.

**Goal:** audit/fix scoped customer/staff/admin auth, authorization, CSRF, error/redaction boundaries, especially unnecessary `payment.redirectUrl` exposure.

**Own:** `apps/api/src/common/http/**`, `modules/auth/**`, `modules/staff-auth/**`, `orders/orders-admin.controller.ts` + focused tests; `payments/**` only for response-redaction tests; focused security ADR if needed.

**Must:** customer/staff isolation; deny-by-default roles; exact-origin/double-submit CSRF; bounded errors; no OTP/session/provider/raw leakage; redact admin `payment.redirectUrl` if exposure is demonstrated while preserving dedicated payment-inspection contract; regression-test every changed boundary.

**Do not:** implement providers, alter schema, frontend, unrelated order rules or credentials.

**Accept:** no validated scoped sensitive exposure; auth/CSRF/role tests pass; no weakened public contract/raw provider payload.

**PR:** `fix(SEC-001): harden API and admin response boundaries`

---

## API-001 — API contract/OpenAPI/client parity

**Status:** follow-up contract revision complete locally on branch `codex/api-001-contract-parity` at `1f0237a`; contract `14/14`, package tests `38/38`, focused orders/payments tests `6/6`, typecheck and build pass. PR #2 remains open at the older remote SHA because GitHub DNS blocked the push; it must be refreshed/reviewed/merged before WEB-001.

**Goal:** establish one stable producer/consumer contract across Nest DTO/controllers, error envelope and `@nova/api-client`.

**Own:** `packages/api-client/**`, API DTO/controller metadata outside the SEC parallel lock, OpenAPI source/spec/validation, required scripts, relevant ADR/docs.

**Must:** inventory `/v1`; document request/response/auth/pagination/idempotency/error codes; additive/versioned public changes only; generated artifacts must derive from a source of truth; contract tests for catalog facets, cart merge conflict, checkout, customer orders, admin orders/payments/content and health.

**Parallel constraint:** SEC-owned files are read-only until SEC merges; record `CONTRACT FOLLOW-UP` for metadata needed there.

**Accept:** frontend agents have one reviewable contract; runtime paths/types agree; parity validation runs locally/CI.

**PR:** `feat(API-001): stabilize API contract and client parity`

---

## WEB-001 — frontend ownership/Tailwind foundation

**Status:** ✅ accepted and merged locally into `codex/integration` as `dc54fee66f2100414e23c20077f532f8ea36e239`; task commit `e998c08` on `codex/web-001-frontend-foundation`. No remote PR was created because repository export/push access is blocked. The bounded extraction covered the shared route, icon and shell ownership hotspots without a material visual redesign; parent validation confirmed existing routes and behavior remain intact.

**Goal:** reduce `apps/web/src/app.tsx` conflict risk and establish page-local ownership without broad rewrite or visual regression.

**Own:** `apps/web/src/app.tsx`, `apps/web/src/styles.css`, `packages/ui/**`, Tailwind config, narrow route/helpers/tests.

**Must:** extract only clear ownership boundaries; preserve URLs/runtime; make later agents page-local under existing feature structure; consolidate duplicated tokens into existing authority; preserve approved dashboard/products, RTL, mixed direction, state primitives and reduced motion; add route/render tests if wiring changes.

**Do not:** API/domain/Prisma/provider work, redesign approved screens, unrelated dependency upgrades.

**Accept:** storefront + `#admin` + `#admin/products` remain reachable; later page agents can avoid shared files; no second styling/design system.

**PR:** `refactor(WEB-001): establish frontend ownership boundaries`

---

## AUTH-001 — staff login/MFA/session guard

**Status:** 🟡 functional slice plus bounded follow-up implemented locally in `03261b0` and `1d67976`; authenticated unfinished admin routes are gated by the related safety follow-up `c2a32d7`; the visual composition follow-up is integrated in `03ed76f`. The current parent follow-up adds localized field validation and accessible invalid-email treatment; Chrome CDP captured default, invalid-email, session-expiry, loading and API-error states at exact `1440x900`/`390x844`, with no staff-auth request during expiry and a browser-local synthetic `503` for the error state. Formal pixel comparison, full keyboard/AT behavior and authenticated login remain required for final sign-off. The slice connects the existing backend endpoints, opaque cookie transport, CSRF, staff roles and session hooks to a factor-aware form, central admin guard, logout/cache cleanup, expiry/403 handling and focused route/session tests.

**Goal:** connect real staff password/TOTP session lifecycle, logout, expiry and protected admin routing while keeping customer/staff sessions separate.

**Own:** web auth/admin session/guard boundary, WEB-001 route wiring, focused tests; `api-client` only for a proven post-API-001 gap.

**Must:** opaque API session only; never store password/OTP/TOTP secret; handle invalid credentials, rate limit, lock, MFA required/invalid, expiry, logout, permission denied; isolate/clear admin caches; protect admin routes.

**Visual:** `output/design-artifacts/auth-staff-login-atelier.png` is the single concrete target; use it for the remaining exact-viewport, required-state and accessibility sign-off.

**Accept:** unauthenticated admin -> real login; password+MFA establishes staff session; logout/expiry clears protected data; route/cache tests pass.

**PR:** `feat(AUTH-001): connect staff MFA session and admin route guard`

---

## ADMIN-001 — catalog/inventory

**Goal:** production-connected product create/edit, variants, media, categories, inventory and stock movements.

**Own:** page-local admin catalog/inventory components, `admin-catalog-api.ts`, `admin-inventory-api.ts`, coordinated route registration, focused tests/QA evidence.

**Must:** real hooks; optimistic `updatedAt`; lifecycle/role validation; draft/invalid/saving/saved/publish-blocked; upload failure; low-stock/discrepancy; empty/table error.

**Direct-detail follow-up:** the page's existing-product editor now reads a single product through the staff-role-protected `GET /v1/admin/catalog/products/{productId}` contract, with encoded client paths, a distinct per-product query key and invalidation on catalog mutations. The API validates and normalizes the identifier, returns the existing redacted detail shape and preserves the established `support`/`operations`/`admin` role boundary. The follow-up is locally integrated in `79ba858` and `4e29bc2`; live authenticated/browser evidence remains a separate gate.

**Visual:** one design artifact is required per new or materially changed page/state; use a supplied reference when available or generate it before code.

**Accept:** product/variant/media/taxonomy/inventory actions hit real API; no static preview with staff session; each visual surface has a design artifact and rendered comparison evidence.

**PR:** `feat(ADMIN-001): connect admin catalog and inventory workflows`

---

## ADMIN-002 — orders/fulfillment/returns/refunds

**Goal:** real order list/detail, fulfillment, shipment/tracking, return review and refund actions.

**Own:** page-local admin order/fulfillment/return/refund UI, `admin-orders-api.ts`, focused tests/QA evidence.

**Must:** real pagination/search/status filters; role-aware actions; optimistic concurrency/stable errors; immutable snapshots; no redirect/raw provider payload; paid/pending/preparing/shipped/delayed/exception/delivered/cancelled/returned + refund pending/failed/success; confirmation + reason for consequential actions.

**Visual:** one design artifact is required for list/detail/return/refund states; use a supplied reference when available or generate it before code.

**Accept:** authorized staff operate real fulfillment/shipment/returns/refunds; unauthorized/stale actions reject safely and remain auditable.

**PR:** `feat(ADMIN-002): implement admin order operations workflows`

---

## ADMIN-003 — payments/customers/notifications/audit

**Goal:** safe support/finance inspection against redacted APIs.

**Own:** page-local payment/customer/notification/audit UI, corresponding `admin-*-api.ts`, focused tests/QA evidence.

**Must:** bounded pagination/filters; permission/session/loading/empty/error states; no raw callbacks/secrets/OTP/provider credentials/job internals/unnecessary PII; safe encoded cross-links.

**Visual:** one design artifact is required before implementation; use a supplied reference when available or generate it from the task brief.

**Accept:** intended roles can inspect intended data; support cannot see operations-only sensitive data; list/detail/error states use real APIs.

**PR:** `feat(ADMIN-003): connect admin support and finance inspection`

---

## ADMIN-004 — content/SEO/redirects

**Goal:** real admin content pages, SEO metadata and redirect management using existing audited optimistic-concurrency APIs.

**Own:** page-local content/SEO/redirect UI, `apps/web/src/features/content/content-api.ts`, focused tests/QA evidence.

**Must:** draft-first transitions; usable-content-before-publish; slug policy; site-relative destinations; cycle rejection; `updatedAt` conflicts; saving/saved/validation/publish-blocked/permission/error/empty; bounded typed JSON blocks; no unsafe HTML.

**Visual:** one design artifact is required before implementation; use a supplied reference when available or generate it from the task brief.

**Accept:** staff can create/edit/publish/manage SEO/redirects through real API; errors preserve unsaved work; mutations audited; stale editors recover safely.

**PR:** `feat(ADMIN-004): implement admin content and SEO workflows`

---

## WEB-002 — storefront discovery/cart

**Status:** 🟡 locally integrated through task commits `36efd32` and `47cb203`, with parent route wiring in `465ce07`. Focused discovery/cart tests and web typecheck pass; live/browser/mobile QA remains open.

**Goal:** finish real home/category/PLP/search/PDP/cart states without hard-coded product truth.

**Own:** page-local catalog/cart UI, `catalog-api.ts`, `cart-api.ts`, coordinated route wiring, focused tests/QA.

**Must:** contextual server facets; preserve stale selected values; hide inventory quantities; loading/slow/empty/error/offline; variant missing; low/out-of-stock; price change; cart conflict; coupon success/error/recalculation; Persian normalization; compare-at invariant; URL state/cache invalidation.

**Visual:** one design artifact is required for materially changed or missing PLP/PDP/cart screens; use a supplied reference when available or generate it before code.

**Accept:** real API read/write; shareable filter/sort/page URLs without duplicate requests; keyboard/RTL-safe critical states.

**PR:** `feat(WEB-002): complete storefront discovery and cart states`

---

## WEB-003 — account/orders/tracking/returns

**Status:** 🟡 locally integrated through task commit `5df3fb8` and parent route wiring `465ce07`. Focused account tests and web typecheck pass; live/authenticated/mobile QA remains open.

**Goal:** finish customer account, addresses, orders, tracking and return journeys on customer-scoped APIs.

**Own:** account/address/order page-local features, address modules, `orders-api.ts`, coordinated route wiring, focused tests/QA.

**Must:** default/loading/empty/error/offline/permission/expiry/success; server-enforced ownership; never leak another customer's order/cached cart; LTR isolate identifiers; clear protected cache on logout/customer switch/expiry.

**Visual:** one design artifact is required before implementation; use a supplied reference when available or generate it from the task brief.

**Accept:** customer manages addresses, list/details orders and eligible returns through real APIs; delivered/expired/ineligible states clear and safe.

**PR:** `feat(WEB-003): complete customer account and order journeys`

---

## WEB-004 — checkout/payment recovery

**Status:** 🟡 locally integrated through task commit `b7e18b4` and parent route wiring `465ce07`. Focused checkout tests and web typecheck pass; provider/live-payment/browser QA remains open.

**Goal:** production-connected address/shipping/quote/coupon/payment/confirmation with explicit recovery for every commerce failure state.

**Own:** page-local checkout features/components, coordinated checkout routing, focused query/cart/checkout tests + QA.

**Must:** authoritative quote; stable idempotency; normalized coupon; server errors; saved/new/invalid address; unsupported region; shipping unavailable; quote expired; stock conflict; price change; offline; processing/redirecting; payment pending/failed/cancelled/timeout/recovery/confirmation; local payment remains fail-closed; recover from query params without duplicate submit.

**Visual:** one design artifact is required for all new checkout/payment states; use a supplied reference when available or generate it before code.

**Accept:** browser cannot cause duplicate order/payment via duplicate submit/callback; every failure has safe next action; confirmation uses authoritative order data only.

**PR:** `feat(WEB-004): complete checkout and payment recovery states`

---

## WEB-005 — public content/system states

**Status:** 🟡 locally integrated through task commit `e4b756b` and parent route wiring `465ce07`. Focused content tests and web typecheck pass; the isolated live SSR/API probe verified catalog-backed public rendering, robots, sitemap and fail-closed missing-content behavior. A disposable published/draft CMS fixture crawl also verified published-only summary/sitemap/SSR discovery and fail-closed draft behavior. Real deployment CMS data, authenticated admin mutation, mobile and pixel QA remain open.

**Goal:** replace preview policy/editorial data with published content API and complete not-found/error/offline/maintenance behavior.

**Own:** page-local content/system-state UI, `content-api.ts`, coordinated routing, focused rendering/transport tests + QA.

**Must:** published blocks only; missing/unpublished safe; loading/not-found/API-error/offline/maintenance/retry; site-relative encoded links; canonical path semantics; no unsafe/unbounded HTML.

**Visual:** one design artifact is required for new or changed public/system pages; use a supplied reference when available or generate it before code.

**Accept:** no fake preview when published API content exists; system routes reachable/keyboard/RTL-safe.

**PR:** `feat(WEB-005): connect public content and system states`

---

## PROVIDER-001 — payment gateway

**Blocked input:** selected Iranian gateway + sandbox docs/credentials outside Git.

**Goal:** selected provider behind existing `PaymentGateway` for start, callback verification, refund, timeout and reconciliation.

**Own:** gateway interface only for proven gaps, provider adapter, payment/checkout wiring, redacted fake fixtures/tests, env names, ADR.

**Must:** toman conversion only inside adapter with provider unit documented; verify signatures/IDs; reject tampering; dedupe callback event IDs; late-callback/refund reconciliation; no raw logs/secrets; sandbox tests for success/failure/cancel/timeout/duplicate/invalid-signature/refund-failure.

**Accept:** replaceable adapter, no SDK types leak to domain, existing payment tests remain valid, failure observable + fail-closed.

**PR:** `feat(PROVIDER-001): add selected payment gateway adapter`

---

## PROVIDER-002 — SMS/notification sender

**Blocked input:** selected provider + sandbox docs/credentials outside Git.

**Goal:** connect OTP delivery + notification outbox to provider while preserving cooldown/retry/lease/dedupe/redaction.

**Own:** OTP delivery/provider boundary, worker provider boundary, adapter files, env validation/tests/runbook.

**Must:** OTP never returned/stored in browser; bounded secret-free errors; preserve dedupe/lease/retry/terminal failure; tests for timeout/retry/duplicate protection/permanent failure.

**Accept:** OTP/payment notifications reach adapter; worker logs/metrics expose stable outcome codes only; unconfigured provider fail-closed.

**PR:** `feat(PROVIDER-002): add SMS and notification delivery adapters`

---

## PROVIDER-003 — shipping

**Blocked input:** provider, supported provinces, pricing, return-shipping policy, sandbox/test mode.

**Goal:** selected provider behind `ShippingProvider` for quote, ETA and tracking where supported.

**Own:** shipping interface for proven gaps, adapter, required checkout/shipment wiring, tests/env/ADR/runbook.

**Must:** provider details stay behind interface; validate province/method/amount; bounded timeout/errors; checkout quote remains authoritative; tests for unsupported region/timeout/price change/standard-express/tracking failure.

**Accept:** checkout quotes or fails safely; provider units/labels do not leak into domain; local fixed policy only explicit local/test adapter.

**PR:** `feat(PROVIDER-003): add selected shipping provider adapter`

---

## PROVIDER-004 — object storage/media

**Blocked input:** storage ownership/region/bucket policy + sandbox access outside Git.

**Goal:** secure S3-compatible media storage connected to admin media records.

**Own:** catalog media service/controller boundary, storage adapter, admin media transport only for proven contract gap, env/tests/runbook.

**Must:** validate MIME/size/ext/dimensions/key ownership; short-lived/signed operations where appropriate; no credentials; preserve primary-image deletion and alt-text rules; upload/orphan/duplicate/derivative-failure tests.

**Accept:** admin media can use real adapter; public URLs safe/cacheable; outage leaves DB/media state consistent.

**PR:** `feat(PROVIDER-004): connect secure object storage media pipeline`

---

## SEO-001 — SSR/hybrid/indexability

**Status:** ✅ final follow-up task commit `770c96e` passed both independent review axes and was merged locally into `codex/integration` as `27116b72`. The local deadline follow-up `e6ca5e6` and public-data hydration follow-up `5c468df` are also committed. The completed slice consumes the published CONTENT-001 summary index, validates catalog/content source boundaries, fails closed on malformed or unavailable sources, bounds sitemap work to standard single-document limits, adds a shared five-second default deadline for document and sitemap API reads, primes matching TanStack Query keys with public SSR data before client mount, and preserves the existing client UI/hash routes. Focused tests `50/50` before the follow-ups and `35/35` after them, web/api-client/api typechecks, targeted lint/format and the web client+SSR production build passed. The 2026-09-11 isolated live SSR/API probe passed robots, catalog sitemap, home, product and category responses; missing published content returned 404/noindex/no-store. A disposable published/draft CMS fixture crawl confirmed published-only summary/sitemap/SSR discovery and fail-closed draft behavior; real deployment CMS content and full browser/crawler coverage remain open.

**Goal:** smallest reversible SSR/prerender/hybrid path that gives important public routes useful initial HTML + deterministic metadata.

**Own:** Vite/server/render entries, content integration as needed, sitemap/robots/structured-data source, one rendering ADR/runbook, focused tests.

**Must:** no preference-driven framework rewrite; use catalog/content truth + `GET /v1/seo/resolve`; canonical/redirect/title/description/OG; JSON-LD where appropriate; robots + XML sitemap; safe empty/error; no duplicated hydration metadata; document cache/revalidation and noindex private routes.

**Accept:** home/category/product/published-content initial HTML useful; canonical/redirect/sitemap/robots deterministic/tested; client routing preserved.

**PR:** `feat(SEO-001): add hybrid rendering and indexability foundation`

---

## CONTENT-001 — authoritative published-content index

**Status:** ✅ commit `a147aed` passed independent Standards and Spec review, parent validation, and was merged locally into `codex/integration` as `ba5bddc`. This is an API/OpenAPI contract task with no visual reference or provider dependency.

**Start deps:** DB-001 + API-001. **Completion deps:** satisfied by the SEO-001 sitemap integration and independent API contract review; the local integration merge is `27116b72`.

**Goal:** expose a safe, published-only content summary index so the SEO sitemap can discover every eligible public content page without an optional deployment manifest.

**Own:** public content service/controller, typed `@nova/api-client` response, OpenAPI route/schema, focused API/client contract tests and one bounded ADR/update note if required.

**Must:** unauthenticated `GET /v1/content/pages`; only `PUBLISHED` records; only slug/title/updatedAt-style sitemap-safe fields; deterministic order; no body/blocks/draft leakage; preserve `/v1/content/pages/:slug`; keep the response envelope and route inventory aligned.

**Accept:** the endpoint is covered by focused source/service/contract tests, API typecheck/build/lint/format pass, OpenAPI references resolve, and SEO can consume the typed list without fake or incomplete content discovery.

**PR:** `feat(CONTENT-001): add published content index contract`

---

## OPS-001 — worker observability

**Status:** ✅ locally accepted and merged into `codex/integration` as `808dd7634a357eb45eb61da4e9b320c7146f2d62` from task commit `9e69d54d1dbec8355d308418ca61ebae9b4f284d`. The bounded implementation is limited to worker observability/lifecycle behavior, focused tests and its runbook; no remote PR was created because repository export/push access is blocked. The batched live gate verified worker health/startup and provider-independent retry plus local-sender `PENDING → SENT` transitions; external provider delivery and database concurrency remain separate follow-up gates.

**Goal:** production-like safe/observable notification worker; provider implementation remains PROVIDER-002-owned.

**Own:** `apps/worker/src/**`, worker scripts/config, worker-owned health/metrics/logging, tests/runbook.

**Must:** preserve lease/retry delay/max-attempt/idempotency/terminal-failure semantics; secret-free claimed/sent/retried/failed counters/logs; safe SIGINT/SIGTERM, DB disconnect, tick failure, backpressure; smoke/health command.

**Accept:** real outbox start/process/retry/shutdown works; no secret leakage; tests cover duplicate workers/lease expiry/terminal failure.

**PR:** `feat(OPS-001): harden notification worker operations`

---

## OPS-002 — CI/deployment/backup/monitoring

**Status:** ✅ the CI prerequisite and bounded PostgreSQL backup/restore verifier are accepted and merged locally into `codex/integration` as `c4f2aa6`. The verifier task head is `05b5c89`; two final independent review axes accepted its environment-only credential boundary, safe database selection, pinned endpoint/cluster identity, atomic archive publication, broad target sanity checks and explicit operator-maintenance gate. No remote PR was created because repository export/push access is blocked. Live backup/restore evidence and the broader deployment, encryption, retention, WAL, media, monitoring and rollback scope remain open.

**Goal:** reproducible CI, staging config, probes, monitoring, backup ownership and executed restore/rollback evidence.

**Own:** CI workflows, `infra/deploy/**`, `infra/monitoring/**`, deployment-safe Docker corrections, runbooks/env validation.

**Must:** CI typecheck/lint/test/build/docker/migrations as applicable; define live/ready semantics without optional provider false-failures; encrypted DB/media backup/retention/ownership/restore/rollback; alerts for stale pending payments, failed/refund backlog, notification failure, reservation expiry, backup age, readiness; execute isolated restore drill. The accepted verifier is intentionally only the provider-independent archive/restore safety slice: full mode needs authorized PostgreSQL 16 credentials, a separate cluster, `pg_control_system()` access, and `NOVA_BACKUP_RESTORE_TARGET_EXCLUSIVE_APPROVAL=approved`; missing provider/operational decisions remain `BLOCKED`.

**Accept:** clean PR gets reproducible CI; the bounded verifier is executable and safety-reviewed; production restore/rollback is executable and evidence-backed only after the provider/owner/runtime gates are completed; no secret/irreversible production action.

**PR:** `chore(OPS-002): add CI and recovery readiness`

---

## TEST-001 — integration/E2E/concurrency

**Status:** ✅ follow-up commit `44dad93c54c3510241b1d7cba1db2348443520c7` passed both independent review axes and parent validation, then was merged locally in `f34cbb5`. Parent validation passed runner tests `3/3`, typecheck, lint, format and the full deterministic matrix (`8` suites, `131` tests) at that historical snapshot; the current integrated matrix is `8` suites and `137` underlying tests. The 2026-09-11 live recheck on isolated project `nova-pg-check-now-20260911` passed exact PostgreSQL 16/Redis 7 health, six migrations, idempotent seed, API liveness/readiness and the default storefront root-shell preflight after the Vite IPv4 bind correction. The worker health/startup path, a synthetic provider-unconfigured retry, and a real producer/consumer local-sender `PENDING → SENT` lifecycle were also observed live. The follow-up provider-independent checks then passed Compose config, checkout `11/11`, worker/outbox `12/12` and payment fail-closed `14/14`. On 2026-09-12, the explicit-`DATABASE_URL` `test:concurrency` harness ran against healthy PostgreSQL 16 and verified exactly one successful reservation plus one insufficient-stock conflict, persisted rows, exact baseline restoration and zero synthetic-row residue. Playwright journeys, authenticated flows and external provider delivery remain `BLOCKED` or `NOT RUN`.

**Start deps:** DB-001 + API-001. **Completion deps:** integrated feature/provider paths required by the asserted journeys.

**Goal:** executable runtime coverage for real API/web flows and commerce race/error matrix.

**Own:** integration/e2e test locations, test scripts/config, explicit test fake adapters/fixtures, test-only Docker.

**Must:** exact Postgres16/Redis where available; cover catalog/search/facets, cart/merge, reservation/final-stock race, checkout idempotency, price/stock conflict, payment success/failure/cancel/timeout/duplicate/delayed/late/refund, order transitions, OTP/staff MFA/CSRF/roles, notifications; Playwright critical storefront/account/checkout/order/admin journeys; isolated safe cleanup; fake deterministic providers + separate sandbox smoke hooks.

**Accept:** expose `test:integration`/`test:e2e` only when real harness exists; critical races/duplicates executable; browser tests prove runtime wiring, not component existence. The separate `test:concurrency` command is a live, mutating disposable-PostgreSQL check and requires explicit `DATABASE_URL`; it does not claim provider or browser coverage.

**PR:** `test(TEST-001): add commerce integration and E2E harness`

---

## QA-001 — responsive/RTL/a11y/visual regression

**Status:** 🟡 audit plus bounded owner fixes are integrated in `1bad6aa` from baseline `465ce07`; James (`01a09128-5e2b-7921-84e6-47f28a1844e8`) recorded the evidence in `docs/design-qa.md`, `03ed76f` closes the previously recorded staff-login composition variance at the available default viewport, and the 2026-09-12 parent recheck verified exact-width route/overflow bounds with one mobile-navigation owner fix. Deterministic web/integration gates, exact viewport layout/overflow checks, and bounded exact staff-login default/invalid-email/session-expiry/loading/API-error captures passed, while formal pixel comparison, full keyboard/AT, authenticated/provider state journeys and release evidence remain `NOT RUN` or `BLOCKED`.

**Goal:** independent integrated frontend quality gate; only small clearly owned fixes may land here, otherwise return findings to owner.

**Own:** QA tests/fixtures/reports, small validated page fixes, `design-qa.md`, accessibility/browser config.

**Must:** widths `1440/1280/1024/768/390/360`; RTL/mixed-LTR/no overflow; keyboard/focus/landmarks/reduced-motion/touch target; long Persian/large prices/realistic data; state matrix including default/loading/empty/error/offline/validation/success/permission/expiry/stock-conflict/price-change/payment/refund states; same-viewport comparison against the task's design artifact (using a supplied reference when available or a generated mockup otherwise); record capture limitations.

**Accept:** no P0/P1 a11y/RTL/overflow/broken-route issue; every visual PR has its design artifact and rendered comparison evidence; no unsupported pixel-perfect claims.

**PR:** `test(QA-001): complete responsive RTL and accessibility QA`

---

## REL-001 — final release audit

**Status:** 🟡 read-only audit completed with release blocked. The authenticated unfinished-route preview finding was addressed locally in `c2a32d7`, the SSR request-deadline finding in `e6ca5e6`, and the duplicate public SSR/client read finding in `5c468df`; live authenticated/provider evidence, recovery/deployment proof, visual QA and exact-candidate remote CI remain open. The provider-independent database reservation concurrency gate is now verified separately by `test:concurrency`.

**Goal:** independently verify integrated branch against security, contract, data-integrity, accessibility, performance and completion gates.

**Own:** audit/checklists, focused tests or approved narrow fixes, dependency/bundle/contract validation config, release docs.

**Must:** inspect real diff/ownership/generated artifacts/lockfile/runtime wiring/PR scope; no secret/raw payload/unsafe redirect/unauthorized exposure; check bundle, duplicate requests, N+1, cache invalidation, slow/error/offline, transactions/idempotency; run all applicable checks and label each `PASS | FAIL | PRE-EXISTING FAILURE | NOT RUN | BLOCKED`; reject mock-only/unreachable/unverified/out-of-scope work.

**Accept:** every applicable completion gate has evidence; blockers/decisions explicit; no task-caused validation failure.

**PR:** `test(REL-001): add final release audit evidence`

---

## LAUNCH-001 — staging/controlled launch readiness

**Goal:** reversible staging release with health/database/queue/storage/payment-sandbox/support/SEO/monitoring verification; stop before irreversible production action.

**Own:** `infra/deploy/**`, staging/launch runbooks, release checklist/dashboards/config, smoke scripts.

**Must:** resolve brand/domain/assortment/hosting/payment/SMS/shipping/storage/privacy/terms/support/budget/margin decisions; execute deploy/migration compatibility/safe smoke/rollback/restore/provider-timeout/network checks; verify critical web/admin/API/storage/worker/DB/payment-sandbox/monitoring/backup-age paths; define limited assortment/inventory and acquisition/payment/refund/return/margin metrics.

**Never without explicit approval:** production DNS, real payment capture, live customer data, irreversible migration.

**Accept:** staging reproducible; rollback+restore actually executed; critical smoke checks have PASS/BLOCKED evidence; launch recommendation includes risks/owner/rollback trigger.

**PR:** `chore(LAUNCH-001): prepare staging and controlled launch gate`

---

## 5) Merge order / integration policy

1. `DB-001` is merged and its exact PostgreSQL 16 runtime gate is verified in isolated project `nova-pg-check-20260910`; keep that evidence separate from the unrelated legacy Docker stack.
2. `SEC-001` is merged; push, review and merge the locally accepted `API-001` revision in PR #2 after GitHub DNS is available.
3. WEB-001 is accepted and merged locally; push/create its PR when repository access is available, then keep its shared-file ownership frozen.
4. Complete the AUTH-001 visual gate against the adopted staff-login artifact at the required viewports and states; the composition follow-up is locally committed in `03ed76f` and the available default-viewport CUA check is aligned. Then smoke real protected admin routing and push/create its PR when repository access is available.
5. Run eligible admin/storefront/provider tasks in parallel. Every visual task must create or adopt its design artifact before code; do not skip the design gate or use the artifact as a substitute for runtime QA.
6. SEO-001 and CONTENT-001 are accepted and merged locally in `27116b72`, and the bounded OPS-002 verifier is merged in `c4f2aa6`; push/create their PRs when repository access is available, then run the batched worker/DB/API/browser/crawler gate. Execute the OPS-002 full restore verifier only after its separate-cluster, PostgreSQL 16 and exclusive-maintenance inputs are approved.
7. Review the completed `TEST-001` evidence against the integrated runtime; retain `BLOCKED`/`NOT RUN` labels for unavailable live gates.
8. Review the completed `QA-001` report and land only the bounded A11Y owner fixes; browser/AT/pixel evidence remains a separate gate.
9. `REL-001` is the final gate after the A11Y follow-ups and applicable live/runtime evidence. Do not advance with task-caused failures, unreachable routes, secret exposure, unresolved migration/security/provider gaps or unverified required visuals.
10. `LAUNCH-001` remains staging/reversible until separate explicit production authority is provided.

---

## 6) PR checklist

```markdown
## Objective / scope

## Files changed

## Contract / migration / security impact

## Visual design artifact + viewport evidence

<!-- create/adopt the required design artifact before visual implementation; a missing user reference is not itself a blocker -->

## Tests / validation

<!-- Select only checks whose scope can be affected; this is not a default run-all list. -->
- [ ] focused tests (when behavior changed)
- [ ] typecheck (when typed code/contracts changed)
- [ ] lint/format (when applicable to changed files)
- [ ] package/root test (when affected by the change or required by its gate)
- [ ] build (when bundling/exports/integration/release risk requires it)
- [ ] Docker/DB/runtime (only when the task changes or claims those paths)

Record `PASS | FAIL | PRE-EXISTING FAILURE | NOT RUN | BLOCKED` for selected checks and for any required check that was not run, with a concise reason. Do not enumerate unrelated checks or repeat a passing check unless its relevant scope was invalidated.

## Known blockers / limitations

## Rollback / migration notes

## Reviewer notes
```

## Completion gate

Project is complete only when all applicable items have evidence:

- All intended routes are real/reachable; no mock/static preview substitutes production.
- API producer, `@nova/api-client`, error/auth/permission contracts agree.
- Customer/staff sessions+caches are isolated; CSRF/roles/redaction/error boundaries verified.
- Target PostgreSQL 16 migrations+seed are proven; release backup/restore/rollback are exercised.
- Provider status is honestly PASS/BLOCKED; unconfigured provider never appears successful.
- Required screen/state matrix is complete.
- `1440/1280/1024/768/390/360`, RTL/mixed-LTR, keyboard/focus/semantics/contrast/reduced-motion/touch/screen-reader behavior are verified.
- Integration/E2E PASS only means a real harness executed.
- Any selected typecheck/lint/test/build/Docker/migration result is real and reproducible; required but unrun checks are explicitly marked.
- Every task has isolated branch/PR/diff review; sub-agents did not self-merge.
- User decisions, credentials/provider blockers and visual-evidence limitations are explicit; each visual task records its supplied or generated design artifact.

## Remaining user decisions

- Keep `master` as integration branch or create a dedicated integration branch before larger parallel waves.
- Supply an exact screenshot/reference when a specific existing fidelity is required; otherwise the Head Agent generates one design artifact from the relevant brief before implementation, together with viewport and state coverage.
- Select payment, SMS/notification, shipping, object storage, hosting/backup/monitoring providers and final shipping/returns policy.
