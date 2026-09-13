import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  ApiEnvelope,
  CartView,
  CheckoutOrder,
  CheckoutQuote,
  CheckoutShippingMethod,
  CustomerAddress,
  CustomerOrderDetail,
  CustomerUser,
} from '../../../packages/api-client/src/types';

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 1440, height: 900 },
});

const syntheticMarker = 'QA-SYNTHETIC-CHECKOUT-CORE-001';
const syntheticAddressId = `${syntheticMarker}-ADDRESS`;
const syntheticCartId = `${syntheticMarker}-CART`;
const syntheticOrderNumber = `${syntheticMarker}-ORDER`;
const syntheticTimestamp = '2026-09-12T00:00:00.000Z';
const syntheticCustomerPhone = '+989000000009';
const syntheticCustomerEmail = 'checkout.core@example.test';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const browserLocalFontStylesheet = {
  origin: 'https://fonts.googleapis.com',
  pathname: '/css2',
} as const;

const syntheticCustomer: CustomerUser = {
  id: `${syntheticMarker}-CUSTOMER`,
  phone: syntheticCustomerPhone,
  email: syntheticCustomerEmail,
  status: 'ACTIVE',
};

const syntheticAddress: CustomerAddress = {
  id: syntheticAddressId,
  label: 'خانه آزمایشی',
  recipientName: `${syntheticMarker} / مشتری آزمایشی`,
  phone: syntheticCustomerPhone,
  province: 'استان آزمایشی',
  city: 'شهر آزمایشی',
  addressLine: 'نشانی loopback آزمایشی، بدون اطلاعات واقعی',
  postalCode: '0000000009',
  isDefault: true,
  createdAt: syntheticTimestamp,
  updatedAt: syntheticTimestamp,
};

