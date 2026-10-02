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

    if (request.method() === 'POST' && url.pathname === '/v1/analytics/events') {
      await route.fulfill({ status: 202, contentType: 'application/json', body: '{}' });
      return;
    }

    if (!safeMethods.has(request.method())) {
      blockedRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (fixture && (await fixture(route, url))) return;

    if (url.pathname.startsWith('/v1/catalog/')) {
      const data =
        url.pathname === '/v1/catalog/products'
          ? { items: [], page: 1, limit: 8, total: 0 }
          : url.pathname === '/v1/catalog/facets'
            ? { groups: [] }
            : [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data, meta: {} }),
      });
      return;
    }

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

async function openRoute(page: Page, path: string): Promise<void> {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });

  if (response) expect(response.ok()).toBeTruthy();
  await expect(page.getByRole('main')).toHaveCount(1);
}

async function expectSettledDiscovery(page: Page): Promise<void> {
  await expect(page.locator('main [role="status"][aria-label*="در حال"]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('در حال بارگذاری...');
}

async function expectReferenceHeaderLayout(page: Page): Promise<void> {
  const bounds = await page.evaluate(() => {
    const nav = document.querySelector('.site-nav')?.getBoundingClientRect();
    const brand = document.querySelector('.site-header .brand-lockup')?.getBoundingClientRect();
    const actions = document.querySelector('.site-header__actions')?.getBoundingClientRect();
    return {
      navLeft: nav?.left ?? 0,
      brandLeft: brand?.left ?? 0,
      brandRight: brand?.right ?? 0,
      actionsRight: actions?.right ?? 0,
    };
  });

  expect(bounds.navLeft).toBeGreaterThan(bounds.brandRight);
  expect(bounds.actionsRight).toBeLessThan(bounds.brandLeft);
}

test('renders the uncovered public category and listing routes', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page);

  const categoryRoutes = [
    { path: '/category/women', heading: 'زنانه' },
    { path: '/category/children', heading: 'دنیای کوچک با داستان‌های بزرگ' },
  ] as const;

  for (const route of categoryRoutes) {
    await openRoute(page, route.path);
    await expectReferenceHeaderLayout(page);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expectSettledDiscovery(page);
  }

  const listingRoutes = [
    { path: '/products', heading: 'همه محصولات' },
    { path: '/products/women', heading: 'محصولات زنانه' },
    { path: '/products/men', heading: 'محصولات مردانه' },
    { path: '/products/children', heading: 'محصولات بچگانه' },
    { path: '/products/sale', heading: 'تخفیف‌های منتخب' },
    { path: '/products/accessories', heading: 'همه محصولات' },
  ] as const;

  for (const route of listingRoutes) {
    await openRoute(page, route.path);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expectSettledDiscovery(page);
  }

  expect(blockedRequests).toEqual([]);
});

test('gives home hero links clear pointer feedback and keeps the no-product card honest', async ({
  page,
}) => {
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page);
  await openRoute(page, '/');
  await expectReferenceHeaderLayout(page);

  const collectionLink = page.getByRole('link', { name: /مشاهده کالکشن/ });
  await expect(collectionLink).toHaveAttribute('href', '/campaign');
  await expect(collectionLink).toHaveCSS('cursor', 'pointer');
  await expect(collectionLink).toHaveCSS('color', 'rgb(255, 255, 255)');

  const heroTiles = page.locator('.nova-home-hero-tile');
  await expect(heroTiles).toHaveCount(2);
  for (const tile of await heroTiles.all()) {
    await expect(tile).toHaveCSS('cursor', 'pointer');
    await expect(tile.locator('em')).toHaveCSS('cursor', 'pointer');
  }

  const featuredCard = page.locator('.nova-home-featured-product');
  await expect(featuredCard.getByText('اکسسوری‌های نوا')).toBeVisible();
  await expect(featuredCard.getByRole('link', { name: /مشاهده محصولات/ })).toHaveAttribute(
    'href',
    '/products/accessories',
  );
  await expect(featuredCard.locator('.nova-home-featured-product__badge')).toHaveCount(0);
  await expect(featuredCard.getByRole('button', { name: /افزودن به سبد/ })).toHaveCount(0);
  expect(blockedRequests).toEqual([]);
});

