# TEST-001 E2E harness

`bun run test:e2e` is a live-runtime prerequisite gate, not a browser test. It checks:

1. `GET /health/live` returns `200`;
2. `GET /health/ready` returns `200` with `database: "ok"`;
3. the Vite/preview storefront serves one HTML root shell with the expected
   RTL application root.

The root-shell check intentionally does not append hash routes before using
`fetch`: fragments are not sent in an HTTP request, so a fetch-based probe
cannot establish route-level rendering. This command reports one named
root-shell availability result only; browser route journeys remain deferred.

The command exits with code `2` and prints `BLOCKED` when the API, exact
PostgreSQL-backed readiness, or storefront is unavailable. It does not start
or stop Docker, delete databases/volumes, or contact providers.

Use the existing isolated local-development runbook before this command:

```powershell
bun run docker:config
# Start the documented isolated postgres:16-alpine and redis:7-alpine stack,
# apply the checked-in migrations, seed the isolated database, then start:
bun run dev:api
bun run dev
```

Override local origins when the servers use different ports:

```powershell
$env:NOVA_E2E_API_URL = 'http://127.0.0.1:4000'
$env:NOVA_E2E_WEB_URL = 'http://127.0.0.1:5173'
bun run test:e2e
```

This checkout has no Playwright dependency and no safe automated source of
customer OTP, CAPTCHA, SMS, or staff MFA values. Therefore Playwright
interaction journeys, authenticated checkout, payment redirects/callbacks,
and admin mutations are explicitly `NOT RUN`/`BLOCKED`, not skipped passing
tests. Add a browser runner only after the repository adopts an approved
Playwright setup and user-controlled test credentials/fixtures.

The runner rejects URL credentials, query strings, and fragments and logs only
the parsed origin. It keeps the local API readiness and storefront prerequisite
fail-closed; it does not print the configured URL values or environment values.