const syntheticCart: CartView = {
  id: syntheticCartId,
  kind: 'CUSTOMER',
  items: [
    {
      id: `${syntheticMarker}-LINE`,
      variantId: `${syntheticMarker}-VARIANT`,
      quantity: 1,
      available: true,
      productId: `${syntheticMarker}-PRODUCT`,
      productSlug: 'synthetic-checkout-product',
      productName: 'محصول آزمایشی پرداخت',
      sku: `${syntheticMarker}-SKU`,
      title: 'نسخه مصنوعی QA',
      unitPriceToman: 2_300_000,
      compareAtPriceToman: 2_500_000,
      imageUrl: null,
      imageAlt: null,
    },
  ],
  itemCount: 1,
  subtotalToman: 2_300_000,
  currency: 'TOMAN',
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return {
    data,
    meta: {
      requestId: `${syntheticMarker}-REQUEST`,
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

function quoteFor(shippingMethod: CheckoutShippingMethod): CheckoutQuote {
  const shippingToman = shippingMethod === 'EXPRESS' ? 95_000 : 45_000;
  const shippingLabel = shippingMethod === 'EXPRESS' ? 'ارسال سریع' : 'ارسال عادی';
  const shippingEstimate = shippingMethod === 'EXPRESS' ? '۱ تا ۲ روز کاری' : '۲ تا ۴ روز کاری';

  return {
    cartId: syntheticCartId,
    address: syntheticAddress,
    shippingMethod,
    shippingLabel,
    shippingEstimate,
    lines: [
      {
        cartItemId: `${syntheticMarker}-LINE`,
        productId: `${syntheticMarker}-PRODUCT`,
        variantId: `${syntheticMarker}-VARIANT`,
        productName: 'محصول آزمایشی پرداخت',
        sku: `${syntheticMarker}-SKU`,
        selectedOptions: [],
        quantity: 1,
        unitPriceToman: 2_300_000,
        compareAtPriceToman: 2_500_000,
        lineTotalToman: 2_300_000,
      },
    ],
    subtotalToman: 2_300_000,
    discountToman: 0,
    coupon: null,
    shippingToman,
    taxToman: 0,
    totalToman: 2_300_000 + shippingToman,
    currency: 'TOMAN',
    expiresAt: '2099-01-01T00:00:00.000Z',
  };
}

const syntheticTimeoutOrder: CheckoutOrder = {
  orderId: `${syntheticMarker}-ORDER-ID`,
  orderNumber: syntheticOrderNumber,
  status: 'PENDING_PAYMENT',
  paymentStatus: 'PENDING',
  subtotalToman: 2_300_000,
  discountToman: 0,
  shippingToman: 45_000,
  taxToman: 0,
  totalToman: 2_345_000,
  currency: 'TOMAN',
  payment: {
    status: 'EXPIRED',
    redirectUrl: null,
  },
};

const syntheticTimeoutOrderDetail: CustomerOrderDetail = {
  ...syntheticTimeoutOrder,
  createdAt: syntheticTimestamp,
  updatedAt: syntheticTimestamp,
  items: [
    {
      id: `${syntheticMarker}-ORDER-LINE`,
      productId: `${syntheticMarker}-PRODUCT`,
      variantId: `${syntheticMarker}-VARIANT`,
      productName: 'محصول آزمایشی پرداخت',
      sku: `${syntheticMarker}-SKU`,
      variantSnapshot: { title: 'نسخه مصنوعی QA' },
      quantity: 1,
      unitPriceToman: 2_300_000,
      compareAtPriceToman: 2_500_000,
      discountToman: 0,
      taxToman: 0,
      totalToman: 2_300_000,
    },
  ],
  address: {
    recipientName: syntheticAddress.recipientName,
    phone: syntheticAddress.phone,
    province: syntheticAddress.province,
    city: syntheticAddress.city,
    addressLine: syntheticAddress.addressLine,
    postalCode: syntheticAddress.postalCode,
  },
  payment: {
    status: 'EXPIRED',
    amountToman: syntheticTimeoutOrder.totalToman,
    redirectUrl: null,
    createdAt: syntheticTimestamp,
    paidAt: null,
  },
  shipment: null,
  events: [],
  refunds: [],
  returnRequest: null,
};

interface CheckoutNetworkEvidence {
  blockedExternalRequests: string[];
  credentialBearingRequests: string[];
  unexpectedApiRequests: string[];
  unexpectedMutationRequests: string[];
  providerRequests: string[];
  quoteRequests: Array<{ addressId: string; shippingMethod: CheckoutShippingMethod }>;
  submitRequests: string[];
  orderDetailRequests: string[];
}

async function installCheckoutFixtures(page: Page): Promise<CheckoutNetworkEvidence> {
  const evidence: CheckoutNetworkEvidence = {
    blockedExternalRequests: [],
    credentialBearingRequests: [],
    unexpectedApiRequests: [],
    unexpectedMutationRequests: [],
    providerRequests: [],
    quoteRequests: [],
    submitRequests: [],
    orderDetailRequests: [],
  };

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = request.headers();

    if (headers.authorization || headers.cookie || headers['x-api-key']) {
      evidence.credentialBearingRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }

    if (/\/v1\/(payment|provider|gateway)(\/|$)/i.test(url.pathname)) {
      evidence.providerRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    }

    if ((url.protocol === 'http:' || url.protocol === 'https:') && !isLoopbackHost(url.hostname)) {
      if (
        url.origin === browserLocalFontStylesheet.origin &&
        url.pathname === browserLocalFontStylesheet.pathname
      ) {
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      evidence.blockedExternalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    const isQuoteRequest = request.method() === 'POST' && url.pathname === '/v1/checkout/quote';
    const isSubmitRequest = request.method() === 'POST' && url.pathname === '/v1/checkout';

    if (!safeMethods.has(request.method())) {
      if (isQuoteRequest) {
        const body = request.postDataJSON() as {
          addressId?: unknown;
          shippingMethod?: unknown;
        };
        const shippingMethod = body.shippingMethod === 'EXPRESS' ? 'EXPRESS' : 'STANDARD';
        evidence.quoteRequests.push({
          addressId: typeof body.addressId === 'string' ? body.addressId : '',
          shippingMethod,
        });
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(envelope(quoteFor(shippingMethod))),
        });
        return;
      }

      if (isSubmitRequest) {
        const idempotencyKey = request.headers()['idempotency-key'];
        if (!idempotencyKey) {
          evidence.unexpectedMutationRequests.push(`${request.method()} ${url.pathname}`);
        }
        evidence.submitRequests.push(`${request.method()} ${url.pathname}`);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(envelope(syntheticTimeoutOrder)),
        });
        return;
      }

      evidence.unexpectedMutationRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/auth/me') {
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

    if (url.pathname === '/v1/account/addresses') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope([syntheticAddress])),
      });
      return;
    }

    if (url.pathname === `/v1/account/orders/${syntheticOrderNumber}`) {
      evidence.orderDetailRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticTimeoutOrderDetail)),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/')) {
      evidence.unexpectedApiRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return evidence;
}

async function expectSettledCheckout(page: Page): Promise<void> {
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.locator('[role="status"][aria-label*="در حال"]')).toHaveCount(0);
}

function assertSafeCheckoutNetwork(evidence: CheckoutNetworkEvidence): void {
  expect(evidence.blockedExternalRequests).toEqual([]);
  expect(evidence.credentialBearingRequests).toEqual([]);
  expect(evidence.providerRequests).toEqual([]);
  expect(evidence.unexpectedApiRequests).toEqual([]);
  expect(evidence.unexpectedMutationRequests).toEqual([]);
}

