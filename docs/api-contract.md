# NOVA API contract

The reviewable API contract is [`packages/api-client/openapi.json`](../packages/api-client/openapi.json). It is an OpenAPI 3.1 document with two responsibilities:

- `paths` is the complete route inventory extracted from the Nest controllers. Health routes are intentionally outside `/v1`; every other route is under `/v1`.
- Detailed request/response schemas and `x-nova-*` annotations cover the consumer-facing catalog/facets, cart merge, checkout, customer orders, admin orders, admin payments, admin content, and health surfaces. Other current routes remain in the inventory and are marked `inventory-only` until their owning workstream expands the schema coverage.

Run the focused parity check from the owning package:

```text
bun run --cwd packages/api-client contract:check
```

The check fails when a controller route is added, removed, or renamed without updating the artifact. It also verifies the stable envelope and error envelope, request DTO field sets for the covered write/query contracts, and the corresponding `@nova/api-client` interface field sets.

## Transport rules

- Successful application responses use `{ data, meta }`. `meta.requestId` is the request identifier and `meta.timestamp` is an ISO timestamp.
- Failures use `{ error: { code, message, statusCode, requestId, timestamp, details? } }`.
- Mutations are sent with credentials included. Browser clients mirror the `nova_csrf` cookie into `X-CSRF-Token` for unsafe methods.
- `POST /v1/cart/items` and `POST /v1/checkout` accept the `idempotency-key` header. Checkout also requires a customer session.
- Cart reads and item mutations support a guest cart cookie; `POST /v1/cart/merge` requires a customer session and may return `409 CART_MERGE_CONFLICT` with typed conflict details.
- Customer order and checkout routes require customer authentication. Admin order reads require `support`, `operations`, or `admin`; fulfillment mutations require `operations` or `admin`; return review requires `support` or `admin`. Admin payments and content require `admin`.

The artifact records route presence for auth, address, inventory, audit, coupon, notification, SEO, and payment-callback routes without claiming that their detailed schemas are complete in this task. Their existing module tests and security-owned boundaries remain the source of truth until those surfaces receive their own contract expansion.
