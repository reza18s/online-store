# ADR-0011 — Cancellation, returns, and refund state boundary

- Status: Accepted
- Date: 2026-09-08
- Owners: NOVA engineering

## Context

Orders now have separate fulfillment, payment, shipment, reservation, and audit state. Cancellation and returns cross those boundaries: an unpaid cancellation must release inventory and close the payment attempt, while a paid cancellation or return must create a durable, retryable refund without making the order appear settled before the provider confirms it. Customer eligibility also depends on ownership, fulfillment state, delivery time, and the condition of the returned goods.

## Decision

- A customer may cancel a `PENDING_PAYMENT` order with a reason. The order becomes `CANCELLED`, its payment attempt becomes `CANCELLED`, the payment status becomes `FAILED`, and active inventory reservations are released after the transaction. The operation is protected by customer ownership and conditional state updates.
- A customer may cancel a paid order only while it is `CONFIRMED`, before warehouse fulfillment starts. The order is cancelled first, then a full refund is created through the provider-agnostic refund service with a stable idempotency key. A failed provider call remains visible as a failed refund and does not falsely change payment status; retrying the same key is supported.
- A customer may request a return only for an owned `DELIVERED` and paid order within seven days of delivery. The request requires an allowed reason, explicit condition attestations, and complete order-line quantities. Partial quantities within a line, exchanges, and direct customer refunds are outside this boundary.
- Support and admin staff may approve, reject, or mark an approved request as received. Receiving a request computes the refund from immutable order-item totals, never current catalog prices. The refund is processed through the same idempotent service and the request becomes `REFUNDED` only after provider success. A full-line return can move the order and shipment to `RETURNED`.
- Item-only returns refund returned item totals. Shipping is not refunded by this slice, so the order payment status remains `PAID` unless the refunded amount exactly equals the order total. This prevents the system from claiming that the entire payment was refunded when a shipping charge remains outstanding.
- Every state change writes an order event and, where applicable, a transactional audit event. Optimistic `updatedAt` guards prevent staff review from overwriting a concurrent customer or staff change.
- The browser exposes page-agnostic customer cancel/return and staff return-review transport hooks. Visual account and admin wiring remains gated on the user's supplied page references.

## Consequences

- Inventory, payment attempts, orders, refunds, shipments, and return requests have explicit, observable state instead of being changed by a generic status endpoint.
- Provider failures are recoverable and auditable, and repeated callbacks or user retries do not create duplicate refunds.
- Customer and staff clients can render refund/return progress from order detail without receiving provider transaction data or internal failure reasons.
- Real payment-provider behavior, carrier receipt workflows, exchanges, partial-line return policy, shipping refunds, notification jobs, and live database/provider integration remain follow-up work.
