# NOVA Store Context

Status: Phase 1 engineering foundation. Commerce use cases are not implemented yet.

## Product boundary

- Single-merchant, Iran-first clothing store for women, men, and children.
- Customer-facing and persisted money values use integer toman values.
- Nationwide delivery starts with one shipping method and fixed destination rates.
- Online payment starts with one gateway behind a provider adapter.

## Domain vocabulary and invariants

- **Customer:** an internal record identified by one unique, normalized, verified phone number. Email is optional.
- **Session:** a durable server-side session stored in PostgreSQL and represented in the browser by an opaque secure httpOnly cookie.
- **Cart:** customer intent that can be anonymous or authenticated; the server is authoritative after merge or conflict resolution.
- **Inventory reservation:** a short-lived hold created only at final checkout, not when an item is added to a cart.
- **Order:** an immutable purchase record containing product, price, delivery, and total snapshots from checkout time.
- **Payment:** a separate lifecycle from fulfillment; only a verified provider callback or server reconciliation can confirm payment.
- **Audit event:** an append-only record for security events and sensitive operational actions; it must not contain secrets.

## Ownership boundaries

- `apps/api` owns HTTP mapping and application orchestration.
- `packages/db` owns Prisma schema/client access and database lifecycle helpers.
- `packages/api-client` owns transport-safe response/error types and query-key conventions.
- `packages/ui` owns reusable visual primitives and design tokens, not commerce behavior.
- `apps/web` owns route composition and local UI/cart intent; server truth remains with TanStack Query.
- `apps/worker` owns asynchronous jobs and provider effects once those capabilities are implemented.

## Current setup boundary

This foundation does not select production providers, add credentials, or implement payment, SMS, shipping, authentication, catalog CRUD, checkout, or admin mutations. Those changes require the decision gates and sequencing in [`arch.md`](arch.md).
