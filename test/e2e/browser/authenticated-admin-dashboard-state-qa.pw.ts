import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  AdminDashboardSummary,
  ApiEnvelope,
  ApiErrorEnvelope,
  ApiMeta,
  StaffUser,
} from '../../../packages/api-client/src/types';

const qaMarker = 'BROWSER-LOCAL-ADMIN-DASHBOARD-STATE-QA-001';
const fixtureTimestamp = '2026-01-01T00:00:00.000Z';
const staffSessionPath = '/v1/staff/auth/me';
const dashboardSummaryPath = '/v1/admin/dashboard/summary';
const dashboardSummaryRequest = 'GET /v1/admin/dashboard/summary?periodDays=30';

const apiMeta: ApiMeta = {
  requestId: `request-${qaMarker}`,
  timestamp: fixtureTimestamp,
};

// Synthetic fixture only: this test does not authenticate against a real staff account.
const syntheticAdmin: StaffUser = {
  id: `staff-${qaMarker}`,
  email: 'qa-admin-dashboard-state@browser.local',
  status: 'ACTIVE',
  roles: ['admin'],
};

const dashboardSummary: AdminDashboardSummary = {
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
};

const dashboardUnavailable: ApiErrorEnvelope = {
  error: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'خلاصه داشبورد موقتاً در دسترس نیست.',
    statusCode: 503,
    requestId: `error-${qaMarker}`,
    timestamp: fixtureTimestamp,
    details: {
      provider: 'provider-secret otp=123456',
      database: 'database password=not-for-display',
      stack: 'Error: internal failure at DashboardService.loadSummary (dashboard.service.ts:42:7)',
    },
  },
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: apiMeta };
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

async function installDashboardStateFixture(page: Page) {
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
    const isApiRequest = url.pathname.startsWith('/v1/');

    if (isNonGetRequest) {
      stateChangingRequests.push(requestLabel);
      if (isApiRequest) unexpectedApiRequests.push(requestLabel);
    }

    if (!isLoopbackHost(url.hostname)) {
      blockedNonLoopbackRequests.push(`${requestLabel} ${url.origin}`);
      if (isApiRequest && !unexpectedApiRequests.includes(requestLabel)) {
        unexpectedApiRequests.push(requestLabel);
      }
      await route.abort();
      return;
    }

    if (isNonGetRequest) {
      await route.abort();
      return;
    }

    if (url.pathname === staffSessionPath && url.search === '') {
      staffSessionRequests.push(requestLabel);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticAdmin)),
      });
      return;
    }

    if (url.pathname === dashboardSummaryPath && url.search === '?periodDays=30') {
      summaryRequests.push(requestLabel);
      await route.fulfill({
        status: summaryRequests.length === 1 ? 503 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          summaryRequests.length === 1 ? dashboardUnavailable : envelope(dashboardSummary),
        ),
      });
      return;
    }

    if (isApiRequest) {
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

test('renders the synthetic read-only admin dashboard error and retry state', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  const network = await installDashboardStateFixture(page);

  const response = await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const main = page.getByRole('main');
  await expect(
    main.getByRole('heading', { name: 'خلاصه داشبورد در دسترس نیست', exact: true }),
  ).toBeVisible();
  await expect(main.getByRole('button', { name: 'تلاش دوباره', exact: true })).toBeVisible();
  await expect(main).not.toContainText(
    /provider-secret|otp=123456|database password|stack trace|traceback|error:\s|at\s+\w+\s*\(/i,
  );

  const retryRequest = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      request.method() === 'GET' &&
      url.pathname === dashboardSummaryPath &&
      url.search === '?periodDays=30'
    );
  });
  await main.getByRole('button', { name: 'تلاش دوباره', exact: true }).click();
  await retryRequest;

  await expect(main.getByRole('heading', { name: 'نمای کلی مدیریت', exact: true })).toBeVisible();
  await expect(main.getByRole('region', { name: 'شاخص‌های خلاصه داشبورد' })).toContainText('۴۲');

  expect(network.staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expect(network.summaryRequests).toEqual([dashboardSummaryRequest, dashboardSummaryRequest]);
  expect(network.stateChangingRequests).toEqual([]);
  expect(network.unexpectedApiRequests).toEqual([]);
  expect(
    network.blockedNonLoopbackRequests.every((request) => !request.includes('127.0.0.1')),
  ).toBe(true);
});
