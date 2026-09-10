# ADR-0016: Bounded customer support lookup

- Status: Accepted
- Date: 2026-09-09

## Context

Phase 5 requires staff to find a customer while handling an order or support
request. Customers and privileged staff share the `User` table, so a broad user
search could accidentally disclose staff identities or privileged credentials.
The lookup also needs to remain useful without exposing full addresses,
payment data, or internal audit details.

## Decision

The API exposes a read-only `GET /v1/admin/customers` boundary for `support`,
`operations`, and `admin` staff. It accepts bounded pagination, customer status,
and trimmed phone/email/identifier search. The database predicate excludes
users with staff credentials or assigned staff roles before any result is
returned.

Each result contains only the customer identity needed for support, status,
account timestamps, order count, and the number/status/timestamp of the latest
order. Addresses, payment-provider fields, raw payloads, sessions, credentials,
and audit metadata remain separate privileged boundaries.

The browser receives a page-agnostic query adapter and cache key. Visual wiring
remains gated on a supplied customer-lookup page reference.

## Consequences

Support can locate a customer and immediately see whether there is recent order
context without database access. The lookup is intentionally not a mutation or
an all-purpose user administration endpoint. Future customer profile or account
recovery workflows must receive their own role, field, and audit review.

## Rejected alternatives

- Searching every `User` row would mix customer support data with privileged staff identities.
- Returning full addresses or payment details would widen the support read surface unnecessarily.
- Reusing the order search response would make customer lookup depend on an order existing and would not represent account status accurately.
