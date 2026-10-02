import { expect, test, type Page, type Route } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test.use({ viewport: { width: 1440, height: 1000 } });

const product = {
  id: 'product-1',
  slug: 'linen-overshirt',
  name: 'مانتوی لینن آوا',
  priceToman: 2490000,
  compareAtPriceToman: 2790000,
  available: true,
  imageUrl: '/assets/nova-product-linen-overshirt.webp',
  imageAlt: 'مانتوی لینن روشن',
  categories: [{ id: 'women', slug: 'women', name: 'زنانه' }],
  options: [
    {
      id: 'size',
      key: 'size',
      name: 'اندازه',
      sortOrder: 1,
      values: [
        { id: 'm', key: 'm', label: 'M', sortOrder: 1 },
        { id: 'l', key: 'l', label: 'L', sortOrder: 2 },
      ],
    },
  ],
  variants: [
    {
      id: 'variant-m',
      sku: 'NOVA-M',
      title: 'M',
      size: 'M',
      color: null,
      colorHex: null,
      priceToman: 2490000,
      compareAtPriceToman: 2790000,
      optionValueIds: ['m'],
      media: [],
      available: true,
    },
    {
      id: 'variant-l',
      sku: 'NOVA-L',
      title: 'L',
      size: 'L',
      color: null,
      colorHex: null,
      priceToman: 2490000,
      compareAtPriceToman: 2790000,
      optionValueIds: ['l'],
      media: [],
      available: false,
    },
  ],
  colors: [],
  stockStatus: 'IN_STOCK',
  shortDescription: 'رویه‌ای سبک برای روزهای روشن.',
  description: 'رویه‌ای سبک و خوش‌دوخت برای استفاده روزمره.',
  brand: 'NOVA',
  media: [],
  attributes: [],
} as const;

const cartLine = {
  id: 'line-1',
  variantId: 'variant-m',
  quantity: 2,
  available: true,
  productId: 'product-1',
  productSlug: 'linen-overshirt',
  productName: 'مانتوی لینن آوا',
  sku: 'NOVA-M',
  title: 'اندازه M',
  unitPriceToman: 2490000,
  compareAtPriceToman: 2790000,
  imageUrl: '/assets/nova-product-linen-overshirt.webp',
  imageAlt: 'مانتوی لینن روشن',
};

function envelope(data: unknown, status = 200) {
  return { status, contentType: 'application/json', body: JSON.stringify({ data, meta: {} }) };
}

async function installCatalogCartFixtures(page: Page) {
  let cartItems = [{ ...cartLine }];
  const unavailableProduct = {
    ...product,
    slug: 'unavailable-overshirt',
    name: 'مانتوی ناموجود آوا',
    available: false,
    options: [product.options[0]],
    variants: [product.variants[1]],
    stockStatus: 'OUT_OF_STOCK',
  };

  const currentCart = () => ({
    id: 'cart-browser-fixture',
    kind: 'GUEST',
    items: cartItems,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    subtotalToman: cartItems.reduce((sum, item) => sum + item.quantity * item.unitPriceToman, 0),
    currency: 'IRR',
  });

  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      await route.abort();
      return;
    }
    if (url.pathname === '/v1/auth/me') {
      await route.fulfill(envelope(null));
      return;
    }
    if (url.pathname === '/v1/analytics/events') {
      await route.fulfill({ status: 202, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.pathname === '/v1/catalog/categories') {
      await route.fulfill(
        envelope([{ id: 'women', slug: 'women', name: 'زنانه', parentId: null, sortOrder: 1 }]),
      );
      return;
    }
    if (url.pathname === '/v1/catalog/facets') {
      await route.fulfill(
        envelope({
          groups: [
            {
              key: 'size',
              label: 'اندازه',
              options: [{ value: 'M', label: 'M', count: 1, selected: false }],
            },
          ],
        }),
      );
      return;
    }
    if (url.pathname === '/v1/catalog/products/linen-overshirt') {
      await route.fulfill(envelope(product));
      return;
    }
    if (url.pathname === '/v1/catalog/products/unavailable-overshirt') {
      await route.fulfill(envelope(unavailableProduct));
      return;
    }
    if (url.pathname === '/v1/search' || url.pathname === '/v1/search/suggestions') {
      await route.fulfill(
        envelope(
          url.pathname.endsWith('suggestions')
            ? []
            : { items: [product], page: 1, limit: 8, total: 1 },
        ),
      );
      return;
    }
    if (url.pathname === '/v1/catalog/products') {
      await route.fulfill(
        envelope({
          items: [product],
          page: Number(url.searchParams.get('page') ?? 1),
          limit: Number(url.searchParams.get('limit') ?? 8),
          total: 1,
        }),
      );
      return;
    }
    if (url.pathname === '/v1/cart' && request.method() === 'GET') {
      await route.fulfill(envelope(currentCart()));
      return;
    }
    if (url.pathname === '/v1/cart/items' && request.method() === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        variantId?: string;
        quantity?: number;
      };
      const existing = cartItems.find((item) => item.variantId === body.variantId);
      if (existing) existing.quantity += body.quantity ?? 1;
      await route.fulfill(envelope(currentCart()));
      return;
    }
    if (url.pathname === '/v1/cart/items/variant-m' && request.method() === 'PATCH') {
      const body = JSON.parse(request.postData() ?? '{}') as { quantity?: number };
      cartItems = cartItems.map((item) => ({ ...item, quantity: body.quantity ?? item.quantity }));
      await route.fulfill(envelope(currentCart()));
      return;
    }
    if (url.pathname === '/v1/cart/items/variant-m' && request.method() === 'DELETE') {
      cartItems = [];
      await route.fulfill(envelope(currentCart()));
      return;
    }
    await route.continue();
  });
}

