import { expect, test, type Page, type Route } from '@playwright/test';

const customerAuthMePath = '/v1/auth/me';
const customerCartPath = '/v1/cart';
const customerOtpVerifyPath = '/v1/auth/otp/verify';
const syntheticChallengeId = 'browser-local-invalid-otp';
const syntheticOtp = '000000';
const syntheticErrorMessage = 'کد ورود آزمایشی معتبر نیست.';
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
      requestId: 'customer-auth-api-error-states-browser-test',
      timestamp: '2026-09-13T00:00:00.000Z',
    },
  });
}

async function installCustomerOtpErrorFixture(page: Page): Promise<{
  blockedExternalRequests: string[];
  blockedMutationRequests: string[];
  verifyRequests: string[];
}> {
  const blockedExternalRequests: string[] = [];
  const blockedMutationRequests: string[] = [];
  const verifyRequests: string[] = [];

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

    if (url.pathname === customerAuthMePath) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: jsonEnvelope(null),
      });
      return;
    }

    if (url.pathname === customerCartPath) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: jsonEnvelope({
          id: 'customer-auth-api-error-states-empty-cart',
          kind: 'GUEST',
          items: [],
          itemCount: 0,
          subtotalToman: 0,
          currency: 'IRR',
        }),
      });
      return;
    }

    if (url.pathname === customerOtpVerifyPath) {
      if (request.method() !== 'POST') {
        blockedMutationRequests.push(`${request.method()} ${url.pathname}`);
        await route.abort();
        return;
      }

      verifyRequests.push(`${request.method()} ${url.pathname}`);
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'UNAUTHORIZED',
            message: syntheticErrorMessage,
          },
        }),
      });
      return;
    }

    if (!safeMethods.has(request.method())) {
      blockedMutationRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return { blockedExternalRequests, blockedMutationRequests, verifyRequests };
}

test.use({ viewport: { width: 1440, height: 900 } });

test('renders a recoverable invalid customer OTP state without redirecting or writing storage', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  page.setDefaultTimeout(15_000);
  const network = await installCustomerOtpErrorFixture(page);

  const response = await page.goto(`/#auth/verify?challengeId=${syntheticChallengeId}`, {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'کد ورود را وارد کنید', level: 1 })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);

  await page.getByRole('textbox', { name: 'کد تأیید' }).fill(syntheticOtp);
  await page.getByRole('button', { name: 'تأیید و ورود' }).click();

  await expect(page.getByRole('alert')).toContainText(syntheticErrorMessage);
  await expect(page.getByRole('button', { name: 'تأیید و ورود' })).toBeEnabled();
  await expect(page).toHaveURL(new RegExp(`#auth/verify\\?challengeId=${syntheticChallengeId}$`));
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  expect(network.verifyRequests).toEqual([`POST ${customerOtpVerifyPath}`]);
  expect(network.blockedExternalRequests).toEqual([]);
  expect(network.blockedMutationRequests).toEqual([]);
});