test('uses an available accessory in the desktop feature card', async ({ page }) => {
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page, async (route, url) => {
    if (url.pathname !== '/v1/catalog/products') return false;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              id: 'mens-shirt',
              slug: 'oxford-shirt',
              name: 'پیراهن آکسفورد مردانه',
              priceToman: 1_890_000,
              compareAtPriceToman: null,
              available: true,
              imageUrl: '/assets/nova-product-oxford-shirt.webp',
              imageAlt: 'پیراهن آکسفورد آبی روشن',
              categories: [{ id: 'men', slug: 'men', name: 'مردانه' }],
              options: [],
              variants: [],
              colors: [{ name: 'آبی', hex: '#536b88' }],
              stockStatus: 'IN_STOCK',
            },
            {
              id: 'accessory-scarf',
              slug: 'textured-scarf',
              name: 'شال بافت برجسته',
              priceToman: 890_000,
              compareAtPriceToman: null,
              available: true,
              imageUrl: '/assets/nova-product-textured-scarf.webp',
              imageAlt: 'شال بافتنی با رنگ خنثی',
              categories: [{ id: 'accessories', slug: 'accessories', name: 'اکسسوری' }],
              options: [],
              variants: [],
              colors: [{ name: 'خاکی', hex: '#9b8b78' }],
              stockStatus: 'IN_STOCK',
            },
          ],
          page: 1,
          limit: 8,
          total: 2,
        },
        meta: {},
      }),
    });
    return true;
  });

  await openRoute(page, '/');

  const featuredCard = page.locator('.nova-home-featured-product');
  await expect(
    featuredCard.getByRole('link', { name: 'شال بافت برجسته', exact: true }),
  ).toHaveAttribute('href', '/product/textured-scarf');
  await expect(featuredCard.locator('img')).toHaveAttribute(
    'src',
    '/assets/nova-product-textured-scarf.webp',
  );
  await expect(featuredCard.getByRole('button', { name: /افزودن به سبد/ })).toBeEnabled();
  expect(blockedRequests).toEqual([]);
});

test('does not present an unrelated product as the featured accessory', async ({ page }) => {
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page, async (route, url) => {
    if (url.pathname !== '/v1/catalog/products') return false;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              id: 'mens-shirt',
              slug: 'oxford-shirt',
              name: 'پیراهن آکسفورد مردانه',
              priceToman: 1_890_000,
              compareAtPriceToman: null,
              available: true,
              imageUrl: '/assets/nova-product-oxford-shirt.webp',
              imageAlt: 'پیراهن آکسفورد آبی روشن',
              categories: [{ id: 'men', slug: 'men', name: 'مردانه' }],
              options: [],
              variants: [],
              colors: [{ name: 'آبی', hex: '#536b88' }],
              stockStatus: 'IN_STOCK',
            },
          ],
          page: 1,
          limit: 8,
          total: 1,
        },
        meta: {},
      }),
    });
    return true;
  });

  await openRoute(page, '/');

  const featuredCard = page.locator('.nova-home-featured-product');
  await expect(
    featuredCard.getByRole('link', { name: 'اکسسوری‌های نوا', exact: true }),
  ).toHaveAttribute('href', '/products/accessories');
  await expect(featuredCard.locator('.nova-home-featured-product__media img')).toHaveAttribute(
    'src',
    '/assets/nova-product-textured-scarf.webp',
  );
  await expect(featuredCard).not.toContainText('پیراهن آکسفورد مردانه');
  await expect(featuredCard.locator('.nova-home-featured-product__badge')).toHaveCount(0);
  await expect(featuredCard.getByRole('button', { name: /افزودن به سبد/ })).toHaveCount(0);
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

  await openRoute(page, `/products?q=${encodeURIComponent(searchTerm)}`);

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
  let recoverCatalogOnRetry = false;
  const blockedRequests = await installReadOnlyLocalNetworkGuard(page, async (route, url) => {
    if (url.pathname === '/v1/catalog/products') {
      if (recoverCatalogOnRetry) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { items: [], page: 1, limit: 8, total: 0 }, meta: {} }),
        });
        return true;
      }
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

  await openRoute(page, '/products/sale');
  await expect(page.getByRole('heading', { name: 'تخفیف‌های منتخب', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'سرویس فهرست محصولات در دسترس نیست' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/ارتباط با سرور محصولات برقرار نشد/)).toBeVisible();
  const retryCatalog = page.getByRole('button', { name: 'تلاش دوباره', exact: true });
  await expect(retryCatalog).toBeVisible({
    timeout: 15_000,
  });
  recoverCatalogOnRetry = true;
  await retryCatalog.click();
  await expect(page.getByRole('heading', { name: 'محصولی برای نمایش پیدا نشد' })).toBeVisible({
    timeout: 15_000,
  });
  await expectSettledDiscovery(page);

  await openRoute(page, '/product/__browser_missing_product__');
  await expect(page.getByRole('heading', { name: 'بارگذاری محصول ممکن نشد' })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole('button', { name: 'تلاش دوباره', exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.locator('main [role="status"][aria-label*="در حال"]')).toHaveCount(0);

  expect(blockedRequests).toEqual([]);
});
