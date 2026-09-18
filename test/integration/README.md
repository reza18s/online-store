# TEST-001 integration harness

`bun run test:integration` executes the explicit suite manifest in
[`suites.ts`](./suites.ts). Each entry runs repository-owned API-module, worker,
or browser-transport tests in a child Bun process, so one broken boundary
cannot be hidden by a different suite's result.

The existing service tests use deterministic in-memory database doubles and
fake gateway/shipping/notification adapters. They are the safe provider seam
for this first slice: no production credentials, SMS, payment, shipping, or
notification endpoint is contacted.

The initial matrix includes:

- catalog products, Persian search/suggestions, contextual size/color/material facets, and sale-price safety;
- cart mutation replay, customer ownership, guest-cart merge, quantity, and stale-stock conflicts;
- authoritative checkout quote, price/stock conflicts, sequential reservation conflict/settlement transitions, payment-start failure, and checkout idempotency;
- order ownership, cancellation, returns, refund handoff, and staff fulfillment transitions;
- payment success/failure, duplicate callbacks, payload-hash conflicts, late callbacks, stock reacquisition, and refund success/failure/replay;
- customer/staff auth service boundaries, session/role policy, and direct CSRF guard behavior (`auth-service-boundaries`);
- notification dedupe, redacted admin inspection, worker delivery retry, and terminal failure;
- the typed browser transport paths, including CSRF header mirroring and admin/customer route construction.

Run one bounded suite while diagnosing a failure:

```powershell
$env:NOVA_INTEGRATION_SUITE = 'checkout-inventory,auth-service-boundaries'
bun run test:integration
$env:NOVA_INTEGRATION_SUITE = $null
```

With no `NOVA_INTEGRATION_SUITE` selector, a successful run prints a distinct
`PASS: complete deterministic commerce integration matrix` result. When a
selector is present, a successful run prints `DIAGNOSTIC/PARTIAL` and the
selected count; it does not claim that the complete matrix ran.

The checkout/inventory cases are deterministic, sequential in-memory service
tests. They preserve useful idempotency, conflict, and settlement checks, but
do not exercise concurrent reservation races.

The database-backed reservation race is a separate, mutating disposable-runtime
check. It must run against a fresh PostgreSQL database whose name matches
`nova_concurrency_validation_[a-z0-9-]+`; the harness rejects the persistent
`nova` database and every non-loopback or target-override URL before constructing
a `DatabaseClient`. The harness intentionally mutates one existing inventory row
inside that disposable target, then restores that row and removes only the
synthetic reservation and stock-movement rows it created.

```powershell
$runId = Get-Date -Format yyyyMMddHHmmss
$validationDb = "nova_concurrency_validation_$runId"
$compose = @('--project-name', 'nova-local', '--env-file', '.env.example', '-f', 'infra/docker/compose.yml')
$previousDatabaseUrl = $env:DATABASE_URL

docker compose @compose exec -T postgres psql -U nova -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $validationDb;"
try {
  $env:DATABASE_URL = "postgresql://nova:nova_local_only@127.0.0.1:55432/${validationDb}?schema=public"
  bun run db:generate
  bun run db:migrate
  bun run db:seed
  bun run test:concurrency
}
finally {
  if ($null -eq $previousDatabaseUrl) {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:DATABASE_URL = $previousDatabaseUrl
  }
  docker compose @compose exec -T postgres psql -U nova -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $validationDb;"
}
```

`test:concurrency` requires an explicit `DATABASE_URL` and never falls back to
the repository's local database default. The URL must be PostgreSQL, loopback
only, fragment-free, free of target-override query parameters, and point to the
dedicated disposable name pattern above. The fresh database needs migrations and
seed data so the harness can select one published active variant with available
inventory. It temporarily sets that row's exact inventory to
`onHand=1/reserved=0`, invokes two independent `InventoryService` instances
concurrently, and requires exactly one successful reservation plus one
insufficient-stock conflict. It then verifies the persisted reservation and
stock movement, deletes only the rows created by that run, restores the exact
inventory baseline, and verifies zero synthetic-row residue. It does not call
an external provider or claim browser, payment, or authenticated-flow
coverage. The outer command drops the disposable database after the run; if the
process is interrupted before cleanup or the drop is ambiguous, discard the
target and create a fresh one rather than reusing it.

The bounded PostgreSQL notification transition check is a separate disposable-
database command. It requires a dedicated database whose name starts with
`nova_worker_validation_`; it rejects the shared `nova` database and all
non-loopback URLs before constructing a client. It creates one synthetic
notification, invokes exactly one `processNotificationBatch` tick with the
provider-unconfigured sender, verifies the first-attempt retry fields, deletes
only that row, and verifies zero residue. It does not start `dev:worker`, call
SMS.ir, or exercise worker interval/startup behavior.

Use a fresh database for each run. The following example creates the database
inside the local PostgreSQL container, applies only migrations (not seed data),
runs the bounded check, and drops only the database it just created:

