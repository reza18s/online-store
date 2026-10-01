import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { installAdminRouteFixtures } from './admin-route-fixtures';

const routes = [
  '/admin',
  '/admin/catalog',
  '/admin/catalog/categories',
  '/admin/catalog/products/new',
  '/admin/catalog/products/route-sweep-product',
  '/admin/inventory',
  '/admin/inventory/route-sweep-variant',
  '/admin/orders',
  '/admin/orders/ROUTE-SWEEP-ORDER',
  '/admin/payments',
  '/admin/customers',
  '/admin/notifications',
  '/admin/audit',
  '/admin/content',
  '/admin/content/pages/route-sweep-page',
  '/admin/content/seo',
  '/admin/content/redirects',
] as const;

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const) {
  test.describe(`admin route sweep ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('renders every AdminRouter family without overflow', async ({ page }) => {
      test.setTimeout(120_000);
      const unexpectedRequests = await installAdminRouteFixtures(page);
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const screenshotDirectory = join(
        process.cwd(),
        'test-results',
        'ui-audit',
        'admin',
        String(viewport.width),
      );
      mkdirSync(screenshotDirectory, { recursive: true });
      for (const route of routes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByRole('status', { name: /در حال/ })).toHaveCount(0);
        await expect(page.locator('main')).not.toContainText('دریافت اطلاعات انجام نشد');
        expect(pageErrors, route).toEqual([]);
        expect(unexpectedRequests, route).toEqual([]);
        if (route.includes('/inventory/')) {
          await expect(
            page.getByRole('heading', { name: 'محصول تست مسیر', exact: true }),
          ).toBeVisible();
          await expect(
            page.getByRole('heading', { name: 'اصلاح موجودی', exact: true }),
          ).toBeVisible();
        }
        if (route.endsWith('/route-sweep-product')) {
          await expect(page.getByLabel('نام محصول', { exact: true })).toHaveValue('محصول تست مسیر');
        }
        const dimensions = await page.evaluate(() => ({
          viewport: window.innerWidth,
          document: document.documentElement.scrollWidth,
          body: document.body.scrollWidth,
        }));
        expect(dimensions.document, route).toBeLessThanOrEqual(dimensions.viewport);
        expect(dimensions.body, route).toBeLessThanOrEqual(dimensions.viewport);
        await page.screenshot({
          path: join(
            screenshotDirectory,
            `${route.replaceAll('/', '_').replace(/^_/, '') || 'dashboard'}.png`,
          ),
          fullPage: true,
        });
      }
    });
  });
}