test('exercises populated catalog controls and product actions with fixtures', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  await installCatalogCartFixtures(page);

  await page.goto('/products', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'همه محصولات', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'مشاهده مانتوی لینن آوا' })).toBeVisible();
  await page.locator('.sort-control select').selectOption('price_desc');
  await expect(page).toHaveURL(/sort=price_desc/);
  await page.locator('.filter-select select').first().selectOption('women');
  await expect(page).toHaveURL(/category=women/);
  await page.getByRole('link', { name: 'حذف همه فیلترها' }).click();
  await expect(page).toHaveURL(/\/products$/);

  const wishlist = page.locator('.product-card').first().getByRole('button', {
    name: 'افزودن مانتوی لینن آوا به علاقه‌مندی‌ها',
  });
  await wishlist.click();
  await expect(
    page.locator('.product-card').first().getByRole('button', {
      name: 'حذف مانتوی لینن آوا از علاقه‌مندی‌ها',
    }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'افزودن مانتوی لینن آوا به سبد' }).click();
  await expect(page.getByText('«مانتوی لینن آوا» به سبد خرید اضافه شد')).toBeVisible();

  await page.screenshot({
    path: 'test-results/catalog-audit/catalog-desktop-populated.png',
    fullPage: true,
  });
});

async function loadMainImages(page: Page): Promise<void> {
  const images = page.locator('main img');
  for (let index = 0; index < (await images.count()); index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
      )
      .toBe(true);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

test('sweeps populated public catalog routes at desktop and phone sizes', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  await installCatalogCartFixtures(page);
  mkdirSync('test-results/ui-audit/catalog/desktop', { recursive: true });
  mkdirSync('test-results/ui-audit/catalog/mobile', { recursive: true });
  const routes = [
    ['/products', 'همه محصولات'],
    ['/products/new', 'تازه‌های آتلیه'],
    ['/products/sale', 'تخفیف‌های منتخب'],
    ['/products/accessories', 'همه محصولات'],
    ['/category/women', 'زنانه'],
    ['/product/linen-overshirt', 'مانتوی لینن آوا'],
    ['/cart', 'سبد خرید'],
    ['/search?q=linen', 'چه چیزی پیدا می‌کنید؟'],
  ] as const;

  for (const [viewportName, viewport] of [
    ['desktop', { width: 1440, height: 1000 }],
    ['mobile', { width: 390, height: 844 }],
  ] as const) {
    await page.setViewportSize(viewport);
    for (const [path, heading] of routes) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      if (path.startsWith('/search')) {
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('heading', { name: heading })).toBeVisible();
        await expect(
          dialog.getByRole('textbox', { name: 'جست‌وجوی محصول، دسته یا کالکشن' }),
        ).toHaveValue('linen');
      } else {
        await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
      }
      await expect(page.locator('main')).not.toContainText('در حال بارگذاری...');
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      // The search dialog makes the underlying page inert, so its background images are not
      // part of the active route's image-health check.
      if (!path.startsWith('/search')) await loadMainImages(page);
      await expect(page.locator('img').first()).toHaveAttribute('src', /.+/);
      await page.screenshot({
        path: `test-results/ui-audit/catalog/${viewportName}/${path
          .replace(/[^a-z0-9]+/gi, '-')
          .replace(/^-|-$/g, '')}.png`,
        fullPage: true,
      });
      if (!path.startsWith('/search')) {
        const imageHealth = await page
          .locator('main img')
          .evaluateAll((images: HTMLImageElement[]) =>
            images.map((image) => ({
              src: image.getAttribute('src'),
              complete: image.complete,
              naturalWidth: image.naturalWidth,
            })),
          );
        expect(
          imageHealth.every((image) => image.naturalWidth > 0),
          `${path}: ${JSON.stringify(imageHealth)}`,
        ).toBe(true);
      }
      if (path.startsWith('/search')) {
        await page
          .getByRole('dialog')
          .getByRole('textbox', { name: 'جست‌وجوی محصول، دسته یا کالکشن' })
          .press('Enter');
        await expect(page).toHaveURL(/\/products\?q=linen/);
      }
    }
  }
});

