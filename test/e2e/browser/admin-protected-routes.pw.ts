import { expect, test } from '@playwright/test';

const privateRouteMarker = 'ADMIN-PRIVATE-DATA-001';

const anonymousAdminRoutes = [
  '#admin/catalog',
  '#admin/catalog/categories',
  `#admin/catalog/products/${privateRouteMarker}`,
  '#admin/products',
  '#admin/inventory',
  `#admin/inventory/${privateRouteMarker}`,
  '#admin/content/pages',
  `#admin/content/pages/${privateRouteMarker}`,
  '#admin/content/seo',
  '#admin/content/redirects',
  '#admin/payments',
  '#admin/customers',
  '#admin/notifications',
  '#admin/audit',
  '#admin/promotions',
  '#admin/operations',
  '#admin/marketing',
  `#admin/orders/${privateRouteMarker}`,
] as const;

const privateAdminDataMarkers = [
  privateRouteMarker,
  'مدیر نمونه',
  'حساب نمایشی',
  'سفارش‌های اخیر',
  'درآمد کل',
] as const;

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isBrowserLocalFontStub(url: URL): boolean {
  return url.origin === 'https://fonts.googleapis.com' && url.pathname === '/css2';
}

test('keeps anonymous admin child routes behind the staff login boundary', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);

  const staffSessionRequests: string[] = [];
  const stateChangingRequests: string[] = [];
  const nonLoopbackRequests: string[] = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!['GET', 'HEAD'].includes(request.method())) {
      stateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if ((url.protocol === 'http:' || url.protocol === 'https:') && !isLoopbackHost(url.hostname)) {
      if (isBrowserLocalFontStub(url)) {
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      nonLoopbackRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/staff/auth/me') {
      staffSessionRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'unauthorized' } }),
      });
      return;
    }

    await route.continue();
  });

  for (const route of anonymousAdminRoutes) {
    const response = await page.goto(`/${route}`, { waitUntil: 'domcontentloaded' });

    if (response) expect(response.ok()).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
    await expect(page.getByRole('heading', { name: 'ورود به فضای مدیریت' })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(1);
    await expect(page.getByLabel('ایمیل سازمانی')).toHaveValue('');
    await expect(page.getByLabel('رمز عبور')).toHaveValue('');
    await expect(page.getByLabel('کد تأیید دومرحله‌ای یا کد بازیابی')).toHaveValue('');

    const main = page.locator('main');
    await expect(main).not.toContainText('در حال بررسی دسترسی');
    await expect(main.locator('[role="status"][aria-label*="در حال"]')).toHaveCount(0);
    for (const marker of privateAdminDataMarkers) {
      await expect(main).not.toContainText(marker);
    }
  }

  expect(staffSessionRequests.length).toBeGreaterThan(0);
  expect(stateChangingRequests).toEqual([]);
  expect(nonLoopbackRequests).toEqual([]);
});
