import { expect, test, type Page, type Route } from '@playwright/test';
import type {
  AdminDashboardSummary,
  ApiEnvelope,
  ApiMeta,
  StaffUser,
} from '../../../packages/api-client/src/types';

const qaMarker = 'BROWSER-LOCAL-ADMIN-DASHBOARD-EMPTY-QA-001';
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
  email: 'qa-admin-dashboard-empty@browser.local',
  status: 'ACTIVE',
  roles: ['admin'],
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: apiMeta };
}

const emptyDashboardEnvelope: ApiEnvelope<AdminDashboardSummary | null> = envelope(null);

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isBrowserLocalFontStylesheet(url: URL): boolean {
  return url.origin === 'https://fonts.googleapis.com' && url.pathname === '/css2';
}

async function installDashboardEmptyFixture(page: Page) {
  const nonLoopbackTraffic: string[] = [];
  const browserFontFixtureRequests: string[] = [];
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

    if (isNonGetRequest) stateChangingRequests.push(requestLabel);

    if (!isLoopbackHost(url.hostname)) {
      if (isBrowserLocalFontStylesheet(url) && !isNonGetRequest) {
        browserFontFixtureRequests.push(requestLabel);
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      nonLoopbackTraffic.push(`${requestLabel} ${url.origin}`);
      if (isApiRequest) unexpectedApiRequests.push(requestLabel);
      await route.abort();
      return;
    }

    if (isNonGetRequest) {
      if (isApiRequest) unexpectedApiRequests.push(requestLabel);
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
        body: JSON.stringify(emptyDashboardEnvelope),
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
    nonLoopbackTraffic,
    browserFontFixtureRequests,
    stateChangingRequests,
    unexpectedApiRequests,
    staffSessionRequests,
    summaryRequests,
  };
}

test('renders the authenticated admin dashboard localized empty state from a null summary', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  const network = await installDashboardEmptyFixture(page);

  const response = await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const main = page.getByRole('main');
  const emptyState = main.getByRole('status');
  await expect(emptyState).toHaveCount(1);
  await expect(emptyState).toBeVisible();
  await expect(emptyState).toHaveAttribute('dir', 'rtl');
  await expect(
    emptyState.getByRole('heading', { name: 'خلاصه‌ای برای نمایش وجود ندارد', exact: true }),
  ).toBeVisible();
  await expect(emptyState).toContainText('در این بازه داده‌ای از API دریافت نشد.');

  await expect(main.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(main).not.toContainText('در حال دریافت خلاصه داشبورد…');

  for (const metricOrPreviewMarker of [
    'محصولات منتشرشده',
    'مشتریان جدید',
    'سفارش‌های جدید',
    'مجموع پرداخت موفق',
    'بازپرداخت موفق',
    'تعداد سفارش‌ها بر اساس وضعیت',
    'NOVA / ADMIN DASHBOARD · LIVE SUMMARY',
    'مدیر نمونه',
    'حساب نمایشی',
    'تاریخ نمایشی',
    'DEV PREVIEW',
    'data preview',
    'داده نمایشی',
  ]) {
    await expect(main).not.toContainText(metricOrPreviewMarker);
  }

  expect(network.staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expect(network.summaryRequests).toEqual([dashboardSummaryRequest]);
  expect(network.stateChangingRequests).toEqual([]);
  expect(network.unexpectedApiRequests).toEqual([]);
  expect(network.nonLoopbackTraffic).toEqual([]);
  expect(
    network.browserFontFixtureRequests.every((request) => request.startsWith('GET /css2?')),
  ).toBeTruthy();
});
