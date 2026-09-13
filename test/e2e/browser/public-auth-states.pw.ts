import { expect, test, type Page, type Route } from '@playwright/test';

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

  test('keeps the empty customer-auth form browser-invalid without requesting an OTP', async ({
    page,
  }) => {
    page.setDefaultNavigationTimeout(15_000);
    page.setDefaultTimeout(15_000);
    const { blockedExternalRequests, blockedMutationRequests } =
      await installPublicAuthFixtures(page);

    const response = await page.goto('/#auth', { waitUntil: 'domcontentloaded' });

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'به نوا خوش آمدید', level: 1 })).toBeVisible();

    const phoneInput = page.getByRole('textbox', { name: 'شماره موبایل' });
    await expect(phoneInput).toHaveAttribute('dir', 'ltr');
    await expect(phoneInput).toHaveAttribute('required', '');
    await expect(phoneInput).toBeEmpty();

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

    const response = await page.goto('/#auth/verify', { waitUntil: 'domcontentloaded' });

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
    await expect(page.getByRole('link', { name: 'تغییر شماره' })).toHaveAttribute('href', '#auth');

    expect(blockedExternalRequests).toEqual([]);
    expect(blockedMutationRequests).toEqual([]);
  });
});
