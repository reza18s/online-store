import { expect, test, type Page, type Route } from '@playwright/test';

const targetViewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
] as const;

async function openPublicHome(page: Page) {
  page.setDefaultNavigationTimeout(15_000);

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      await route.abort();
      return;
    }

    if (request.method() !== 'GET') {
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
            id: 'qa-accessibility-empty-cart',
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

    await route.continue();
  });

  const response = await page.goto('/#home', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main h1#storefront-home-title')).toBeVisible();
}

async function getUnnamedVisibleControls(page: Page) {
  return page
    .locator(
      [
        'button:visible',
        'a[href]:visible',
        'input:visible',
        'select:visible',
        'textarea:visible',
        '[role="button"]:visible',
        '[role="link"]:visible',
      ].join(', '),
    )
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          if (element.closest('[aria-hidden="true"], [inert]')) return false;

          const labelledBy = element.getAttribute('aria-labelledby');
          const labelledByText = labelledBy
            ? labelledBy
                .split(/\s+/)
                .map((id) => document.getElementById(id)?.textContent ?? '')
                .join(' ')
                .trim()
            : '';
          const ariaLabel = element.getAttribute('aria-label')?.trim() ?? '';
          const title = element.getAttribute('title')?.trim() ?? '';
          const id = element.getAttribute('id') ?? '';
          const associatedLabel = id
            ? Array.from(document.querySelectorAll('label')).find((label) => label.htmlFor === id)
                ?.textContent
            : '';
          const wrappingLabel = element.closest('label')?.textContent ?? '';
          const imageAlt = Array.from(element.querySelectorAll('img'))
            .map((image) => image.getAttribute('alt') ?? '')
            .join(' ');
          const value = element.getAttribute('value') ?? '';
          const placeholder = element.getAttribute('placeholder') ?? '';
          const text = element.textContent?.trim() ?? '';

          return ![
            labelledByText,
            ariaLabel,
            title,
            associatedLabel,
            wrappingLabel,
            imageAlt,
            value,
            placeholder,
            text,
          ].some(Boolean);
        })
        .map((element) => ({
          tagName: element.tagName.toLowerCase(),
          id: element.id,
          className: element.className,
        })),
    );
}

async function assertHomeAccessibility(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.getByRole('banner')).toHaveCount(1);
  await expect(page.getByRole('main')).toHaveCount(1);

  const headings = await page.locator('main :is(h1, h2, h3, h4, h5, h6)').evaluateAll((elements) =>
    elements.map((element) => ({
      level: Number(element.tagName.slice(1)),
      text: element.textContent?.trim() ?? '',
    })),
  );

  expect(headings.filter((heading) => heading.level === 1)).toHaveLength(1);
  expect(headings.every((heading) => heading.text.length > 0)).toBeTruthy();
  for (let index = 1; index < headings.length; index += 1) {
    expect(headings[index]!.level - headings[index - 1]!.level).toBeLessThanOrEqual(1);
  }

  const missingAlt = await page
    .locator('img:visible')
    .evaluateAll((images) =>
      images
        .filter((image) => !image.hasAttribute('alt'))
        .map((image) => image.getAttribute('src') ?? '<inline-image>'),
    );
  expect(missingAlt).toEqual([]);

  const unnamedControls = await getUnnamedVisibleControls(page);
  expect(unnamedControls).toEqual([]);

  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
}

for (const viewport of targetViewports) {
  test.describe(`accessibility smoke ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('keeps the public home semantic and operable', async ({ page }) => {
      await openPublicHome(page);
      await assertHomeAccessibility(page);

      const searchButton = page.getByRole('button', { name: 'جست‌وجو', exact: true });
      await searchButton.focus();
      await expect(searchButton).toBeFocused();
    });
  });
}

for (const viewport of [targetViewports[0], targetViewports[4]]) {
  test.describe(`reduced motion ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('disables smooth scrolling and long CSS motion durations', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openPublicHome(page);

      const motion = await page.evaluate(() => {
        const durationsToMilliseconds = (value: string) =>
          value.split(',').map((duration) => {
            const normalized = duration.trim();
            if (normalized.endsWith('ms')) return Number.parseFloat(normalized);
            if (normalized.endsWith('s')) return Number.parseFloat(normalized) * 1000;
            return 0;
          });
        const sample = document.querySelector('a, button');
        const style = sample ? getComputedStyle(sample) : null;

        return {
          scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
          transitionDurations: style ? durationsToMilliseconds(style.transitionDuration) : [],
          animationDurations: style ? durationsToMilliseconds(style.animationDuration) : [],
        };
      });

      expect(motion.scrollBehavior).toBe('auto');
      expect(Math.max(0, ...motion.transitionDurations)).toBeLessThanOrEqual(0.1);
      expect(Math.max(0, ...motion.animationDurations)).toBeLessThanOrEqual(0.1);
    });
  });
}
