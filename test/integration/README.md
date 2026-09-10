# TEST-001 integration harness

`bun run test:integration` executes the explicit suite manifest in
[`suites.ts`](./suites.ts). Each entry runs the repository's real API, worker,
or browser-transport tests in a child Bun process, so one broken boundary
cannot be hidden by a different suite's result.

The existing service tests use deterministic in-memory database doubles and
fake gateway/shipping/notification adapters. They are the safe provider seam
for this first slice: no production credentials, SMS, payment, shipping, or
notification endpoint is contacted.

The initial matrix includes:

- catalog products, Persian search/suggestions, contextual size/color/material facets, and sale-price safety;
- cart mutation replay, customer ownership, guest-cart merge, quantity, and stale-stock conflicts;
- authoritative checkout quote, price/stock conflicts, reservation transitions, payment-start failure, and checkout idempotency;
- order ownership, cancellation, returns, refund handoff, and staff fulfillment transitions;
- payment success/failure, duplicate callbacks, payload-hash conflicts, late callbacks, stock reacquisition, and refund success/failure/replay;
- customer/staff authentication, session behavior, role checks, and CSRF rejection;
- notification dedupe, redacted admin inspection, worker delivery retry, and terminal failure;
- the typed browser transport paths, including CSRF header mirroring and admin/customer route construction.

Run one bounded suite while diagnosing a failure:

```powershell
$env:NOVA_INTEGRATION_SUITE = 'checkout-inventory,payments'
bun run test:integration
$env:NOVA_INTEGRATION_SUITE = $null
```

This is deterministic integration coverage, not a substitute for the live
runtime gate. PostgreSQL 16, Redis 7, and real provider sandbox checks remain
separate because the repository does not guarantee that those services or
credentials are available in every environment. The harness prints those
boundaries explicitly and never turns them into passing tests.
