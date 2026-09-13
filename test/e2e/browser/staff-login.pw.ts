import { expect, test } from '@playwright/test';

const targetViewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

for (const viewport of targetViewports) {
  test.describe(`staff login ${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    test('keeps the expired-session state semantic and within the viewport', async ({ page }) => {
      page.setDefaultNavigationTimeout(15_000);
      let loginRequests = 0;

      page.on('request', (request) => {
        if (new URL(request.url()).pathname === '/v1/staff/auth/login') loginRequests += 1;
      });

      const response = await page.goto('/#admin/login?expired=1', {
        waitUntil: 'domcontentloaded',
      });

      expect(response?.ok()).toBeTruthy();
      await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('form')).toHaveCount(1);
      await expect(page.getByRole('heading', { name: 'ورود به فضای مدیریت' })).toBeVisible();
      await expect(page.getByRole('status')).toContainText('نشست مدیریت منقضی شده است');
      await expect(page.getByLabel('ایمیل سازمانی')).toBeVisible();
      await expect(page.getByLabel('رمز عبور')).toBeVisible();
      await expect(page.getByLabel('کد تأیید دومرحله‌ای یا کد بازیابی')).toBeVisible();

      const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
      }));

      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
      expect(loginRequests).toBe(0);
    });

    test('preserves the staff form keyboard order and reverse traversal', async ({ page }) => {
      page.setDefaultNavigationTimeout(15_000);
      const response = await page.goto('/#admin/login', { waitUntil: 'domcontentloaded' });

      expect(response?.ok()).toBeTruthy();
      const email = page.locator('#staff-email');
      const password = page.locator('#staff-password');
      const factor = page.locator('#staff-factor');
      const submit = page.getByRole('button', { name: 'ورود به پنل' });
      const returnLink = page.getByRole('link', { name: 'بازگشت به فروشگاه' });

      await email.focus();
      await page.keyboard.press('Tab');
      await expect(password).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(factor).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(submit).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(returnLink).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(submit).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(factor).toBeFocused();
    });
  });
}
