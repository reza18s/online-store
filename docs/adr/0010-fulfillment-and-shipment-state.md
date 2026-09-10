# ADR-0010 — Fulfillment and shipment state boundary

- Status: Accepted
- Date: 2026-09-08
- Owners: NOVA engineering

## Context

Checkout creates a paid-or-pending order intent and must leave a durable shipment record that staff can advance after payment succeeds. The existing schema has separate order and shipment statuses, order events, audit events, and optimistic `updatedAt` fields. A fulfillment endpoint that updates only one of those records could expose contradictory customer tracking information or permit staff to move an unpaid order into the warehouse flow.

## Decision

- The admin fulfillment mutation is restricted to `operations` and `admin` staff, requires `paymentStatus = PAID`, requires a non-empty reason, and uses the order `updatedAt` as an optional optimistic-concurrency precondition plus a conditional update guard.
- Order fulfillment is forward-only: `CONFIRMED → PREPARING → SHIPPED → DELIVERED`. The endpoint does not expose cancellation or returns because those paths require refund and return-specific invariants.
- Checkout creates one local `PENDING` shipment row. The shipment mutation is also restricted to `operations` and `admin`, requires a paid order, and advances shipment state only through `PENDING → PACKED → SHIPPED → DELIVERED`.
- Shipment transitions synchronize the corresponding order status: packing starts `PREPARING`, shipping sets `SHIPPED`, and delivery sets `DELIVERED`. Tracking data and shipped/delivered timestamps are stored on the shipment snapshot.
- Every real status change creates an `OrderEvent` with the staff actor and reason and an `AuditEvent` in the same database transaction. Repeating the current state is an idempotent read of the latest detail and does not create a duplicate event.
- The browser receives page-agnostic mutation functions and TanStack Query hooks that update the order detail cache and invalidate admin order lists. Visual admin wiring remains gated on the user's supplied page references.

## Consequences

- Customer and staff order details can always expose a shipment status after order creation, while unpaid orders remain outside fulfillment.
- Operations workflows have an auditable, concurrency-safe transition boundary with explicit role separation from support read access.
- Cancellation after payment, refunds, returns, carrier webhooks, and carrier-specific delivery integrations remain separate follow-up work rather than being folded into an unsafe generic status endpoint.
