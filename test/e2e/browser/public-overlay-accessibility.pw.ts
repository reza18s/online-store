import { expect, test, type Page, type Route } from '@playwright/test';

const targetViewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

function isLoopbackHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}

async function openPublicHome(page: Page): Promise<string[]> {
  page.setDefaultNavigationTimeout(15_000);
  const blockedMutationRequests: string[] = [];

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!isLoopbackHost(url.hostname)) {
      await route.abort();
      return;
    }

    if (request.method() !== 'GET') {
      blockedMutationRequests.push(`${request.method()} ${url.pathname}`);
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
            id: 'qa-public-overlay-empty-cart',
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

    if (url.pathname === '/v1/catalog/products') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { items: [], page: 1, limit: 8, total: 0 },
          meta: {},
        }),
      });
      return;
    }

    await route.continue();
  });

  const response = await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main h1#storefront-home-title')).toBeVisible();

  return blockedMutationRequests;
}

for (const viewport of targetViewports) {
  test.describe(`public search dialog accessibility ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport, storageState: { cookies: [], origins: [] } });

    test('opens from the labeled header control and keeps keyboard focus inside', async ({
      page,
    }) => {
      const blockedMutationRequests = await openPublicHome(page);
      const searchTrigger = page.getByRole('banner').getByRole('button', {
        name: 'جست‌وجو',
        exact: true,
      });

      await expect(searchTrigger).toBeVisible();
      await searchTrigger.focus();
      await page.keyboard.press('Enter');

      const searchDialog = page.getByRole('dialog', {
        name: 'چه چیزی پیدا می‌کنید؟',
        exact: true,
      });
      const searchInput = searchDialog.getByRole('textbox', {
        name: 'جست‌وجوی محصول، دسته یا کالکشن',
        exact: true,
      });
      const closeButton = searchDialog.getByRole('button', {
        name: 'بستن جست‌وجو',
        exact: true,
      });

      await expect(searchDialog).toBeVisible();
      await expect(searchDialog).toHaveAttribute('role', 'dialog');
      await expect(searchDialog).toHaveAttribute('aria-modal', 'true');
      await expect(searchDialog).toHaveAccessibleName('چه چیزی پیدا می‌کنید؟');
      await expect(searchInput).toBeFocused();

      await page.keyboard.press('Tab');
      await expect(closeButton).toBeFocused();
      expect(await searchDialog.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(
        true,
      );

      await page.keyboard.press('Tab');
      await expect(searchInput).toBeFocused();

      await page.keyboard.press('Shift+Tab');
      await expect(closeButton).toBeFocused();
      expect(await searchDialog.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(
        true,
      );

      await page.keyboard.press('Escape');
      await expect(searchDialog).toHaveCount(0);
      await expect(searchTrigger).toBeFocused();
      expect(blockedMutationRequests).toEqual([]);
    });
  });
}
