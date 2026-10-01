import { expect, test } from '@playwright/test';

const privateRouteMarker = 'WEB-003-PRIVATE-DATA';

const anonymousProtectedRoutes = [
  {
    path: `/account/orders?customer=${privateRouteMarker}`,
    heading: 'برای دیدن حساب کاربری وارد شوید',
    copy: 'اطلاعات خصوصی شما فقط پس از ورود به حساب نمایش داده می‌شود.',
  },
  {
    path: `/order/${privateRouteMarker}-ORDER`,
    heading: 'برای دیدن جزئیات سفارش وارد شوید',
    copy: 'برای مشاهده جزئیات سفارش ابتدا وارد حساب شوید.',
  },
  {
    path: `/return/status?orderNumber=${privateRouteMarker}-RETURN`,
    heading: 'برای دیدن بازگشت کالا وارد شوید',
    copy: 'برای پیگیری یا ثبت درخواست بازگشت ابتدا وارد حساب شوید.',
  },
] as const;

function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

test('keeps anonymous account, order, and return routes private and settled', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);

  const stateChangingRequests: string[] = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!['GET', 'HEAD'].includes(request.method())) {
      stateChangingRequests.push(`${request.method()} ${url.pathname}`);
    }

    if ((url.protocol === 'http:' || url.protocol === 'https:') && !isLoopbackHost(url.hostname)) {
      // Abort non-loopback requests before they leave the browser.
      await route.abort();
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/v1/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          meta: { requestId: 'QA-ANONYMOUS-REQUEST', timestamp: '2026-09-30T00:00:00.000Z' },
        }),
      });
      return;
    }

    if (request.method() === 'GET' && url.pathname === '/v1/cart') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'QA-ANONYMOUS-CART',
            kind: 'GUEST',
            items: [],
            itemCount: 0,
            subtotalToman: 0,
            currency: 'TOMAN',
          },
          meta: { requestId: 'QA-ANONYMOUS-CART-REQUEST', timestamp: '2026-09-30T00:00:00.000Z' },
        }),
      });
      return;
    }

    await route.continue();
  });

  for (const route of anonymousProtectedRoutes) {
    const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    if (response) expect(response.ok()).toBeTruthy();

    const main = page.locator('main');
    await expect(main).toBeVisible();
    await expect(main.getByRole('heading', { name: route.heading })).toBeVisible();
    await expect(main).toContainText(route.copy);

    const loginLink = main.getByRole('link', { name: 'ورود به حساب' });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute('href', '/auth');

    await expect(main.locator('[role="status"][aria-label*="در حال"]')).toHaveCount(0);
    await expect(main).not.toContainText(privateRouteMarker);
    await expect(main.locator('.account-nav, .order-card')).toHaveCount(0);
  }

  expect(stateChangingRequests).toEqual([]);
});
