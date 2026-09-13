# Local infrastructure

This directory contains the local PostgreSQL 16, Redis 7, and S3-compatible MinIO definitions required by the NOVA Store foundation. Application processes run through Bun during local development; Compose provides the stateful dependencies without putting production credentials in source control.

The complete reproducible workflow, including isolated project names, alternate host ports, Prisma migrations, seed verification, health probes, and cleanup, is documented in [`docs/runbooks/local-development.md`](../../docs/runbooks/local-development.md).

From the repository root, review the exact rendered Compose configuration without starting containers:

```powershell
docker compose --env-file .env.example -f infra/docker/compose.yml config
```

For an ordinary local session, use a unique Compose project name. Do not attach to an existing project or remove volumes that you did not create:

```powershell
$env:POSTGRES_PORT = '55432'
$env:REDIS_PORT = '56379'
docker compose --project-name nova-local --env-file .env.example -f infra/docker/compose.yml up -d postgres redis s3
```

The Compose default network lets containers address the services as `postgres:5432`, `redis:6379`, and `s3:9000`. Processes running on the host use the published ports instead: PostgreSQL `55432`, Redis `56379`, S3 API `127.0.0.1:59000`, and the MinIO console `127.0.0.1:59001` in the convenience setup. Compose project names scope the generated network and named volumes, so the runbook's isolated project should be preferred for verification.

The local S3-compatible endpoint is `http://127.0.0.1:59000`, with the MinIO console at `http://127.0.0.1:59001`. The Compose service uses the locally verified immutable image `minio/minio@sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e` (MinIO `RELEASE.2025-09-07T16-13-09Z`) with `pull_policy: never`; update this reference only after verifying a replacement digest is locally available and compatible with the current runtime. The Compose service explicitly configures MinIO's server-wide stale multipart-upload cleanup to a 24-hour expiry with a 6-hour scan interval. This local image does not accept `AbortIncompleteMultipartUpload` through its S3 bucket lifecycle API, so do not replace the setting with an object-expiration rule: complete objects are never automatically expired or hard-deleted, and application media deletion must still pass through the catalog quarantine and database lifecycle. The local bucket and credentials in `.env.example` are development-only examples. Keep the S3 volume and bucket separate from any production or staging storage, and never expose the MinIO console or root credentials publicly.

To start the local PostgreSQL, Redis, and MinIO services, wait for all health checks, run Prisma generation/migrations/seed, and launch the Bun API with the matching connection URLs, use the convenience command from the repository root:

```powershell
bun run dev:api:local
```

The helper uses project `nova-local`, publishes PostgreSQL on `55432`, Redis on `56379`, and S3 on `59000`/`59001`, connects through the IPv4 loopback address `127.0.0.1` for Windows/Docker compatibility, and keeps those containers running after the API process is stopped. If a healthy API is already serving the selected port, the helper reuses it instead of starting a duplicate process; an occupied port that fails the readiness check produces a clear error without stopping its owner. Override the ports when needed, including the API port, for example `powershell -NoProfile -ExecutionPolicy Bypass -File infra/docker/start-local.ps1 -PostgresPort 55433 -RedisPort 56380 -S3Port 59002 -S3ConsolePort 59003 -ApiPort 4001`.

Use a local `.env` only for development. The values in `.env.example` are non-production examples and must never be used for production credentials.
