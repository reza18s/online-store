# TEST-001 E2E harness

`bun run test:e2e` is a live-runtime prerequisite gate, not a browser test. It checks:

1. `GET /health/live` returns `200`;
2. `GET /health/ready` returns `200` with `database: "ok"`;
3. unauthenticated public catalog categories and one product listing return the
   expected envelope shapes;
4. unauthenticated customer session lookup returns `data: null`;
5. customer order, staff session, and admin catalog endpoints fail closed with
   `401` and the stable `UNAUTHORIZED` error code;
6. the Vite/preview storefront serves one HTML root shell with the expected
   RTL application root.

The root-shell check intentionally does not append hash routes before using
`fetch`: fragments are not sent in an HTTP request, so a fetch-based probe
cannot establish route-level rendering. These checks are HTTP contract smoke
only; browser route journeys remain deferred.

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

The repository now has a pinned Playwright browser runner. Install the
workspace dependencies and the Chromium browser once:

```powershell
bun install
npx playwright install chromium
```

Start the API and Vite storefront using the runbook above, then run the
anonymous browser smoke:

```powershell
bun run test:e2e:browser
```

The browser runner uses `NOVA_E2E_WEB_URL` (default
`http://127.0.0.1:5173`), keeps browser reports in ignored output folders, and
currently covers only the public RTL storefront shell. It does not enter or
invent customer OTP, CAPTCHA, SMS, staff MFA, payment-provider, or other
authenticated values. Authenticated checkout, payment redirects/callbacks,
and admin mutations remain explicitly `NOT RUN`/`BLOCKED`, not skipped passing
tests.

If the pinned Playwright Chromium download is unavailable on a local machine,
an operator may use the installed Chrome channel for a local smoke only:

```powershell
$env:NOVA_E2E_BROWSER_CHANNEL = 'chrome'
bun run test:e2e:browser
```

An already-installed Chromium-compatible executable can be selected with
`NOVA_E2E_BROWSER_PATH` instead. Set only one of these two overrides at a
time; neither changes the repository default.

The repository default remains the pinned Playwright Chromium browser; this
override is not a substitute for the reproducible browser install in CI.

The runner rejects URL credentials, query strings, and fragments and logs only
the parsed origin. It keeps the local API readiness and storefront prerequisite
fail-closed; it does not print the configured URL values or environment values.
