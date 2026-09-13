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

async function installLoopbackOnlyGuard(page: Page, holdLoginResponse = false) {
  const controlledLoginRequests: string[] = [];
  const controlledCsrfRequests: string[] = [];
  const observedCsrfHeaders: string[] = [];
  const observedCsrfCookies: string[] = [];
  const unexpectedStateChangingRequests: string[] = [];

  let releaseLoginResponse = () => {};
  const loginResponseReleased = new Promise<void>((resolve) => {
    releaseLoginResponse = resolve;
  });

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      await route.abort();
      return;
    }

    if (url.pathname === staffLoginPath) {
      if (request.method() !== 'POST') {
        unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
        await route.abort();
        return;
      }

      controlledLoginRequests.push(`${request.method()} ${url.pathname}`);
      observedCsrfHeaders.push(request.headers()['x-csrf-token'] ?? '');
      observedCsrfCookies.push((await request.allHeaders()).cookie ?? '');
      if (holdLoginResponse) await loginResponseReleased;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'BROWSER_LOCAL_STAFF_LOGIN_FAILURE',
            message: 'controlled browser-local login failure',
          },
        }),
      });
      return;
    }

    if (url.pathname === staffCsrfPath) {
      if (request.method() !== 'GET') {
        unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
        await route.abort();
        return;
      }

      controlledCsrfRequests.push(`${request.method()} ${url.pathname}`);
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

    if (!safeMethods.has(request.method())) {
      unexpectedStateChangingRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return {
    controlledLoginRequests,
    controlledCsrfRequests,
    observedCsrfHeaders,
    observedCsrfCookies,
    releaseLoginResponse,
    unexpectedStateChangingRequests,
  };
}

async function openStaffLogin(page: Page): Promise<void> {
  page.setDefaultNavigationTimeout(15_000);
  const response = await page.goto('/#admin/login', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'ورود به فضای مدیریت' })).toBeVisible();
}

test('rejects an invalid staff email on the client without posting login data', async ({
  page,
}) => {
  const { controlledLoginRequests, unexpectedStateChangingRequests } =
    await installLoopbackOnlyGuard(page);

  await openStaffLogin(page);
  await page.getByLabel('ایمیل سازمانی').fill('not-an-email');
  await page.getByLabel('رمز عبور').fill('synthetic-password');
  await page.getByLabel('کد تأیید دومرحله‌ای یا کد بازیابی').fill('000000');
  await page.getByRole('button', { name: 'ورود به پنل' }).click();

  const email = page.locator('#staff-email');
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#staff-email-error')).toContainText('لطفاً یک ایمیل معتبر وارد کنید.');
  await expect(page.getByRole('button', { name: 'ورود به پنل' })).toBeEnabled();

  expect(controlledLoginRequests).toEqual([]);
  expect(unexpectedStateChangingRequests).toEqual([]);
});

test('shows the loading state before a controlled local staff API error settles', async ({
  page,
}) => {
  const {
    controlledLoginRequests,
    controlledCsrfRequests,
    observedCsrfHeaders,
    observedCsrfCookies,
    releaseLoginResponse,
    unexpectedStateChangingRequests,
  } = await installLoopbackOnlyGuard(page, true);

  try {
    await openStaffLogin(page);
    await page.getByLabel('ایمیل سازمانی').fill('browser-local-staff@example.invalid');
    await page.getByLabel('رمز عبور').fill('synthetic-password');
    await page.getByLabel('کد تأیید دومرحله‌ای یا کد بازیابی').fill('000000');

    const submit = page.locator('button[type="submit"]');
    await submit.click();
    await expect.poll(() => controlledLoginRequests.length).toBe(1);
    await expect(submit).toBeDisabled();
    await expect(submit).toContainText('در حال بررسی...');
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(controlledCsrfRequests).toEqual(['GET /v1/staff/auth/csrf']);

    releaseLoginResponse();

    await expect(page.getByRole('alert')).toContainText(
      'ورود به فضای مدیریت انجام نشد؛ دوباره تلاش کنید.',
    );
    await expect(submit).toBeEnabled();
    expect(controlledLoginRequests).toEqual(['POST /v1/staff/auth/login']);
    expect(observedCsrfHeaders).toEqual([csrfToken]);
    expect(observedCsrfCookies[0]).toContain(`nova_csrf=${csrfToken}`);
    expect(unexpectedStateChangingRequests).toEqual([]);
  } finally {
    releaseLoginResponse();
  }
});
