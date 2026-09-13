import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const expectedFontHosts = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

async function installReadOnlyLocalNetworkGuard(page: Page): Promise<string[]> {
  const blockedRequests: string[] = [];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLocalHost(url.hostname)) {
      if (!expectedFontHosts.has(url.hostname)) {
        blockedRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      }
      await route.abort();
      return;
    }

    if (!safeMethods.has(request.method())) {
      blockedRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  return blockedRequests;
}

async function expectSettledCheckoutState(page: Page): Promise<void> {
  await expect(page.getByRole('main')).toHaveCount(1);
  await expect(page.getByRole('status', { name: /در حال/ })).toHaveCount(0);
}

test.describe('WEB-004 checkout recovery browser coverage', () => {
  test('renders safe unauthenticated payment pending and failed states', async ({ page }) => {
    page.setDefaultNavigationTimeout(15_000);
    const blockedRequests = await installReadOnlyLocalNetworkGuard(page);

    const routes = [
      {
        hash: '#checkout/payment-pending',
        heading: 'در حال بررسی پرداخت',
        primaryAction: 'پیگیری سفارش',
        primaryHref: '#account/orders',
      },
      {
        hash: '#checkout/payment-failed',
        heading: 'پرداخت انجام نشد',
        primaryAction: 'تلاش دوباره',
        primaryHref: '#checkout/payment',
      },
    ] as const;

    for (const route of routes) {
      const response = await page.goto(`/${route.hash}`, { waitUntil: 'domcontentloaded' });

      if (response) expect(response.ok()).toBeTruthy();
      await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
      await expect(
        page.getByRole('link', { name: route.primaryAction, exact: true }),
      ).toHaveAttribute('href', route.primaryHref);
      await expectSettledCheckoutState(page);
    }

    expect(blockedRequests).toEqual([]);
  });

  test('settles blank and whitespace-only order parameters without a skeleton', async ({
    page,
  }) => {
    page.setDefaultNavigationTimeout(15_000);
    const blockedRequests = await installReadOnlyLocalNetworkGuard(page);

    const routes = [
      {
        hash: '#checkout/payment-recovery?orderNumber',
        heading: 'ادامه سفارش ممکن نشد',
        message: 'شماره سفارش در لینک پرداخت وجود ندارد.',
      },
      {
        hash: '#checkout/confirmation?orderNumber=%20%09',
        heading: 'ادامه سفارش ممکن نشد',
        message: 'شماره سفارش معتبر نیست.',
      },
    ] as const;

    for (const route of routes) {
      const response = await page.goto(`/${route.hash}`, { waitUntil: 'domcontentloaded' });

      if (response) expect(response.ok()).toBeTruthy();
      await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
      await expect(page.getByRole('alert')).toContainText(route.message);
      await expectSettledCheckoutState(page);
    }

    expect(blockedRequests).toEqual([]);
  });
});