```powershell
$validationDb = "nova_worker_validation_$(Get-Date -Format yyyyMMddHHmmss)"
$compose = @('--project-name', 'nova-local', '--env-file', '.env.example', '-f', 'infra/docker/compose.yml')
$previousDatabaseUrl = $env:DATABASE_URL
$previousNotificationDatabaseUrl = $env:NOVA_NOTIFICATION_DATABASE_URL

docker compose @compose exec -T postgres psql -U nova -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $validationDb;"
try {
  $env:DATABASE_URL = "postgresql://nova:nova_local_only@127.0.0.1:55432/${validationDb}?schema=public"
  $env:NOVA_NOTIFICATION_DATABASE_URL = $env:DATABASE_URL
  bun run db:generate
  bun run db:migrate
  bun run test:notification-live
}
finally {
  if ($null -eq $previousDatabaseUrl) {
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:DATABASE_URL = $previousDatabaseUrl
  }
  if ($null -eq $previousNotificationDatabaseUrl) {
    Remove-Item Env:NOVA_NOTIFICATION_DATABASE_URL -ErrorAction SilentlyContinue
  } else {
    $env:NOVA_NOTIFICATION_DATABASE_URL = $previousNotificationDatabaseUrl
  }
  docker compose @compose exec -T postgres psql -U nova -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $validationDb;"
}
```

The database is intentionally discarded even after a successful row cleanup;
if the process is interrupted or cleanup is ambiguous, do not reuse the target.
The command reports an isolated PostgreSQL outbox transition only. It is not
provider-delivery, real-SMS, worker-runtime, concurrency, or production
evidence.

The composed catalog-media HTTP check is a separate opt-in command. It starts
the built API entrypoint in a child process on a dedicated loopback port,
creates a synthetic active admin/TOTP fixture in a fresh disposable database,
and exercises the real CSRF, staff-session, admin presign/complete, MinIO PUT,
public derivative redirect, and admin delete/quarantine routes:

```powershell
$runId = Get-Date -Format yyyyMMddHHmmss
$validationDb = "nova_media_validation_$runId"
$validationBucket = "nova-media-validation-$runId"
$compose = @('--project-name', 'nova-local', '--env-file', '.env.example', '-f', 'infra/docker/compose.yml')
$previousDatabaseUrl = $env:DATABASE_URL
$previousMediaDatabaseUrl = $env:NOVA_MEDIA_DATABASE_URL
$previousMediaBucket = $env:NOVA_MEDIA_S3_BUCKET
$previousMediaRedisUrl = $env:NOVA_MEDIA_REDIS_URL

docker compose @compose exec -T postgres psql -U nova -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE $validationDb;"
docker compose @compose exec -T s3 sh -c 'mc alias set admin http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null'
docker compose @compose exec -T s3 mc mb --ignore-existing "admin/$validationBucket"
try {
  $env:DATABASE_URL = "postgresql://nova:nova_local_only@127.0.0.1:55432/${validationDb}?schema=public"
  $env:NOVA_MEDIA_DATABASE_URL = $env:DATABASE_URL
  $env:NOVA_MEDIA_S3_BUCKET = $validationBucket
  $env:NOVA_MEDIA_REDIS_URL = 'redis://127.0.0.1:56379/15'
  bun run db:generate
  bun run db:migrate
  bun run build
  bun run test:media-live
}
finally {
  if ($null -eq $previousDatabaseUrl) { Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue } else { $env:DATABASE_URL = $previousDatabaseUrl }
  if ($null -eq $previousMediaDatabaseUrl) { Remove-Item Env:NOVA_MEDIA_DATABASE_URL -ErrorAction SilentlyContinue } else { $env:NOVA_MEDIA_DATABASE_URL = $previousMediaDatabaseUrl }
  if ($null -eq $previousMediaBucket) { Remove-Item Env:NOVA_MEDIA_S3_BUCKET -ErrorAction SilentlyContinue } else { $env:NOVA_MEDIA_S3_BUCKET = $previousMediaBucket }
  if ($null -eq $previousMediaRedisUrl) { Remove-Item Env:NOVA_MEDIA_REDIS_URL -ErrorAction SilentlyContinue } else { $env:NOVA_MEDIA_REDIS_URL = $previousMediaRedisUrl }
  docker compose @compose exec -T s3 mc rb --force "admin/$validationBucket"
  docker compose @compose exec -T postgres psql -U nova -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS $validationDb;"
}
```

This command must use a fresh database with migrations only (do not run the
normal seed, because the harness creates its own `admin` role and product), a
unique MinIO bucket, and Redis logical database `15`. The database URL, bucket,
S3 endpoint, and Redis URL are validated fail-closed by the harness; it refuses
the shared `nova` database, the shared `nova-media-local` bucket, non-loopback
targets, credentials/query overrides in the target URLs, and an API port that
already responds. The parent API on port `4000` and the storefront are not
reused or restarted.

The harness uses the built `apps/api/dist/main.js` artifact and keeps the API
child environment separate from the parent process. It never prints the
password, TOTP code, cookies, connection string, or S3 credentials. The outer
`finally` block removes the unique bucket and drops the unique database even
when the HTTP check fails. If teardown is interrupted or ambiguous, discard
the target runtime instead of reusing it.

The successful route check proves local composed HTTP/session/CSRF/Prisma/
MinIO behavior only. It does not prove real staff credentials, production
identity/MFA, external provider delivery, deployment, or release readiness.

The `auth-service-boundaries` suite exercises customer/staff auth services and
direct CSRF guard behavior. The separate `test:media-live` command exercises a
bounded real HTTP cookie round-trip and composed guard pipeline against its own
disposable runtime; it remains opt-in and does not change the deterministic
matrix.

This is deterministic integration coverage, not a substitute for the full live
runtime gate. PostgreSQL 16, Redis 7, and real provider sandbox checks remain
separate because the repository does not guarantee that those services or
credentials are available in every environment. The deterministic harness
prints those boundaries explicitly and never turns them into passing tests.
The separate concurrency command proves only the database-backed reservation
race and its cleanup contract; it makes no claim for browser interaction,
provider delivery, or authenticated-flow coverage.
