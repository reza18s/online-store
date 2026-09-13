# Monitoring signal contract

This document names the repository-owned signals that an external monitoring
system may collect. It is provider-neutral: it does not create dashboards,
metrics, deployment wiring, alert thresholds, production SLOs, credentials, or
an on-call policy. A signal is evidence about one boundary only; it is not a
release or provider sign-off.

Owner placeholders below are intentionally unassigned:

- API and runtime: `[TBD: API/runtime owner]`
- Worker and notification outbox: `[TBD: worker/outbox owner]`
- Commerce operations: `[TBD: payment/inventory operations owner]`
- Database recovery: `[TBD: database/recovery owner]`
- Monitoring and on-call: `[TBD: monitoring/on-call owner]`

## Probe contract

### API and dependency liveness

| Signal                  | Probe and healthy evidence                                                                                            | Failure interpretation                                                                                                                                          | Owner                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| API liveness            | `GET {API_ORIGIN}/health/live` returns HTTP `200` and JSON containing `"status":"ok"` and `"service":"api"`.          | The API process, route, or network path is unavailable. This check does not prove database, Redis, storage, or provider health.                                 | `[TBD: API/runtime owner]` |
| API readiness           | `GET {API_ORIGIN}/health/ready` returns HTTP `200` and JSON containing `"status":"ok"` and `"database":"ok"`.         | The API cannot establish its PostgreSQL readiness dependency, or the route is unavailable. The current readiness contract intentionally does not include Redis. | `[TBD: API/runtime owner]` |
| Redis connectivity      | Use the environment's approved Redis client check; the repository local check is `redis-cli ping` and expects `PONG`. | Redis is unavailable or the endpoint/authentication configuration is wrong. A Redis failure is not represented by `/health/ready` today.                        | `[TBD: API/runtime owner]` |
| Object-storage liveness | The current repository preflight checks `GET {S3_ORIGIN}/minio/health/live` for HTTP `200`.                           | The MinIO-compatible liveness path or storage service is unavailable. This proves neither bucket authorization nor presigned upload/complete behavior.          | `[TBD: API/runtime owner]` |

The API health routes are deliberately outside the `/v1` prefix. Other API
routes, including the protected inspection routes below, use `/v1`.

Focused local corroboration is documented in
[`local-development.md`](../../docs/runbooks/local-development.md) and the
repository preflight is `bun run test:e2e`. Those checks are useful evidence
only for the endpoint and environment tested; they are not production uptime
monitoring.

For a repeatable, read-only local signal check, use the repository-owned probe:

```powershell
bun run verify:local-signals -- `
  -ApiOrigin http://127.0.0.1:4000 `
  -S3Origin http://127.0.0.1:59000
