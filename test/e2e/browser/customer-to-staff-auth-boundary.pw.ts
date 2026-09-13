import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  ApiEnvelope,
  CartView,
  CustomerOrderPage,
  CustomerUser,
} from '../../../packages/api-client/src/types';

const customerSessionPath = '/v1/auth/me';
const customerOrdersPath = '/v1/account/orders';
const staffSessionPath = '/v1/staff/auth/me';
const syntheticMarker = 'BROWSER-LOCAL-CUSTOMER-TO-STAFF-001';
const syntheticTimestamp = '2026-01-01T00:00:00.000Z';
const syntheticCustomerEmail = 'customer-boundary@browser.local';

const syntheticCustomer: CustomerUser = {
  id: `customer-${syntheticMarker}`,
  phone: '+989000000099',
  email: syntheticCustomerEmail,
  status: 'ACTIVE',
};

const syntheticCart: CartView = {
  id: `cart-${syntheticMarker}`,
  kind: 'CUSTOMER',
  items: [],
  itemCount: 0,
  subtotalToman: 0,
  currency: 'TOMAN',
};

const syntheticOrders: CustomerOrderPage = {
  items: [],
  total: 0,
  page: 1,
  limit: 10,
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return {
    data,
    meta: {
      requestId: `request-${syntheticMarker}`,
      timestamp: syntheticTimestamp,
    },
  };
}

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function isBrowserLocalFontStub(url: URL): boolean {
  return url.origin === 'https://fonts.googleapis.com' && url.pathname === '/css2';
}

async function installCustomerToStaffBoundary(page: Page) {
  const blockedExternalRequests: string[] = [];
  const blockedMutationRequests: string[] = [];
  const unhandledApiRequests: string[] = [];
  const customerSessionRequests: string[] = [];
  const customerOrdersRequests: string[] = [];
  const staffSessionRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      if (isBrowserLocalFontStub(url)) {
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      blockedExternalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      blockedMutationRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === customerSessionPath) {
      customerSessionRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticCustomer)),
      });
      return;
    }

    if (url.pathname === '/v1/cart') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticCart)),
      });
      return;
    }

    if (url.pathname === customerOrdersPath) {
      customerOrdersRequests.push(`${request.method()} ${url.pathname}${url.search}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticOrders)),
      });
      return;
    }

    if (url.pathname === staffSessionPath) {
      staffSessionRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'UNAUTHORIZED', message: 'staff session required' },
        }),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/')) {
      unhandledApiRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return {
    blockedExternalRequests,
    blockedMutationRequests,
    unhandledApiRequests,
    customerSessionRequests,
    customerOrdersRequests,
    staffSessionRequests,
  };
}

test('does not reuse an authenticated customer session for a staff-only route', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  page.setDefaultTimeout(15_000);
  const network = await installCustomerToStaffBoundary(page);

  const customerResponse = await page.goto('/#account/orders', { waitUntil: 'domcontentloaded' });
  expect(customerResponse?.ok()).toBeTruthy();

  const customerMain = page.getByRole('main');
  await expect(customerMain.getByRole('heading', { name: 'سفارش‌های من', level: 1 })).toBeVisible();
  await expect(customerMain.locator('.account-nav__profile')).toContainText(syntheticCustomerEmail);
  const customerSessionRequestsBeforeStaffNavigation = network.customerSessionRequests.length;
  expect(customerSessionRequestsBeforeStaffNavigation).toBeGreaterThan(0);
  expect(network.customerOrdersRequests).toEqual(['GET /v1/account/orders?page=1&limit=10']);

  await page.evaluate(() => {
    window.location.hash = '#admin/catalog';
  });

  await expect(page).toHaveURL(/#admin\/catalog$/);
  await expect(page.getByRole('heading', { name: 'ورود به فضای مدیریت' })).toBeVisible();
  await expect(page.getByLabel('ایمیل سازمانی')).toBeEmpty();
  await expect(page.getByLabel('رمز عبور')).toBeEmpty();
  await expect(page.getByLabel('کد تأیید دومرحله‌ای یا کد بازیابی')).toBeEmpty();
  await expect(page.getByRole('main')).not.toContainText(syntheticMarker);
  await expect(page.getByRole('main')).not.toContainText('کاتالوگ و موجودی');

  expect(network.customerSessionRequests).toHaveLength(
    customerSessionRequestsBeforeStaffNavigation,
  );
  expect(network.staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expect(network.blockedExternalRequests).toEqual([]);
  expect(network.blockedMutationRequests).toEqual([]);
  expect(network.unhandledApiRequests).toEqual([]);
});
