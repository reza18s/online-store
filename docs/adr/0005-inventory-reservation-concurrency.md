# ADR-0005: Inventory reservation and concurrency

- Status: accepted
- Date: 2026-09-08

## Context

NOVA must prevent overselling when multiple customers check out the same
variant concurrently, while allowing payment to complete after checkout has
started. The architecture defines `InventoryItem`, `InventoryReservation`,
and `StockMovement` as the V1 inventory model. Cart state is not authoritative
inventory state, and inventory mutations belong to the Inventory module.

## Decision

V1 uses one logical stock location. There is no warehouse-selection or
routing decision in the checkout contract. Each variant has one authoritative
inventory record for that logical location with at least `onHand` and
`reserved` quantities. Availability is always calculated from that record:

```text
availableToSell = onHand - reserved
```

Product or cart responses must not be used as inventory truth.

Cart operations do not reserve stock. Checkout creates one
`InventoryReservation` row per unique variant line, with a default `expiresAt`
15 minutes after creation. The current schema stores the inventory item and
quantity directly on each reservation row; the `InventoryReservation` to
`InventoryItem` relation identifies the variant. A reservation may be created
before the pending order exists and linked to it once the order is created via
the nullable `orderId`. Checkout owns the idempotency record and must reuse
the same reservation set on a valid retry.

### Reservation creation

The Inventory module performs reservation creation inside one PostgreSQL
transaction. Before changing inventory, it validates that every line:

- refers to a valid, purchasable variant;
- has a positive integer quantity; and
- appears only once in the reservation request.

The database migration must reinforce the positive-quantity rule and
non-negative inventory quantities with check constraints. Duplicate variants
are rejected by the Inventory application service because the current schema
represents each line as its own `InventoryReservation` row rather than having
a separate reservation-line table. The caller must provide an idempotency key
for the checkout; a
successful retry with the same key returns the existing checkout, order, and
reservation set rather than creating another set.

For each line, in deterministic variant order to reduce lock contention, the
transaction executes an atomic conditional update equivalent to:

```sql
UPDATE InventoryItem
SET reserved = reserved + :quantity
WHERE variantId = :variantId
  AND onHand - reserved >= :quantity;
```

The update must be checked for an affected row (and should return the new
quantities). A line that updates zero rows has insufficient stock. Only after
all conditional updates succeed does the transaction create one reservation
row per line, link any known pending order, and write one `StockMovement` per
reserved line. The inventory updates, reservations, order linkage, and
movement records commit together.

### Reservation lifecycle

`InventoryReservation` has these explicit states:

```text
ACTIVE
CONSUMED
RELEASED
EXPIRED
```

Only `ACTIVE` can transition to a different state. The transition and the
inventory change happen in one transaction, using a row lock or an equivalent
conditional state update so consumption and expiry cannot both release or
consume the same reservation.

- `ACTIVE -> CONSUMED`: decrement `reserved` and `onHand` by the reservation
  quantity. Write a `StockMovement` of type `SALE` with a signed quantity
  equal to the negative reservation quantity.
- `ACTIVE -> RELEASED`: decrement `reserved` by the line quantity, leaving
  `onHand` unchanged. Write a `StockMovement` of type `RELEASE` with a signed
  quantity equal to the negative reservation quantity.
- `ACTIVE -> EXPIRED`: apply the same inventory adjustment as release and
  write a `StockMovement` of type `RELEASE` with a signed quantity equal to
  the negative reservation quantity; the reservation state distinguishes
  expiry from an explicit release. Expiry workers may select only active
  reservations whose `expiresAt` is at or before the database clock.

`StockMovement.inventoryItemId` identifies the variant through the inventory
relation, `type` identifies the event, signed `quantity` records its stock
impact, and `reference` contains the reservation identifier (and an order
reference when the caller needs one). A movement is written only when its
corresponding state transition commits. Repeating the same transition is a
successful no-op: it returns the already-applied state and writes no
additional movement. A request to change one terminal state to another is
rejected as an invalid transition and never changes inventory.
All line adjustments in a transition are transactional; a failure on any line
rolls back the state change, every inventory adjustment, and every movement.

### Failure and concurrency behavior

If any reservation line has insufficient stock, the entire creation
transaction rolls back. No reservation, pending order linkage, movement, or
partial `reserved` increment remains. The checkout API returns a typed
insufficient-stock result identifying the conflicting variant lines where
appropriate. Database or serialization failures also roll back completely and
may be retried with the same checkout idempotency key.

Payment failure releases an active reservation. A successful order/payment
flow consumes it. If payment confirmation arrives after expiry, the payment
callback must not consume the expired reservation silently: checkout/payment
must attempt the architecture-defined reacquisition path and, when stock is
unavailable, place the order into payment-exception handling for refund and
operator alerting.

All writes to `onHand` or `reserved`, including future manual adjustments,
must pass through the Inventory module. Multi-warehouse routing and any
general-purpose stock mutation API outside that module are explicitly deferred
from V1.

The V1 staff boundary is exposed through the protected inventory routes:

```text
GET   /v1/admin/inventory/items
GET   /v1/admin/inventory/items/:variantId
POST  /v1/admin/inventory/items/:variantId/adjustments
PATCH /v1/admin/inventory/items/:variantId/reorder-point
```

Support staff may read inventory; only operations and admin staff may change
on-hand quantities or reorder points. An on-hand adjustment requires a
non-zero signed delta and a human-readable reason. The use case checks the
current `onHand`, `reserved`, and `updatedAt` values in the conditional update,
rejects a result below reserved stock or above the PostgreSQL integer limit,
records a signed `ADJUSTMENT` movement, and writes the staff audit event in the
same transaction. Reorder-point updates use the same `updatedAt` optimistic
guard and audit boundary. Low-stock reads use the authoritative
`onHand - reserved <= reorderPoint` expression rather than a client-computed
approximation.

## Consequences

- The conditional update makes the stock check and reservation increment one
  database decision, so concurrent buyers cannot both reserve the final
  available quantity.
- Reservation, consumption, release, and expiry are auditable through
  `StockMovement` records and remain safe under retries and worker/callback
  races.
- Observability must include correlation by checkout, order, reservation, and
  variant, plus metrics for reservation attempts, successes, insufficient
  stock, transition conflicts, expiry volume, and database/serialization
  failures. Logs must not contain payment secrets or customer credentials.
- Integration tests must exercise multiple buyers competing for the final
  unit, multi-line all-or-nothing rollback, duplicate checkout retries,
  repeated terminal transitions, and simultaneous expiry versus consumption.
  They must assert that `reserved` and `onHand` never become invalid and that
  one logical transition produces one movement per line.
- Warehouse allocation, transfers, and stock mutation workflows remain future
  ADRs/modules rather than leaking into checkout or cart behavior.
