import type {
  CatalogAudience,
  CatalogCategory,
  CatalogFacetGroup,
  CatalogFacets,
  CatalogProduct,
  CatalogProductMedia,
  CatalogProductOption,
  CatalogProductPage,
  CatalogProductQuery,
  CatalogProductVariant,
  CatalogSearchSuggestion,
  CartLine,
  CartView,
  ContentPage,
} from '@nova/api-client';

/**
 * Local visual/demo data is deliberately enabled only in Vite development.
 * Production builds always use the API-backed query functions.
 */
export function isStorefrontFakeDataEnabled(): boolean {
  return import.meta.env.DEV;
}

const categoryBySlug: Record<string, CatalogCategory> = {
  women: { id: 'category-women', slug: 'women', name: 'زنانه' },
  men: { id: 'category-men', slug: 'men', name: 'مردانه' },
  children: { id: 'category-children', slug: 'children', name: 'بچگانه' },
  outerwear: { id: 'category-outerwear', slug: 'outerwear', name: 'رویه' },
  knitwear: { id: 'category-knitwear', slug: 'knitwear', name: 'بافت' },
  shirts: { id: 'category-shirts', slug: 'shirts', name: 'پیراهن' },
  trousers: { id: 'category-trousers', slug: 'trousers', name: 'شلوار' },
  accessories: { id: 'category-accessories', slug: 'accessories', name: 'اکسسوری' },
};

export const fakeCatalogCategories: CatalogCategory[] = Object.values(categoryBySlug);

type FakeCatalogProduct = CatalogProduct & {
  audience: CatalogAudience;
  material: string;
};

function sizeOptions(slug: string): CatalogProductOption[] {
  const values = ['S', 'M', 'L'].map((label, sortOrder) => ({
    id: `${slug}-size-${label.toLowerCase()}`,
    key: label.toLowerCase(),
    label,
    sortOrder,
  }));

  return [
    {
      id: `${slug}-size`,
      key: 'size',
      name: 'سایز',
      sortOrder: 0,
      values,
    },
  ];
}

function productMedia(imageUrl: string, imageAlt: string): CatalogProductMedia[] {
  return [
    { url: imageUrl, altText: imageAlt, kind: 'PRODUCT', sortOrder: 0 },
    { url: imageUrl, altText: `${imageAlt}، نمای نزدیک`, kind: 'DETAIL', sortOrder: 1 },
  ];
}

function productVariants(
  slug: string,
  priceToman: number,
  compareAtPriceToman: number | null,
  imageUrl: string,
  color: string,
  colorHex: string,
  sizes: CatalogProductOption["values"],
): CatalogProductVariant[] {
  return sizes.map((size, index) => ({
    id: `${slug}-variant-${size.key}`,
    sku: `NOVA-${slug.toUpperCase()}-${size.label}`,
    title: `${color} / ${size.label}`,
    size: size.label,
    color,
    colorHex,
    priceToman,
    compareAtPriceToman,
    optionValueIds: [size.id],
    media: [{ url: imageUrl, altText: `${slug} ${color}`, sortOrder: 0 }],
    available: index !== sizes.length - 1 || slug !== 'textured-scarf',
  }));
}

function makeProduct(input: {
  slug: string;
  name: string;
  audience: CatalogAudience;
  category: keyof typeof categoryBySlug;
  priceToman: number;
  compareAtPriceToman: number | null;
  imageUrl: string;
  imageAlt: string;
  color: string;
  colorHex: string;
  material: string;
  description: string;
}): FakeCatalogProduct {
  const options = sizeOptions(input.slug);
  const sizes = options[0]!.values;
  const variants = productVariants(
    input.slug,
    input.priceToman,
    input.compareAtPriceToman,
    input.imageUrl,
    input.color,
    input.colorHex,
    sizes,
  );
  const categories = [categoryBySlug[input.audience]!, categoryBySlug[input.category]!];

  return {
    id: `product-${input.slug}`,
    slug: input.slug,
    name: input.name,
    priceToman: input.priceToman,
    compareAtPriceToman: input.compareAtPriceToman,
    available: true,
    imageUrl: input.imageUrl,
    imageAlt: input.imageAlt,
    categories,
    options,
    variants,
    colors: [{ name: input.color, hex: input.colorHex }],
    stockStatus: input.slug === 'textured-scarf' ? 'LOW_STOCK' : 'IN_STOCK',
    shortDescription: input.description,
    description: input.description,
    brand: 'NOVA Atelier',
    media: productMedia(input.imageUrl, input.imageAlt),
    attributes: [
      { key: 'material', value: input.material },
      { key: 'care', value: 'شست‌وشوی ملایم و خشک‌کردن در سایه' },
    ],
    audience: input.audience,
    material: input.material,
  };
}