test.describe('WEB-005 checkout core browser coverage', () => {
  test('presents the synthetic address, shipping methods, and authoritative quote', async ({
    page,
  }) => {
    page.setDefaultNavigationTimeout(15_000);
    page.setDefaultTimeout(15_000);
    const evidence = await installCheckoutFixtures(page);

    const response = await page.goto('/#checkout/address', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expectSettledCheckout(page);

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'آدرس تحویل', level: 1 })).toBeVisible();
    await expect(main).toContainText(syntheticMarker);
    await expect(main).toContainText(syntheticCustomerPhone);
    await expect(main.locator('input[name="checkout-address"]')).toBeChecked();
    await expect(main).toContainText('پس از تأیید آدرس');

    await main.getByRole('button', { name: 'ادامه', exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`#checkout/shipping\\?addressId=${syntheticAddressId}&shipping=STANDARD$`),
    );
    await expectSettledCheckout(page);
    await expect(main.getByRole('heading', { name: 'روش ارسال', level: 1 })).toBeVisible();
    await expect(main.getByRole('radio').nth(0)).toBeChecked();
    await expect(main).toContainText('ارسال عادی');
    await expect(main).toContainText('۲ تا ۴ روز کاری');
    await expect(main).toContainText('۴۵٬۰۰۰ تومان');
    await expect(main).toContainText('۲٬۳۴۵٬۰۰۰ تومان');

    await main.getByRole('radio').nth(1).check();
    await expect.poll(() => evidence.quoteRequests.length).toBe(2);
    await expect(main.getByRole('radio').nth(1)).toBeChecked();
    await expect(main).toContainText('ارسال سریع');
    await expect(main).toContainText('۱ تا ۲ روز کاری');
    await expect(main).toContainText('۹۵٬۰۰۰ تومان');
    await expect(main).toContainText('۲٬۳۹۵٬۰۰۰ تومان');

    await main.getByRole('button', { name: 'ادامه', exact: true }).click();
    await expect(page).toHaveURL(
      new RegExp(`#checkout/payment\\?addressId=${syntheticAddressId}&shipping=EXPRESS$`),
    );
    await expect(main.getByRole('heading', { name: 'پرداخت امن', level: 1 })).toBeVisible();
    await expect(main).toContainText('پرداخت آنلاین');
    await expect(main).toContainText('وضعیت پرداخت پس از بازگشت');
    await expect(main).toContainText('ارسال سریع · ۱ تا ۲ روز کاری');

    expect(evidence.quoteRequests).toEqual([
      { addressId: syntheticAddressId, shippingMethod: 'STANDARD' },
      { addressId: syntheticAddressId, shippingMethod: 'EXPRESS' },
    ]);
    expect(evidence.submitRequests).toEqual([]);
    assertSafeCheckoutNetwork(evidence);
  });

  test('shows an authoritative payment timeout without redirecting or mutating real state', async ({
    page,
  }) => {
    page.setDefaultNavigationTimeout(15_000);
    page.setDefaultTimeout(15_000);
    const evidence = await installCheckoutFixtures(page);

    const response = await page.goto(
      `/#checkout/payment?addressId=${syntheticAddressId}&shipping=STANDARD`,
      { waitUntil: 'domcontentloaded' },
    );
    expect(response?.ok()).toBeTruthy();
    await expectSettledCheckout(page);

    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'پرداخت امن', level: 1 })).toBeVisible();
    await expect(main).toContainText('۲٬۳۴۵٬۰۰۰ تومان');
    await expect(main).toContainText('ارسال عادی · ۲ تا ۴ روز کاری');

    const submitResponse = page.waitForResponse((candidate) => {
      const url = new URL(candidate.url());
      return candidate.request().method() === 'POST' && url.pathname === '/v1/checkout';
    });
    await main.getByRole('button', { name: 'پرداخت و ثبت سفارش', exact: true }).click();
    expect((await submitResponse).status()).toBe(200);

    await expect(page).toHaveURL(
      new RegExp(
        `#checkout/payment-recovery\\?orderNumber=${syntheticOrderNumber}&paymentState=timeout$`,
      ),
    );
    await expectSettledCheckout(page);
    await expect(
      page.getByRole('heading', { name: 'زمان پاسخ پرداخت تمام شد', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('main')).toContainText(
      'نتیجه قطعی دریافت نشد. برای جلوگیری از پرداخت تکراری، ابتدا وضعیت سفارش را بررسی کنید.',
    );
    await expect(page.getByRole('main')).toContainText(syntheticOrderNumber);
    await expect(
      page.getByRole('link', { name: 'مشاهده وضعیت سفارش', exact: true }).first(),
    ).toHaveAttribute('href', `#order/${syntheticOrderNumber}`);

    expect(evidence.quoteRequests.length).toBeGreaterThanOrEqual(1);
    expect(
      evidence.quoteRequests.every(
        (request) =>
          request.addressId === syntheticAddressId && request.shippingMethod === 'STANDARD',
      ),
    ).toBeTruthy();
    expect(evidence.submitRequests).toEqual(['POST /v1/checkout']);
    expect(evidence.orderDetailRequests).toEqual([
      `GET /v1/account/orders/${syntheticOrderNumber}`,
    ]);
    assertSafeCheckoutNetwork(evidence);
  });
});
