import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  ApiEnvelope,
  CartView,
  CustomerAddress,
  CustomerOrderDetail,
  CustomerReturnRequest,
  CustomerUser,
} from '../../../packages/api-client/src/types';

const syntheticMarker = 'QA-SYNTHETIC-ADDRESS-RETURN-001';
const syntheticCustomerPhone = '+989000000002';
const syntheticCustomerEmail = 'qa.address-return@example.test';
const syntheticTimestamp = '2026-09-12T00:00:00.000Z';

const syntheticCustomer: CustomerUser = {
  id: syntheticMarker,
  phone: syntheticCustomerPhone,
  email: syntheticCustomerEmail,
  status: 'ACTIVE',
};

const syntheticCustomerCart: CartView = {
  id: 'QA-SYNTHETIC-CART-ADDRESS-RETURN-001',
  kind: 'CUSTOMER',
  items: [],
  itemCount: 0,
  subtotalToman: 0,
  currency: 'TOMAN',
};

const syntheticAddress: CustomerAddress = {
  id: 'QA-SYNTHETIC-ADDRESS-001',
  label: 'خانه آزمایشی',
  recipientName: `${syntheticMarker} / گیرنده آزمایشی`,
  phone: syntheticCustomerPhone,
  province: 'استان آزمایشی',
  city: 'شهر آزمایشی',
  addressLine: 'نشانی آزمایشی، بدون اطلاعات واقعی',
  postalCode: '0000000000',
  isDefault: true,
  createdAt: syntheticTimestamp,
  updatedAt: syntheticTimestamp,
};

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

function relativeTimestamp(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
}

function makeCustomerOrder(
  orderNumber: string,
  options: { deliveredDaysAgo: number; returnRequest?: CustomerReturnRequest | null },
): CustomerOrderDetail {
  const deliveredAt = relativeTimestamp(options.deliveredDaysAgo);
  const orderTimestamp = relativeTimestamp(options.deliveredDaysAgo + 1);
  return {
    orderId: `${syntheticMarker}-${orderNumber}-ID`,
    orderNumber,
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    subtotalToman: 1_200_000,
    discountToman: 0,
    shippingToman: 60_000,
    taxToman: 0,
    totalToman: 1_260_000,
    currency: 'TOMAN',
    createdAt: orderTimestamp,
    updatedAt: orderTimestamp,
    items: [
      {
        id: `${syntheticMarker}-${orderNumber}-ITEM`,
        productId: 'QA-SYNTHETIC-PRODUCT-001',
        variantId: 'QA-SYNTHETIC-VARIANT-001',
        productName: `${syntheticMarker} / محصول آزمایشی`,
        sku: 'QA-SYNTHETIC-SKU-001',
        variantSnapshot: { size: 'M', color: 'آزمایشی' },
        quantity: 1,
        unitPriceToman: 1_200_000,
        compareAtPriceToman: 1_400_000,
        discountToman: 0,
        taxToman: 0,
        totalToman: 1_200_000,
      },
    ],
    address: {
      recipientName: `${syntheticMarker} / مشتری آزمایشی`,
      phone: syntheticCustomerPhone,
      province: 'استان آزمایشی',
      city: 'شهر آزمایشی',
      addressLine: 'نشانی سفارش آزمایشی، بدون اطلاعات واقعی',
      postalCode: '0000000000',
    },
    payment: {
      status: 'SUCCEEDED',
      amountToman: 1_260_000,
      redirectUrl: null,
      createdAt: orderTimestamp,
      paidAt: orderTimestamp,
    },
    shipment: {
      provider: 'QA-SYNTHETIC-CARRIER',
      method: 'ارسال آزمایشی',
      trackingReference: `QA-SYNTHETIC-TRACKING-${orderNumber}`,
      status: 'DELIVERED',
      shippedAt: orderTimestamp,
      deliveredAt,
    },
    events: [
      { fromStatus: null, toStatus: 'CONFIRMED', createdAt: orderTimestamp },
      { fromStatus: 'CONFIRMED', toStatus: 'DELIVERED', createdAt: deliveredAt },
    ],
    refunds: [],
    returnRequest: options.returnRequest ?? null,
  };
}

