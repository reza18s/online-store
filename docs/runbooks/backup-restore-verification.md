# PostgreSQL backup and restore verification

This runbook defines the provider-independent database recovery contract currently
supported by NOVA. It verifies a PostgreSQL custom-format archive and, when an
operator supplies a separate disposable target, replays that archive into the
target without changing the source database.

The contract is intentionally narrower than production recovery. It does not claim
that an external backup target, encryption-key owner, retention policy, WAL archive,
media backup, monitoring provider, or rollback procedure exists. Those decisions
remain `BLOCKED` until the responsible provider and operational owners are selected.

## Safety contract

The verifier at [`infra/deploy/verify-postgres-backup.ps1`](../../infra/deploy/verify-postgres-backup.ps1)
has these invariants:

- PostgreSQL credentials are read only from the current process environment through
  `NOVA_BACKUP_SOURCE_DATABASE_URL` and, for restore,
  `NOVA_BACKUP_RESTORE_DATABASE_URL`. They are never printed in the JSON output.
- The verifier accepts connection URLs only from those process environment
  variables; it has no credential-bearing URL parameters. It passes the selected
  database name as a non-secret `--dbname` value and forwards credentials through
  the PostgreSQL client process environment.
- `pg_dump` reads the source. The source and target must use different database
  names, and the verifier compares their connected server/port/database identity
  before it starts the archive or restore.
- The archive path must be new; an existing file is rejected instead of replaced.
  The archive is written to a unique partial path and atomically published to the
  requested path, so a concurrent file cannot be overwritten by the verifier.
- Restore requires a pre-existing target database with zero user tables. The
  verifier never creates, drops, resets, truncates, or cleans a database and never
  passes `pg_restore --clean`.
- Restore uses `--exit-on-error` and `--single-transaction`, then verifies that the
  target contains user tables and any explicitly requested expected tables.
- The script leaves the archive in place for evidence and does not remove the
  target or its data. Failed runs may leave a `.partial.<guid>` archive beside the
  requested path for operator inspection; cleanup is an operator-owned action
  outside this contract.
- Output is compact JSON events with status `RUNNING`, `PASS`, `FAIL`, or
  `BLOCKED`. Exit code `0` means the selected mode passed, `1` means an executable
  check failed, and `2` means a safety or external-decision gate blocked execution.

## Preconditions

Run only with authorized non-production or isolated staging/local credentials until
the production recovery owner explicitly approves a production exercise. Never put
credentials in this runbook, the verifier's script arguments, Git, `.env` files, or
captured logs. Load the two connection URLs from the approved secret-management/
session mechanism immediately before the command; the verifier forwards them only
to the PostgreSQL client processes and never emits them.

The operator also needs:

- `pg_dump`, `pg_restore`, and `psql` on `PATH`, preferably from the same
  PostgreSQL major version as the source;
- a new writable archive path with enough local capacity;
- for a restore drill, an already-created disposable PostgreSQL database that is
  empty of user tables, has a different database name, and is not the source
  database;
- a record location outside this repository for the JSON output, archive SHA-256,
  source/target identities approved by the operator, and the run timestamp.

The repository’s declared local runtime is PostgreSQL `16` from
[`infra/docker/compose.yml`](../../infra/docker/compose.yml). The existing local
development runbook proves how to start the isolated local database, but this
verification contract does not assume that Docker, a hosting provider, or an
external backup service is available.

## Full archive and isolated restore verification

Set the connection URLs in the current process using the approved local/staging
secret flow. Do not replace the placeholders below with real credentials in a
checked-in file or shell history:

```powershell
$env:NOVA_BACKUP_SOURCE_DATABASE_URL = '<approved source URL>'
$env:NOVA_BACKUP_RESTORE_DATABASE_URL = '<approved empty disposable target URL>'
```

Choose a new archive path, then run from the repository root:

```powershell
$BackupFile = Join-Path (Get-Location) 'backup-evidence\nova-postgres-2026-09-11.dump'
powershell -NoProfile -File .\infra\deploy\verify-postgres-backup.ps1 `
  -BackupFile $BackupFile `
  -ExpectedTable _prisma_migrations
```

For the current NOVA schema, `_prisma_migrations` is a useful minimum content
assertion. Add further expected table names only when they are part of the
approved recovery scope. The script’s final `PASS` event is evidence that the
archive could be replayed into an isolated empty database and that the selected
table checks passed; it is not evidence of media, WAL, external storage, or
application smoke-test recovery.

Record the emitted `archivePath`, `archiveBytes`, `archiveEntries`, `sha256`,
`restoredTables`, and the exit code in the approved operational evidence store.
Keep the archive and restored database under the same approved retention and
access-control policy as the test environment; this repository does not define
that policy.

## Archive-only validation when the target decision is unresolved

If no authorized disposable restore target exists, do not invent one and do not
point the command at the source database. Run the safe archive-only mode:

```powershell
$BackupFile = Join-Path (Get-Location) 'backup-evidence\nova-postgres-2026-09-11.dump'
powershell -NoProfile -File .\infra\deploy\verify-postgres-backup.ps1 `
  -BackupFile $BackupFile `
  -BackupOnly
```

This mode proves only that `pg_dump` created a non-empty custom archive and that
`pg_restore --list` can read it. It exits `0` for that limited check while emitting
`restore: SKIPPED`; the OPS-002 restore gate remains `BLOCKED` until the separate
target and owner decision is recorded.

## Evidence interpretation and failure handling

`PASS` for `archive` plus `PASS` for `complete` is the minimum successful full
verification. `PASS` with `restore: SKIPPED` is archive-only evidence and must not
be reported as a restore drill. `BLOCKED` means the verifier refused to continue
because a safe prerequisite or external decision was missing. `FAIL` means a
command, archive, restore, or post-restore assertion failed and requires operator
investigation.

Do not rerun with `--clean`, a reset command, a different PostgreSQL major version,
or a shared database to work around a failure. Preserve the archive and secret-free
JSON output, inspect the exact isolated target/tooling problem, and provision a new
disposable target if the approved owner directs a retry.

## Current blockers and future extensions

The following are deliberately not implemented or claimed by this slice:

- external Iranian backup destination and its network/access contract;
- encryption command/key custody and rotation;
- 30-day retention, daily scheduling, and backup-age alert delivery;
- PostgreSQL WAL/archive continuity and the 15-minute RPO objective;
- independent object/media backup and media restore verification;
- rollback of an immutable application release;
- production monitoring provider, alert routing, and incident ownership;
- an executed production or provider-failure recovery exercise.

Closing those gates requires explicit provider, credential, ownership, and
environment decisions. Until then, label them `BLOCKED`, not `PASS`.
