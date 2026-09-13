import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import type {
  AdminDashboardSummary,
  ApiEnvelope,
  ApiMeta,
  StaffUser,
} from '../../../packages/api-client/src/types';

const qaMarker = 'BROWSER-LOCAL-ADMIN-DASHBOARD-ACCESSIBILITY-QA-001';
const fixtureTimestamp = '2026-01-01T00:00:00.000Z';
const staffSessionPath = '/v1/staff/auth/me';
const dashboardSummaryPath = '/v1/admin/dashboard/summary';

const apiMeta: ApiMeta = {
  requestId: `request-${qaMarker}`,
  timestamp: fixtureTimestamp,
};

// Synthetic fixture only: this test does not authenticate against a real staff account.
const syntheticAdmin: StaffUser = {
  id: `staff-${qaMarker}`,
  email: 'qa-admin-dashboard-accessibility@browser.local',
  status: 'ACTIVE',
  roles: ['admin'],
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

async function installDashboardFixtureGuard(page: Page) {
  const nonLoopbackRequests: string[] = [];
  const stateChangingRequests: string[] = [];
  const unexpectedApiRequests: string[] = [];
  const staffSessionRequests: string[] = [];
  const summaryRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const requestLabel = `${request.method()} ${url.pathname}${url.search}`;

    if (!isLoopbackHost(url.hostname)) {
      // The app imports Google Fonts. Fulfill that stylesheet locally so the test
      // never permits an external network request or depends on the provider.
      if (url.hostname === 'fonts.googleapis.com' && url.pathname === '/css2') {
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      nonLoopbackRequests.push(`${request.method()} ${url.origin}${url.pathname}${url.search}`);
      if (request.method() !== 'GET') stateChangingRequests.push(requestLabel);
      await route.abort();
      return;
    }

    if (request.method() !== 'GET') {
      stateChangingRequests.push(requestLabel);
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

    if (url.pathname === dashboardSummaryPath) {
      const periodDays = Number(url.searchParams.get('periodDays'));
      const summary = summaries[periodDays as 30 | 90];
      if (!summary || url.searchParams.size !== 1) {
        unexpectedApiRequests.push(requestLabel);
        await route.abort();
        return;
      }

      summaryRequests.push(requestLabel);
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
    nonLoopbackRequests,
    stateChangingRequests,
    unexpectedApiRequests,
    staffSessionRequests,
    summaryRequests,
  };
}

function assertReadOnlyDashboardNetwork(
  network: Awaited<ReturnType<typeof installDashboardFixtureGuard>>,
  summaryRequests: string[],
) {
  expect(network.staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expect(network.summaryRequests).toEqual(summaryRequests);
  expect(network.stateChangingRequests).toEqual([]);
  expect(network.unexpectedApiRequests).toEqual([]);
  expect(network.nonLoopbackRequests).toEqual([]);
}

async function assertVisibleKeyboardFocus(selector: Locator) {
  await selector.focus();
  await expect(selector).toBeFocused();

  const focusState = await selector.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      matchesFocusVisible: element.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth),
      boxShadow: style.boxShadow,
    };
  });

  expect(focusState.matchesFocusVisible).toBe(true);
  expect(focusState.outlineStyle).not.toBe('none');
  expect(focusState.outlineWidth).toBeGreaterThan(0);
  expect(focusState.boxShadow).not.toBe('none');
}

test('keeps the authenticated admin dashboard semantic and keyboard-operable', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  const network = await installDashboardFixtureGuard(page);

  const response = await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();

  const main = page.getByRole('main');
  await expect(main).toHaveCount(1);
  await expect(main.getByRole('heading', { name: 'نمای کلی مدیریت', exact: true })).toBeVisible();

  const periodSelector = main.getByRole('combobox', { name: 'بازه گزارش', exact: true });
  await expect(periodSelector).toBeVisible();
  await expect(periodSelector).toHaveValue('30');
  await assertVisibleKeyboardFocus(periodSelector);

  const period90Request = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return (
      request.method() === 'GET' &&
      isLoopbackHost(url.hostname) &&
      url.pathname === dashboardSummaryPath &&
      url.search === '?periodDays=90'
    );
  });
  await periodSelector.press('ArrowDown');
  await period90Request;

  await expect(periodSelector).toHaveValue('90');
  await expect(main.locator('article').filter({ hasText: 'سفارش‌های جدید' })).toContainText('۲۷');
  await expect(main).toContainText('۹۸۷٬۶۵۴٬۰۰۰ تومان');

  assertReadOnlyDashboardNetwork(network, [
    'GET /v1/admin/dashboard/summary?periodDays=30',
    'GET /v1/admin/dashboard/summary?periodDays=90',
  ]);
});

test('makes reduced motion observable on the authenticated admin dashboard', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const network = await installDashboardFixtureGuard(page);

  const response = await page.goto('/#admin', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(
    page.getByRole('main').getByRole('heading', { name: 'نمای کلی مدیریت', exact: true }),
  ).toBeVisible();

  const motion = await page.evaluate(() => {
    const durationsToMilliseconds = (value: string) =>
      value.split(',').map((duration) => {
        const normalized = duration.trim();
        if (normalized.endsWith('ms')) return Number.parseFloat(normalized);
        if (normalized.endsWith('s')) return Number.parseFloat(normalized) * 1000;
        return 0;
      });
    const sample = document.querySelector('main a, main button, main select');
    const style = sample ? getComputedStyle(sample) : null;

    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transitionDurations: style ? durationsToMilliseconds(style.transitionDuration) : [],
      animationDurations: style ? durationsToMilliseconds(style.animationDuration) : [],
    };
  });

  expect(motion.reducedMotion).toBe(true);
  expect(motion.scrollBehavior).toBe('auto');
  expect(Math.max(0, ...motion.transitionDurations)).toBeLessThanOrEqual(0.1);
  expect(Math.max(0, ...motion.animationDurations)).toBeLessThanOrEqual(0.1);

  assertReadOnlyDashboardNetwork(network, ['GET /v1/admin/dashboard/summary?periodDays=30']);
});
