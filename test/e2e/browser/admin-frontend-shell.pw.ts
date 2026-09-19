import { expect, test } from '@playwright/test';

import { parseE2eEndpoint } from '../run';

const adminEndpoint = parseE2eEndpoint(
  'NOVA_E2E_ADMIN_URL',
  process.env.NOVA_E2E_ADMIN_URL,
  'http://127.0.0.1:5174',
);

test('serves the standalone admin frontend shell', async ({ page }) => {
  const response = await page.goto(`${adminEndpoint.safeOrigin}/admin/login`, {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/NOVA Admin/);
  await expect(page.locator('.admin-login-page')).toBeVisible();
});
