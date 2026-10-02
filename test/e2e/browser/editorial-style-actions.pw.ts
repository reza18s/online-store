import { mkdir } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Isolate UI verification from provider availability and real writes.
const titles: Record<string, string> = {
  campaign: 'کالکشن پاییز',
  guide: 'راهنمای خرید',
  article: 'مجله نوا',
  lookbook: 'لوک‌بوک',
  about: 'درباره نوا',
  trust: 'اعتماد به نوا',
  'size-guide': 'راهنمای اندازه',
  'shipping-policy': 'راهنمای ارسال',
  'returns-policy': 'شرایط بازگشت',
  'care-guide': 'مراقبت از لباس',
  faq: 'پرسش‌های متداول',
  contact: 'تماس با نوا',
  privacy: 'حریم خصوصی',
  terms: 'شرایط استفاده',
  support: 'پشتیبانی',
};
const product = {
  id: 'editorial-product',
  slug: 'editorial-linen',
  name: 'رویه لینن منتشرشده',
  priceToman: 1250000,
  compareAtPriceToman: null,
  available: true,
  imageUrl: '/assets/nova-product-linen-overshirt.webp',
  imageAlt: 'رویه لینن',
  categories: [{ id: 'women', slug: 'women', name: 'زنانه' }],
  colors: [{ name: 'کرم', hex: '#d8c3a6' }],
  stockStatus: 'IN_STOCK',
  variants: [
    {
      id: 'editorial-variant',
      sku: 'QA-LINEN-M',
      title: 'کرم / M',
      size: 'M',
      color: 'کرم',
      colorHex: '#d8c3a6',
      available: true,
      priceToman: 1250000,
      compareAtPriceToman: null,
      optionValueIds: [],
      media: [],
    },
  ],
};

async function fixtures(page: Page) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) return route.abort();
    if (!url.pathname.startsWith('/v1/')) return route.continue();
    const envelope = (data: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data,
          meta: { requestId: 'ui-audit', timestamp: '2026-09-30T12:00:00Z' },
        }),
      });
    if (url.pathname === '/v1/auth/me') return envelope(null);
    if (url.pathname === '/v1/cart')
      return envelope({
        id: 'ui-audit-cart',
        kind: 'GUEST',
        items: [],
        itemCount: 0,
        subtotalToman: 0,
        currency: 'IRR',
      });
    if (url.pathname === '/v1/catalog/products')
      return envelope({ items: [product], total: 1, page: 1, limit: 8 });
    if (url.pathname === '/v1/search/suggestions') return envelope([]);
    if (url.pathname.startsWith('/v1/content/pages/')) {
      const slug = decodeURIComponent(url.pathname.split('/').at(-1)!);
      return envelope({
        slug,
        title: titles[slug] ?? 'محتوای نوا',
        body: 'متن منتشرشده این صفحه از سامانه محتوا دریافت شده است.',
        blocks: [
          { kind: 'heading', sortOrder: 0, payload: { text: 'بخش نخست منتشرشده', level: 2 } },
          {
            kind: 'paragraph',
            sortOrder: 1,
            payload: { text: 'توضیح نخست منتشرشده برای مشتریان.' },
          },
          { kind: 'heading', sortOrder: 2, payload: { text: 'بخش دوم منتشرشده', level: 2 } },
          {
            kind: 'paragraph',
            sortOrder: 3,
            payload: { text: 'توضیح دوم منتشرشده با جزئیات بیشتر.' },
          },
          {
            kind: 'link',
            sortOrder: 4,
            payload: { label: 'انتخاب‌های تازه', href: '/products/new' },
          },
        ],
      });
    }
    return route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        error: { code: 'NOT_FOUND', message: 'UI fixture has no matching resource' },
      }),
    });
  });
}

