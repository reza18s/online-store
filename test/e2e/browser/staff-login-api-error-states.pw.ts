import { expect, test, type Page, type Route } from '@playwright/test';

const staffLoginPath = '/v1/staff/auth/login';
const staffCsrfPath = '/v1/staff/auth/csrf';
const csrfToken = 'c'.repeat(43);
const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

async function installControlledLoginError(page: Page, status: 401 | 429) {
  const loginRequests: string[] = [];
  const csrfRequests: string[] = [];
  const csrfHeaders: string[] = [];
  const csrfCookies: string[] = [];
  const unexpectedStateChangingRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      await route.abort();
      return;
    }

    if (url.pathname === staffCsrfPath) {
      if (request.method() !== 'GET') {
        unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
        await route.abort();
        return;
      }

      csrfRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Set-Cookie': `nova_csrf=${csrfToken}; Max-Age=1800; Path=/; SameSite=Lax`,
        },
        body: JSON.stringify({ data: null, meta: {} }),
      });
      return;
    }

    if (url.pathname === staffLoginPath) {
      if (request.method() !== 'POST') {
        unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
        await route.abort();
        return;
      }

      loginRequests.push(`${request.method()} ${url.pathname}`);
      csrfHeaders.push(request.headers()['x-csrf-token'] ?? '');
      csrfCookies.push((await request.allHeaders()).cookie ?? '');
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: status === 401 ? 'UNAUTHORIZED' : 'TOO_MANY_REQUESTS',
            message: status === 401 ? 'invalid staff factor' : 'staff login rate limited',
          },
        }),
      });
      return;
    }

    if (!safeMethods.has(request.method())) {
      unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return {
    loginRequests,
    csrfRequests,
    csrfHeaders,
    csrfCookies,
    unexpectedStateChangingRequests,
  };
}

async function submitStaffLogin(page: Page): Promise<void> {
  page.setDefaultNavigationTimeout(15_000);
  const response = await page.goto('/#admin/login', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'ورود به فضای مدیریت' })).toBeVisible();

  await page.getByLabel('ایمیل سازمانی').fill('browser-local-staff@example.invalid');
  await page.getByLabel('رمز عبور').fill('synthetic-password');
  await page.getByLabel('کد تأیید دومرحله‌ای یا کد بازیابی').fill('000000');
  await page.getByRole('button', { name: 'ورود به پنل' }).click();
}

test('shows the invalid MFA or recovery-code state after a 401 staff login response', async ({
  page,
}) => {
  const network = await installControlledLoginError(page, 401);

  await submitStaffLogin(page);

  await expect(page.getByRole('alert')).toContainText(
    'ایمیل، رمز عبور یا کد تأیید دومرحله‌ای نادرست است.',
  );
  await expect(page.getByRole('button', { name: 'ورود به پنل' })).toBeEnabled();
  expect(network.csrfRequests).toEqual(['GET /v1/staff/auth/csrf']);
  expect(network.loginRequests).toEqual(['POST /v1/staff/auth/login']);
  expect(network.csrfHeaders).toEqual([csrfToken]);
  expect(network.csrfCookies[0]).toContain(`nova_csrf=${csrfToken}`);
  expect(network.unexpectedStateChangingRequests).toEqual([]);
});

test('shows the rate-limited state after a 429 staff login response', async ({ page }) => {
  const network = await installControlledLoginError(page, 429);

  await submitStaffLogin(page);

  await expect(page.getByRole('alert')).toContainText(
    'تعداد تلاش‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.',
  );
  await expect(page.getByRole('button', { name: 'ورود به پنل' })).toBeEnabled();
  expect(network.csrfRequests).toEqual(['GET /v1/staff/auth/csrf']);
  expect(network.loginRequests).toEqual(['POST /v1/staff/auth/login']);
  expect(network.csrfHeaders).toEqual([csrfToken]);
  expect(network.csrfCookies[0]).toContain(`nova_csrf=${csrfToken}`);
  expect(network.unexpectedStateChangingRequests).toEqual([]);
});