test('guards unavailable variants and prevents repeated pending add requests', async ({ page }) => {
  page.setDefaultNavigationTimeout(15_000);
  await installCatalogCartFixtures(page);
  await page.goto('/product/unavailable-overshirt', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'مانتوی ناموجود آوا', level: 1 })).toBeVisible();
  await expect(page.locator('.product-detail__add')).toBeDisabled();

  let addCalls = 0;
  let failNextAdd = true;
  await page.route('**/v1/cart/items', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    addCalls += 1;
    if (failNextAdd) {
      failNextAdd = false;
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE', message: 'unavailable' } }),
      });
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill(
      envelope({
        id: 'cart-pending',
        kind: 'GUEST',
        items: [],
        itemCount: 0,
        subtotalToman: 0,
        currency: 'IRR',
      }),
    );
  });
  await page.goto('/product/linen-overshirt', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'M' }).click();
  const add = page.getByRole('button', { name: 'افزودن به سبد خرید' });
  await add.click();
  await expect(page.getByRole('alert')).toContainText('unavailable');
  await add.click();
  await expect(add).toBeDisabled();
  await expect.poll(() => addCalls).toBe(2);
  await expect(page.getByText('به سبد خرید اضافه شد')).toBeVisible();
});

test('exercises product variant selection and cart quantity, remove, and checkout actions', async ({
  page,
}) => {
  page.setDefaultNavigationTimeout(15_000);
  await installCatalogCartFixtures(page);

  await page.goto('/product/linen-overshirt', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'مانتوی لینن آوا', level: 1 })).toBeVisible();
  await expect(
    page.locator('.product-detail__info').getByRole('button', {
      name: 'افزودن مانتوی لینن آوا به علاقه‌مندی‌ها',
    }),
  ).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', { name: 'انتخاب کنید' })).toBeDisabled();
  await page.getByRole('button', { name: 'M' }).click();
  await expect(page.getByRole('button', { name: 'افزودن به سبد خرید' })).toBeEnabled();
  await page.getByRole('button', { name: 'افزودن به سبد خرید' }).click();
  await expect(page.getByText('«مانتوی لینن آوا» به سبد خرید اضافه شد')).toBeVisible();

  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'سبد خرید', level: 1 })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'test-results/catalog-audit/cart-mobile-populated.png',
    fullPage: true,
  });
  await expect(page.locator('.quantity-stepper__value')).toHaveText('۳');
  await page.getByRole('button', { name: 'افزایش تعداد' }).click();
  await expect(page.locator('.quantity-stepper__value')).toHaveText('۴');
  await page.getByRole('button', { name: 'کاهش تعداد' }).click();
  await expect(page.locator('.quantity-stepper__value')).toHaveText('۳');
  await expect(page.getByText(/کد تخفیف در مرحله پرداخت/)).toBeVisible();
  await page.getByRole('link', { name: 'ادامه فرایند خرید' }).click();
  await expect(page).toHaveURL(/\/checkout\/address/);

  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'حذف مانتوی لینن آوا' }).click();
  await expect(page.getByRole('heading', { name: 'سبد خرید شما هنوز خالی است' })).toBeVisible();
});
