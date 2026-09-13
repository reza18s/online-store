import { expect, test, type Page, type Route } from '@playwright/test';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const siteDescription = 'NOVA Store، فروشگاه پوشاک ایرانی برای انتخابی روشن و قابل اعتماد.';
const browserLocalFontStylesheet = {
  origin: 'https://fonts.googleapis.com',
  pathname: '/css2',
} as const;

const publishedSizeGuide = {
  slug: 'size-guide',
  title: 'راهنمای اندازه',
  body: 'اندازه‌گیری ساده برای انتخاب مطمئن‌تر.',
  blocks: [
    {
      kind: 'heading',
      payload: { text: 'چطور اندازه بگیریم؟', level: 2 },
      sortOrder: 0,
    },
    {
      kind: 'paragraph',
      payload: { text: 'قد و دور سینه را با آرامش اندازه بگیرید.' },
      sortOrder: 1,
    },
  ],
};

function isLoopbackHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
}

function jsonEnvelope(data: unknown): string {
  return JSON.stringify({
    data,
    meta: {
      requestId: 'public-content-seo-browser-test',
      timestamp: '2026-09-12T00:00:00.000Z',
    },
  });
}

async function installPublicContentFixtures(
  page: Page,
  contentStatuses: Record<string, number> = {},
): Promise<{
  blockedExternalRequests: string[];
  blockedMutationRequests: string[];
  contentRequests: string[];
}> {
  const blockedExternalRequests: string[] = [];
  const blockedMutationRequests: string[] = [];
  const contentRequests: string[] = [];

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
          id: 'public-content-seo-empty-cart',
          kind: 'GUEST',
          items: [],
          itemCount: 0,
          subtotalToman: 0,
          currency: 'IRR',
        }),
      });
      return;
    }

    const contentPrefix = '/v1/content/pages/';
    if (url.pathname.startsWith(contentPrefix)) {
      const slug = decodeURIComponent(url.pathname.slice(contentPrefix.length));
      contentRequests.push(slug);
      const status = contentStatuses[slug] ?? (slug === publishedSizeGuide.slug ? 200 : 404);

      if (status === 200 && slug === publishedSizeGuide.slug) {
        await route.fulfill({
          status,
          contentType: 'application/json',
          body: jsonEnvelope(publishedSizeGuide),
        });
        return;
      }

      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'NOT_FOUND',
            message: 'صفحه محتوا پیدا نشد.',
          },
        }),
      });
      return;
    }

    await route.continue();
  });

  return { blockedExternalRequests, blockedMutationRequests, contentRequests };
}

test.describe('SEO-001 public content route', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('renders the published size-guide hash route with client SEO metadata', async ({ page }) => {
    page.setDefaultNavigationTimeout(15_000);
    page.setDefaultTimeout(15_000);
    const { blockedExternalRequests, blockedMutationRequests, contentRequests } =
      await installPublicContentFixtures(page);

    const response = await page.goto('/#content/size-guide', { waitUntil: 'domcontentloaded' });

    expect(response?.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'راهنمای اندازه', level: 1 })).toBeVisible();
    await expect(page.getByRole('article', { name: 'محتوای منتشرشده' })).toContainText(
      'اندازه‌گیری ساده برای انتخاب مطمئن‌تر.',
    );
    await expect(page.getByRole('article', { name: 'محتوای منتشرشده' })).toContainText(
      'چطور اندازه بگیریم؟',
    );

    const origin = new URL(page.url()).origin;
    await expect(page).toHaveTitle('NOVA | محتوا');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      siteDescription,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `${origin}/content/size-guide`,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      `${origin}/content/size-guide`,
    );

    expect(contentRequests).toContain('size-guide');
    expect(blockedExternalRequests).toEqual([]);
    expect(blockedMutationRequests).toEqual([]);
  });

  test('keeps missing and non-published content on the safe public not-found state', async ({
    page,
  }) => {
    page.setDefaultNavigationTimeout(15_000);
    page.setDefaultTimeout(15_000);
    const { blockedExternalRequests, blockedMutationRequests, contentRequests } =
      await installPublicContentFixtures(page, {
        'draft-page': 404,
        'missing-page': 404,
      });

    for (const slug of ['missing-page', 'draft-page']) {
      const response = await page.goto(`/#content/${slug}`, { waitUntil: 'domcontentloaded' });

      if (response) expect(response.ok()).toBeTruthy();
      await expect(page.getByRole('heading', { name: 'این صفحه پیدا نشد', level: 1 })).toBeVisible({
        timeout: 15_000,
      });
      await expect(page.getByRole('alert')).toContainText(
        'این محتوا در حال حاضر منتشر نشده است یا مسیر آن تغییر کرده است.',
      );
      await expect(page.getByRole('link', { name: 'بازگشت به خانه', exact: true })).toHaveAttribute(
        'href',
        '#home',
      );
      await expect(page.getByRole('article', { name: 'محتوای منتشرشده' })).toHaveCount(0);
    }

    expect(contentRequests).toEqual(expect.arrayContaining(['missing-page', 'draft-page']));
    expect(blockedExternalRequests).toEqual([]);
    expect(blockedMutationRequests).toEqual([]);
  });
});
