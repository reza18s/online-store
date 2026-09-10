# Notification worker operations

The worker consumes the transactional notification outbox. It deliberately uses the
`UnconfiguredNotificationSender` until PROVIDER-002 supplies a configured provider, so
delivery failures remain fail-closed and are recorded with the stable
`notification-delivery-failed` diagnostic.

## Start and health check

Run the long-lived worker from the repository root with:

```powershell
bun run dev:worker
```

For a built worker, use `bun run --cwd apps/worker build` followed by
`bun run --cwd apps/worker start`.

The worker-owned health command performs a real database connection and `SELECT 1`,
then disconnects:

```powershell
bun run --cwd apps/worker health
```

It exits with status `0` only when the database check and cleanup succeed. It emits
one fixed-schema JSON event with `event: "worker_health"` on success, or the stable
`database-health-check-failed` / `database-disconnect-failed` code on failure. It does
not process or mutate outbox jobs.

## Observability contract

Worker output is one-line JSON with `service: "nova-worker"`, a level, timestamp, and
one fixed event shape:

- `notification_batch` reports bounded `claimed`, `sent`, `retried`, and `failed` counts.
- `worker_started` reports only the validated environment name.
- `notification_tick_failed` reports `notification-tick-failed`.
- `worker_start_failed` reports `worker-start-failed`.
- `worker_shutdown` reports the received signal and disconnect result.
- `worker_shutdown_failed` reports `database-disconnect-failed`.

Logs never include job payloads, recipients, provider error text, cookies, credentials,
or database URLs. The provider response is also never persisted; notification jobs retain
only the stable delivery error code.

## Lifecycle behavior

Only one batch tick may run at a time; an interval callback that overlaps an active tick
is suppressed. Tick failures are caught and logged as a stable code, so interval callbacks
cannot create unhandled promise rejections. SIGINT and SIGTERM cancel future ticks,
wait for an active batch to settle, and disconnect the database once. Repeated shutdown
signals share the same cleanup promise.
