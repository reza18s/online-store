import { expect, test, type Page, type Route } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const expectedFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

type LocalFixture = (route: Route, url: URL) => Promise<boolean>;

async function installReadOnlyLocalNetworkGuard(
  page: Page,
  fixture?: LocalFixture,
): Promise<string[]> {
  const blockedRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      if (!expectedFontHosts.has(url.hostname)) {
        blockedRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      }
      await route.abort();
      return;
    }

    if (!safeMethods.has(request.method())) {
      blockedRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (fixture && (await fixture(route, url))) return;

    if (url.pathname === '/v1/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, meta: {} }),
      });
      return;
    }

    if (url.pathname === '/v1/cart') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'browser-local-empty-cart',
            kind: 'GUEST',
            items: [],
            itemCount: 0,
            subtotalToman: 0,
            currency: 'IRR',
          },
          meta: {},
        }),
      });
      return;
    }

    await route.continue();
  });

  return blockedRequests;
}

async function openRoute(page: Page, hash: string): Promise<void> {
  const response = await page.goto(`/${hash}`, { waitUntil: 'domcontentloaded' });

  if (response) expect(response.ok()).toBeTruthy();
  await expect(page.getByRole('main')).toHaveCount(1);
}

async function expectSettledDiscovery(page: Page): Promise<void> {
  await expect(page.locator('main [role="status"][aria-label*="در حال"]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('در حال بارگذاری...');
}

test('renders the uncovered public category and listing routes', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page);

  const categoryRoutes = [
    { hash: '#category/women', heading: 'لباس‌هایی برای روزهای روشن' },
    { hash: '#category/children', heading: 'برای بازی‌های تمام‌نشدنی' },
  ] as const;

  for (const route of categoryRoutes) {
    await openRoute(page, route.hash);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expectSettledDiscovery(page);
  }

  const listingRoutes = [
    { hash: '#products', heading: 'همه محصولات' },
    { hash: '#products/women', heading: 'محصولات زنانه' },
    { hash: '#products/men', heading: 'محصولات مردانه' },
    { hash: '#products/children', heading: 'محصولات بچگانه' },
    { hash: '#products/sale', heading: 'تخفیف‌های منتخب' },
    { hash: '#products/accessories', heading: 'همه محصولات' },
  ] as const;

  for (const route of listingRoutes) {
    await openRoute(page, route.hash);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expectSettledDiscovery(page);
  }

  expect(blockedRequests).toEqual([]);
});

test('settles an empty public search without a skeleton or mutation', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page);
  const searchTerm = '__browser_no_match__';

  await page.route('**/v1/search**', async (route) => {
    const url = new URL(route.request().url());
    const body =
      url.pathname === '/v1/search/suggestions'
        ? []
        : {
            items: [],
            page: 1,
            limit: 8,
            total: 0,
          };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: body, meta: {} }),
    });
  });

  await page.route('**/v1/catalog/categories**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: {} }),
    });
  });

  await page.route('**/v1/catalog/facets**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { groups: [] }, meta: {} }),
    });
  });

  await openRoute(page, `#products?q=${encodeURIComponent(searchTerm)}`);

  const main = page.getByRole('main');
  await expect(
    page.getByRole('heading', { name: `نتایج جست‌وجوی «${searchTerm}»`, level: 1 }),
  ).toBeVisible();
  await expect(main.getByRole('textbox', { name: 'عبارت جست‌وجو' })).toHaveValue(searchTerm);
  await expect(main.getByRole('heading', { name: 'محصولی برای نمایش پیدا نشد' })).toBeVisible();
  await expectSettledDiscovery(page);
  expect(blockedRequests).toEqual([]);
});

test('settles public discovery and product API errors without loading forever', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page, async (route, url) => {
    if (url.pathname === '/v1/catalog/products') {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'SERVICE_UNAVAILABLE', message: 'unavailable' },
        }),
      });
      return true;
    }

    if (url.pathname === '/v1/catalog/products/__browser_missing_product__') {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'NOT_FOUND', message: 'not found' } }),
      });
      return true;
    }

    return false;
  });

  await openRoute(page, '#products/sale');
  await expect(page.getByRole('heading', { name: 'تخفیف‌های منتخب', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'بارگذاری محصولات ممکن نشد' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('button', { name: 'تلاش دوباره', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expectSettledDiscovery(page);

  await openRoute(page, '#product/__browser_missing_product__');
  await expect(page.getByRole('heading', { name: 'بارگذاری محصول ممکن نشد' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('button', { name: 'تلاش دوباره', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('main [role="status"][aria-label*="در حال"]')).toHaveCount(0);

  expect(blockedRequests).toEqual([]);
});
