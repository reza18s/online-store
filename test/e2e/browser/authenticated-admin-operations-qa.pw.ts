import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  AdminAuditPage,
  AdminContentPage,
  AdminContentPagePage,
  AdminCustomerPage,
  AdminNotificationPage,
  AdminOrderDetail,
  AdminOrderPage,
  AdminPaymentAttempt,
  AdminPaymentPage,
  AdminRedirectPage,
  AdminSeoMetadataPage,
  ApiEnvelope,
  ApiMeta,
  StaffUser,
} from '../../../packages/api-client/src/types';

const qaMarker = 'BROWSER-LOCAL-ADMIN-OPS-QA-001';
const fixtureTimestamp = '2026-01-01T00:00:00.000Z';
const orderNumber = 'QA-ADMIN-ORDER-001';
const paymentId = `payment-${qaMarker}`;
const contentPageId = `content-page-${qaMarker}`;

const apiMeta: ApiMeta = {
  requestId: `request-${qaMarker}`,
  timestamp: fixtureTimestamp,
};

const staffUser: StaffUser = {
  id: `staff-${qaMarker}`,
  email: 'qa-admin-operations@browser.local',
  status: 'ACTIVE',
  roles: ['admin', 'operations', 'support'],
};

const orderSummary: AdminOrderPage['items'][number] = {
  orderId: `order-id-${qaMarker}`,
  orderNumber,
  status: 'CONFIRMED',
  paymentStatus: 'PAID',
  subtotalToman: 900000,
  discountToman: 0,
  shippingToman: 50000,
  taxToman: 0,
  totalToman: 950000,
  currency: 'TOMAN',
  createdAt: fixtureTimestamp,
  updatedAt: fixtureTimestamp,
  customer: {
    id: `customer-${qaMarker}`,
    phone: '+989000000001',
    email: `customer-${qaMarker}@example.test`,
    status: 'ACTIVE',
  },
  shipmentStatus: 'PENDING',
  trackingReference: null,
};

const orderDetail: AdminOrderDetail = {
  ...orderSummary,
  items: [
    {
      id: `order-item-${qaMarker}`,
      productId: `product-${qaMarker}`,
      variantId: `variant-${qaMarker}`,
      productName: `محصول عملیات مدیریت ${qaMarker}`,
      sku: `SKU-${qaMarker}`,
      variantSnapshot: { size: 'M', color: 'QA' },
      quantity: 1,
      unitPriceToman: 900000,
      compareAtPriceToman: null,
      discountToman: 0,
      taxToman: 0,
      totalToman: 900000,
    },
  ],
  address: {
    recipientName: `مشتری مصنوعی ${qaMarker}`,
    phone: '+989000000001',
    province: 'تهران',
    city: 'تهران',
    addressLine: 'نشانی مصنوعی برای تست مرورگر',
    postalCode: '0000000000',
  },
  payment: {
    status: 'SUCCEEDED',
    amountToman: 950000,
    createdAt: fixtureTimestamp,
    paidAt: fixtureTimestamp,
  },
  shipment: {
    provider: 'QA-CARRIER',
    method: 'استاندارد',
    trackingReference: null,
    status: 'PENDING',
    shippedAt: null,
    deliveredAt: null,
  },
  events: [{ fromStatus: 'PENDING_PAYMENT', toStatus: 'CONFIRMED', createdAt: fixtureTimestamp }],
  refunds: [],
  returnRequest: null,
};

const paymentAttempt: AdminPaymentAttempt = {
  id: paymentId,
  orderId: orderSummary.orderId,
  orderNumber,
  provider: `QA-PAYMENT-PROVIDER-${qaMarker}`,
  providerTransactionId: `transaction-${qaMarker}`,
  status: 'SUCCEEDED',
  amountToman: orderSummary.totalToman,
  orderStatus: orderSummary.status,
  paymentStatus: orderSummary.paymentStatus,
  createdAt: fixtureTimestamp,
  updatedAt: fixtureTimestamp,
  paidAt: fixtureTimestamp,
  refunds: [],
};

const contentPage: AdminContentPage = {
  id: contentPageId,
  slug: `qa-admin-operations-${qaMarker.toLowerCase()}`,
  title: `صفحه محتوای مدیریت ${qaMarker}`,
  status: 'DRAFT',
  createdAt: fixtureTimestamp,
  updatedAt: fixtureTimestamp,
  body: `بدنه مصنوعی ${qaMarker}`,
  blocks: [],
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: apiMeta };
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function jsonResponse<T>(data: T) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(envelope(data)),
  };
}

