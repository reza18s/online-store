import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  ApiEnvelope,
  CartView,
  CustomerAddress,
  CustomerOrderDetail,
  CustomerOrderPage,
  CustomerOrderSummary,
  CustomerUser,
} from '../../../packages/api-client/src/types';
import { captureUiAudit } from './ui-audit-screenshot';

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
  items: [
    syntheticOrderSummary,
    {
      ...syntheticOrderSummary,
      orderId: 'QA-SYNTHETIC-ORDER-ID-002',
      orderNumber: 'QA-ORDER-002',
      status: 'SHIPPED',
      createdAt: '2026-09-10T00:00:00.000Z',
      updatedAt: '2026-09-11T00:00:00.000Z',
    },
    {
      ...syntheticOrderSummary,
      orderId: 'QA-SYNTHETIC-ORDER-ID-003',
      orderNumber: 'QA-ORDER-003',
      status: 'CONFIRMED',
      createdAt: '2026-09-08T00:00:00.000Z',
      updatedAt: '2026-09-09T00:00:00.000Z',
    },
  ],
  total: 3,
  page: 1,
  limit: 10,
};

const syntheticAddresses: CustomerAddress[] = [
  {
    id: 'QA-SYNTHETIC-ADDRESS-001',
    label: 'خانه',
    recipientName: 'مشتری آزمایشی',
    phone: syntheticCustomerPhone,
    province: 'استان آزمایشی',
    city: 'شهر آزمایشی',
    addressLine: 'نشانی آزمایشی، بدون اطلاعات واقعی',
    postalCode: '0000000000',
    isDefault: true,
    createdAt: syntheticTimestamp,
    updatedAt: syntheticTimestamp,
  },
  {
    id: 'QA-SYNTHETIC-ADDRESS-002',
    label: 'محل کار',
    recipientName: 'مشتری آزمایشی',
    phone: syntheticCustomerPhone,
    province: 'استان آزمایشی',
    city: 'شهر آزمایشی',
    addressLine: 'نشانی دوم آزمایشی، بدون اطلاعات واقعی',
    postalCode: '0000000001',
    isDefault: false,
    createdAt: syntheticTimestamp,
    updatedAt: syntheticTimestamp,
  },
];

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
  options: { addresses?: CustomerAddress[]; orders?: CustomerOrderPage } = {},
) {
  const blockedNonLoopbackRequests: string[] = [];
  const unexpectedStateChangingRequests: string[] = [];
  const sessionRequests: string[] = [];
  const cartRequests: string[] = [];
  const orderListRequests: string[] = [];
  const orderDetailRequests: string[] = [];
  const addressListRequests: string[] = [];
  const logoutRequests: string[] = [];
  let authenticated = true;
  const orders = options.orders ?? syntheticOrders;
  const addresses = options.addresses ?? syntheticAddresses;

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      blockedNonLoopbackRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (request.method() === 'POST' && url.pathname === '/v1/analytics/events') {
      await route.fulfill({ status: 202, contentType: 'application/json', body: '{}' });
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

    if (url.pathname === '/v1/account/addresses') {
      addressListRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(addresses)),
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
    addressListRequests,
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

  const initialResponse = await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
  if (initialResponse) expect(initialResponse.ok()).toBeTruthy();
  await waitForSettledAccount(page);

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'سفارش‌های من', level: 1 })).toBeVisible();
  await expect(main.locator('.account-nav__profile')).toContainText(syntheticCustomerEmail);
  await expect(main.locator('.account-nav__profile')).toContainText(syntheticCustomerPhone);
  await captureUiAudit(page, 'account/orders');

  await page.goto('/account', { waitUntil: 'domcontentloaded' });
  await waitForSettledAccount(page);
  await expect(page.getByRole('heading', { name: 'حساب کاربری', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'سفارش‌های اخیر' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /مشاهده جزئیات سفارش QA-ORDER-001/ }),
  ).toHaveAttribute('href', '/order/QA-ORDER-001');
  await expect(page.getByRole('link', { name: /مدیریت آدرس‌ها/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'آدرس‌های ذخیره‌شده' })).toBeVisible();
  await expect(page.getByRole('link', { name: /خانه مشتری آزمایشی/ })).toHaveAttribute(
    'href',
    '/account/addresses/edit/QA-SYNTHETIC-ADDRESS-001',
  );
  await expect(page.getByRole('main')).toContainText('پیش‌فرض');
  await expect(
    page.locator('.nova-account-dashboard__shortcuts').getByRole('link', { name: 'اطلاعات شخصی' }),
  ).toHaveAttribute('href', '/account/profile');
  await captureUiAudit(page, 'account/dashboard');

  await page.goto('/account/profile', { waitUntil: 'domcontentloaded' });
  await waitForSettledAccount(page);
  await expect(page.getByRole('heading', { name: 'اطلاعات شخصی', level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(syntheticCustomerEmail);
  await captureUiAudit(page, 'account/profile');

  await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
  await waitForSettledAccount(page);
  const ordersMain = page.getByRole('main');
  await expect(ordersMain.getByRole('heading', { name: 'سفارش‌های من', level: 1 })).toBeVisible();

  const orderCard = ordersMain.locator('a.order-card').filter({ hasText: syntheticOrderNumber });
  await expect(orderCard).toBeVisible();
  await expect(orderCard).toHaveAttribute('href', `/order/${syntheticOrderNumber}`);
  await orderCard.click();
  await waitForSettledAccount(page);

  await expect(page).toHaveURL(new RegExp(`/order/${syntheticOrderNumber}$`));
  await expect(page.getByRole('heading', { name: 'پیگیری سفارش', level: 1 })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(syntheticOrderNumber);
  await expect(page.getByRole('main')).toContainText(`${syntheticMarker} / مشتری آزمایشی`);
  await expect(page.getByRole('main')).toContainText('QA-SYNTHETIC-TRACKING-001');
  await expect(page.getByRole('heading', { name: 'اقلام سفارش', exact: true })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(`${syntheticMarker} / پیراهن آزمایشی`);
  await expect(page.getByRole('heading', { name: 'خلاصه مالی', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'روش پرداخت', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'اطلاعات مرسوله', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /تماس با پشتیبانی/ })).toHaveAttribute(
    'href',
    '/support',
  );
  await captureUiAudit(page, 'account/order-detail');

  await page.getByRole('link', { name: 'سفارش‌ها', exact: true }).click();
  await waitForSettledAccount(page);
  await expect(page.getByRole('heading', { name: 'سفارش‌های من', level: 1 })).toBeVisible();

  const logoutResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return response.request().method() === 'POST' && url.pathname === '/v1/auth/logout';
  });
  await page.getByRole('button', { name: 'خروج از حساب', exact: true }).click();
  expect((await logoutResponse).status()).toBe(200);

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('body')).not.toContainText(syntheticMarker);
  await expect(page.locator('body')).not.toContainText(syntheticCustomerEmail);
  await expect(page.locator('body')).not.toContainText(syntheticOrderNumber);

  await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
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
  expect(network.addressListRequests).toEqual(['GET /v1/account/addresses']);
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

  const response = await page.goto('/account/orders', { waitUntil: 'domcontentloaded' });
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
