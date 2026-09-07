# ADR-0001: Establish the Phase 1 foundation boundaries

- Status: accepted for the initial foundation
- Date: 2026-09-06

## Decision

Use a Bun workspace with separate `apps/` and `packages/` boundaries. The first implementation seam is intentionally small:

- NestJS owns API transport and health behavior.
- Prisma owns durable PostgreSQL access through `packages/db`.
- `packages/config` validates environment values at process startup.
- `packages/api-client` defines transport types and query-key conventions without becoming a server cache.
- `packages/ui` contains shadcn-style primitives and CSS-variable tokens shared by the Vite web shell.
- Zustand stores only local cart/UI intent; TanStack Query remains the owner of server state.

Health is outside the `/v1` prefix so deployment probes can remain stable. All future public API routes use `/v1`, and public catalog responses will be separately cacheable from customer, checkout, payment, and admin responses.

## Consequences

The repository can be installed, typechecked, linted, tested, built, and checked against local PostgreSQL/Redis configuration before commerce features exist. Provider-specific integrations, production deployment choices, and feature modules remain deferred rather than leaking into the foundation.

## Rejected alternatives

- A single application package was rejected because the architecture explicitly separates web, API, worker, and shared contracts.
- A global Zustand API cache was rejected because it duplicates server truth and complicates invalidation.
- Placeholder modules for every future domain were rejected because empty pass-through modules do not provide a meaningful deletion seam.
