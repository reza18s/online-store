import { expect, test, type Page, type Route } from '@playwright/test';

const targetViewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
] as const;

test.use({ storageState: { cookies: [], origins: [] } });

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
            id: 'qa-quantitative-empty-cart',
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

    if (url.pathname === '/v1/catalog/categories') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: {} }),
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
  test.describe(`header cart target ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('measures at least 44 CSS pixels high', async ({ page }) => {
      const blockedMutationRequests = await openPublicHome(page);
      const cartLink = page.getByRole('banner').getByRole('link', {
        name: /^سبد خرید، \d+ کالا$/,
      });

      await expect(cartLink).toBeVisible();
      const measurement = await cartLink.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { height: rect.height, width: rect.width };
      });

      expect(measurement.height).toBeGreaterThanOrEqual(44);
      expect(measurement.width).toBeGreaterThan(0);
      expect(blockedMutationRequests).toEqual([]);
    });
  });
}

test.describe('solid-background section eyebrow contrast', () => {
  test.use({ viewport: targetViewports[0] });

  test('meets the 4.5:1 normal-text threshold in the search panel', async ({ page }) => {
    const blockedMutationRequests = await openPublicHome(page);
    const searchTrigger = page.getByRole('banner').getByRole('button', {
      name: 'جست‌وجو',
      exact: true,
    });

    await searchTrigger.click();
    const searchDialog = page.getByRole('dialog', {
      name: 'چه چیزی پیدا می‌کنید؟',
      exact: true,
    });
    const eyebrow = searchDialog.locator('.search-dialog__top > div > .section-heading__eyebrow');

    await expect(eyebrow).toHaveCount(1);
    await expect(eyebrow).toBeVisible();

    const measurement = await eyebrow.evaluate((element) => {
      const parseColor = (value: string) => {
        const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (!match) throw new Error(`Unsupported rendered color: ${value}`);
        return {
          red: Number(match[1]),
          green: Number(match[2]),
          blue: Number(match[3]),
          alpha: match[4] === undefined ? 1 : Number(match[4]),
        };
      };
      const relativeLuminance = (color: ReturnType<typeof parseColor>) =>
        [color.red, color.green, color.blue]
          .map((channel) => channel / 255)
          .map((channel) =>
            channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
          )
          .reduce(
            (luminance, channel, index) => luminance + channel * [0.2126, 0.7152, 0.0722][index]!,
            0,
          );

      const panel = element.closest('.search-dialog');
      if (!panel) throw new Error('The eyebrow is not inside the solid search dialog panel.');

      const foreground = parseColor(getComputedStyle(element).color);
      const panelStyle = getComputedStyle(panel);
      const background = parseColor(panelStyle.backgroundColor);
      if (panelStyle.backgroundImage !== 'none') {
        throw new Error(
          'The contrast background must not use an image, gradient, or translucency.',
        );
      }

      const foregroundLuminance = relativeLuminance(foreground);
      const backgroundLuminance = relativeLuminance(background);
      const lighter = Math.max(foregroundLuminance, backgroundLuminance);
      const darker = Math.min(foregroundLuminance, backgroundLuminance);

      return {
        foreground: getComputedStyle(element).color,
        background: panelStyle.backgroundColor,
        foregroundAlpha: foreground.alpha,
        backgroundAlpha: background.alpha,
        backgroundImage: panelStyle.backgroundImage,
        contrastRatio: (lighter + 0.05) / (darker + 0.05),
      };
    });

    expect(measurement.foregroundAlpha).toBe(1);
    expect(measurement.backgroundAlpha).toBe(1);
    expect(measurement.backgroundImage).toBe('none');
    expect(measurement.contrastRatio).toBeGreaterThanOrEqual(4.5);
    expect(blockedMutationRequests).toEqual([]);
  });
});
