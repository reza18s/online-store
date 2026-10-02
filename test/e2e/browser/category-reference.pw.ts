import { expect, test, type Page, type Route } from '@playwright/test';

const categories = [
  { id: 'women', slug: 'women', name: 'زنانه' },
  { id: 'men', slug: 'men', name: 'مردانه' },
  { id: 'children', slug: 'children', name: 'بچگانه' },
  { id: 'accessories', slug: 'accessories', name: 'اکسسوری' },
  { id: 'knitwear', slug: 'knitwear', name: 'بافت' },
  { id: 'outerwear', slug: 'outerwear', name: 'مانتو و رویه' },
  { id: 'trousers', slug: 'trousers', name: 'شلوار' },
  { id: 'shirts', slug: 'shirts', name: 'پیراهن' },
  { id: 'kidswear', slug: 'kidswear', name: 'لباس کودک' },
];

const facetOption = (value: string, label: string) => ({ value, label, count: 1, selected: false });

async function installCategoryFixtures(page: Page): Promise<void> {
  await page.route('**/*', async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(url.hostname)) {
      await route.abort();
      return;
    }
    if (request.method() === 'POST' && url.pathname === '/v1/analytics/events') {
      await route.fulfill({ status: 202, body: '{}' });
      return;
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      await route.abort();
      return;
    }
    if (url.pathname === '/v1/catalog/categories') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: categories, meta: {} }),
      });
      return;
    }
    if (url.pathname === '/v1/catalog/facets') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            groups: [
              { key: 'size', label: 'سایز', options: [facetOption('M', 'متوسط')] },
              { key: 'color', label: 'رنگ', options: [facetOption('navy', 'سرمه‌ای')] },
              { key: 'material', label: 'جنس', options: [facetOption('cotton', 'نخی')] },
            ],
          },
          meta: {},
        }),
      });
      return;
    }
    if (url.pathname === '/v1/catalog/products') {
      const audience = url.searchParams.get('audience') ?? 'women';
      const page = Number(url.searchParams.get('page') ?? '1');
      const audienceLabel =
        audience === 'women' ? 'زنانه' : audience === 'men' ? 'مردانه' : 'بچگانه';
      const items = [
        {
          slug: `${audience}-shirt`,
          name: `پیراهن ${audienceLabel}`,
          category: 'shirts',
          image: 'nova-product-oxford-shirt.webp',
        },
        {
          slug: `${audience}-knit`,
          name: `بافت ${audienceLabel}`,
          category: 'knitwear',
          image: 'nova-product-knit-cardigan.webp',
        },
        {
          slug: `${audience}-trousers`,
          name: `شلوار ${audienceLabel}`,
          category: 'trousers',
          image: 'nova-product-soft-trousers.webp',
        },
        {
          slug: `${audience}-linen`,
          name: `رویه لینن ${audienceLabel}`,
          category: 'outerwear',
          image: 'nova-product-linen-overshirt.webp',
        },
      ].map((item, index) => ({
        id: item.slug,
        slug: item.slug,
        name: item.name,
        priceToman: 1_890_000 + index * 100_000,
        compareAtPriceToman: null,
        available: true,
        imageUrl: `/assets/${item.image}`,
        imageAlt: item.name,
        categories: categories.filter(({ slug }) => slug === audience || slug === item.category),
        options: [],
        variants: [],
        colors: [{ name: 'سرمه‌ای', hex: '#25354b' }],
        stockStatus: 'IN_STOCK',
      }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { items, page, limit: 8, total: 9 }, meta: {} }),
      });
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
            id: 'empty',
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
}

async function loadVisibleProductImages(page: Page): Promise<void> {
  await page.locator('.product-card img').evaluateAll(async (images) => {
    await Promise.all(
      images.map(async (image) => {
        const productImage = image as HTMLImageElement;
        productImage.loading = 'eager';
        await productImage.decode();
      }),
    );
  });
}

