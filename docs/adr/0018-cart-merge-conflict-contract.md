# ADR-0018: Explicit guest-cart merge conflicts

## Status

Accepted.

## Context

Guest-cart contents are merged after customer verification. A variant can become
inactive, be archived, lose its inventory row, or have less available stock
before that merge. Combining those lines without a preflight would silently
carry stale commerce state into the customer cart. The existing quantity cap
also needs to be reported in a way that a future checkout UI can explain.

## Decision

`POST /v1/cart/merge` preflights every guest line inside the same transaction
that owns the merge. It checks the variant/product lifecycle state, the current
available quantity (`onHand - reserved`), and the maximum cart quantity. When a
line cannot be merged, the service throws a `409` error with code
`CART_MERGE_CONFLICT` and bounded `details.conflicts` entries containing the
variant id, guest/customer quantities, merged quantity, available quantity, and
one of `VARIANT_UNAVAILABLE`, `STOCK_LIMIT`, or `QUANTITY_LIMIT`.

The transaction makes no cart changes when any conflict exists, so the guest
cart token remains usable while the customer resolves the conflict. A
successful merge still combines compatible lines and deletes the guest source.
Checkout remains authoritative and repeats its own live price, lifecycle, and
stock validation before reservation.

## Consequences

- Customer-facing transport can distinguish a merge conflict from a generic
  request failure and keep the customer in context.
- Invalid or stale guest lines are never silently deleted or merged.
- A stock snapshot can change immediately after a successful merge; checkout
  therefore remains the final inventory authority.
- The future visual flow must render these structured conflicts and offer an
  explicit resolution path before retrying the merge.
