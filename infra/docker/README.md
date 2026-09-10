# Local infrastructure

This directory contains the local PostgreSQL 16 and Redis 7 definitions required by the NOVA Store foundation. Application processes run through Bun during local development; Compose provides the stateful dependencies without putting credentials in source control.

The complete reproducible workflow, including isolated project names, alternate host ports, Prisma migrations, seed verification, health probes, and cleanup, is documented in [`docs/runbooks/local-development.md`](../../docs/runbooks/local-development.md).

From the repository root, review the exact rendered Compose configuration without starting containers:

```powershell
docker compose --env-file .env.example -f infra/docker/compose.yml config
```

For an ordinary local session, use a unique Compose project name. Do not attach to an existing project or remove volumes that you did not create:

```powershell
$env:POSTGRES_PORT = '55432'
$env:REDIS_PORT = '56379'
docker compose --project-name nova-local --env-file .env.example -f infra/docker/compose.yml up -d postgres redis
```

The Compose default network lets containers address the services as `postgres:5432` and `redis:6379`. Processes running on the host use the published ports instead. Compose project names scope the generated network and named volumes, so the runbook's isolated project should be preferred for verification.

Use a local `.env` only for development. The values in `.env.example` are non-production examples and must never be used for production credentials.