test('category pages match their audience, real category links, and responsive hero structure', async ({
  page,
}) => {
  await installCategoryFixtures(page);
  const routes = [
    {
      path: '/category/women',
      label: 'زنانه',
      title: 'زنانه',
      ctaLabel: 'مشاهده مجموعه',
      quickCount: 0,
    },
    {
      path: '/category/men',
      label: 'مردانه',
      title: 'استایل مردانه',
      ctaLabel: 'مشاهده کالکشن',
      quickCount: 5,
    },
    {
      path: '/category/children',
      label: 'بچگانه',
      title: 'دنیای کوچک با داستان‌های بزرگ',
      ctaLabel: 'مشاهده مجموعه',
      quickCount: 0,
    },
  ] as const;

  for (const route of routes) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const response = await page.goto(route.path);
    expect(response?.ok()).toBeTruthy();
    await page.locator('.category-hero__image').evaluate((image) =>
      (image as HTMLImageElement).decode(),
    );
    await expect(page.locator('.product-card')).toHaveCount(4);
    await loadVisibleProductImages(page);
    await expect(page.getByRole('heading', { name: route.title, level: 1 })).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'دسته‌بندی‌های اصلی' })
        .getByRole('link', { name: route.label }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.category-hero .editorial-cta')).toHaveAttribute(
      'href',
      `/products/${route.path.split('/').at(-1)}`,
    );
    await expect(page.locator('.category-hero .editorial-cta')).toHaveText(route.ctaLabel);
    await expect(page.locator('.product-card')).toHaveCount(4);
    await page.screenshot({
      path: `test-results/ui-audit/category-reference/${route.label}-desktop.png`,
      fullPage: true,
    });
    if (route.label === 'زنانه') {
      await expect(page.locator('.category-hero__note')).toBeVisible();
      const heroImage = await page.locator('.category-hero__image').boundingBox();
      const editorialNote = await page.locator('.category-hero__note').boundingBox();
      expect(heroImage).not.toBeNull();
      expect(editorialNote).not.toBeNull();
      expect(editorialNote!.x).toBeGreaterThanOrEqual(heroImage!.x);
      expect(editorialNote!.x + editorialNote!.width).toBeLessThanOrEqual(
        heroImage!.x + heroImage!.width + 1,
      );
      await expect(
        page.getByText('مجموعه‌ای از لباس‌ها و استایل‌های زنانه برای روزهای واقعی شما.'),
      ).toBeVisible();
    }
    if (route.label === 'مردانه')
      await expect(page.locator('.category-hero__lead')).toHaveText('تعادل میان اصالت و امروز');
    if (route.quickCount) {
      await expect(page.locator('.category-quick-card')).toHaveCount(route.quickCount);
      const railCards = await page.locator('.category-quick-card').all();
      const visualOrder = await Promise.all(
        railCards.map(async (card) => ({
          label: await card.locator('span').innerText(),
          left: (await card.boundingBox())?.x ?? 0,
        })),
      );
      visualOrder.sort((left, right) => right.left - left.left);
      expect(visualOrder.map(({ label }) => label)).toEqual([
        'پیراهن',
        'شلوار',
        'مانتو و رویه',
        'بافت',
        'اکسسوری',
      ]);
    }
    if (route.label === 'مردانه')
      await expect(page.locator('.category-filter-rail')).toHaveCount(0);
    if (route.label !== 'مردانه') await expect(page.locator('.category-filter-rail')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'صفحه‌بندی محصولات' })).toBeVisible();
    if (route.label === 'زنانه') {
      const pagination = page.getByRole('navigation', { name: 'صفحه‌بندی محصولات' });
      await pagination.getByRole('link', { name: '۲', exact: true }).click();
      await expect(page).toHaveURL(/page=2/);
      await expect(pagination.getByRole('link', { name: '۲', exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      );
      const outerwear = page
        .locator('.category-filter-rail')
        .getByLabel('مانتو و رویه', { exact: true });
      await outerwear.click();
      await expect(page).toHaveURL(/category=outerwear/);
      await expect(outerwear).toBeChecked();
      const minPrice = page.getByLabel('حداقل قیمت');
      await minPrice.fill('1000000');
      await minPrice.blur();
      await expect(page).toHaveURL(/minPrice=1000000/);
    }
    if (route.label === 'بچگانه') {
      await expect(page.locator('.category-image-card')).toHaveCount(2);
      await expect(page.getByText('لباس‌های دخترانه', { exact: true })).toBeVisible();
      await expect(page.getByText('لباس‌های پسرانه', { exact: true })).toBeVisible();
      await expect(page.getByText('رنگ‌های لطیف برای خیال‌های بزرگ', { exact: true })).toBeVisible();
      const heroImage = await page.locator('.category-hero__image').boundingBox();
      const heroCopy = await page.locator('.category-hero__copy').boundingBox();
      expect(heroImage).not.toBeNull();
      expect(heroCopy).not.toBeNull();
      expect(heroCopy!.x + heroCopy!.width).toBeLessThanOrEqual(heroImage!.x + 1);
      await expect(page.locator('.category-image-card').nth(0)).toHaveAttribute(
        'href',
        '/products/children?category=children',
      );
      await expect(page.locator('.category-image-card').nth(1)).toHaveAttribute(
        'href',
        '/products/children?category=kidswear',
      );
    }
    const widths = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
    }));
    expect(widths.document).toBeLessThanOrEqual(widths.viewport);
  }
});