```

The API and S3 origins must be explicit loopback HTTP(S) origins or be supplied
through `NOVA_E2E_API_URL` and `NOVA_E2E_S3_URL`. Add `-CheckWorker` only when
the current session has an explicitly approved local/disposable `DATABASE_URL`;
the probe rejects missing, malformed, non-PostgreSQL, non-loopback, and fragment-
containing database URLs before invoking Bun. It never prints or otherwise
exposes the URL. Add
`-CheckRedis -ComposeProjectName <project>` only for the already-running,
approved local Compose project. The probe never starts or stops services,
prints command output, migrates or seeds a database, performs provider calls,
or changes storage. Exit code `0` is a local PASS, `1` is an executed-check
FAIL, and `2` is a safe-prerequisite BLOCKED result. Optional checks are
reported as `NOT RUN` when they are not requested. This remains local
corroboration, not production monitoring or release sign-off.

### Worker and notification outbox

The non-mutating worker health probe is:

```powershell
bun run --cwd apps/worker health
```

It connects to PostgreSQL, performs the worker-owned `SELECT 1` check, and
disconnects without processing outbox jobs. Healthy evidence is exit code `0`
and an event with `service: "nova-worker"`, `event: "worker_health"`, and
`status: "ok"`. The stable failure codes are
`database-health-check-failed` and `database-disconnect-failed`.

Long-lived worker output is one-line JSON with `service: "nova-worker"`. The
following event names and fields are the monitoring contract:

- `notification_batch`: bounded `claimed`, `sent`, `retried`, and `failed`
  counts. `failed > 0` means delivery attempts reached the fail-closed error
  path; inspect the outbox state and the provider decision rather than
  treating it as a transient transport metric.
- `worker_started`: the validated environment name. It is startup evidence,
  not a continuing heartbeat.
- `notification_tick_failed` with `errorCode: "notification-tick-failed"`:
  the batch tick failed before producing a normal batch result.
- `worker_start_failed` with `errorCode: "worker-start-failed"`: the worker
  could not start its database/runtime lifecycle.
- `worker_shutdown` with `signal` and `disconnect`; `disconnect: "failed"`
  requires investigation.
- `worker_shutdown_failed` with
  `errorCode: "database-disconnect-failed"`: cleanup failed.

For an authenticated operator inspection, use the existing read-only route:

```text
GET {API_ORIGIN}/v1/admin/notifications?status=FAILED&limit=100&page=1
```

This requires an `operations` or `admin` staff role. Supported status filters
are `PENDING`, `PROCESSING`, `SENT`, and `FAILED`; returned records expose
`id`, `kind`, `status`, `attempts`, `availableAt`, `processedAt`, `lastError`,
and `createdAt`, but not payloads or recipients. `FAILED` is terminal after
the worker's eighth attempt. An old `PENDING` or `PROCESSING` record can
indicate backlog or an expired lease, but the repository defines no alert-age
threshold; the monitoring owner must choose one.

The default sender is intentionally unconfigured until the provider decision
is closed. Delivery failures retain only the stable
`notification-delivery-failed` diagnostic. Logs never contain payloads,
recipients, provider error text, cookies, credentials, or database URLs.

### Payment and reservation signals

For authenticated admin inspection, the existing payment read is:

```text
GET {API_ORIGIN}/v1/admin/payments?status=PENDING&limit=100&page=1
```

It requires the `admin` staff role. Supported payment-attempt statuses are
`PENDING`, `REDIRECTED`, `SUCCEEDED`, `FAILED`, `EXPIRED`, and `CANCELLED`.
The response also exposes the authoritative order/payment states and refund
records, whose statuses are `PENDING`, `SUCCEEDED`, or `FAILED`. Use
`createdAt`, `updatedAt`, `paidAt`, and the returned statuses for investigation;
the repository does not define age or volume alert thresholds. A `401`/`403`
from a protected inspection route means the probe's authentication or role
configuration is invalid, not that the filtered result is empty.

Inventory reservations are owned by the inventory service and use the stable
states `ACTIVE`, `CONSUMED`, `RELEASED`, and `EXPIRED`, with a 15-minute
default TTL. There is currently no repository-owned read-only endpoint or
metric for reservation depth, expiry lag, or stock-movement anomalies. The
`bun run test:concurrency` check is a mutating disposable-database race test,
not a continuous monitoring probe; do not schedule it against a shared or
production database.

## Backup evidence

OPS-002 provides a provider-independent PostgreSQL archive/restore verifier and
runbook in [`backup-restore-verification.md`](../../docs/runbooks/backup-restore-verification.md).
Use the runbook's approved secret/session flow and the exact verifier at
[`verify-postgres-backup.ps1`](../deploy/verify-postgres-backup.ps1); never put a
database URL, password, or key in this file or a command committed to Git.

The verifier may emit `RUNNING` while a phase is in progress and emits terminal
statuses `PASS`, `FAIL`, or `BLOCKED`. Terminal exit codes are `0` for `PASS`,
`1` for `FAIL`, and `2` for `BLOCKED`; `RUNNING` has no separate terminal exit
code. Interpret the evidence as follows:

- Full verification requires `PASS` for archive and complete/restore phases,
  a separate PostgreSQL cluster/database identity, and explicit exclusive
  target-maintenance approval. It proves the bounded archive and replay check,
  not production permissions, media, WAL, or application recovery.
- Archive-only mode may exit `0` while emitting `restore: SKIPPED`. That is
  archive readability evidence only and must not be reported as a successful
  restore drill.
- `BLOCKED` means a safe prerequisite or owner/provider decision is missing;
  `FAIL` means the selected command, archive, restore, or assertion failed and
  needs operator investigation. Do not work around either status with a
  shared target, reset, `--clean`, or an unapproved PostgreSQL version.

## Explicit evidence boundary

The repository currently supplies probes and inspection shapes, not a complete
production monitoring system. The following still require an external
monitoring provider and named owners:

- collection, transport, retention, access control, and redaction for HTTP,
  worker-log, database, Redis, object-storage, and backup evidence;
- endpoint origins, network vantage points, TLS/DNS checks, protected-route
  authentication, and the monitoring/on-call escalation path;
- alert thresholds and evaluation windows for availability, latency, 5xx,
  request rate, outbox age/depth/retries, payment age/failure/refund state,
  reservation expiry, resource saturation, and backup age;
- production PostgreSQL connection/slow-query/disk signals, Redis memory and
  eviction signals, object-storage error signals, and host CPU/memory/disk/
  network signals, because the repository exports none of these metrics;
- backup scheduling, external failure-domain storage, encryption and key
  custody, retention, WAL/archive continuity, media backup/restore, a live
  restore target, and recovery/rollback ownership;
- real payment, SMS, and shipping provider failure probes and runbooks;
- approved production recovery exercises and any production SLO/RPO/RTO
  commitment. The planning values in `arch.md` are not monitoring
  configuration or release evidence.

Until those decisions exist, report the relevant item as `BLOCKED`, `NOT RUN`,
or provider-independent evidence as appropriate; do not convert a local,
synthetic, archive-only, or authenticated inspection result into production
monitoring or release sign-off.
