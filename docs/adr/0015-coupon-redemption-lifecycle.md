# ADR-0015: Small V1 coupon redemption lifecycle

- Status: Accepted
- Date: 2026-09-09

## Context

The repository already reserved a `Coupon` table, but it did not define how a checkout preview, concurrent order attempts, payment failure, or an abandoned order affects usage limits. A discount cannot be treated as a display-only calculation: global and per-customer limits need a durable order relationship and a race-safe reservation boundary.

## Decision

V1 supports intentionally small, code-based coupons:

- `FIXED` and `PERCENTAGE` discounts;
- a minimum merchandise subtotal;
- an active window and an explicit enabled/disabled flag;
- optional global and per-customer redemption limits.

The checkout lifecycle is:

1. Quote preview normalizes and validates the code against current catalog subtotal and active redemption counts.
2. New order creation reserves the coupon in the same transaction as the order snapshot, using a unique order relationship. The coupon row is touched to acquire a PostgreSQL row lock before counting active reservations, so concurrent reservations for one code cannot both pass the limit.
3. A verified paid callback commits the reservation. Payment failure, payment-handoff cleanup, late-payment inventory failure, and unpaid customer cancellation release it. Committed redemptions remain consumed after a later refund to prevent reuse after fulfillment of the promotion; this policy can be revisited with an explicit refund-credit decision.
4. Expired reservations are excluded from capacity checks and are marked released when a new reservation evaluates the coupon. A worker cleanup job can compact old reservation state later without changing the checkout contract.

Coupon codes are immutable after creation, and coupon mutations are admin-only, audited, and protected by an optional optimistic `updatedAt` condition. Coupons are never deleted so their order history remains explainable. Generic dynamic promotion rules and product/category targeting are intentionally outside V1.

## Consequences

Quotes may become invalid between preview and submit; submit revalidates and reserves against current state, returning a conflict instead of charging an incorrect amount. Coupon state is explainable through `PromotionRedemption`, while order totals remain immutable snapshots. Admins can schedule, disable, and cap codes without changing discount semantics for an already-created order.

The current implementation has no coupon-management visual screen because page-level UI remains gated on a supplied page reference. The browser transport is available for a future supplied design.

## Rejected alternatives

- Calculating a discount only in the browser would be authoritative neither for price nor usage limits.
- Counting redemptions without locking the coupon row would allow a global-limit race.
- Deleting a coupon on disablement would break historical order explanations and foreign-key relationships.
- A generic rule engine would expand the V1 risk surface beyond the fixed/percentage requirements.
