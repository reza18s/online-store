import { expect, test, type Page, type Route } from '@playwright/test';

const targetViewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

const primaryNavigationLabels = [
  'زنانه',
  'مردانه',
  'بچگانه',
  'اکسسوری',
  'جدیدترین‌ها',
  'کالکشن‌ها',
  'تخفیف',
] as const;

async function openPublicHome(page: Page) {
  page.setDefaultNavigationTimeout(15_000);
  const forbiddenRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      await route.abort();
      return;
    }

    if (request.method() !== 'GET') {
      forbiddenRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    if (url.pathname === '/v1/auth/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: null, meta: {} }),
      });
      return;
    }

    if (url.pathname === '/v1/cart') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            id: 'qa-public-shell-empty-cart',
            kind: 'GUEST',
            items: [],
            itemCount: 0,
            subtotalToman: 0,
            currency: 'IRR',
          },
          meta: {},
        }),
      });
      return;
    }

    if (url.pathname.startsWith('/v1/auth/') || url.pathname.startsWith('/v1/admin/')) {
      forbiddenRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort();
      return;
    }

    await route.continue();
  });

  const response = await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main h1#storefront-home-title')).toBeVisible();

  return forbiddenRequests;
}

for (const viewport of targetViewports) {
  test.describe(`public storefront shell ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('exposes semantic RTL landmarks and stays within the viewport', async ({ page }) => {
      const forbiddenRequests = await openPublicHome(page);

      await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

      const header = page.getByRole('banner');
      const main = page.getByRole('main');
      await expect(header).toHaveCount(1);
      await expect(main).toHaveCount(1);
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();

      await expect(
        header.getByRole('link', { name: 'NOVA، صفحه اصلی', exact: true }),
      ).toBeVisible();
      await expect(header.getByRole('button', { name: 'جست‌وجو', exact: true })).toBeVisible();
      await expect(header.getByRole('link', { name: /^سبد خرید، \d+ کالا$/ })).toBeVisible();

      const primaryNavigation = page.locator('nav.site-nav[aria-label="دسته‌بندی‌های اصلی"]');
      await expect(primaryNavigation).toHaveCount(1);
      const primaryNavigationLinks = primaryNavigation.locator('a');
      await expect(primaryNavigationLinks).toHaveCount(primaryNavigationLabels.length);
      for (const label of primaryNavigationLabels) {
        await expect(primaryNavigationLinks.filter({ hasText: label })).toHaveCount(1);
      }

      const quickNavigation = page.locator('nav.mobile-bottom-nav[aria-label="ناوبری سریع"]');
      await expect(quickNavigation).toHaveCount(1);
      const quickNavigationLinks = quickNavigation.locator('a');
      await expect(quickNavigationLinks).toHaveCount(5);
      for (const label of ['خانه', 'فروشگاه', 'جست‌وجو', 'سبد', 'حساب']) {
        await expect(quickNavigationLinks.filter({ hasText: label })).toHaveCount(1);
      }

      if (viewport.width === 390) {
        await expect(quickNavigation).toBeVisible();
        await expect(header.locator('button.site-header__menu')).toBeVisible();
      } else {
        await expect(quickNavigation).toBeHidden();
        await expect(header.locator('button.site-header__menu')).toBeHidden();
      }

      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(forbiddenRequests).toEqual([]);
    });
  });
}

test.describe('mobile public storefront navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('opens the labeled menu dialog and restores focus after Escape', async ({ page }) => {
    const forbiddenRequests = await openPublicHome(page);
    const menuButton = page.getByRole('button', { name: 'باز کردن منو', exact: true });

    await expect(menuButton).toBeVisible();
    await menuButton.focus();
    await page.keyboard.press('Enter');

    const menuDialog = page.getByRole('dialog', { name: 'منوی فروشگاه', exact: true });
    await expect(menuDialog).toBeVisible();
    await expect(menuDialog).toHaveAttribute('aria-modal', 'true');
    await expect(menuDialog.getByRole('button', { name: 'بستن منو', exact: true })).toBeFocused();
    await expect(menuDialog.getByRole('navigation')).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(menuDialog).toHaveCount(0);
    await expect(menuButton).toBeFocused();
    expect(forbiddenRequests).toEqual([]);
  });
});
