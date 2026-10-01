import { expect, test, type Page, type Route } from '@playwright/test';
import { captureUiAudit } from './ui-audit-screenshot';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const browserLocalFontStylesheet = {
  origin: 'https://fonts.googleapis.com',
  pathname: '/css2',
} as const;

function isLoopbackHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
}

function jsonEnvelope(data: unknown): string {
  return JSON.stringify({
    data,
    meta: {
      requestId: 'public-auth-states-browser-test',
      timestamp: '2026-09-13T00:00:00.000Z',
    },
  });
}

async function installPublicAuthFixtures(page: Page): Promise<{
  blockedExternalRequests: string[];
  blockedMutationRequests: string[];
}> {
  const blockedExternalRequests: string[] = [];
  const blockedMutationRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if ((url.protocol === 'http:' || url.protocol === 'https:') && !isLoopbackHost(url.hostname)) {
      if (
        url.origin === browserLocalFontStylesheet.origin &&
        url.pathname === browserLocalFontStylesheet.pathname
      ) {
        await route.fulfill({ status: 200, contentType: 'text/css', body: '' });
        return;
      }

      blockedExternalRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (!safeMethods.has(request.method())) {
      blockedMutationRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: jsonEnvelope(null),
      });
      return;
    }

    if (url.pathname === '/v1/cart') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: jsonEnvelope({
          id: 'public-auth-states-empty-cart',
          kind: 'GUEST',
          items: [],
          itemCount: 0,
          subtotalToman: 0,
          currency: 'IRR',
        }),
      });
      return;
    }

    await route.continue();
  });

  return { blockedExternalRequests, blockedMutationRequests };
}

test.describe('public customer authentication states', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('requests, resends, and verifies a synthetic customer code', async ({ page }) => {
    await installPublicAuthFixtures(page);
    let signedIn = false;
    let requests = 0;
    const customer = { id: 'synthetic-auth-customer', phone: '+989000000001', email: null, status: 'ACTIVE', createdAt: '2026-01-01T00:00:00.000Z' };
    const respond = (data: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ data, meta: {} }) });
    await page.route('**/v1/auth/me', (route) => route.fulfill(respond(signedIn ? customer : null)));
    await page.route('**/v1/account/orders?*', (route) => route.fulfill(respond({ items: [], total: 0, page: 1, limit: 10 })));
    await page.route('**/v1/auth/otp/request', async (route) => {
      expect(route.request().postDataJSON()).toEqual({ phone: '09000000001' });
      requests += 1;
      await route.fulfill(respond({ challengeId: `synthetic-challenge-${requests}`, expiresAt: '2026-12-01T00:00:00.000Z', resendAvailableAt: '2026-01-01T00:00:00.000Z' }));
    });
    await page.route('**/v1/auth/otp/verify', async (route) => {
      expect(route.request().postDataJSON()).toEqual({ challengeId: 'synthetic-challenge-2', code: '000000' });
      signedIn = true;
      await route.fulfill(respond({ user: customer, expiresAt: '2026-12-01T00:00:00.000Z' }));
    });
    await page.goto('/auth');
    await page.getByRole('textbox', { name: 'شماره موبایل' }).fill('09000000001');
    await page.getByRole('button', { name: 'ارسال کد ورود' }).click();
    await expect(page).toHaveURL(/challengeId=synthetic-challenge-1/);
    await page.getByRole('button', { name: 'ارسال دوباره کد' }).click();
    await expect(page).toHaveURL(/challengeId=synthetic-challenge-2/);
    await captureUiAudit(page, 'auth/verify');
    await page.getByRole('textbox', { name: 'کد تأیید' }).fill('000000');
    await page.getByRole('button', { name: 'تأیید و ورود' }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole('main')).toContainText(customer.phone);
    expect(requests).toBe(2);
  });

  test('keeps the empty customer-auth form browser-invalid without requesting an OTP', async ({
    page,
  }) => {
    page.setDefaultNavigationTimeout(15_000);
    page.setDefaultTimeout(15_000);
    const { blockedExternalRequests, blockedMutationRequests } =
      await installPublicAuthFixtures(page);

    const response = await page.goto('/auth', { waitUntil: 'domcontentloaded' });

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'به نوا خوش آمدید', level: 1 })).toBeVisible();

    const phoneInput = page.getByRole('textbox', { name: 'شماره موبایل' });
    await expect(phoneInput).toHaveAttribute('dir', 'ltr');
    await expect(phoneInput).toHaveAttribute('required', '');
    await expect(phoneInput).toBeEmpty();
    await captureUiAudit(page, 'auth/request');

    await page.getByRole('button', { name: 'ارسال کد ورود' }).click();

    await expect(phoneInput).toBeFocused();
    expect(
      await phoneInput.evaluate((element) => (element as HTMLInputElement).validity.valid),
    ).toBe(false);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(blockedExternalRequests).toEqual([]);
    expect(blockedMutationRequests).toEqual([]);
  });

  test('renders missing OTP challenge as a disabled, recoverable verification state', async ({
    page,
  }) => {
    page.setDefaultNavigationTimeout(15_000);
    page.setDefaultTimeout(15_000);
    const { blockedExternalRequests, blockedMutationRequests } =
      await installPublicAuthFixtures(page);

    const response = await page.goto('/auth/verify', { waitUntil: 'domcontentloaded' });

    expect(response?.ok()).toBeTruthy();
    await expect(
      page.getByRole('heading', { name: 'کد ورود را وارد کنید', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('alert')).toContainText(
      'نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.',
    );
    await expect(page.getByRole('textbox', { name: 'کد تأیید' })).toHaveAttribute(
      'autocomplete',
      'one-time-code',
    );
    await expect(page.getByRole('button', { name: 'تأیید و ورود' })).toBeDisabled();
    await expect(page.getByRole('link', { name: 'تغییر شماره' })).toHaveAttribute('href', '/auth');
    await captureUiAudit(page, 'auth/missing-challenge');

    expect(blockedExternalRequests).toEqual([]);
    expect(blockedMutationRequests).toEqual([]);
  });
});
