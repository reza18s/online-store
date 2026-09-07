# Local infrastructure

This directory contains the local PostgreSQL and Redis definition required by the NOVA Store foundation. Application processes run through Bun during local development; the compose file keeps stateful dependencies reproducible without putting credentials in source control.

From the repository root, review the Compose file without starting containers:

```powershell
docker compose --env-file .env.example -f infra/docker/compose.yml config
```

Start the dependencies when database-backed API work is needed:

```powershell
docker compose --env-file .env.example -f infra/docker/compose.yml up -d postgres redis
```

Use a local `.env` only for development. Never commit production credentials.
