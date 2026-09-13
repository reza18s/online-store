import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  AdminDashboardSummary,
  ApiEnvelope,
  ApiMeta,
  StaffUser,
} from '../../../packages/api-client/src/types';

const qaMarker = 'BROWSER-LOCAL-ADMIN-DASHBOARD-QA-001';
const fixtureTimestamp = '2026-01-01T00:00:00.000Z';
const staffSessionPath = '/v1/staff/auth/me';
const dashboardSummaryPath = '/v1/admin/dashboard/summary';

const apiMeta: ApiMeta = {
  requestId: `request-${qaMarker}`,
  timestamp: fixtureTimestamp,
};

const adminStaff: StaffUser = {
  id: `staff-${qaMarker}`,
  email: 'qa-admin-dashboard@browser.local',
  status: 'ACTIVE',
  roles: ['admin'],
};

const supportStaff: StaffUser = {
  id: `staff-support-${qaMarker}`,
  email: 'qa-support-dashboard@browser.local',
  status: 'ACTIVE',
  roles: ['support'],
};

const summaries: Record<30 | 90, AdminDashboardSummary> = {
  30: {
    publishedProductCount: 42,
    newCustomerCount: 17,
    newOrderCount: 9,
    paidGrossToman: 123_456_000,
    successfulRefundToman: 789_000,
    orderStatusCounts: {
      PENDING_PAYMENT: 2,
      CONFIRMED: 3,
      PREPARING: 1,
      SHIPPED: 1,
      DELIVERED: 2,
      CANCELLED: 0,
      RETURNED: 0,
    },
  },
  90: {
    publishedProductCount: 84,
    newCustomerCount: 51,
    newOrderCount: 27,
    paidGrossToman: 987_654_000,
    successfulRefundToman: 1_234_000,
    orderStatusCounts: {
      PENDING_PAYMENT: 4,
      CONFIRMED: 8,
      PREPARING: 3,
      SHIPPED: 5,
      DELIVERED: 7,
      CANCELLED: 1,
      RETURNED: 0,
    },
  },
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: apiMeta };
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

async function installDashboardFixtureGuard(page: Page, staff: StaffUser) {
  const blockedNonLoopbackRequests: string[] = [];
  const stateChangingRequests: string[] = [];
  const unexpectedApiRequests: string[] = [];
  const staffSessionRequests: string[] = [];
  const summaryRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const requestLabel = `${request.method()} ${url.pathname}${url.search}`;
    const isNonGetRequest = request.method() !== 'GET';

    if (!isLoopbackHost(url.hostname)) {
      if (isNonGetRequest) stateChangingRequests.push(requestLabel);
      blockedNonLoopbackRequests.push(
        `${request.method()} ${url.origin}${url.pathname}${url.search}`,
      );
      await route.abort();
      return;
    }

    if (isNonGetRequest) {
      stateChangingRequests.push(requestLabel);
      await route.abort();
      return;
    }

    if (url.pathname === staffSessionPath) {
      staffSessionRequests.push(requestLabel);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(staff)),
      });
      return;
    }

    if (url.pathname === dashboardSummaryPath) {
      summaryRequests.push(requestLabel);

      if (!staff.roles.includes('admin')) {
        unexpectedApiRequests.push(requestLabel);
        await route.abort();
        return;
      }

      const periodDays = Number(url.searchParams.get('periodDays'));
      const summary = summaries[periodDays as 30 | 90];
      if (!summary) {
        unexpectedApiRequests.push(requestLabel);
        await route.abort();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(summary)),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/')) {
      unexpectedApiRequests.push(requestLabel);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return {
    blockedNonLoopbackRequests,
    stateChangingRequests,
    unexpectedApiRequests,
    staffSessionRequests,
    summaryRequests,
  };
}

function expectOnlyFontStylesheetBlocked(requests: readonly string[]): void {
  expect(
    requests.every((request) => request.startsWith('GET https://fonts.googleapis.com/css2?')),
  ).toBeTruthy();
}

test('renders the live fixture-backed authenticated admin dashboard and changes its period', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  const network = await installDashboardFixtureGuard(page, adminStaff);

  const response = await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'نمای کلی مدیریت', exact: true })).toBeVisible();
  await expect(main).toContainText('NOVA / ADMIN DASHBOARD · LIVE SUMMARY');
  await expect(main).toContainText('محصولات منتشرشده');
  await expect(main).toContainText('۴۲');
  await expect(main).toContainText('مشتریان جدید');
  await expect(main).toContainText('۱۷');
  await expect(main).toContainText('سفارش‌های جدید');
  await expect(main).toContainText('۹');
  await expect(main).toContainText('۱۲۳٬۴۵۶٬۰۰۰ تومان');
  await expect(main).toContainText('۷۸۹٬۰۰۰ تومان');
  await expect(main).toContainText('در انتظار پرداخت');
  await expect(main).toContainText('۳');
  await expect(main).not.toContainText(
    /DEV PREVIEW|data preview|داده نمایشی|نمونه|مدیر نمونه|حساب نمایشی|تاریخ نمایشی/i,
  );

  const periodSelector = main.getByLabel('بازه گزارش');
  await expect(periodSelector).toHaveValue('30');
  await expect(network.summaryRequests).toContain('GET /v1/admin/dashboard/summary?periodDays=30');

  const period90Request = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === dashboardSummaryPath && url.searchParams.get('periodDays') === '90';
  });
  await periodSelector.selectOption('90');
  await period90Request;

  await expect(periodSelector).toHaveValue('90');
  await expect(main.locator('article').filter({ hasText: 'سفارش‌های جدید' })).toContainText('۲۷');
  await expect(main).toContainText('۹۸۷٬۶۵۴٬۰۰۰ تومان');
  await expect(network.summaryRequests).toContain('GET /v1/admin/dashboard/summary?periodDays=90');

  expect(network.staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expectOnlyFontStylesheetBlocked(network.blockedNonLoopbackRequests);
  expect(network.stateChangingRequests).toEqual([]);
  expect(network.unexpectedApiRequests).toEqual([]);
});

test('denies an authenticated support staff member without requesting dashboard data', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  const network = await installDashboardFixtureGuard(page, supportStaff);

  const response = await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const main = page.getByRole('main');
  await expect(main.getByRole('alert')).toBeVisible();
  await expect(main.getByRole('heading', { name: 'دسترسی کافی نیست', exact: true })).toBeVisible();
  await expect(main).not.toContainText('NOVA / ADMIN DASHBOARD · LIVE SUMMARY');
  await expect(main.getByRole('region', { name: 'شاخص‌های خلاصه داشبورد' })).toHaveCount(0);
  await expect(main).not.toContainText('۴۲');
  await expect(main).not.toContainText('۹۸۷٬۶۵۴٬۰۰۰ تومان');

  expect(network.staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expect(network.summaryRequests).toEqual([]);
  expectOnlyFontStylesheetBlocked(network.blockedNonLoopbackRequests);
  expect(network.stateChangingRequests).toEqual([]);
  expect(network.unexpectedApiRequests).toEqual([]);
});
