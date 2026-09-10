const webBaseUrl = (process.env.NOVA_E2E_WEB_URL ?? 'http://127.0.0.1:5173').replace(/\/$/, '');
const apiBaseUrl = (process.env.NOVA_E2E_API_URL ?? 'http://127.0.0.1:4000').replace(/\/$/, '');
const requestTimeoutMs = 5_000;

const shellJourneys = [
  { id: 'home', hash: '#home' },
  { id: 'category-women', hash: '#category/women' },
  { id: 'search', hash: `#search?q=${encodeURIComponent('مانتو')}` },
  { id: 'product-detail', hash: '#product/linen-overshirt' },
  { id: 'cart', hash: '#cart' },
  { id: 'auth', hash: '#auth' },
  { id: 'account', hash: '#account' },
  { id: 'checkout-address', hash: '#checkout/address' },
  { id: 'admin-products', hash: '#admin/products' },
] as const;

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

async function checkApiHealth(): Promise<string[]> {
  const failures: string[] = [];
  const live = await probe(`${apiBaseUrl}/health/live`);
  if (!live.ok || live.status !== 200 || !live.body.includes('"status":"ok"')) {
    failures.push(`API liveness ${apiBaseUrl}/health/live (${live.status ?? 'unreachable'})`);
  } else {
    console.log(`[PASS] API liveness: ${apiBaseUrl}/health/live`);
  }

  const ready = await probe(`${apiBaseUrl}/health/ready`);
  if (
    !ready.ok ||
    ready.status !== 200 ||
    !ready.body.includes('"status":"ok"') ||
    !ready.body.includes('"database":"ok"')
  ) {
    failures.push(
      `API readiness/database ${apiBaseUrl}/health/ready (${ready.status ?? 'unreachable'})`,
    );
  } else {
    console.log(`[PASS] API readiness/database: ${apiBaseUrl}/health/ready`);
  }

  return failures;
}

async function checkStorefrontShell(): Promise<string[]> {
  const failures: string[] = [];
  for (const journey of shellJourneys) {
    const url = new URL('/', `${webBaseUrl}/`);
    url.hash = journey.hash.slice(1);
    const result = await probe(url.toString());
    const hasRoot =
      result.body.includes('id="root"') &&
      result.body.includes('lang="fa"') &&
      result.body.includes('dir="rtl"');
    if (!result.ok || result.status !== 200 || !hasRoot) {
      failures.push(`storefront shell ${journey.id} (${result.status ?? 'unreachable'})`);
      continue;
    }
    console.log(`[PASS] storefront shell route: ${journey.id}`);
  }
  return failures;
}

async function main(): Promise<void> {
  console.log('TEST-001 runtime E2E preflight and storefront shell smoke');
  console.log(`web: ${webBaseUrl}`);
  console.log(`api: ${apiBaseUrl}`);
  console.log(
    'scope: API health/readiness plus HTML shell fallback; no browser interaction is claimed',
  );

  const failures = [...(await checkApiHealth()), ...(await checkStorefrontShell())];
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

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
