# Local development

## First run

1. Install Bun `1.3.4` or a compatible Bun release.
2. Run `bun install` from the repository root.
3. Copy `.env.example` to `.env` if local overrides are needed.
4. Run `bun run db:generate`.
5. Run `bun run docker:config` to verify the dependency definition.
6. Start the web shell with `bun run dev`.

## Database-backed API work

```powershell
docker compose --env-file .env.example -f infra/docker/compose.yml up -d postgres redis
bun run db:migrate
bun run db:seed
bun run dev:api
```

The API liveness probe is `GET http://localhost:4000/health/live`. Readiness is `GET http://localhost:4000/health/ready` and requires PostgreSQL to be reachable.

## Checks before handoff

```powershell
bun run typecheck
bun run lint
bun run test
bun run build
bun run docker:config
```

Do not use production data or secrets in the local seeded environment.
