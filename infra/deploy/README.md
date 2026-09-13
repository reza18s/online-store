# Deployment

Production deployment remains intentionally deferred until the provider, domain, backup destination, and operational ownership decisions in [`arch.md`](../../arch.md) are confirmed. The local foundation is designed to remain portable to Docker-based Iranian hosting.

The provider-independent PostgreSQL archive and isolated-restore contract is documented in [`docs/runbooks/backup-restore-verification.md`](../../docs/runbooks/backup-restore-verification.md) and implemented by [`verify-postgres-backup.ps1`](verify-postgres-backup.ps1). It does not create an external target or claim encryption, retention, WAL, media, rollback, or production recovery evidence.

The repository-owned local release contract is implemented by [`verify-local-release.ps1`](verify-local-release.ps1). Run it from the repository root after loading only the approved local environment:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\infra\deploy\verify-local-release.ps1
```

The default mode clears only the repository's generated package and service `dist` directories before running `bun run build`, then verifies the non-empty package, API, web SSR, and worker artifacts plus each service's declared start command. This prevents stale TypeScript output from satisfying the artifact check after an output is removed or renamed. Use `-SkipBuild` only when checking artifacts produced by an already-verified build; that mode intentionally does not provide build-freshness evidence. This is local build/artifact evidence; it does not start services, deploy, perform rollback, read credentials, call providers, or replace the separate database restore and staging/production gates.
