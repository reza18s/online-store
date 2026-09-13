# NOVA Store

NOVA Store is an Iran-first, single-merchant clothing commerce platform for Persian-speaking customers. The product and engineering source of truth is [`arch.md`](arch.md); this README describes the runnable foundation currently in the repository.

## Foundation stack

- Bun `1.3.4` workspace
- React + Vite + TypeScript web application
- NestJS HTTP API
- Prisma + PostgreSQL persistence boundary
- Redis-ready local infrastructure
- TanStack Query for server state and Zustand for local cart/UI state
- Tailwind CSS tokens and shadcn-style shared primitives in `packages/ui`

The current implementation includes the Phase 1 engineering foundation plus catalog/discovery, guest/customer-cart ownership, checkout-time inventory reservation, customer OTP/session security, staff password/TOTP sessions, address persistence, and the first authoritative checkout boundary. It provides a Persian RTL web shell, API liveness/readiness endpoints, typed client contracts, validated environment configuration, a Prisma schema and seed catalog, read-only catalog/search routes with filters, sorting, pagination, inventory-aware availability, Persian text normalization, full-text/trigram typo tolerance, and bounded category/product search suggestions, plus API-backed home, category, product-list, search, product-detail, and guest-cart views. The API now also has Redis-backed OTP state, opaque PostgreSQL customer/admin sessions, encrypted staff TOTP credentials, explicit role guards, exact-origin/double-submit CSRF protection, customer address CRUD, idempotent order-intent creation, order/address snapshots, live integer-toman quotes, default shipment creation, reservation cleanup, browser client support for CSRF mutation headers, explicit guest-cart merge conflicts for stale lifecycle/stock/quantity state, protected admin product list/create/edit operations, audited admin product lifecycle mutations with publish/archive/draft transitions, protected admin variant/media operations with inventory-row creation and primary-image safeguards, protected category/assignment/option administration with cycle, ownership, active-category, and variant-option integrity guards, a protected inventory read/adjustment/reorder-point API with signed stock movements, reserved-stock safeguards, optimistic concurrency, and transactional audit events, verified payment callbacks with replay protection and late-payment refund reconciliation, bounded fixed/percentage coupons with minimum-order checks, row-locked global/per-user redemption reservations, payment-aware commit/release transitions, and audited admin coupon management, transactional payment success/failure notification outbox jobs with idempotent dedupe keys and worker retry leasing, paid-order fulfillment/shipment state transitions with transactional order events and audit records, customer cancellation/return requests with support/admin review and observable idempotent refund retries, and admin-only paginated audit-event and payment-attempt/refund inspection reads. The browser now has page-agnostic customer-auth, customer-address, checkout quote/submit, staff-session, admin-catalog, admin-inventory, admin-order, admin-audit, admin-payment, admin-coupon, guest-cart merge, and catalog category/search-suggestion transport/query/mutation layers with cache-safe category/product/option/variant/media/inventory/order/coupon updates. SMS/notification delivery and the payment adapter remain intentionally fail-closed until real providers are selected; SSR/hybrid storefront rendering and the non-dashboard admin catalog, inventory, order, audit, payment, and coupon UI still await their supplied page references before visual implementation.

The API also exposes session-scoped customer order history/detail reads, customer cancellation and return-request actions, read-only staff order search/detail and support customer lookup reads, operations/admin-only fulfillment and shipment mutations, support/admin return review/refund actions, operations/admin-only redacted notification delivery inspection, and admin-only audit-event and payment-attempt/refund reads. Their page-agnostic browser transport lives in `apps/web/src/features/orders/orders-api.ts`, `apps/web/src/features/admin/admin-orders-api.ts`, `apps/web/src/features/admin/admin-customers-api.ts`, `apps/web/src/features/admin/admin-notifications-api.ts`, `apps/web/src/features/admin/admin-audit-api.ts`, and `apps/web/src/features/admin/admin-payments-api.ts`; visual wiring remains pending the supplied page references.

The content domain now exposes `GET /v1/seo/resolve` for SSR/hybrid metadata and redirect lookup, `GET /v1/content/pages/:slug` for published editorial/trust content, and admin-only paginated SEO metadata, redirect, and content-page lifecycle management. Content pages are draft-first, publish only when they contain usable content, and use audited optimistic-concurrency mutations. The browser transport lives in `apps/web/src/features/content/content-api.ts`; the boundaries are documented in [`docs/adr/0020-seo-metadata-and-redirects.md`](docs/adr/0020-seo-metadata-and-redirects.md), [`docs/adr/0021-public-content-page-read.md`](docs/adr/0021-public-content-page-read.md), and [`docs/adr/0022-admin-content-page-lifecycle.md`](docs/adr/0022-admin-content-page-lifecycle.md). SSR, sitemap/robots generation, content-page rendering, and the admin content UI remain separate follow-up work and still require the relevant supplied page references before visual implementation.

## Getting started

```powershell
bun install
bun run db:generate
bun run docker:config
bun run dev
```

The web shell runs at `http://127.0.0.1:5173`. To run the API or worker independently:

```powershell
bun run dev:api
bun run dev:worker
```

Start local dependencies when database-backed API work is needed:

```powershell
docker compose --env-file .env.example -f infra/docker/compose.yml up -d postgres redis s3
bun run db:migrate
bun run db:seed
```

The local `s3` service is MinIO. The E2E runtime preflight also checks its loopback liveness endpoint, so start it with PostgreSQL and Redis whenever running database-backed API or browser verification.

The API exposes `GET /health/live` without a database dependency and `GET /health/ready` once PostgreSQL is available. API routes use the `/v1` prefix after the health endpoints.

## Verification

```powershell
bun run typecheck
bun run lint
bun run test
bun run build
bun run docker:config
```

Validation is behavior- and risk-based, not file-based. Do not create a separate
test for every changed file. Add or update focused tests when observable
behavior, state transitions, public contracts, security or data integrity, or
meaningful regression risk changes. Otherwise, use the narrowest applicable
existing tests and static checks; broader suites belong at integration or
release gates rather than on every file change.

Do not place production credentials in this repository. Copy `.env.example` to a local `.env` only for development and resolve the provider, hosting, domain, brand, and compliance decisions listed in `arch.md` before production work.
