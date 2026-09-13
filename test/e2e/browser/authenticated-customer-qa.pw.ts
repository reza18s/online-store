import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  ApiEnvelope,
  CartView,
  CustomerOrderDetail,
  CustomerOrderPage,
  CustomerOrderSummary,
  CustomerUser,
} from '../../../packages/api-client/src/types';

const syntheticMarker = 'QA-SYNTHETIC-AUTH-CUSTOMER-001';
const syntheticOrderNumber = 'QA-ORDER-001';
const syntheticCustomerEmail = 'qa.customer@example.test';
const syntheticCustomerPhone = '+989000000001';
const syntheticTimestamp = '2026-09-12T00:00:00.000Z';

const syntheticCustomer: CustomerUser = {
  id: syntheticMarker,
  phone: syntheticCustomerPhone,
  email: syntheticCustomerEmail,
  status: 'ACTIVE',
};

const syntheticCustomerCart: CartView = {
  id: 'QA-SYNTHETIC-CART-CUSTOMER-001',
  kind: 'CUSTOMER',
  items: [],
  itemCount: 0,
  subtotalToman: 0,
  currency: 'TOMAN',
};

const syntheticGuestCart: CartView = {
  id: 'QA-SYNTHETIC-CART-GUEST-001',
  kind: 'GUEST',
  items: [],
  itemCount: 0,
  subtotalToman: 0,
  currency: 'TOMAN',
};

const syntheticOrderSummary: CustomerOrderSummary = {
  orderId: 'QA-SYNTHETIC-ORDER-ID-001',
  orderNumber: syntheticOrderNumber,
  status: 'DELIVERED',
  paymentStatus: 'PAID',
  subtotalToman: 2_400_000,
  discountToman: 100_000,
  shippingToman: 80_000,
  taxToman: 0,
  totalToman: 2_380_000,
  currency: 'TOMAN',
  createdAt: syntheticTimestamp,
  updatedAt: syntheticTimestamp,
};

const syntheticOrders: CustomerOrderPage = {
  items: [syntheticOrderSummary],
  total: 1,
  page: 1,
  limit: 10,
};

const syntheticOrderDetail: CustomerOrderDetail = {
  ...syntheticOrderSummary,
  items: [
    {
      id: 'QA-SYNTHETIC-ORDER-ITEM-001',
      productId: 'QA-SYNTHETIC-PRODUCT-001',
      variantId: 'QA-SYNTHETIC-VARIANT-001',
      productName: `${syntheticMarker} / پیراهن آزمایشی`,
      sku: 'QA-SYNTHETIC-SKU-001',
      variantSnapshot: { size: 'M', color: 'QA-SYNTHETIC-COLOR' },
      quantity: 1,
      unitPriceToman: 2_400_000,
      compareAtPriceToman: 2_600_000,
      discountToman: 100_000,
      taxToman: 0,
      totalToman: 2_300_000,
    },
  ],
  address: {
    recipientName: `${syntheticMarker} / مشتری آزمایشی`,
    phone: syntheticCustomerPhone,
    province: 'استان آزمایشی',
    city: 'شهر آزمایشی',
    addressLine: 'نشانی آزمایشی، بدون اطلاعات واقعی',
    postalCode: '0000000000',
  },
  payment: {
    status: 'SUCCEEDED',
    amountToman: syntheticOrderSummary.totalToman,
    redirectUrl: null,
    createdAt: syntheticTimestamp,
    paidAt: syntheticTimestamp,
  },
  shipment: {
    provider: 'QA-SYNTHETIC-CARRIER',
    method: 'ارسال آزمایشی',
    trackingReference: 'QA-SYNTHETIC-TRACKING-001',
    status: 'DELIVERED',
    shippedAt: syntheticTimestamp,
    deliveredAt: syntheticTimestamp,
  },
  events: [
    {
      fromStatus: null,
      toStatus: 'CONFIRMED',
      createdAt: syntheticTimestamp,
    },
    {
      fromStatus: 'CONFIRMED',
      toStatus: 'DELIVERED',
      createdAt: syntheticTimestamp,
    },
  ],
  refunds: [],
  returnRequest: null,
};

const expectedFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

function envelope<T>(data: T): ApiEnvelope<T> {
  return {
    data,
    meta: {
      requestId: `QA-SYNTHETIC-REQUEST-${syntheticMarker}`,
      timestamp: syntheticTimestamp,
    },
  };
}

