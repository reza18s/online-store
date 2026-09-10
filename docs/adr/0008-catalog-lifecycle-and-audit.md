# ADR-0008: Audited catalog lifecycle transitions

- Status: accepted
- Date: 2026-09-08

## Context

The catalog already exposes only published products to customers, but product
status changes were not yet available to a protected application use case.
Products referenced by carts or historic orders must not be deleted merely to
remove them from the storefront. Staff changes also need an auditable record
that cannot be committed separately from the state change.

## Decision

Product lifecycle changes use the protected endpoint:

```text
PATCH /v1/admin/catalog/products/:productId/status
```

The endpoint is guarded by a staff session and the explicit `admin` role. The
`CatalogAdminService` repeats the role assertion inside the use case so a
controller or future caller cannot become the authorization boundary.

The supported transitions are:

```text
DRAFT     -> PUBLISHED | ARCHIVED
PUBLISHED -> DRAFT | ARCHIVED
ARCHIVED  -> DRAFT
```

Submitting the current status is an idempotent no-op and does not emit another
audit event. Publishing requires at least one active variant and one primary
(`PRODUCT`) image. Inventory may still be zero; an out-of-stock published
product remains a valid catalog state. Archiving changes status and preserves
the product row for historical references.

The status update uses a conditional `WHERE id + currentStatus` update inside a
PostgreSQL transaction. A lost update returns a conflict rather than silently
overwriting another staff change. The corresponding `AuditEvent` is inserted
through the same transaction client, with the staff actor, resource, previous
status, target status, and product slug.

Product administration also supports draft-first creation and editing through
`POST /v1/admin/catalog/products` and
`PATCH /v1/admin/catalog/products/:productId`. Both operations are admin-only,
normalize searchable text, keep the slug immutable after creation, and write
audit events in the same transaction. Edits use `updatedAt` as an
optimistic-concurrency guard. New products always start as `DRAFT`. The
protected catalog boundary also covers variant/media administration, category
assignment, category lifecycle, product options, option values, and variant
option-value associations.

## Consequences

- Customer catalog reads immediately respect the lifecycle state without a
  second visibility mechanism.
- Audit persistence and lifecycle persistence commit or roll back together.
- Variant/media/option mutations are admin-only; staff read roles can inspect
  their current state. Variants are deactivated rather than deleted, option
  keys remain stable, and option values are not destructively deleted while
  they may be referenced by variants.
- Category parent changes reject cycles and archived parents. Archiving a
  category with a published-product assignment is blocked, and product
  category replacement accepts only active categories.
- The admin UI still needs to be wired to these contracts; its non-dashboard
  product/category pages remain a separate visual implementation task.
- Live PostgreSQL migration and integration behavior still require the local
  database dependency to be available.
