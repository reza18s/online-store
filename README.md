# NOVA Store

NOVA Store is an Iran-first, single-merchant clothing commerce platform for Persian-speaking customers. The product and engineering source of truth is [`arch.md`](arch.md); this README describes the runnable foundation currently in the repository.

## Foundation stack

- Bun `1.3.4` workspace
- React + Vite + TypeScript web application
- NestJS HTTP API
- Prisma + PostgreSQL persistence boundary
- Redis-ready local infrastructure
- TanStack Query for server state and Zustand for local cart/UI state
- Tailwind CSS tokens and shadcn-style shared primitives in `packages/ui`

The current implementation is the Phase 1 engineering foundation. It provides a Persian RTL web shell, API liveness/readiness endpoints, typed client contracts, validated environment configuration, a Prisma schema baseline, seed data, and local PostgreSQL/Redis definitions. Product discovery, authentication, checkout, payment, and admin mutations remain later phases from `arch.md`.

## Getting started

```powershell
bun install
bun run db:generate
bun run docker:config
bun run dev
```

The web shell runs at `http://localhost:5173`. To run the API or worker independently:

```powershell
bun run dev:api
bun run dev:worker
```

Start local dependencies when database-backed API work is needed:

```powershell
docker compose --env-file .env.example -f infra/docker/compose.yml up -d postgres redis
bun run db:migrate
bun run db:seed
```

The API exposes `GET /health/live` without a database dependency and `GET /health/ready` once PostgreSQL is available. API routes use the `/v1` prefix after the health endpoints.

## Verification

```powershell
bun run typecheck
bun run lint
bun run test
bun run build
bun run docker:config
```

Do not place production credentials in this repository. Copy `.env.example` to a local `.env` only for development and resolve the provider, hosting, domain, brand, and compliance decisions listed in `arch.md` before production work.