interface NetworkFixture {
  blockedExternalRequests: string[];
  unexpectedStateChangingRequests: string[];
  unhandledApiRequests: string[];
  sessionRequests: string[];
  cartRequests: string[];
  addressRequests: string[];
  orderDetailRequests: string[];
}

async function installSyntheticCustomerNetwork(
  page: Page,
  options: {
    addresses?: CustomerAddress[];
    orders?: Record<string, CustomerOrderDetail>;
  } = {},
): Promise<NetworkFixture> {
  const network: NetworkFixture = {
    blockedExternalRequests: [],
    unexpectedStateChangingRequests: [],
    unhandledApiRequests: [],
    sessionRequests: [],
    cartRequests: [],
    addressRequests: [],
    orderDetailRequests: [],
  };
  const addresses = options.addresses ?? [];
  const orders = options.orders ?? {};

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      network.blockedExternalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (!safeMethods.has(request.method())) {
      network.unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/auth/me') {
      network.sessionRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticCustomer)),
      });
      return;
    }

    if (url.pathname === '/v1/cart') {
      network.cartRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticCustomerCart)),
      });
      return;
    }

    if (url.pathname === '/v1/account/addresses') {
      network.addressRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(addresses)),
      });
      return;
    }

    const orderPrefix = '/v1/account/orders/';
    if (url.pathname.startsWith(orderPrefix) && !url.pathname.endsWith('/cancel')) {
      const orderNumber = decodeURIComponent(url.pathname.slice(orderPrefix.length));
      const order = orders[orderNumber];
      if (order) {
        network.orderDetailRequests.push(`${request.method()} ${url.pathname}`);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(envelope(order)),
        });
        return;
      }
    }

    if (url.pathname.startsWith('/v1/')) {
      network.unhandledApiRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return network;
}

async function gotoHash(page: Page, hash: string): Promise<void> {
  page.setDefaultNavigationTimeout(15_000);
  const response = await page.goto(`/${hash}`, { waitUntil: 'domcontentloaded' });
  if (response) expect(response.ok()).toBeTruthy();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('[role="status"][aria-label*="در حال"]')).toHaveCount(0);
}

function expectReadOnlyFixture(network: NetworkFixture): void {
  expect(network.unexpectedStateChangingRequests).toEqual([]);
  expect(network.unhandledApiRequests).toEqual([]);
  expect(network.sessionRequests.length).toBeGreaterThan(0);
  expect(network.cartRequests.length).toBeGreaterThan(0);
}

