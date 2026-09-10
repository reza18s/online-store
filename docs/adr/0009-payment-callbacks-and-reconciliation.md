# ADR-0009: Payment callbacks, reservation settlement, and late-payment refunds

- Status: accepted
- Date: 2026-09-08

## Context

Checkout creates a durable pending order, inventory reservations, and a
payment attempt before it contacts the provider. A browser redirect is not a
payment authority: the provider callback or a later reconciliation result must
decide whether money was paid. Callbacks can be duplicated, delayed, signed
with provider-specific rules, or delivered after the inventory reservation has
expired.

## Decision

The payment boundary is provider-agnostic and fail-closed until a real gateway
adapter is configured.

### Verification and replay safety

The configured `PaymentGateway` verifies the provider signature and translates
the provider payload into a small internal result containing an event ID,
order number, payment status, amount, and optional transaction ID. The API
does not persist the raw payload. It stores a SHA-256 hash in `WebhookEvent`
and uses `(provider, providerEventId)` as the replay key. A duplicate event
with the same hash is harmless; the same event ID with a different hash is a
conflict. Processing outcomes are stored without copying provider secrets into
logs or error fields.

The callback route is exempt from browser CSRF requirements because it is a
server-to-server endpoint; provider signature verification remains mandatory
inside the adapter. Customer/admin browser mutations continue to use the
double-submit CSRF guard.

### Successful and failed payment

For a verified paid callback, the service validates the order and amount,
settles the order's active inventory reservations through `InventoryService`,
then atomically marks the payment attempt `SUCCEEDED`, the payment status
`PAID`, and the order status `CONFIRMED`, recording an `OrderEvent`. A failed
callback marks a still-pending attempt `FAILED`, cancels the pending order,
releases its reservations, and records the system event. Existing terminal
states are not overwritten by a contradictory callback.

### Reservation expiry and refunds

If the original reservations are expired or absent, the service attempts to
reacquire the immutable order-item quantities. If reacquisition succeeds, the
new reservations are consumed before confirmation. If it fails, the paid
attempt remains observable, the order is cancelled, and a separate `Refund`
record is created with an idempotency key. The gateway refund result moves the
refund to `SUCCEEDED` or `FAILED`; a failed refund leaves the order payment
state as `PAID` and is recorded as an operator-visible audit outcome instead of
being hidden behind a generic callback error.

Refunds are separate from payment attempts and are never inferred from an
order cancellation. The `0002_payment_reconciliation` migration adds the
refund status enum, constraints, indexes, and references to the order and
payment attempt.

## Consequences

- Browser redirects remain non-authoritative and cannot mark an order paid.
- Duplicate provider events do not consume reservations or create duplicate
  refunds.
- The late-payment invariant is explicit and testable, including the refund
  failure path.
- A production provider must implement signature verification and idempotent
  payment/refund calls before the adapter can be enabled.
- Reconciliation jobs and real provider adapters remain separate follow-up
  work; the local `UnconfiguredPaymentGateway` intentionally returns a
  service-unavailable failure.
