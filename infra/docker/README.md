# Local infrastructure

This directory contains the local PostgreSQL and Redis definition required by the planned NOVA Store stack. The setup task does not start these services.

From the repository root, review the Compose file without starting containers:

```bash
docker compose --env-file .env.example -f infra/docker/compose.yml config
```

Use a local `.env` only for development. Never commit production credentials.
