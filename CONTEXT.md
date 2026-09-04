# NOVA Store Context

Status: workspace scaffold only. No storefront, API, worker, database schema, authentication flow, or checkout feature has been implemented.

## Product boundary

- Single-merchant Iran-first clothing store.
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

## Setup boundary

This initial setup creates the workspace structure, package identity, shared TypeScript defaults, and local infrastructure definition. Bun is the workspace package manager. The setup intentionally does not create application source, install feature dependencies, run containers, select production providers, or add production credentials.

See [README.md](README.md) for the full product scope, confirmed architecture decisions, and remaining provider/operations decisions.
