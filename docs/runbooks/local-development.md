# Local development

This runbook covers the local dependency workflow for the NOVA Store workspace. It uses the repository's exact `postgres:16-alpine` and `redis:7-alpine` images, the locally verified immutable MinIO image `minio/minio@sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e` (MinIO `RELEASE.2025-09-07T16-13-09Z`), the checked-in Prisma migrations, and the idempotent catalog seed. It does not reset or delete an existing database.

## Prerequisites

- Bun `1.3.4` (the version declared by the repository).
- Docker Desktop with the Linux-container engine running and permission to pull images from Docker Hub.
- PowerShell for the commands below. Keep the environment-variable overrides in the same PowerShell session as the Prisma commands.
- Host ports `55432` and `56379` available. These alternate ports keep verification separate from a normal local stack on `5432` or `6379`.

The Compose definition declares `postgres:16-alpine`, `redis:7-alpine`, and the pinned MinIO digest above. MinIO uses `pull_policy: never`, PostgreSQL uses `nova` / `nova` / `nova_local_only`, Redis enables append-only persistence, and all three services have healthchecks. These credentials are local-only examples; do not use them in production.

## First run and static Compose validation

From the repository root, render the checked-in definition before starting anything:

```powershell
bun run docker:config
```

The rendered configuration must show:

- `postgres:16-alpine` with container port `5432` and a `pg_isready` healthcheck.
- `redis:7-alpine` with container port `6379`, append-only mode, and a `redis-cli ping` healthcheck.
- `minio/minio@sha256:14cea493d9a34af32f524e538b8346cf79f3321eff8e708c1e2960462bd8936e` with `pull_policy: never`, container ports `9000`/`9001`, and an `mc ready local` healthcheck.
- `nova_postgres_data` mounted at `/var/lib/postgresql/data` and `nova_redis_data` mounted at `/data`.
- The Compose default network. Its actual name is project-scoped (for example, `nova-db-001_default`), and containers can reach one another at `postgres:5432`, `redis:6379`, and `s3:9000`.

The `config` command is static validation; it does not prove that Docker can pull images or start containers.

## Isolated PostgreSQL 16 / Redis 7 workflow

Use a project name that is not used by another local stack. The project name scopes the generated network and volumes. The alternate published ports avoid taking over a user's existing PostgreSQL or Redis ports.

```powershell
$ComposeProject = 'nova-db-001'
$PostgresPort = 55432
$RedisPort = 56379
$ComposeArgs = @('--project-name', $ComposeProject, '--env-file', '.env.example', '-f', 'infra/docker/compose.yml')

$env:POSTGRES_PORT = [string]$PostgresPort
$env:REDIS_PORT = [string]$RedisPort
$env:DATABASE_URL = "postgresql://nova:nova_local_only@127.0.0.1:$PostgresPort/nova?schema=public"
$env:REDIS_URL = "redis://127.0.0.1:$RedisPort"

docker compose @ComposeArgs config
docker compose @ComposeArgs up -d postgres redis s3
docker compose @ComposeArgs ps

bun run db:generate
bun run db:migrate
bun run db:seed
```

`bun run db:migrate` invokes `prisma migrate deploy`. It applies the seven checked-in migrations in lexicographic order and does not create, rename, reorder, or reset migrations. `bun run db:seed` invokes the seed command configured in `packages/db/prisma.config.ts`.

If another service already owns either alternate port, choose two other unused ports and set all four overrides consistently before running the Prisma commands. Do not change the image tags to work around a pull failure.

## Runtime evidence

Run these checks after the migration and seed commands. They provide evidence for container health, migration history, seed counts, and Redis connectivity without connecting to an unrelated database.