const viewports = [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
];
for (const viewport of viewports) {
  test.describe(`editorial and system UI ${viewport.width}`, () => {
    test.use({ viewport });
    for (const path of [
      '/',
      ...Object.keys(titles).map((slug) => `/${slug}`),
      '/content/custom-page',
      '/state/offline',
      '/state/error',
      '/state/maintenance',
      '/missing-page',
    ]) {
      test(`renders ${path} without overflow or broken imagery`, async ({ page }) => {
        await fixtures(page);
        await page.goto(path);
        await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
        if (path in titles || titles[path.slice(1)] || path.startsWith('/content/')) {
          await expect(page.getByRole('main')).toContainText('متن منتشرشده');
        }
        await expect(page.locator('main [aria-label="در حال بارگذاری محصولات"]')).toHaveCount(0);
        const broken = await page.locator('img:visible').evaluateAll(async (images) => {
          await Promise.all(
            images.map((image) => (image as HTMLImageElement).decode().catch(() => undefined)),
          );
          return images
            .filter((image) => !(image as HTMLImageElement).naturalWidth)
            .map((image) => image.getAttribute('src'));
        });
        expect(broken).toEqual([]);
        const widths = await page.evaluate(() => ({
          width: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        expect(widths.scroll).toBeLessThanOrEqual(widths.width);
        if (path === '/') {
          await expect(page.getByRole('button', { name: 'عضویت', exact: true })).toBeDisabled();
          await expect(page.getByText('عضویت خبرنامه در حال حاضر فعال نیست.').filter({ visible: true })).toBeVisible();
        }
        if (path === '/' && viewport.width < 768) {
          const menu = await page.getByRole('button', { name: 'باز کردن منو' }).boundingBox();
          const headerActions = await page.locator('.site-header__actions').boundingBox();
          const brand = await page.locator('.site-header .brand-lockup').boundingBox();
          expect(menu).not.toBeNull();
          expect(headerActions).not.toBeNull();
          expect(brand).not.toBeNull();
          expect(headerActions!.x + headerActions!.width).toBeLessThan(brand!.x);
          expect(menu!.x).toBeGreaterThan(brand!.x + brand!.width);

          const hero = await page.locator('.atelier-mobile-hero').boundingBox();
          const copy = await page.locator('.atelier-mobile-hero__copy').boundingBox();
          expect(hero).not.toBeNull();
          expect(copy).not.toBeNull();
          expect(copy!.y).toBeGreaterThanOrEqual(hero!.y);
          expect(copy!.y + copy!.height).toBeLessThanOrEqual(hero!.y + hero!.height);
          const storyColors = await page.locator('.atelier-mobile-story a').evaluate((link) => {
            const style = getComputedStyle(link);
            return { text: style.color, background: style.backgroundColor };
          });
          expect(storyColors.text).not.toBe(storyColors.background);
          const categoryLinks = page.locator('.atelier-mobile-categories > a');
          await expect(categoryLinks).toHaveCount(3);
          await expect(categoryLinks.nth(0)).toHaveAttribute('href', '/products/accessories');
          await expect(categoryLinks.nth(1)).toHaveAttribute('href', '/products/new');
          await expect(categoryLinks.nth(2)).toHaveAttribute('href', '/products/sale');
          const compactCard = page
            .locator('.atelier-mobile-products--compact .atelier-mobile-product--compact')
            .first();
          await expect(compactCard).toBeVisible();
          const media = await compactCard.locator('.atelier-mobile-product__media').boundingBox();
          const details = await compactCard.locator('.atelier-mobile-product__details').boundingBox();
          expect(media).not.toBeNull();
          expect(details).not.toBeNull();
          expect(media!.x + media!.width).toBeLessThanOrEqual(details!.x + 1);
        }
        const dir = `test-results/ui-audit/editorial/${viewport.width}`;
        await mkdir(dir, { recursive: true });
        await page.screenshot({
          path: `${dir}/${path === '/' ? 'home' : path.slice(1).replaceAll('/', '-')}.png`,
          fullPage: true,
        });
      });
    }

    test('privacy disclosures work with keyboard and published content', async ({ page }) => {
      await fixtures(page);
      await page.goto('/privacy');
      const details = page.locator('main details').nth(1);
      const summary = details.locator('summary');
      await expect(summary).toContainText('بخش دوم منتشرشده');
      await expect(details).not.toHaveAttribute('open', '');
      await summary.focus();
      await summary.press('Enter');
      await expect(details).toHaveAttribute('open', '');
      await expect(details).toContainText('توضیح دوم منتشرشده');
      await expect(details.getByRole('link', { name: 'انتخاب‌های تازه' })).toHaveAttribute(
        'href',
        '/products/new',
      );
      await summary.press('Enter');
      await expect(details).not.toHaveAttribute('open', '');
    });

    test('editorial products link to the actual catalog item and price', async ({ page }) => {
      await fixtures(page);
      await page.goto('/campaign');
      const rail = page.locator('.nova-editorial-product-rail');
      await expect(rail.getByRole('link', { name: /رویه لینن منتشرشده/ })).toHaveAttribute(
        'href',
        '/product/editorial-linen',
      );
      await expect(rail).toContainText('۱٬۲۵۰٬۰۰۰');
      await expect(rail).not.toContainText('۶٬۹۸۰٬۰۰۰');
    });
  });
}
