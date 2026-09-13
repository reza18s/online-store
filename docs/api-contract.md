# NOVA API contract

The reviewable API contract is [`packages/api-client/openapi.json`](../packages/api-client/openapi.json). It is the OpenAPI 3.1 source-of-truth for the API producer and `@nova/api-client`, with two responsibilities:

- `paths` is the complete route inventory extracted from the Nest controllers. Health routes are intentionally outside `/v1`; every other route is under `/v1`.
- Every templated path has a standard required `in: path` parameter. Query DTO annotations are paired with standard `in: query` parameters, and mutation DTO annotations are paired with required JSON request bodies.
- Detailed request/response schemas and `x-nova-*` annotations cover the consumer-facing catalog/facets, cart merge, checkout, customer orders, admin orders, admin payments, admin catalog/inventory, admin content/SEO, and health surfaces. A small set of operational routes remains marked `inventory-only` where the producer has provider- or worker-specific payloads; their route, transport, security, and error metadata is still explicit.
- Response schemas are complete closed shapes rather than `allOf` extensions of closed base schemas. This is important for OpenAPI 3.1 validators and for consumers that need the actual admin response shape.

Run the focused parity check from the owning package:

```text
bun run --cwd packages/api-client contract:check
```

The check fails when a controller route is added, removed, or renamed without updating the artifact. It also verifies standard path/query/body parameters, security and CSRF metadata, idempotency headers, the stable envelope and error envelope, request DTO field sets for the covered write/query contracts, nested response shapes, and the corresponding `@nova/api-client` interface field sets.

## Transport and security rules

- Successful application responses use `{ data, meta }`. `meta.requestId` is the request identifier and `meta.timestamp` is an ISO timestamp.
- Failures use `{ error: { code, message, statusCode, requestId, timestamp, details? } }`.
- Standard `securitySchemes` describe the `nova_session` customer cookie, the `nova_staff_session` staff cookie, and the `x-csrf-token` header. `x-nova-auth-requirement` retains the machine-readable principal/role requirement that OpenAPI security schemes cannot express.
- Mutations are sent with credentials included. Browser clients mirror the `nova_csrf` cookie into `X-CSRF-Token` and must send an `Origin` matching the configured web origin for unsafe requests. Safe requests may issue the CSRF cookie. The payment callback is explicitly marked `@SkipCsrf` because it is a provider callback rather than a browser mutation.
- The staff login page obtains that readable token through the safe `GET /v1/staff/auth/csrf` bootstrap route before sending the CSRF-protected `POST /v1/staff/auth/login`; the bootstrap route never authenticates or bypasses the login guard.
- `POST /v1/cart/items` accepts an optional `idempotency-key` header. `POST /v1/checkout` requires the same header and a customer session. The header is modeled as a standard OpenAPI parameter with its validation constraints.
- Cart reads and item mutations support a guest cart cookie; `POST /v1/cart/merge` requires a customer session and may return `409 CART_MERGE_CONFLICT` with typed conflict details.
- Customer order and checkout routes require customer authentication. Admin order reads require `support`, `operations`, or `admin`; fulfillment mutations require `operations` or `admin`; return review requires `support` or `admin`. Admin payments and content require `admin`.
- Checkout and customer order payment objects retain `redirectUrl` because those responses may return a customer payment redirect. Admin order detail payment objects intentionally omit `redirectUrl`, including when the underlying payment attempt has one.

## Errors and intentional gaps

The shared `ApiErrorEnvelope` is attached to every operation with a `default` response for the filter's non-HTTP-exception fallback (`500 INTERNAL_ERROR`) and a validation response (`400 VALIDATION_ERROR`). The artifact also defines the filter's standard `401`, `403`, `404`, `409`, `422`, `429`, `500`, and `503` mappings; operation-specific statuses are attached where the producer exposes them.

The payment callback body remains an intentionally provider-specific JSON object and its signature header is optional at the transport boundary. Its callback path parameter, signature metadata, `@SkipCsrf` marker, and response envelope are still documented. These are the only intentionally broad payload areas in the current artifact; module tests and the security-owned runtime boundaries remain authoritative for their enforcement details.
