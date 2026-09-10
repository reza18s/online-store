# ADR-0006: Checkout transaction boundaries and payment handoff

- Status: accepted
- Date: 2026-09-08

## Context

Checkout combines live catalog state, a customer-owned cart, an address
snapshot, inventory reservations, an external payment provider, and a retry
key. The database transaction must not remain open while an external gateway
is contacted, but a successful retry must not create a second order,
reservation, or payment attempt.

## Decision

V1 separates checkout into a read-only quote and an idempotent submit flow.
All monetary values are integer Iranian toman values and are re-derived from
the customer cart at submit time; the client quote is informational and is
not trusted as an amount authority.

### Quote

`POST /v1/checkout/quote` requires an authenticated customer, an address owned
by that customer, and a supported shipping method. The service reads the
customer cart through the Cart module, verifies that every variant is still
active, published, unarchived, and available, and resolves the current price
from the variant/product records. It then resolves the address and asks the
shipping provider for a quote. The current local provider policy is free
standard shipping and 89,000 toman express shipping; this is a replaceable
provider policy, not a final carrier integration.

The quote exposes a five-minute advisory expiry, selected options, and the
calculated subtotal, shipping, tax, discount, and total. V1 has no coupon or
tax engine, so discount and tax are zero until those domain rules are
implemented.

### Submit and idempotency

`POST /v1/checkout` requires the same customer/address/shipping inputs and a
validated `Idempotency-Key` header. The order's unique idempotency key is the
authoritative retry record. A request first returns an existing order for the
same customer without re-quoting or repeating side effects. A different
customer cannot read or reuse that order key.

For a new key, the service re-builds the quote and creates the order intent in
one short database transaction. That transaction creates:

- the `PENDING_PAYMENT` order and authoritative money totals;
- order-item rows with product, SKU, variant, and selected-option snapshots;
- the address snapshot used for fulfillment; and
- the initial customer order event.

The transaction commits before inventory or payment-provider work begins.
This avoids holding a database transaction open across an external network
call while leaving a durable, idempotent pending order to reconcile.

### Reservation and payment handoff

After the order intent commits, the Inventory module reserves every line in
its own all-or-nothing transaction and associates each reservation with the
order. The service then persists one pending payment attempt using a derived
attempt idempotency key. Only after those durable records exist does it call
the payment adapter.

The adapter result must contain an HTTPS redirect URL. A valid result moves
the payment attempt to `REDIRECTED` and stores the provider transaction ID and
redirect URL. The payment adapter is deliberately fail-closed in the local
configuration until a real gateway is selected; it must never manufacture a
success response.

If reservation, payment-attempt creation, gateway startup, or redirect
validation fails, the service marks a pending attempt failed when possible,
releases every active reservation, and cancels the pending order with a system
event. Cleanup errors are surfaced as a distinct failure because silently
leaving stock reserved or an order pending would be unsafe.

Payment callback verification, late-payment reconciliation, refunds, and
reservation settlement are covered by
[`ADR-0009`](0009-payment-callbacks-and-reconciliation.md). Checkout's default
shipment creation and the fulfillment/shipment state machine are covered by
[`ADR-0010`](0010-fulfillment-and-shipment-state.md). Those boundaries remain
separate from the order-intent transaction described here.

## Consequences

- The API owns amount calculation and immutable order snapshots; clients
  cannot change a submitted total by modifying a quote response.
- The external gateway is never called inside a database transaction, so
  database locks are bounded and provider latency does not hold SQL work open.
- A failed handoff may leave a short-lived cancelled order record, which is
  intentional for idempotency and auditability.
- The current fixed shipping policy and unconfigured payment adapter are safe
  local boundaries, but they are not production carrier/payment integrations.
- Production readiness still requires database-backed concurrent submit tests
  and live provider integration tests. In-memory coverage now exercises
  callback signature/replay adapters, late-payment handling, refund paths, and
  reservation consumption at their service boundaries.