export const fakeCatalogProducts: FakeCatalogProduct[] = [
  makeProduct({
    slug: 'linen-overshirt',
    name: 'رویه لینن روشن',
    audience: 'women',
    category: 'outerwear',
    priceToman: 2_450_000,
    compareAtPriceToman: 2_950_000,
    imageUrl: '/assets/nova-product-linen-overshirt.webp',
    imageAlt: 'رویه لینن روشن نوا',
    color: 'کرم',
    colorHex: '#d8c3a6',
    material: 'لینن',
    description: 'یک رویه سبک و تنفس‌پذیر برای لایه‌سازی روزمره با برش آزاد.',
  }),
  makeProduct({
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد روزمره',
    audience: 'men',
    category: 'shirts',
    priceToman: 1_750_000,
    compareAtPriceToman: null,
    imageUrl: '/assets/nova-product-oxford-shirt.webp',
    imageAlt: 'پیراهن آکسفورد روزمره نوا',
    color: 'آبی مه‌آلود',
    colorHex: '#9aa9b0',
    material: 'نخ پنبه',
    description: 'پیراهنی با ساختار نرم، یقه تمیز و تناسبی که از صبح تا شب همراه می‌ماند.',
  }),
  makeProduct({
    slug: 'knit-cardigan',
    name: 'ژاکت بافت آرام',
    audience: 'women',
    category: 'knitwear',
    priceToman: 2_800_000,
    compareAtPriceToman: null,
    imageUrl: '/assets/nova-product-knit-cardigan.webp',
    imageAlt: 'ژاکت بافت آرام نوا',
    color: 'زیتونی',
    colorHex: '#7d8068',
    material: 'پشم و پنبه',
    description: 'بافتی سبک با حس دست‌ساز و رنگی که به‌سادگی با کمد شما هماهنگ می‌شود.',
  }),
  makeProduct({
    slug: 'soft-trousers',
    name: 'شلوار نرم روزانه',
    audience: 'men',
    category: 'trousers',
    priceToman: 2_200_000,
    compareAtPriceToman: 2_550_000,
    imageUrl: '/assets/nova-product-soft-trousers.webp',
    imageAlt: 'شلوار نرم روزانه نوا',
    color: 'ذغالی',
    colorHex: '#4a4845',
    material: 'تنسل',
    description: 'شلواری خوش‌فرم با کمر راحت و پارچه‌ای که برای حرکت طراحی شده است.',
  }),
  makeProduct({
    slug: 'textured-scarf',
    name: 'شال بافت‌دار خاکی',
    audience: 'women',
    category: 'accessories',
    priceToman: 980_000,
    compareAtPriceToman: null,
    imageUrl: '/assets/nova-product-textured-scarf.webp',
    imageAlt: 'شال بافت‌دار خاکی نوا',
    color: 'خاکی',
    colorHex: '#a9957e',
    material: 'پشم نرم',
    description: 'اکسسوری‌ای با بافت محسوس برای کامل‌کردن استایل‌های مینیمال.',
  }),
  makeProduct({
    slug: 'kids-play-set',
    name: 'ست بازی آزاد',
    audience: 'children',
    category: 'outerwear',
    priceToman: 1_650_000,
    compareAtPriceToman: null,
    imageUrl: '/assets/nova-product-kids-set.webp',
    imageAlt: 'ست بازی آزاد بچگانه نوا',
    color: 'زرد کره‌ای',
    colorHex: '#e7cb88',
    material: 'پنبه ارگانیک',
    description: 'ست راحت و مقاوم برای بازی، حرکت و روزهای طولانی بیرون از خانه.',
  }),
];

function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('fa-IR') : '';
}

function productIsOnSale(product: FakeCatalogProduct): boolean {
  return product.compareAtPriceToman !== null && product.compareAtPriceToman > product.priceToman;
}

