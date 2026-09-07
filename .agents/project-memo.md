## NOVA foundation

- `arch.md` is the current architecture source of truth. The repository is in Phase 1: a Bun workspace with `apps/web`, `apps/api`, `apps/worker`, and shared packages under `packages/`.
- `apps/web/src/app.tsx` is the current RTL foundation screen. It uses `@nova/api-client` through TanStack Query and reports API liveness with a retry action.
- `apps/api/src/main.ts` owns Nest bootstrap, CORS, the `/v1` prefix, validation, request IDs, and the shared error envelope. Health endpoints stay outside `/v1` at `/health/live` and `/health/ready`.
- `apps/api/src/modules/health` owns liveness and PostgreSQL readiness checks; `apps/api/src/database` owns the Nest database lifecycle boundary.
- `packages/api-client` owns transport-safe health/error types and query-key conventions. `packages/ui` owns shared tokens and primitives. `apps/worker/src/main.ts` is an idle process boundary until queue jobs are added.
- Local setup uses `bun install`, `bun run db:generate`, `bun run docker:config`, `bun run dev`, `bun run dev:api`, and `bun run dev:worker`.
- Confirmed locally: ESLint, frontend typecheck/build, worker typecheck/build, shared config/api-client/ui typechecks, Docker Compose config validation, and the five existing tests.
- Prisma generation is currently blocked by the environment's inability to resolve `binaries.prisma.sh`; the generated client is therefore absent and database/API typecheck/build remain unverified until generation succeeds.
