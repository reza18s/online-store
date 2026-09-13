import { expect, test, type Route } from '@playwright/test';
import type { ApiEnvelope, StaffUser } from '../../../packages/api-client/src/types';

const staffSessionPath = '/v1/staff/auth/me';
const syntheticMarker = 'BROWSER-LOCAL-STAFF-ROLE-DENIAL-001';
const syntheticStaff: StaffUser = {
  id: `staff-${syntheticMarker}`,
  email: 'qa-support-role@browser.local',
  status: 'ACTIVE',
  roles: ['support'],
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return {
    data,
    meta: {
      requestId: `request-${syntheticMarker}`,
      timestamp: '2026-01-01T00:00:00.000Z',
    },
  };
}

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

test('keeps an authenticated support staff member out of the admin payments view', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);

  const staffSessionRequests: string[] = [];
  const blockedExternalRequests: string[] = [];
  const stateChangingRequests: string[] = [];
  const unexpectedApiRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      if (url.origin === 'https://fonts.googleapis.com' && url.pathname === '/css2') {
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      blockedExternalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (!['GET', 'HEAD'].includes(request.method())) {
      stateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === staffSessionPath) {
      staffSessionRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(envelope(syntheticStaff)),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/')) {
      unexpectedApiRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  const response = await page.goto('/#admin/payments', { waitUntil: 'domcontentloaded' });

  expect(response?.ok()).toBeTruthy();
  const main = page.getByRole('main');
  await expect(main.getByRole('alert')).toBeVisible();
  await expect(main.getByRole('heading', { name: 'دسترسی کافی ندارید', level: 1 })).toBeVisible();
  await expect(main).toContainText('این بخش برای نقش فعلی شما فعال نیست.');
  await expect(main.getByRole('link')).toHaveCount(0);
  await expect(main.locator('form')).toHaveCount(0);
  await expect(main).not.toContainText('ورود به فضای مدیریت');
  await expect(main).not.toContainText(syntheticMarker);
  await expect(main).not.toContainText('تلاش‌های پرداخت');

  expect(staffSessionRequests).toEqual(['GET /v1/staff/auth/me']);
  expect(blockedExternalRequests).toEqual([]);
  expect(stateChangingRequests).toEqual([]);
  expect(unexpectedApiRequests).toEqual([]);
});