```powershell
docker compose @ComposeArgs ps

docker compose @ComposeArgs exec -T postgres pg_isready -U nova -d nova
docker compose @ComposeArgs exec -T redis redis-cli ping

docker compose @ComposeArgs exec -T postgres psql -U nova -d nova -Atc 'SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY migration_name;'

bun run --cwd packages/db prisma migrate status

docker compose @ComposeArgs exec -T postgres psql -U nova -d nova -c 'SELECT (SELECT count(*) FROM "Category") AS categories, (SELECT count(*) FROM "Product") AS products, (SELECT count(*) FROM "ProductVariant") AS variants, (SELECT count(*) FROM "ProductMedia") AS media, (SELECT count(*) FROM "InventoryItem") AS inventory;'
```

Expected evidence:

- All three Compose services show `Up` and `(healthy)`; the exact container image names are `postgres:16-alpine`, `redis:7-alpine`, and the pinned MinIO digest documented above.
- `pg_isready` reports that the database is accepting connections.
- Redis prints `PONG`.
- Migration history lists, in order, `0001_foundation`, `0002_payment_reconciliation`, `0003_returns_and_cancellation`, `0004_notification_outbox_dedupe`, `0005_coupon_redemption_lifecycle`, `0006_seo_redirect_status`, and `0007_catalog_media_storage`.
- Prisma reports that the database schema is up to date.
- Seed counts are `9` categories, `6` products, `14` variants, `6` media records, and `14` inventory records. The seed output should also report `Seeded 9 categories and 6 products.`

The API readiness implementation checks PostgreSQL only. Start the API in a second terminal with the same `DATABASE_URL` and `REDIS_URL` overrides, then query both endpoints from the first terminal:

```powershell
bun run dev:api
```

```powershell
(Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4000/health/live').Content
(Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:4000/health/ready').Content
```

`/health/live` must return HTTP `200` with `status: "ok"` and `service: "api"`. `/health/ready` must return HTTP `200` with `status: "ok"`, `service: "api"`, and `database: "ok"`. The separate Redis `PONG` check above verifies the Redis path used by the OTP state store; Redis is intentionally not part of the current readiness response.

## Cleanup and data protection

Stop the isolated containers and remove its Compose network after verification:

```powershell
docker compose @ComposeArgs down
```

Do not add `-v`: the project-scoped volumes are deliberately retained so this cleanup cannot delete seeded data. A later run can reuse the same project and volumes, or use a new project name for another isolated database. Before any manual volume operation, confirm the exact project and volume names with `docker volume ls`; never target a shared or pre-existing user volume.

After the run, clear the session-only overrides if the PowerShell window will continue to be used:

```powershell
$env:POSTGRES_PORT = $null
$env:REDIS_PORT = $null
$env:DATABASE_URL = $null
$env:REDIS_URL = $null
```

## Troubleshooting

### Docker cannot pull `postgres:16-alpine` or `redis:7-alpine`

Inspect the exact error from `docker compose ... up`. Docker Hub access, DNS, proxy configuration, registry authentication, and Docker Desktop permissions are external prerequisites. Restore that access and rerun the exact command. Do not substitute `postgres:latest`, another PostgreSQL major version, or a host-installed database: that would not validate this repository's declared runtime.

### The port is already allocated

Choose unused alternate ports and update `POSTGRES_PORT`, `REDIS_PORT`, `DATABASE_URL`, and `REDIS_URL` together in the same session. Leave any existing service running.

### Prisma cannot connect

Confirm that the Compose project is healthy with `docker compose @ComposeArgs ps`, then confirm that `DATABASE_URL` points to the published PostgreSQL port for this project. From the host, use `127.0.0.1:<published-port>`; from another container on the Compose network, use `postgres:5432`.

### The seed is rerun

The seed uses upserts and is intended to be repeatable. It should preserve the expected counts rather than duplicate the catalog. If counts differ, stop and inspect the selected project and database URL; do not reset the database as a troubleshooting shortcut.

## Workspace checks before handoff

```powershell
bun run typecheck
bun run lint
bun run test
bun run build
bun run docker:config
```

These checks are separate from the runtime evidence above. A successful typecheck or Compose render does not prove that PostgreSQL 16, Redis 7, or the pinned MinIO image started successfully.

Do not use production data or secrets in the local seeded environment.
