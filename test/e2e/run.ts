import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const requestTimeoutMs = 5_000;

export interface E2eEndpoint {
  readonly requestUrl: URL;
  readonly safeOrigin: string;
}

export function parseE2eEndpoint(
  envName: string,
  value: string | undefined,
  fallback: string,
): E2eEndpoint {
  const rawValue = value ?? fallback;
  let requestUrl: URL;
  try {
    requestUrl = new URL(rawValue);
  } catch {
    throw new Error(`Invalid ${envName}: expected an absolute HTTP(S) URL.`);
  }

  if (
    !['http:', 'https:'].includes(requestUrl.protocol) ||
    requestUrl.username ||
    requestUrl.password ||
    requestUrl.search ||
    requestUrl.hash
  ) {
    throw new Error(
      `Invalid ${envName}: use an absolute HTTP(S) URL without credentials, query strings, or fragments.`,
    );
  }

  return { requestUrl, safeOrigin: requestUrl.origin };
}

export function endpointUrl(endpoint: E2eEndpoint, path: string): string {
  return new URL(path, endpoint.requestUrl).toString();
}

interface ProbeResult {
  readonly ok: boolean;
  readonly status: number | null;
  readonly body: string;
  readonly detail: string;
}

async function probe(url: string): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.text();
    return { ok: response.ok, status: response.status, body, detail: body.slice(0, 240) };
  } catch (error) {
    return {
      ok: false,
      status: null,
      body: '',
      detail: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkApiHealth(apiEndpoint: E2eEndpoint): Promise<string[]> {
  const failures: string[] = [];
  const live = await probe(endpointUrl(apiEndpoint, '/health/live'));
  if (!live.ok || live.status !== 200 || !live.body.includes('"status":"ok"')) {
    failures.push(`API liveness ${apiEndpoint.safeOrigin} (${live.status ?? 'unreachable'})`);
  } else {
    console.log(`[PASS] API liveness: ${apiEndpoint.safeOrigin}`);
  }

  const ready = await probe(endpointUrl(apiEndpoint, '/health/ready'));
  if (
    !ready.ok ||
    ready.status !== 200 ||
    !ready.body.includes('"status":"ok"') ||
    !ready.body.includes('"database":"ok"')
  ) {
    failures.push(
      `API readiness/database ${apiEndpoint.safeOrigin} (${ready.status ?? 'unreachable'})`,
    );
  } else {
    console.log(`[PASS] API readiness/database: ${apiEndpoint.safeOrigin}`);
  }

  return failures;
}

async function checkStorefrontRootShell(webEndpoint: E2eEndpoint): Promise<string[]> {
  const failures: string[] = [];
  const result = await probe(endpointUrl(webEndpoint, '/'));
  const hasRoot =
    result.body.includes('id="root"') &&
    result.body.includes('lang="fa"') &&
    result.body.includes('dir="rtl"');
  if (!result.ok || result.status !== 200 || !hasRoot) {
    failures.push(
      `storefront root-shell availability ${webEndpoint.safeOrigin} (${result.status ?? 'unreachable'})`,
    );
  } else {
    console.log(`[PASS] storefront root-shell availability: ${webEndpoint.safeOrigin}`);
  }
  return failures;
}

async function main(): Promise<void> {
  const apiEndpoint = parseE2eEndpoint(
    'NOVA_E2E_API_URL',
    process.env.NOVA_E2E_API_URL,
    'http://127.0.0.1:4000',
  );
  const webEndpoint = parseE2eEndpoint(
    'NOVA_E2E_WEB_URL',
    process.env.NOVA_E2E_WEB_URL,
    'http://127.0.0.1:5173',
  );

  console.log('TEST-001 runtime E2E preflight and storefront shell smoke');
  console.log(`web origin: ${webEndpoint.safeOrigin}`);
  console.log(`api origin: ${apiEndpoint.safeOrigin}`);
  console.log(
    'scope: API health/readiness plus one HTML root-shell availability probe; no browser interaction is claimed',
  );

  const failures = [
    ...(await checkApiHealth(apiEndpoint)),
    ...(await checkStorefrontRootShell(webEndpoint)),
  ];
  if (failures.length) {
    console.error('\nBLOCKED: live E2E prerequisites or storefront shell are unavailable.');
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(
      'Required: running API with PostgreSQL readiness and a running Vite/preview storefront. ' +
        'Do not interpret this as authenticated or Playwright coverage.',
    );
    process.exitCode = 2;
    return;
  }

  console.log('\nPASS: live health/readiness and storefront shell smoke.');
  console.log(
    'NOT RUN: Playwright browser journeys, authenticated OTP/CAPTCHA/SMS flows, and provider sandboxes.',
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