function matchesProduct(product: FakeCatalogProduct, query: CatalogProductQuery): boolean {
  const search = normalizedText(query.q);
  const category = normalizedText(query.category);
  const size = normalizedText(query.size);
  const color = normalizedText(query.color);
  const material = normalizedText(query.material);

  return (
    (!search || normalizedText(`${product.name} ${product.slug}`).includes(search)) &&
    (!category || product.categories.some((item) => item.slug === category)) &&
    (!query.audience || product.audience === query.audience) &&
    (!size || product.variants.some((variant) => normalizedText(variant.size) === size)) &&
    (!color || product.colors.some((item) => normalizedText(item.name) === color)) &&
    (!material || normalizedText(product.material) === material) &&
    (query.minPrice === undefined || product.priceToman >= query.minPrice) &&
    (query.maxPrice === undefined || product.priceToman <= query.maxPrice) &&
    (!query.inStock || product.available) &&
    (!query.onSale || productIsOnSale(product))
  );
}

export function getFakeCatalogProducts(query: CatalogProductQuery = {}): CatalogProductPage {
  const matching = fakeCatalogProducts.filter((product) => matchesProduct(product, query));
  const sorted = [...matching].sort((left, right) => {
    switch (query.sort) {
      case 'price_asc':
        return left.priceToman - right.priceToman;
      case 'price_desc':
        return right.priceToman - left.priceToman;
      case 'name':
        return left.name.localeCompare(right.name, 'fa');
      default:
        return 0;
    }
  });
  const page = Number.isSafeInteger(query.page) && query.page! > 0 ? query.page! : 1;
  const limit = Number.isSafeInteger(query.limit) && query.limit! > 0 ? query.limit! : 24;
  const start = (page - 1) * limit;

  return { items: sorted.slice(start, start + limit), total: sorted.length, page, limit };
}

export function getFakeCatalogProduct(slug: string): CatalogProduct {
  const product = fakeCatalogProducts.find((candidate) => candidate.slug === slug.trim().toLowerCase());
  if (!product) throw new Error('محصول نمونه پیدا نشد.');
  return product;
}

export function getFakeCatalogFacets(query: CatalogProductQuery = {}): CatalogFacets {
  const groups: CatalogFacetGroup[] = [
    {
      key: 'size',
      label: 'سایز',
      options: ['S', 'M', 'L'].map((value) => ({
        value,
        label: value,
        count: fakeCatalogProducts.filter((product) =>
          product.variants.some((variant) => variant.size === value),
        ).length,
        selected: query.size === value,
      })),
    },
    {
      key: 'color',
      label: 'رنگ',
      options: fakeCatalogProducts.map((product) => ({
        value: product.colors[0]!.name,
        label: product.colors[0]!.name,
        count: fakeCatalogProducts.filter((candidate) => candidate.colors[0]?.name === product.colors[0]!.name).length,
        selected: query.color === product.colors[0]!.name,
        hex: product.colors[0]!.hex,
      })),
    },
    {
      key: 'material',
      label: 'جنس پارچه',
      options: [...new Set(fakeCatalogProducts.map((product) => product.material))].map((value) => ({
        value,
        label: value,
        count: fakeCatalogProducts.filter((product) => product.material === value).length,
        selected: query.material === value,
      })),
    },
  ];

  return { groups };
}

export function getFakeCatalogSuggestions(query: string, limit: number): CatalogSearchSuggestion[] {
  const search = normalizedText(query);
  if (!search) return [];
  return fakeCatalogProducts
    .filter((product) => normalizedText(`${product.name} ${product.slug}`).includes(search))
    .slice(0, Math.max(1, limit))
    .map((product) => ({
      type: 'PRODUCT',
      id: product.id,
      slug: product.slug,
      label: product.name,
      imageUrl: product.imageUrl,
      imageAlt: product.imageAlt,
    }));
}

function cartLineFor(product: FakeCatalogProduct, variant: CatalogProductVariant, quantity: number): CartLine {
  return {
    id: `cart-line-${variant.id}`,
    variantId: variant.id,
    quantity,
    available: variant.available,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    sku: variant.sku,
    title: variant.title,
    unitPriceToman: variant.priceToman ?? product.priceToman,
    compareAtPriceToman: variant.compareAtPriceToman,
    imageUrl: product.imageUrl,
    imageAlt: product.imageAlt,
  };
}