async function installAdminOperationsFixtureGuard(page: Page) {
  const stateChangingRequests: string[] = [];
  const externalHostRequests: string[] = [];
  const unexpectedApiRequests: string[] = [];

  const adminOrders: AdminOrderPage = {
    items: [orderSummary],
    total: 1,
    page: 1,
    limit: 10,
  };
  const payments: AdminPaymentPage = {
    items: [paymentAttempt],
    total: 1,
    page: 1,
    limit: 12,
  };
  const customers: AdminCustomerPage = {
    items: [
      {
        id: `customer-${qaMarker}`,
        phone: '+989000000001',
        email: `customer-${qaMarker}@example.test`,
        status: 'ACTIVE',
        orderCount: 1,
        lastOrderNumber: orderNumber,
        lastOrderStatus: 'CONFIRMED',
        lastOrderAt: fixtureTimestamp,
        createdAt: fixtureTimestamp,
        updatedAt: fixtureTimestamp,
      },
    ],
    total: 1,
    page: 1,
    limit: 12,
  };
  const notifications: AdminNotificationPage = {
    items: [
      {
        id: `notification-${qaMarker}`,
        kind: `QA_NOTIFICATION_${qaMarker}`,
        status: 'SENT',
        attempts: 1,
        availableAt: fixtureTimestamp,
        processedAt: fixtureTimestamp,
        lastError: null,
        createdAt: fixtureTimestamp,
      },
    ],
    total: 1,
    page: 1,
    limit: 12,
  };
  const audit: AdminAuditPage = {
    items: [
      {
        id: `audit-${qaMarker}`,
        actorType: 'STAFF',
        actorUserId: staffUser.id,
        action: `admin.read.${qaMarker}`,
        resourceType: 'Order',
        resourceId: orderNumber,
        metadata: { marker: qaMarker },
        createdAt: fixtureTimestamp,
      },
    ],
    total: 1,
    page: 1,
    limit: 12,
  };
  const contentPages: AdminContentPagePage = {
    items: [contentPage],
    total: 1,
    page: 1,
    limit: 10,
  };
  const seoMetadata: AdminSeoMetadataPage = {
    items: [
      {
        id: `seo-${qaMarker}`,
        path: `/qa/${qaMarker.toLowerCase()}`,
        title: `SEO مدیریت ${qaMarker}`,
        description: `توضیح SEO مصنوعی ${qaMarker}`,
        canonicalUrl: null,
        noIndex: true,
        structuredData: null,
        updatedAt: fixtureTimestamp,
      },
    ],
    total: 1,
    page: 1,
    limit: 10,
  };
  const redirects: AdminRedirectPage = {
    items: [
      {
        id: `redirect-${qaMarker}`,
        fromPath: `/qa-old/${qaMarker.toLowerCase()}`,
        toPath: `/qa-new/${qaMarker.toLowerCase()}`,
        statusCode: 301,
        createdAt: fixtureTimestamp,
      },
    ],
    total: 1,
    page: 1,
    limit: 100,
  };

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if ((url.protocol === 'http:' || url.protocol === 'https:') && !isLoopbackHost(url.hostname)) {
      externalHostRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (!['GET', 'HEAD'].includes(request.method())) {
      stateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/staff/auth/me') {
      await route.fulfill(jsonResponse(staffUser));
      return;
    }
    if (url.pathname === '/v1/admin/orders') {
      await route.fulfill(jsonResponse(adminOrders));
      return;
    }
    if (url.pathname === `/v1/admin/orders/${orderNumber}`) {
      await route.fulfill(jsonResponse(orderDetail));
      return;
    }
    if (url.pathname === '/v1/admin/payments') {
      await route.fulfill(jsonResponse(payments));
      return;
    }
    if (url.pathname === `/v1/admin/payments/${paymentId}`) {
      await route.fulfill(jsonResponse(paymentAttempt));
      return;
    }
    if (url.pathname === '/v1/admin/customers') {
      await route.fulfill(jsonResponse(customers));
      return;
    }
    if (url.pathname === '/v1/admin/notifications') {
      await route.fulfill(jsonResponse(notifications));
      return;
    }
    if (url.pathname === '/v1/admin/audit-events') {
      await route.fulfill(jsonResponse(audit));
      return;
    }
    if (url.pathname === '/v1/admin/content/pages') {
      await route.fulfill(jsonResponse(contentPages));
      return;
    }
    if (url.pathname === `/v1/admin/content/pages/${contentPageId}`) {
      await route.fulfill(jsonResponse(contentPage));
      return;
    }
    if (url.pathname === '/v1/admin/content/seo-metadata') {
      await route.fulfill(jsonResponse(seoMetadata));
      return;
    }
    if (url.pathname === '/v1/admin/content/redirects') {
      await route.fulfill(jsonResponse(redirects));
      return;
    }

    if (url.pathname.startsWith('/v1/')) {
      unexpectedApiRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return { stateChangingRequests, externalHostRequests, unexpectedApiRequests };
}

test('renders fixture-backed authenticated admin operations without real auth or writes', async ({
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

  const network = await installAdminOperationsFixtureGuard(page);

  await page.goto('/#admin/orders', { waitUntil: 'domcontentloaded' });
  const ordersMain = page.getByRole('main');
  await expect(ordersMain.getByRole('heading', { name: 'سفارش‌ها', exact: true })).toBeVisible();
  await expect(ordersMain).toContainText(qaMarker);
  await expect(ordersMain).toContainText(orderNumber);
  await expect(ordersMain).toContainText('تأیید شده');

  await page.goto(`/#admin/orders/${orderNumber}`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: orderNumber, exact: true })).toBeVisible();
  await expect(page.getByRole('main')).toContainText(`محصول عملیات مدیریت ${qaMarker}`);
  await expect(page.getByRole('main')).toContainText('اقلام سفارش');

  await page.goto('/#admin/payments', { waitUntil: 'domcontentloaded' });
  const paymentsMain = page.getByRole('main');
  await expect(paymentsMain.getByRole('heading', { name: 'پرداخت‌ها', exact: true })).toBeVisible();
  await expect(
    paymentsMain.getByRole('heading', { name: 'تلاش‌های پرداخت', exact: true }),
  ).toBeVisible();
  await expect(paymentsMain).toContainText(qaMarker);
  await paymentsMain.getByRole('button', { name: paymentId }).click();
  await expect(
    paymentsMain.getByRole('heading', { name: 'جزئیات تلاش پرداخت', exact: true }),
  ).toBeVisible();

  await page.goto(`/#admin/customers?q=${encodeURIComponent(qaMarker)}`, {
    waitUntil: 'domcontentloaded',
  });
  const customersMain = page.getByRole('main');
  await expect(customersMain.getByRole('heading', { name: 'مشتریان', exact: true })).toBeVisible();
  await expect(
    customersMain.getByRole('heading', { name: 'جست‌وجوی مشتری', exact: true }),
  ).toBeVisible();
  await expect(customersMain).toContainText(qaMarker);

  await page.goto('/#admin/notifications', { waitUntil: 'domcontentloaded' });
  const notificationsMain = page.getByRole('main');
  await expect(
    notificationsMain.getByRole('heading', { name: 'تحویل اعلان‌ها', exact: true }).first(),
  ).toBeVisible();
  await expect(notificationsMain).toContainText(`QA_NOTIFICATION_${qaMarker}`);

  await page.goto('/#admin/audit', { waitUntil: 'domcontentloaded' });
  const auditMain = page.getByRole('main');
  await expect(auditMain.getByRole('heading', { name: 'گزارش فعالیت', exact: true })).toBeVisible();
  await expect(
    auditMain.getByRole('heading', { name: 'گزارش رویدادها', exact: true }),
  ).toBeVisible();
  await expect(auditMain).toContainText(`admin.read.${qaMarker}`);

  await page.goto(`/#admin/content/pages/${contentPageId}`, { waitUntil: 'domcontentloaded' });
  const contentMain = page.getByRole('main');
  await expect(
    contentMain.getByRole('heading', { name: 'محتوا و دیده‌شدن', exact: true }),
  ).toBeVisible();
  await expect(contentMain).toContainText(`صفحه محتوای مدیریت ${qaMarker}`);
  await expect(contentMain.getByLabel('متن صفحه')).toHaveValue(`بدنه مصنوعی ${qaMarker}`);

  await page.goto('/#admin/content/seo', { waitUntil: 'domcontentloaded' });
  const seoMain = page.getByRole('main');
  await expect(seoMain.getByRole('heading', { name: 'متادیتای SEO', exact: true })).toBeVisible();
  await expect(seoMain).toContainText(`SEO مدیریت ${qaMarker}`);

  await page.goto('/#admin/content/redirects', { waitUntil: 'domcontentloaded' });
  const redirectsMain = page.getByRole('main');
  await expect(
    redirectsMain.getByRole('heading', { name: 'redirectها', exact: true }),
  ).toBeVisible();
  await expect(redirectsMain).toContainText(`/qa-old/${qaMarker.toLowerCase()}`);

  expect(staffSessionRequests.length).toBeGreaterThan(0);
  expect(staffSessionRequests.every((request) => request === 'GET /v1/staff/auth/me')).toBeTruthy();
  expect(network.stateChangingRequests).toEqual([]);
  expect(network.unexpectedApiRequests).toEqual([]);

  await test.info().attach('blocked-external-host-requests', {
    body: JSON.stringify(network.externalHostRequests, null, 2),
    contentType: 'application/json',
  });
});
