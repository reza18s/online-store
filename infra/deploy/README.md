# Deployment

Production deployment remains intentionally deferred until the provider, domain, backup destination, and operational ownership decisions in [`arch.md`](../../arch.md) are confirmed. The local foundation is designed to remain portable to Docker-based Iranian hosting.

The provider-independent PostgreSQL archive and isolated-restore contract is documented in [`docs/runbooks/backup-restore-verification.md`](../../docs/runbooks/backup-restore-verification.md) and implemented by [`verify-postgres-backup.ps1`](verify-postgres-backup.ps1). It does not create an external target or claim encryption, retention, WAL, media, rollback, or production recovery evidence.