test('phone category actions open search and filters and preserve real catalog state in the URL', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await installCategoryFixtures(page);
  await page.goto('/category/women');
  const categoryMenu = await page.getByRole('button', { name: 'باز کردن منو' }).boundingBox();
  const categoryActions = await page.locator('.site-header__actions').boundingBox();
  const categoryBrand = await page.locator('.site-header .brand-lockup').boundingBox();
  expect(categoryMenu).not.toBeNull();
  expect(categoryActions).not.toBeNull();
  expect(categoryBrand).not.toBeNull();
  expect(categoryMenu!.x + categoryMenu!.width).toBeLessThan(categoryBrand!.x);
  expect(categoryActions!.x).toBeGreaterThan(categoryBrand!.x + categoryBrand!.width);
  await expect(page.locator('.category-hero__note')).toBeHidden();
  await expect(page.locator('.product-card')).toHaveCount(4);
  await loadVisibleProductImages(page);
  await page.locator('.category-hero__image').evaluate((image) =>
    (image as HTMLImageElement).decode(),
  );
  await page.screenshot({
    path: 'test-results/ui-audit/category-reference/women-phone-viewport.png',
  });
  await page.screenshot({
    path: 'test-results/ui-audit/category-reference/women-phone.png',
    fullPage: true,
  });
  await page.goto('/category/children');
  await expect(page.locator('.category-card-stack')).toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(4);
  await loadVisibleProductImages(page);
  await page.locator('.category-hero__image').evaluate((image) =>
    (image as HTMLImageElement).decode(),
  );
  await page.screenshot({
    path: 'test-results/ui-audit/category-reference/children-phone-viewport.png',
  });
  await page.screenshot({
    path: 'test-results/ui-audit/category-reference/children-phone.png',
    fullPage: true,
  });
  await page.goto('/category/men');
  await expect(page.locator('.product-card')).toHaveCount(4);
  await loadVisibleProductImages(page);
  await page.locator('.category-hero__image').evaluate((image) =>
    (image as HTMLImageElement).decode(),
  );
  await page.screenshot({
    path: 'test-results/ui-audit/category-reference/men-phone-viewport.png',
  });
  await page.screenshot({
    path: 'test-results/ui-audit/category-reference/men-phone.png',
    fullPage: true,
  });

  await page.getByRole('button', { name: 'باز کردن منو' }).click();
  const menu = page.getByRole('dialog', { name: 'منوی فروشگاه' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);

  await page.getByRole('button', { name: 'جست‌وجوی محصولات' }).click();
  await expect(page.getByRole('dialog', { name: 'چه چیزی پیدا می‌کنید؟' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'چه چیزی پیدا می‌کنید؟' })).toHaveCount(0);

  await page.getByRole('button', { name: 'فیلترها' }).click();
  const filters = page.getByRole('dialog', { name: 'فیلترها' });
  await expect(filters).toBeVisible();
  await filters.getByLabel('رنگ').selectOption('navy');
  await expect(page).toHaveURL(/color=navy/);
  await filters.getByRole('button', { name: 'بستن فیلترها' }).click();

  await page.getByLabel('مرتب‌سازی محصولات').selectOption('price_asc');
  await expect(page).toHaveURL(/sort=price_asc/);
  await expect(page.locator('.product-card__meta').first()).toContainText('پیراهن');
  await expect(page.locator('.product-card__add').first()).toHaveText('افزودن به سبد');
  const favorite = page.getByRole('button', { name: 'افزودن پیراهن مردانه به علاقه‌مندی‌ها' });
  await favorite.click();
  await expect(
    page.getByRole('button', { name: 'حذف پیراهن مردانه از علاقه‌مندی‌ها' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'افزودن پیراهن مردانه به سبد' }).click();
  await expect(page.getByRole('alert')).toHaveText('این محصول بدون انتخاب تنوع قابل افزودن نیست.');

  const widths = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(widths.document).toBeLessThanOrEqual(widths.viewport);
});
