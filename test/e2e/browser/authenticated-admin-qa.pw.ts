import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  AdminCatalogCategory,
  AdminCatalogProductPage,
  AdminInventoryPage,
  ApiEnvelope,
  ApiMeta,
  StaffUser,
} from '../../../packages/api-client/src/types';

const qaMarker = 'BROWSER-LOCAL-ADMIN-QA-001';
const fixtureTimestamp = '2026-01-01T00:00:00.000Z';

const apiMeta: ApiMeta = {
  requestId: `request-${qaMarker}`,
  timestamp: fixtureTimestamp,
};

const staffUser: StaffUser = {
  id: `staff-${qaMarker}`,
  email: 'qa-admin@browser.local',
  status: 'ACTIVE',
  roles: ['admin'],
};

const category: AdminCatalogCategory = {
  id: `category-${qaMarker}`,
  slug: 'browser-local-qa-category',
  name: `دسته تست ${qaMarker}`,
  description: 'Synthetic browser-local category fixture.',
  parentId: null,
  archivedAt: null,
  productCount: 1,
  childCount: 0,
  createdAt: fixtureTimestamp,
  updatedAt: fixtureTimestamp,
};

const productPage: AdminCatalogProductPage = {
  items: [
    {
      id: `product-${qaMarker}`,
      slug: 'browser-local-qa-product',
      name: `محصول تست مرورگر ${qaMarker}`,
      status: 'PUBLISHED',
      publishedAt: fixtureTimestamp,
      archivedAt: null,
      basePriceToman: 1250000,
      compareAtPriceToman: null,
      categories: [{ id: category.id, slug: category.slug, name: category.name }],
      primaryMedia: null,
      inventory: {
        available: 7,
        lowStockVariantCount: 0,
        outOfStockVariantCount: 0,
        status: 'IN_STOCK',
      },
      variantCount: 1,
      mediaCount: 0,
      createdAt: fixtureTimestamp,
      updatedAt: fixtureTimestamp,
    },
  ],
  total: 1,
  page: 1,
  limit: 8,
};

const inventoryPage: AdminInventoryPage = {
  items: [
    {
      id: `inventory-${qaMarker}`,
      variantId: `variant-${qaMarker}`,
      productId: `product-${qaMarker}`,
      productSlug: 'browser-local-qa-product',
      productName: `محصول تست مرورگر ${qaMarker}`,
      productStatus: 'PUBLISHED',
      sku: `SKU-${qaMarker}`,
      variantTitle: 'نسخه مصنوعی QA',
      isActive: true,
      onHand: 3,
      reserved: 2,
      available: 1,
      reorderPoint: 2,
      stockStatus: 'LOW_STOCK',
      updatedAt: fixtureTimestamp,
      recentMovements: [],
    },
  ],
  total: 1,
  page: 1,
  limit: 4,
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: apiMeta };
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

async function installAdminFixtureGuard(page: Page) {
  const stateChangingRequests: string[] = [];
  const unexpectedApiRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      await route.abort();
      return;
    }

    if (!['GET', 'HEAD'].includes(request.method())) {
      stateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/staff/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(staffUser)),
      });
      return;
    }

    if (url.pathname === '/v1/admin/catalog/products') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(productPage)),
      });
      return;
    }

    if (url.pathname === '/v1/admin/catalog/categories') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope([category])),
      });
      return;
    }

    if (url.pathname === '/v1/admin/inventory/items') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(inventoryPage)),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/')) {
      unexpectedApiRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return { stateChangingRequests, unexpectedApiRequests };
}

test('renders a fixture-backed authenticated admin catalog within the staff boundary', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  const staffSessionRequests: string[] = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/v1/staff/auth/me') {
      staffSessionRequests.push(`${request.method()} ${url.pathname}`);
    }
  });

  const { stateChangingRequests, unexpectedApiRequests } = await installAdminFixtureGuard(page);

  const response = await page.goto('/#admin/catalog', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'کاتالوگ و موجودی', exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'محصولات', exact: true })).toBeVisible();
  await expect(main).toContainText(qaMarker);
  await expect(main).toContainText('محصول تست مرورگر');
  await expect(main).toContainText('دسته تست');
  await expect(main).toContainText('۱٬۲۵۰٬۰۰۰ تومان');
  await expect(main).toContainText('موجود');
  await expect(main).toContainText('موجودی کم');

  await expect(main.locator('[role="status"][aria-label*="در حال"]')).toHaveCount(0);
  await expect(main).not.toContainText('مدیر نمونه');
  await expect(main).not.toContainText('حساب نمایشی');
  await expect(main).not.toContainText('NV-DEMO-001');

  for (const createRoute of ['#admin/catalog/products/new', '#admin/products/new']) {
    await page.goto(`/${createRoute}`, { waitUntil: 'domcontentloaded' });
    const editor = page.getByRole('main');
    await expect(editor.getByRole('heading', { name: 'محصول جدید', exact: true })).toBeVisible();
    await expect(editor.getByLabel('شناسه محصول')).toBeEnabled();
    await expect(editor).not.toContainText('محصول پیدا نشد');
    await expect(editor).not.toContainText('این مسیر هنوز به داده‌های واقعی پنل متصل نشده است');
  }

  expect(staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expect(stateChangingRequests).toEqual([]);
  expect(unexpectedApiRequests).toEqual([]);
});
