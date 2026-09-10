# TEST-001 integration harness

`bun run test:integration` executes the explicit suite manifest in
[`suites.ts`](./suites.ts). Each entry runs repository-owned API-module, worker,
or browser-transport tests in a child Bun process, so one broken boundary
cannot be hidden by a different suite's result.

The existing service tests use deterministic in-memory database doubles and
fake gateway/shipping/notification adapters. They are the safe provider seam
for this first slice: no production credentials, SMS, payment, shipping, or
notification endpoint is contacted.

The initial matrix includes:

- catalog products, Persian search/suggestions, contextual size/color/material facets, and sale-price safety;
- cart mutation replay, customer ownership, guest-cart merge, quantity, and stale-stock conflicts;
- authoritative checkout quote, price/stock conflicts, sequential reservation conflict/settlement transitions, payment-start failure, and checkout idempotency;
- order ownership, cancellation, returns, refund handoff, and staff fulfillment transitions;
- payment success/failure, duplicate callbacks, payload-hash conflicts, late callbacks, stock reacquisition, and refund success/failure/replay;
- customer/staff auth service boundaries, session/role policy, and direct CSRF guard behavior (`auth-service-boundaries`);
- notification dedupe, redacted admin inspection, worker delivery retry, and terminal failure;
- the typed browser transport paths, including CSRF header mirroring and admin/customer route construction.

Run one bounded suite while diagnosing a failure:

```powershell
$env:NOVA_INTEGRATION_SUITE = 'checkout-inventory,auth-service-boundaries'
bun run test:integration
$env:NOVA_INTEGRATION_SUITE = $null
```

With no `NOVA_INTEGRATION_SUITE` selector, a successful run prints a distinct
`PASS: complete deterministic commerce integration matrix` result. When a
selector is present, a successful run prints `DIAGNOSTIC/PARTIAL` and the
selected count; it does not claim that the complete matrix ran.

The checkout/inventory cases are deterministic, sequential in-memory service
tests. They preserve useful idempotency, conflict, and settlement checks, but
do not exercise concurrent reservation races. A concurrent runtime harness is
deferred until database-backed concurrent execution is available.

The `auth-service-boundaries` suite exercises customer/staff auth services and
direct CSRF guard behavior. HTTP controller requests, cookie round-trips, the
composed guard pipeline, and role/CSRF request coverage remain deferred to the
integrated runtime.

This is deterministic integration coverage, not a substitute for the live
runtime gate. PostgreSQL 16, Redis 7, and real provider sandbox checks remain
separate because the repository does not guarantee that those services or
credentials are available in every environment. The harness prints those
boundaries explicitly and never turns them into passing tests. It also makes no
claim for browser interaction or concurrency coverage.
