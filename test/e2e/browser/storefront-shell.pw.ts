import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 1440, height: 900 } });

test('renders the anonymous RTL storefront shell', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response?.ok()).toBeTruthy();
  await expect(page).toHaveTitle('NOVA | Atelier Editorial');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fa');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.locator('main h1#storefront-home-title')).toBeVisible();
});

test('renders public category, listing, and product routes', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);

  const routes = [
    { hash: '#category/men', heading: 'فرم‌های ساده، حضور ماندگار' },
    { hash: '#products/new', heading: 'تازه‌های آتلیه' },
  ] as const;

  for (const route of routes) {
    const response = await page.goto(`/${route.hash}`, { waitUntil: 'domcontentloaded' });

    if (response) expect(response.ok()).toBeTruthy();
    await expect(page.locator('main h1')).toContainText(route.heading);
  }

  const productResponse = await page.goto('/#product/linen-overshirt', {
    waitUntil: 'domcontentloaded',
  });

  if (productResponse) expect(productResponse.ok()).toBeTruthy();
  await expect(page.locator('main h1')).toBeVisible();
  await expect(page.locator('main h1')).not.toHaveText('این محصول پیدا نشد');
});

test('renders the empty anonymous cart shell', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  const response = await page.goto('/#cart', { waitUntil: 'domcontentloaded' });

  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main h1')).toHaveText('سبد خرید');
  await expect(page.locator('main h2')).toHaveText('سبد خرید شما هنوز خالی است');
});

test('recovers the cart shell through the visible retry action after a controlled API error', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  let allowCart = false;

  await page.route('**/v1/cart**', async (route) => {
    if (!allowCart) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'unavailable' } }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'browser-smoke-empty-cart',
          kind: 'GUEST',
          items: [],
          itemCount: 0,
          subtotalToman: 0,
          currency: 'IRR',
        },
        meta: {},
      }),
    });
  });

  const response = await page.goto('/#cart', { waitUntil: 'domcontentloaded' });

  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'سبد خرید بارگذاری نشد' })).toBeVisible({
    timeout: 15_000,
  });
  const retry = page.getByRole('button', { name: 'تلاش دوباره' });
  await expect(retry).toBeVisible();

  allowCart = true;
  await retry.click();
  await expect(page.locator('main h1')).toHaveText('سبد خرید');
  await expect(page.locator('main h2')).toHaveText('سبد خرید شما هنوز خالی است');
});

test('keeps protected admin navigation on the staff login form without credentials', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  let loginRequests = 0;

  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/v1/staff/auth/login') loginRequests += 1;
  });

  const response = await page.goto('/#admin/orders', { waitUntil: 'domcontentloaded' });

  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'ورود به فضای مدیریت' })).toBeVisible();
  await expect(page.locator('form')).toBeVisible();
  await expect(page.getByLabel('ایمیل سازمانی')).toBeVisible();
  await expect(page.getByLabel('رمز عبور')).toBeVisible();
  await expect(page.getByLabel('کد تأیید دومرحله‌ای یا کد بازیابی')).toBeVisible();
  expect(loginRequests).toBe(0);
});

test('validates an empty staff login client-side without sending credentials', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  let loginRequests = 0;

  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/v1/staff/auth/login') loginRequests += 1;
  });

  const response = await page.goto('/#admin/login?expired=1', { waitUntil: 'domcontentloaded' });

  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('status')).toContainText('نشست مدیریت منقضی شده است');

  await page.getByRole('button', { name: 'ورود به پنل' }).click();

  await expect(page.getByRole('alert')).toContainText('ایمیل سازمانی را وارد کنید.');
  await expect(page.locator('#staff-email')).toBeFocused();
  await expect(page.locator('#staff-email')).toHaveAttribute(
    'aria-describedby',
    'staff-email-error',
  );
  expect(loginRequests).toBe(0);
});

test('settles unauthenticated account and recovery routes without permanent loading', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);

  const sessionRoutes = [
    { hash: '#account/addresses', heading: 'برای دیدن آدرس‌های من وارد شوید' },
    { hash: '#order/NOPE', heading: 'برای دیدن جزئیات سفارش وارد شوید' },
    { hash: '#return/request?orderNumber=NOPE', heading: 'برای دیدن بازگشت کالا وارد شوید' },
  ] as const;

  for (const route of sessionRoutes) {
    const response = await page.goto(`/${route.hash}`, { waitUntil: 'domcontentloaded' });

    if (response) expect(response.ok()).toBeTruthy();
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
    await expect(page.locator('main [role="status"][aria-label*="در حال"]')).toHaveCount(0);
  }

  const recoveryRoutes = [
    { hash: '#checkout/payment-recovery', copy: 'شماره سفارش در لینک پرداخت وجود ندارد.' },
    { hash: '#checkout/confirmation', copy: 'شماره سفارش معتبر نیست.' },
  ] as const;

  for (const route of recoveryRoutes) {
    const response = await page.goto(`/${route.hash}`, { waitUntil: 'domcontentloaded' });

    if (response) expect(response.ok()).toBeTruthy();
    await expect(page.getByRole('alert')).toContainText(route.copy);
    await expect(page.locator('main [role="status"][aria-label*="در حال"]')).toHaveCount(0);
  }
});
