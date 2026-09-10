# ADR-0013 — Admin payment inspection boundary

- Status: Accepted
- Date: 2026-09-08
- Owners: NOVA engineering

## Context

Payment attempts and refunds now cross checkout, callback, cancellation, return, and reconciliation workflows. Administrators need a searchable operational view to investigate payment state and refund progress without querying the database or receiving provider secrets and raw callback data.

## Decision

- Expose read-only `GET /v1/admin/payments` and `GET /v1/admin/payments/:paymentAttemptId` endpoints to the `admin` role only. Authorization is enforced by the route guards and again inside the application service.
- Support bounded pagination and exact filters for payment-attempt status, provider, and order number. Results are ordered newest-first with a stable ID tie-breaker.
- Return the payment-attempt state, amount, provider transaction identifier, timestamps, linked order state, and refund summaries. Do not return redirect URLs, idempotency keys, raw provider payloads, webhook hashes, or other gateway secrets through this read boundary.
- Keep refund mutation and callback reconciliation in their existing services. Browser code receives page-agnostic query transport and cache-key helpers; visual payment screens wait for the user's supplied page reference.

## Consequences

- Administrators can inspect payment and refund progress while support and operations do not gain access to this sensitive operational view.
- The current interface is exact-filtered and offset-paginated. Provider-specific retry controls, export, reconciliation dashboards, redaction/retention policy, and live provider integration remain follow-up work.