async function installAuthenticatedFixtureNetwork(
  page: Page,
  options: { orders?: CustomerOrderPage } = {},
) {
  const blockedNonLoopbackRequests: string[] = [];
  const unexpectedStateChangingRequests: string[] = [];
  const sessionRequests: string[] = [];
  const cartRequests: string[] = [];
  const orderListRequests: string[] = [];
  const orderDetailRequests: string[] = [];
  const logoutRequests: string[] = [];
  let authenticated = true;
  const orders = options.orders ?? syntheticOrders;

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      blockedNonLoopbackRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (!safeMethods.has(request.method())) {
      if (request.method() === 'POST' && url.pathname === '/v1/auth/logout') {
        authenticated = false;
        logoutRequests.push(`${request.method()} ${url.pathname}`);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(envelope(null)),
        });
        return;
      }

      unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/auth/me') {
      sessionRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(authenticated ? syntheticCustomer : null)),
      });
      return;
    }

    if (url.pathname === '/v1/cart') {
      cartRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(authenticated ? syntheticCustomerCart : syntheticGuestCart)),
      });
      return;
    }

    if (url.pathname === '/v1/account/orders') {
      orderListRequests.push(`${request.method()} ${url.pathname}${url.search}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(orders)),
      });
      return;
    }

    if (url.pathname === `/v1/account/orders/${syntheticOrderNumber}`) {
      orderDetailRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticOrderDetail)),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/')) {
      await route.abort();
      return;
    }

    await route.continue();
  });

  return {
    blockedNonLoopbackRequests,
    unexpectedStateChangingRequests,
    sessionRequests,
    cartRequests,
    orderListRequests,
    orderDetailRequests,
    logoutRequests,
  };
}

async function waitForSettledAccount(page: Page): Promise<void> {
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('[role="status"][aria-label*="در حال"]')).toHaveCount(0);
}

test('renders an authenticated synthetic customer order journey and clears it on logout', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  const network = await installAuthenticatedFixtureNetwork(page);

  const initialResponse = await page.goto('/#account/orders', { waitUntil: 'domcontentloaded' });
  if (initialResponse) expect(initialResponse.ok()).toBeTruthy();
  await waitForSettledAccount(page);

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'سفارش‌های من', level: 1 })).toBeVisible();
  await expect(main.locator('.account-nav__profile')).toContainText(syntheticCustomerEmail);
  await expect(main.locator('.account-nav__profile')).toContainText(syntheticCustomerPhone);

  const orderCard = main.locator('a.order-card').filter({ hasText: syntheticOrderNumber });
  await expect(orderCard).toBeVisible();
  await expect(orderCard).toHaveAttribute('href', `#order/${syntheticOrderNumber}`);
  await orderCard.click();
  await waitForSettledAccount(page);

  await expect(page).toHaveURL(new RegExp(`#order/${syntheticOrderNumber}$`));
  await expect(page.getByRole('heading', { name: 'پیگیری سفارش', level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(syntheticOrderNumber);
  await expect(page.getByRole('main')).toContainText(`${syntheticMarker} / مشتری آزمایشی`);
  await expect(page.getByRole('main')).toContainText('QA-SYNTHETIC-TRACKING-001');

  await page.getByRole('link', { name: 'سفارش‌ها', exact: true }).click();
  await waitForSettledAccount(page);
  await expect(page.getByRole('heading', { name: 'سفارش‌های من', level: 1 })).toBeVisible();

  const logoutResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return response.request().method() === 'POST' && url.pathname === '/v1/auth/logout';
  });
  await page.getByRole('button', { name: 'خروج از حساب', exact: true }).click();
  expect((await logoutResponse).status()).toBe(200);

  await expect(page).toHaveURL(/#home$/);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(syntheticMarker);
  await expect(page.locator('body')).not.toContainText(syntheticCustomerEmail);
  await expect(page.locator('body')).not.toContainText(syntheticOrderNumber);

  await page.goto('/#account/orders', { waitUntil: 'domcontentloaded' });
  await waitForSettledAccount(page);
  await expect(
    page.getByRole('heading', { name: 'برای دیدن حساب کاربری وارد شوید', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText(syntheticMarker);
  await expect(page.getByRole('main')).not.toContainText(syntheticCustomerEmail);
  await expect(page.getByRole('main')).not.toContainText(syntheticOrderNumber);

  expect(network.sessionRequests.length).toBeGreaterThan(0);
  expect(network.cartRequests.length).toBeGreaterThan(0);
  expect(network.orderListRequests).toContain('GET /v1/account/orders?page=1&limit=10');
  expect(network.orderDetailRequests).toEqual([`GET /v1/account/orders/${syntheticOrderNumber}`]);
  expect(network.logoutRequests).toEqual(['POST /v1/auth/logout']);
  expect(network.unexpectedStateChangingRequests).toEqual([]);
  expect(
    network.blockedNonLoopbackRequests.every((request) => {
      const origin = request.split(' ')[1]?.split('/').slice(0, 3).join('/');
      return origin ? expectedFontHosts.has(new URL(origin).hostname) : false;
    }),
  ).toBeTruthy();
});

test('renders an authenticated empty customer order state without order cards', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  const network = await installAuthenticatedFixtureNetwork(page, {
    orders: { items: [], total: 0, page: 1, limit: 10 },
  });

  const response = await page.goto('/#account/orders', { waitUntil: 'domcontentloaded' });
  if (response) expect(response.ok()).toBeTruthy();
  await waitForSettledAccount(page);

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'سفارش‌های من', level: 1 })).toBeVisible();
  await expect(main.locator('a.order-card')).toHaveCount(0);

  expect(network.orderListRequests).toEqual(['GET /v1/account/orders?page=1&limit=10']);
  expect(network.orderDetailRequests).toEqual([]);
  expect(network.logoutRequests).toEqual([]);
  expect(network.unexpectedStateChangingRequests).toEqual([]);
});
