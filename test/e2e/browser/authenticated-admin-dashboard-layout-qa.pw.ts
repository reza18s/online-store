import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  AdminDashboardSummary,
  ApiEnvelope,
  ApiMeta,
  StaffUser,
} from '../../../packages/api-client/src/types';

const qaMarker = 'BROWSER-LOCAL-ADMIN-DASHBOARD-LAYOUT-QA-001';
const fixtureTimestamp = '2026-01-01T00:00:00.000Z';
const staffSessionPath = '/v1/staff/auth/me';
const dashboardSummaryPath = '/v1/admin/dashboard/summary';

const targetViewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

const apiMeta: ApiMeta = {
  requestId: `request-${qaMarker}`,
  timestamp: fixtureTimestamp,
};

const syntheticAdmin: StaffUser = {
  id: `staff-${qaMarker}`,
  email: 'qa-admin-dashboard-layout@browser.local',
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

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: apiMeta };
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

async function installDashboardFixtureGuard(page: Page) {
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
      blockedNonLoopbackRequests.push(`${requestLabel} ${url.origin}`);
      if (isNonGetRequest && url.pathname.startsWith('/v1/')) {
        stateChangingRequests.push(requestLabel);
      }
      await route.abort();
      return;
    }

    if (isNonGetRequest) {
      if (url.pathname.startsWith('/v1/')) stateChangingRequests.push(requestLabel);
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
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(dashboardSummary)),
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

async function assertDashboardLayout(page: Page) {
  const response = await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await page.waitForLoadState('networkidle');

  const main = page.getByRole('main');
  await expect(main).toHaveCount(1);

  const heading = main.getByRole('heading', { name: 'نمای کلی مدیریت', exact: true });
  await expect(heading).toBeVisible();

  const dashboardContent = heading.locator('xpath=ancestor::div[@dir="rtl"][1]');
  await expect(dashboardContent).toHaveCount(1);
  await expect(dashboardContent).toHaveAttribute('dir', 'rtl');

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(widths.documentScrollWidth).toBeLessThanOrEqual(widths.viewport);
  expect(widths.bodyScrollWidth).toBeLessThanOrEqual(widths.viewport);

  const periodSelector = main.getByLabel('بازه گزارش');
  await expect(periodSelector).toBeVisible();
  await expect(periodSelector).toHaveValue('30');
  await expect(periodSelector.locator('option')).toHaveCount(3);
  await expect(periodSelector.locator('option')).toHaveText([
    '۷ روز گذشته',
    '۳۰ روز گذشته',
    '۹۰ روز گذشته',
  ]);

  const summaryRegion = main.getByRole('region', { name: 'شاخص‌های خلاصه داشبورد' });
  await expect(summaryRegion).toBeVisible();
  const representativeMetric = summaryRegion
    .locator('article')
    .filter({ hasText: 'محصولات منتشرشده' });
  await expect(representativeMetric).toBeVisible();
  await expect(
    representativeMetric.getByRole('heading', { name: 'محصولات منتشرشده' }),
  ).toBeVisible();
  await expect(representativeMetric).toContainText('۴۲');

  await expect(main.locator('[role="status"]')).toHaveCount(0);
  for (const previewMarker of [
    'مدیر نمونه',
    'حساب نمایشی',
    'تاریخ نمایشی',
    'DEV PREVIEW',
    'data preview',
    'داده نمایشی',
  ]) {
    await expect(main).not.toContainText(previewMarker);
  }
}

for (const viewport of targetViewports) {
  test.describe(`authenticated admin dashboard layout ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('renders the read-only fixture-backed RTL dashboard without overflow', async ({
      page,
    }) => {
      page.setDefaultNavigationTimeout(15_000);
      const network = await installDashboardFixtureGuard(page);

      await assertDashboardLayout(page);

      expect(network.staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
      expect(network.summaryRequests).toEqual(['GET /v1/admin/dashboard/summary?periodDays=30']);
      expect(network.stateChangingRequests).toEqual([]);
      expect(network.unexpectedApiRequests).toEqual([]);
      expect(
        network.blockedNonLoopbackRequests.every(
          (request) =>
            request.startsWith('GET /css2?') && request.endsWith('https://fonts.googleapis.com'),
        ),
      ).toBeTruthy();
    });
  });
}