function recalculateCart(items: CartLine[]): CartView {
  return {
    id: 'fake-cart-nova',
    kind: 'GUEST',
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotalToman: items.reduce((total, item) => total + item.quantity * item.unitPriceToman, 0),
    currency: 'TOMAN',
  };
}

const initialCartItems = [
  cartLineFor(fakeCatalogProducts[0]!, fakeCatalogProducts[0]!.variants[1]!, 1),
  cartLineFor(fakeCatalogProducts[1]!, fakeCatalogProducts[1]!.variants[0]!, 2),
];
let fakeCart = recalculateCart(initialCartItems);

export function getFakeCart(): CartView {
  return { ...fakeCart, items: fakeCart.items.map((item) => ({ ...item })) };
}

export function mergeFakeCart(): CartView {
  return getFakeCart();
}

export function addFakeCartItem(variantId: string, quantity: number): CartView {
  const product = fakeCatalogProducts.find((candidate) =>
    candidate.variants.some((variant) => variant.id === variantId),
  );
  const variant = product?.variants.find((candidate) => candidate.id === variantId);
  if (!product || !variant) throw new Error('تنوع انتخاب‌شده در داده نمونه پیدا نشد.');

  const items = [...fakeCart.items];
  const existing = items.find((item) => item.variantId === variantId);
  if (existing) existing.quantity += quantity;
  else items.push(cartLineFor(product, variant, Math.max(1, quantity)));
  fakeCart = recalculateCart(items);
  return getFakeCart();
}

export function updateFakeCartItem(variantId: string, quantity: number): CartView {
  const items = fakeCart.items
    .map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  fakeCart = recalculateCart(items);
  return getFakeCart();
}

export function removeFakeCartItem(variantId: string): CartView {
  fakeCart = recalculateCart(fakeCart.items.filter((item) => item.variantId !== variantId));
  return getFakeCart();
}

const contentTitles: Record<string, string> = {
  about: 'لباس‌هایی برای زندگی واقعی',
  article: 'آرامش در جزئیات',
  campaign: 'فصل تازه، بافت‌های آشنا',
  'care-guide': 'مراقبت از لباس‌های نوا',
  contact: 'با آتلیه نوا در تماس باشید',
  content: 'مجله نوا',
  faq: 'پاسخ پرسش‌های شما',
  guide: 'راهنمای انتخاب آگاهانه',
  lookbook: 'لوک‌بوک فصل آرام',
  privacy: 'حریم خصوصی',
  'returns-policy': 'بازگشت، ساده و روشن',
  'shipping-policy': 'ارسال با دقت',
  'size-guide': 'راهنمای اندازه‌گیری',
  support: 'همراه شما هستیم',
  terms: 'شرایط استفاده',
  trust: 'اعتماد در هر دوخت',
};

export function getFakeContentPage(slug: string): ContentPage {
  const normalized = slug.trim().toLowerCase();
  const title = contentTitles[normalized] ?? 'روایت نوا';
  return {
    slug: normalized,
    title,
    body: 'در نوا، هر انتخاب با دقت و برای زندگی روزمره طراحی می‌شود؛ از لمس پارچه تا تجربه‌ای که بعد از خرید با شما می‌ماند.',
    blocks: [
      { kind: 'heading', sortOrder: 0, payload: { text: 'یک انتخاب آرام برای هر روز', level: 2 } },
      {
        kind: 'paragraph',
        sortOrder: 1,
        payload: {
          text: 'پارچه‌های خوش‌دست، فرم‌های ماندگار و جزئیاتی که قرار نیست برای دیده‌شدن فریاد بزنند. مجموعه‌های نوا برای ترکیب‌شدن با زندگی واقعی ساخته شده‌اند.',
        },
      },
      {
        kind: 'quote',
        sortOrder: 2,
        payload: { text: 'سادگی وقتی ارزشمند است که با دقت ساخته شده باشد.', cite: 'آتلیه نوا' },
      },
      { kind: 'link', sortOrder: 3, payload: { label: 'مشاهده انتخاب‌های تازه', href: '/#products/new' } },
    ],
  };
}