test.describe('authenticated customer address and return presentation', () => {
  test('renders a synthetic authenticated address list without exposing mutation controls to the network', async ({
    page,
  }) => {
    const network = await installSyntheticCustomerNetwork(page, { addresses: [syntheticAddress] });

    await gotoHash(page, '#account/addresses');

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'آدرس‌های من', level: 1 })).toBeVisible();
    await expect(main.locator('article')).toHaveCount(1);
    await expect(main.locator('article')).toContainText(syntheticMarker);
    await expect(main.locator('article')).toContainText('آدرس اصلی');
    await expect(main.getByRole('link', { name: 'ویرایش' })).toHaveAttribute(
      'href',
      '#account/addresses/edit/QA-SYNTHETIC-ADDRESS-001',
    );

    expect(network.addressRequests).toEqual(['GET /v1/account/addresses']);
    expectReadOnlyFixture(network);
  });

  test('renders the authenticated empty address state and its create route', async ({ page }) => {
    const network = await installSyntheticCustomerNetwork(page, { addresses: [] });

    await gotoHash(page, '#account/addresses');

    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: 'هنوز آدرسی ثبت نکرده‌اید', level: 1 }),
    ).toBeVisible();
    await expect(main).toContainText('برای تحویل سریع‌تر سفارش، اولین آدرس خود را اضافه کنید.');
    await expect(main.getByRole('link', { name: 'افزودن آدرس جدید' })).toHaveAttribute(
      'href',
      '#account/addresses/create',
    );
    await expect(main.locator('article')).toHaveCount(0);

    expect(network.addressRequests).toEqual(['GET /v1/account/addresses']);
    expectReadOnlyFixture(network);
  });

  test('renders an eligible return request presentation without submitting it', async ({
    page,
  }) => {
    const orderNumber = 'QA-RETURN-ELIGIBLE-001';
    const order = makeCustomerOrder(orderNumber, { deliveredDaysAgo: 1 });
    const network = await installSyntheticCustomerNetwork(page, {
      orders: { [orderNumber]: order },
    });

    await gotoHash(page, `#return/request?orderNumber=${encodeURIComponent(orderNumber)}`);

    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: 'درخواست بازگشت کالا', level: 1 }),
    ).toBeVisible();
    await expect(main).toContainText(orderNumber);
    await expect(main.getByRole('button', { name: 'ثبت درخواست بازگشت' })).toBeEnabled();
    await expect(main.locator('form')).toBeVisible();
    await expect(main.getByRole('link', { name: 'انصراف' })).toHaveAttribute(
      'href',
      `#order/${orderNumber}`,
    );

    expect(network.orderDetailRequests).toEqual([`GET /v1/account/orders/${orderNumber}`]);
    expectReadOnlyFixture(network);
  });

  test('renders the ineligible expired return presentation from the current order route', async ({
    page,
  }) => {
    const orderNumber = 'QA-RETURN-EXPIRED-001';
    const order = makeCustomerOrder(orderNumber, { deliveredDaysAgo: 8 });
    const network = await installSyntheticCustomerNetwork(page, {
      orders: { [orderNumber]: order },
    });

    await gotoHash(page, `#return/request?orderNumber=${encodeURIComponent(orderNumber)}`);

    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: 'مهلت بازگشت تمام شده است', level: 1 }),
    ).toBeVisible();
    await expect(main).toContainText('مهلت بازگشت این سفارش ۷ روز پس از تحویل است.');
    await expect(main.getByRole('link', { name: 'مشاهده سفارش' })).toHaveAttribute(
      'href',
      `#order/${orderNumber}`,
    );
    await expect(main.locator('form')).toHaveCount(0);

    expect(network.orderDetailRequests).toEqual([`GET /v1/account/orders/${orderNumber}`]);
    expectReadOnlyFixture(network);
  });

  test('renders a settled return status without attempting a return mutation', async ({ page }) => {
    const orderNumber = 'QA-RETURN-SETTLED-001';
    const returnRequest: CustomerReturnRequest = {
      id: `${syntheticMarker}-RETURN-001`,
      reason: 'SIZE_PREFERENCE',
      note: null,
      status: 'REFUNDED',
      requestedAt: relativeTimestamp(3),
      reviewedAt: relativeTimestamp(2),
      receivedAt: relativeTimestamp(1),
      items: [{ orderItemId: `${syntheticMarker}-${orderNumber}-ITEM`, quantity: 1 }],
    };
    const order = makeCustomerOrder(orderNumber, { deliveredDaysAgo: 4, returnRequest });
    const network = await installSyntheticCustomerNetwork(page, {
      orders: { [orderNumber]: order },
    });

    await gotoHash(page, `#return/status?orderNumber=${encodeURIComponent(orderNumber)}`);

    const main = page.getByRole('main');
    await expect(
      main.getByRole('heading', { name: 'وضعیت درخواست بازگشت', level: 1 }),
    ).toBeVisible();
    await expect(main).toContainText('وضعیت فعلی درخواست شما:');
    await expect(main).toContainText('بازپرداخت شده');
    await expect(main.getByRole('link', { name: 'مشاهده سفارش' })).toHaveAttribute(
      'href',
      `#order/${orderNumber}`,
    );
    await expect(main.getByRole('link', { name: 'تماس با پشتیبانی' })).toHaveAttribute(
      'href',
      '#support',
    );
    await expect(main.getByRole('button', { name: 'ثبت درخواست بازگشت' })).toHaveCount(0);

    expect(network.orderDetailRequests).toEqual([`GET /v1/account/orders/${orderNumber}`]);
    expectReadOnlyFixture(network);
  });
});
