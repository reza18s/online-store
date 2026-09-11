import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import { Button } from '@nova/ui';
import { ApiClientError } from '@nova/api-client';
import type {
  AdminCatalogProductListItem,
  AdminCatalogProductStatus,
  AdminInventoryItem,
  AdminOrderSummary,
  CartView,
  CheckoutOrderStatus,
  CheckoutShippingMethod,
  CustomerAddress,
  CustomerAddressCreateInput,
  CustomerReturnReason,
  CustomerReturnRequestStatus,
} from '@nova/api-client';

import {
  useCreateCustomerAddress,
  useCustomerAddresses,
  useRemoveCustomerAddress,
  useSetCustomerAddressDefault,
  useUpdateCustomerAddress,
} from './features/addresses/addresses-api';
import {
  useAdminCatalogCategories,
  useAdminCatalogProducts,
  useStaffLogin,
  useStaffLogout,
  useStaffUser,
} from './features/admin/admin-catalog-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from './features/admin/admin-auth';
import { useAdminInventory } from './features/admin/admin-inventory-api';
import { useAdminOrders } from './features/admin/admin-orders-api';
import {
  useCurrentCustomer,
  useLogoutCustomer,
  useRequestCustomerOtp,
  useVerifyCustomerOtp,
} from './features/auth/auth-api';
import {
  useCustomerOrder,
  useCustomerOrders,
  useRequestCustomerOrderReturn,
} from './features/orders/orders-api';
import { useCheckoutQuote, useSubmitCheckout } from './features/checkout/checkout-api';
import { Icon, type IconName } from './shared/icon';
import {
  parseHashRoute,
  useHashRoute,
  useScrollToTop,
  type Audience,
  type PreviewState,
} from './shared/hash-route';
import { Header, Logo, MenuDrawer, MobileBottomNav, SearchDialog } from './shared/site-shell';
import {
  applySeoDocument,
  clientSeoForHashRoute,
  createSeoDocument,
  readInitialRenderContext,
} from './seo/metadata';
import {
  toStorefrontProduct,
  toStorefrontProductDetail,
  useCatalogCategories,
  useCatalogFacets,
  useCatalogProduct,
  useCatalogProducts,
  type CatalogFacetFilters,
  type CatalogFilters,
  type StorefrontProduct,
} from './features/catalog/catalog-api';
import { useContentPage } from './features/content/content-api';
import {
  useAddCartItem,
  useCart,
  getCartMergeConflicts,
  shouldMergeGuestCart,
  useMergeGuestCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from './features/cart/cart-api';

type Product = StorefrontProduct;

type Category = {
  label: string;
  href: string;
  icon: IconName;
};

const products: Product[] = [
  {
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    audience: 'women',
    category: 'مانتو و رویه',
    price: 2490000,
    compareAt: 2890000,
    image: '/assets/nova-product-linen-overshirt.webp',
    alt: 'مانتوی لینن روشن با کمربند پارچه‌ای',
    colors: ['#e6ddd0', '#a89b8d', '#272220'],
    tag: 'تازه‌وارد',
    stock: 'موجود',
  },
  {
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد مردانه',
    audience: 'men',
    category: 'پیراهن مردانه',
    price: 1890000,
    image: '/assets/nova-product-oxford-shirt.webp',
    alt: 'پیراهن آکسفورد آبی روشن',
    colors: ['#b7c7dc', '#263d68'],
    tag: 'پرفروش',
    stock: 'موجود',
  },
  {
    slug: 'kids-knit-set',
    name: 'ست دورس و شلوار کودک',
    audience: 'children',
    category: 'لباس کودک',
    price: 1690000,
    image: '/assets/nova-product-kids-set.webp',
    alt: 'ست دورس سبز زیتونی کودک',
    colors: ['#65705b', '#263026'],
    tag: 'سایزهای کامل',
    stock: 'موجود',
  },
  {
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    audience: 'women',
    category: 'اکسسوری',
    price: 890000,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
    colors: ['#e7ded2', '#9b8b78'],
    tag: 'اکسسوری',
    stock: 'موجود',
  },
  {
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    audience: 'women',
    category: 'شلوار',
    price: 1990000,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
    colors: ['#b1a394', '#292621'],
    stock: 'رو به اتمام',
  },
  {
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    audience: 'women',
    category: 'بافت',
    price: 2190000,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
    colors: ['#817464', '#44382d', '#d7cbbb'],
    tag: 'فصل تازه',
    stock: 'موجود',
  },
];

const categories: Category[] = [
  { label: 'زنانه', href: '#category/women', icon: 'dress' },
  { label: 'مردانه', href: '#category/men', icon: 'shirt' },
  { label: 'بچگانه', href: '#category/children', icon: 'users' },
  { label: 'اکسسوری', href: '#products/accessories', icon: 'bag' },
  { label: 'تازه‌ها', href: '#products/new', icon: 'sparkles' },
  { label: 'کالکشن‌ها', href: '#campaign', icon: 'book' },
  { label: 'تخفیف', href: '#products/sale', icon: 'tag' },
];

const audienceCopy: Record<
  Audience,
  { label: string; title: string; description: string; image: string }
> = {
  women: {
    label: 'زنانه',
    title: 'لباس‌هایی برای روزهای روشن',
    description: 'رویه‌های سبک، بافت‌های آرام و جزئیاتی که هر روز را شخصی‌تر می‌کنند.',
    image: '/assets/nova-women-lifestyle.webp',
  },
  men: {
    label: 'مردانه',
    title: 'فرم‌های ساده، حضور ماندگار',
    description: 'ترکیبی از برش دقیق، پارچه‌های خوش‌دست و رنگ‌هایی که به‌راحتی کنار هم می‌نشینند.',
    image: '/assets/nova-hero-men.webp',
  },
  children: {
    label: 'بچگانه',
    title: 'برای بازی‌های تمام‌نشدنی',
    description: 'لباس‌های راحت و مقاوم برای حرکت، کشف و روزهایی که باید آزاد باشند.',
    image: '/assets/nova-children-lifestyle.webp',
  },
};

function formatToman(amount: number) {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}

function resolveCompareAtPrice(
  activePriceToman: number,
  compareAtPriceToman: number | null | undefined,
): number | null {
  return compareAtPriceToman !== null &&
    compareAtPriceToman !== undefined &&
    compareAtPriceToman > activePriceToman
    ? compareAtPriceToman
    : null;
}

function formatPersianNumber(value: number) {
  return new Intl.NumberFormat('fa-IR').format(value);
}

function formatPersianDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'تاریخ نامشخص';
  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

const orderStatusCopy: Record<CheckoutOrderStatus, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  RETURNED: 'مرجوع شده',
};

const returnReasonCopy: Record<CustomerReturnReason, string> = {
  DAMAGED: 'کالا آسیب دیده است',
  INCORRECT_ITEM: 'کالای اشتباه ارسال شده است',
  DEFECTIVE: 'کالا ایراد دارد',
  SIZE_PREFERENCE: 'اندازه مناسب نیست',
  COLOR_PREFERENCE: 'رنگ یا ظاهر مطابق انتظار نیست',
  CHANGE_OF_MIND: 'تغییر نظر',
};

const returnRequestStatusCopy: Record<CustomerReturnRequestStatus, string> = {
  REQUESTED: 'در انتظار بررسی',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
  RECEIVED: 'کالا دریافت شده',
  REFUNDED: 'بازپرداخت شده',
  CANCELLED: 'لغو شده',
};

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError && error.payload?.error.message) {
    return error.payload.error.message;
  }
  return error instanceof Error ? error.message : fallback;
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: string;
  href?: string;
};

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  href = '#products',
}: SectionHeadingProps) {
  return (
    <div className="section-heading flex items-end justify-between gap-5">
      <div>
        {eyebrow ? <span className="section-heading__eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? (
        <a className="text-link" href={href}>
          {action}
          <Icon name="arrow-left" size={16} />
        </a>
      ) : null}
    </div>
  );
}

type ProductCardProps = {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: Product) => void;
};

function ProductCard({ product, isWishlisted, onToggleWishlist, onAdd }: ProductCardProps) {
  return (
    <article className="product-card min-w-0">
      <div className="product-card__media relative aspect-square overflow-hidden rounded-editorial bg-secondary">
        <a href={`#product/${product.slug}`} aria-label={`مشاهده ${product.name}`}>
          {product.image ? (
            <img src={product.image} alt={product.alt} loading="lazy" />
          ) : (
            <span
              className="flex h-full items-center justify-center text-muted-foreground"
              aria-label="تصویر محصول در دسترس نیست"
            >
              <Icon name="shirt" size={32} />
            </span>
          )}
        </a>
        <button
          className={`icon-button product-card__favorite ${isWishlisted ? 'is-selected' : ''}`}
          type="button"
          aria-label={
            isWishlisted
              ? `حذف ${product.name} از علاقه‌مندی‌ها`
              : `افزودن ${product.name} به علاقه‌مندی‌ها`
          }
          aria-pressed={isWishlisted}
          onClick={() => onToggleWishlist(product.slug)}
        >
          <Icon name="heart" size={17} />
        </button>
        {product.tag ? <span className="product-card__tag">{product.tag}</span> : null}
      </div>
      <div className="product-card__body pt-2.5">
        <div className="product-card__meta flex items-center justify-between gap-2">
          <span>{product.category}</span>
          <span className={product.stock === 'رو به اتمام' ? 'is-warning' : ''}>
            {product.stock}
          </span>
        </div>
        <a className="product-card__title" href={`#product/${product.slug}`}>
          {product.name}
        </a>
        <div className="product-card__footer flex items-end justify-between gap-2">
          <div className="product-card__price">
            {product.compareAt ? <del>{formatToman(product.compareAt)}</del> : null}
            <strong>{formatToman(product.price)}</strong>
          </div>
          <div className="product-card__purchase flex items-center gap-1.5">
            <div className="color-swatches" aria-label="رنگ‌های موجود">
              {product.colors.map((color) => (
                <span key={color} className="color-swatch" style={{ backgroundColor: color }} />
              ))}
            </div>
            <button
              className="quick-add inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 hover:-translate-y-px hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100"
              type="button"
              onClick={() => onAdd(product)}
              aria-label={
                product.available === false
                  ? `${product.name} ناموجود است`
                  : `افزودن ${product.name} به سبد`
              }
              disabled={product.available === false}
            >
              <Icon name="plus" size={17} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

type ProductGridProps = {
  items: Product[];
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: Product) => void;
  className?: string;
};

function ProductGrid({
  items,
  className = '',
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: ProductGridProps) {
  return (
    <div className={`product-grid grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 ${className}`}>
      {items.map((product) => (
        <ProductCard
          key={product.slug}
          product={product}
          isWishlisted={isWishlisted(product.slug)}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      ))}
    </div>
  );
}

function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="product-grid grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      role="status"
      aria-label="در حال بارگذاری محصولات"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="min-w-0 animate-pulse" key={index}>
          <div className="aspect-square rounded-editorial bg-secondary" />
          <div className="mt-3 h-3 w-2/5 rounded bg-secondary" />
          <div className="mt-2 h-4 w-4/5 rounded bg-secondary" />
          <div className="mt-3 h-3 w-1/2 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

function CatalogErrorState({ onRetry }: { onRetry: () => void }) {
  const offline = typeof navigator !== 'undefined' && !navigator.onLine;

  return (
    <section className="col-span-full border border-border bg-surface p-8 text-center" role="alert">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning">
        <Icon name={offline ? 'info' : 'warning'} size={22} />
      </span>
      <h3 className="mt-4 text-lg">
        {offline ? 'اتصال اینترنت برقرار نیست' : 'بارگذاری محصولات ممکن نشد'}
      </h3>
      <p className="mx-auto mt-2 max-w-[38ch] text-sm leading-7 text-muted-foreground">
        {offline
          ? 'اتصال خود را بررسی کنید و دوباره تلاش کنید.'
          : 'لطفاً چند لحظه بعد دوباره تلاش کنید.'}
      </p>
      <Button className="mt-5" type="button" variant="outline" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        تلاش دوباره
      </Button>
    </section>
  );
}

function CatalogGrid({
  query,
  items: providedItems,
  emptyTitle = 'محصولی برای نمایش پیدا نشد',
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: {
  query: ReturnType<typeof useCatalogProducts>;
  items?: Product[];
  emptyTitle?: string;
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: Product) => void;
}) {
  const items = providedItems ?? query.data?.items.map(toStorefrontProduct) ?? [];

  if (query.isPending && !items.length) return <ProductGridSkeleton />;
  if (query.isError && !items.length)
    return <CatalogErrorState onRetry={() => void query.refetch()} />;
  if (!items.length) {
    return (
      <section className="col-span-full border border-border bg-surface p-8 text-center">
        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
          <Icon name="layers" size={22} />
        </span>
        <h3 className="mt-4 text-lg">{emptyTitle}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          فیلترها را تغییر دهید یا از انتخاب‌های تازه نوا دیدن کنید.
        </p>
      </section>
    );
  }

  return (
    <ProductGrid
      items={items}
      isWishlisted={isWishlisted}
      onToggleWishlist={onToggleWishlist}
      onAdd={onAdd}
    />
  );
}

type HomeProps = Omit<ProductGridProps, 'items' | 'className'>;

function HomePage({ isWishlisted, onToggleWishlist, onAdd }: HomeProps) {
  const catalogQuery = useCatalogProducts({ limit: 8, sort: 'newest' });
  const catalogItems = catalogQuery.data?.items.map(toStorefrontProduct) ?? [];

  return (
    <>
      <main className="bg-background">
        <div className="shell home-page mx-auto w-[calc(100%-2rem)] max-w-[1280px]">
          <section
            className="hero-spread block gap-4 lg:grid lg:grid-cols-[minmax(0,2.05fr)_minmax(250px,0.86fr)]"
            aria-labelledby="hero-title"
          >
            <article className="hero-story flex flex-col overflow-hidden rounded-editorial border border-border bg-surface lg:grid">
              <div className="hero-story__copy flex flex-col justify-center">
                <span className="folio-mark">۰۱ / پاییز ۱۴۰۵</span>
                <p className="hero-story__kicker">نوا / کالکشن تازه</p>
                <h1 id="hero-title">جزئیات آرام، برای روزهای بلند</h1>
                <p>انتخابی از بافت‌های طبیعی، فرم‌های دقیق و رنگ‌هایی که با فصل همراه می‌شوند.</p>
                <a className="editorial-cta" href="#products/new">
                  مشاهده کالکشن
                  <Icon name="arrow-left" size={17} />
                </a>
              </div>
              <a
                className="hero-story__media relative overflow-hidden"
                href="#campaign"
                aria-label="مشاهده کالکشن پاییز"
              >
                <img
                  src="/assets/nova-women-lifestyle.webp"
                  alt="استایل پاییزی زنانه در فضای روشن و آرام"
                />
                <span className="image-caption">استودیو نوا / ۰۱</span>
              </a>
            </article>

            <div className="hero-support gap-4" aria-label="داستان‌های همراه کالکشن">
              <a className="support-card support-card--portrait" href="#category/men">
                <img
                  src="/assets/nova-hero-men.webp"
                  alt="استایل مردانه با کت چهارخانه در استودیو"
                />
                <span className="support-card__veil" />
                <span className="support-card__copy">
                  <span className="folio-mark">۰۲</span>
                  <strong>لایه‌هایی برای فصل تغییر</strong>
                  <span>مشاهده مردانه</span>
                </span>
              </a>
              <a className="support-card support-card--material" href="#article">
                <img src="/assets/nova-materials.webp" alt="بافت‌های طبیعی پارچه و نخ در کنار هم" />
                <span className="support-card__veil" />
                <span className="support-card__copy">
                  <span className="folio-mark">۰۳</span>
                  <strong>بافت‌هایی که لمس می‌شوند</strong>
                  <span>یادداشت متریال</span>
                </span>
              </a>
            </div>
          </section>

          <nav
            className="category-rail gap-2 border-y border-border"
            aria-label="میانبر دسته‌بندی‌ها"
          >
            {categories.map((category) => (
              <a key={category.href} className="category-rail__item" href={category.href}>
                <span className="category-rail__icon">
                  <Icon name={category.icon} size={24} />
                </span>
                <span>{category.label}</span>
              </a>
            ))}
          </nav>

          <section className="home-section" aria-labelledby="arrivals-title">
            <SectionHeading
              eyebrow="۰۲ / انتخاب‌های تازه"
              title="تازه‌های آتلیه"
              description="قطعاتی که برای پوشیدن امروز، و ماندن در کمد فردا انتخاب شده‌اند."
              action="مشاهده همه"
              href="#products/new"
            />
            <CatalogGrid
              query={catalogQuery}
              items={catalogItems.slice(0, 4)}
              isWishlisted={isWishlisted}
              onToggleWishlist={onToggleWishlist}
              onAdd={onAdd}
            />
          </section>

          <section
            className="collection-story border border-border bg-surface lg:grid"
            aria-labelledby="story-title"
          >
            <div className="collection-story__media">
              <img
                src="/assets/nova-materials.webp"
                alt="پارچه‌های طبیعی با رنگ‌های خنثی در استودیو"
                loading="lazy"
              />
              <span className="image-caption">جزئیات / متریال</span>
            </div>
            <div className="collection-story__copy">
              <span className="folio-mark">۰۳ / یادداشت آتلیه</span>
              <h2 id="story-title">بافت‌ها، از نزدیک</h2>
              <p>
                ما به جزئیاتی فکر می‌کنیم که دیده نمی‌شوند؛ از انتخاب پارچه‌ای که نرم‌تر می‌شود تا
                دوختی که با هر بار پوشیدن، دقیق‌تر می‌نشیند.
              </p>
              <a className="text-link" href="#article">
                خواندن داستان پارچه‌ها
                <Icon name="arrow-left" size={16} />
              </a>
            </div>
          </section>

          <section className="home-section" aria-labelledby="bestsellers-title">
            <SectionHeading
              eyebrow="۰۴ / انتخاب‌های ماندگار"
              title="محبوب‌های نوا"
              description="مدل‌هایی که بیشتر از یک فصل با شما همراه می‌شوند."
              action="مشاهده همه"
              href="#products"
            />
            <CatalogGrid
              query={catalogQuery}
              items={catalogItems.length > 2 ? catalogItems.slice(2, 6) : catalogItems.slice(0, 4)}
              isWishlisted={isWishlisted}
              onToggleWishlist={onToggleWishlist}
              onAdd={onAdd}
            />
          </section>

          <TrustStrip />
          <Newsletter />
        </div>
      </main>
      <Footer />
    </>
  );
}

function TrustStrip() {
  const items = [
    { icon: 'truck' as IconName, title: 'ارسال سریع', copy: 'ارسال به سراسر ایران' },
    { icon: 'rotate' as IconName, title: '۷ روز ضمانت بازگشت', copy: 'خریدی مطمئن و بدون نگرانی' },
    { icon: 'users' as IconName, title: 'پشتیبانی', copy: 'پاسخ‌گوی سوال‌های شما هستیم' },
  ];

  return (
    <section className="trust-strip border-y border-border" aria-label="خدمات نوا">
      {items.map((item) => (
        <div className="trust-strip__item" key={item.title}>
          <Icon name={item.icon} size={26} />
          <div>
            <strong>{item.title}</strong>
            <span>{item.copy}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

function Newsletter() {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="newsletter bg-secondary lg:grid" aria-labelledby="newsletter-title">
      <div className="newsletter__image">
        <img
          src="/assets/nova-materials.webp"
          alt="گلدان و کتاب در فضای آرام آتلیه"
          loading="lazy"
        />
      </div>
      <div className="newsletter__copy">
        <span className="section-heading__eyebrow">دفترچه آتلیه نوا</span>
        <h2 id="newsletter-title">خبرنامه آتلیه نوا</h2>
        <p>
          اولین نفری باشید که از کالکشن‌های جدید، یادداشت‌های متریال و پیشنهادهای اختصاصی ما باخبر
          می‌شوید.
        </p>
        {submitted ? (
          <div className="inline-message inline-message--success" role="status">
            <Icon name="check" size={16} />
            ایمیل شما ثبت شد؛ به‌زودی از نوا می‌شنوید.
          </div>
        ) : (
          <form
            className="newsletter__form"
            onSubmit={(event) => {
              event.preventDefault();
              if (value.trim()) setSubmitted(true);
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              ایمیل شما
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="ایمیل خود را وارد کنید"
              required
              dir="ltr"
            />
            <Button type="submit" size="sm">
              عضویت
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer border-t border-border bg-surface">
      <div className="shell site-footer__grid mx-auto w-[calc(100%-2rem)] max-w-[1280px] grid gap-7">
        <div className="site-footer__brand">
          <Logo />
          <p>نوا، انتخابی برای پوشیدن، زندگی کردن و ماندن.</p>
          <div className="footer-socials">
            <a className="icon-button" href="#contact" aria-label="اینستاگرام نوا">
              <Icon name="instagram" size={17} />
            </a>
            <a className="icon-button" href="#contact" aria-label="تماس با نوا">
              <Icon name="send" size={17} />
            </a>
          </div>
        </div>
        <div>
          <h3>درباره نوا</h3>
          <a href="#about">درباره ما</a>
          <a href="#article">آتلیه</a>
          <a href="#trust">اعتماد و اصالت</a>
          <a href="#contact">تماس با ما</a>
        </div>
        <div>
          <h3>راهنمای خرید</h3>
          <a href="#guide">راهنمای انتخاب</a>
          <a href="#size-guide">راهنمای اندازه</a>
          <a href="#shipping-policy">ارسال و تحویل</a>
          <a href="#returns-policy">بازگشت کالا</a>
        </div>
        <div>
          <h3>فروشگاه</h3>
          <a href="#category/women">زنانه</a>
          <a href="#category/men">مردانه</a>
          <a href="#category/children">بچگانه</a>
          <a href="#products/accessories">اکسسوری</a>
        </div>
      </div>
      <div className="shell site-footer__bottom">
        <span>تمامی حقوق برای نوا محفوظ است.</span>
        <span dir="ltr">NOVA / 1405</span>
      </div>
    </footer>
  );
}

type ListingProps = HomeProps & {
  audience?: Audience;
  mode?: string;
  queryString?: string;
};

function CategoryPage({ audience, isWishlisted, onToggleWishlist, onAdd }: ListingProps) {
  const currentAudience = audience ?? 'women';
  const copy = audienceCopy[currentAudience];
  const catalogQuery = useCatalogProducts({ audience: currentAudience, limit: 4, sort: 'newest' });

  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <span>{copy.label}</span>
      </div>
      <section className="category-hero">
        <img src={copy.image} alt={`تصویر ادیتوریال دسته ${copy.label}`} />
        <div className="category-hero__copy">
          <span className="folio-mark">کالکشن / {copy.label}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <a className="editorial-cta" href={`#products/${currentAudience}`}>
            مشاهده محصولات
            <Icon name="arrow-left" size={17} />
          </a>
        </div>
      </section>
      <section className="subcategories" aria-label={`زیر دسته‌های ${copy.label}`}>
        {['تازه‌ها', 'پرفروش‌ها', 'بافت و رویه', 'شلوار', 'راهنمای اندازه'].map((item) => (
          <a
            href={item === 'راهنمای اندازه' ? '#size-guide' : `#products/${currentAudience}`}
            key={item}
          >
            <span>{item}</span>
            <Icon name="arrow-left" size={16} />
          </a>
        ))}
      </section>
      <section className="home-section">
        <SectionHeading
          title={`انتخاب‌های محبوب ${copy.label}`}
          action="مشاهده همه"
          href={`#products/${currentAudience}`}
        />
        <CatalogGrid
          query={catalogQuery}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
          emptyTitle={`هنوز محصولی در دسته ${copy.label} منتشر نشده است`}
        />
      </section>
      <section className="guide-callout">
        <div>
          <span className="section-heading__eyebrow">راهنمای انتخاب</span>
          <h2>سایز درست، حس درست</h2>
          <p>
            برای هر مدل، اندازه‌گیری و پیشنهاد فیت را کنار مشخصات محصول گذاشته‌ایم تا با خیال راحت
            انتخاب کنید.
          </p>
        </div>
        <a className="text-link" href="#size-guide">
          مشاهده راهنمای اندازه <Icon name="arrow-left" size={16} />
        </a>
      </section>
    </main>
  );
}

function ProductsPage({
  audience,
  mode,
  queryString = '',
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: ListingProps) {
  const searchParams = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const basePath = audience ? `#products/${audience}` : mode ? `#products/${mode}` : '#products';
  const selectedCategory = searchParams.get('category') ?? '';
  const selectedSize = searchParams.get('size') ?? '';
  const selectedColor = searchParams.get('color') ?? '';
  const selectedMaterial = searchParams.get('material') ?? '';
  const selectedSort = searchParams.get('sort') ?? 'newest';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const minPrice = Number(searchParams.get('minPrice') ?? '') || undefined;
  const maxPrice = Number(searchParams.get('maxPrice') ?? '') || undefined;
  const inStock = searchParams.get('inStock') === 'true';
  const onSale = searchParams.get('onSale') === 'true';
  const effectiveCategory = mode === 'accessories' ? 'accessories' : selectedCategory || undefined;
  const effectiveOnSale = mode === 'sale' || onSale ? true : undefined;
  const displayedCategory = effectiveCategory ?? '';
  const categoryQuery = useCatalogCategories();
  const sort = ['newest', 'price_asc', 'price_desc', 'name'].includes(selectedSort)
    ? (selectedSort as CatalogFilters['sort'])
    : 'newest';
  const catalogFilters = useMemo<CatalogFilters>(
    () => ({
      q: searchParams.get('q') || undefined,
      category: effectiveCategory,
      audience,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      material: selectedMaterial || undefined,
      minPrice,
      maxPrice,
      inStock: inStock ? true : undefined,
      onSale: effectiveOnSale,
      sort,
      page,
      limit: 8,
    }),
    [
      audience,
      effectiveCategory,
      effectiveOnSale,
      inStock,
      maxPrice,
      minPrice,
      page,
      searchParams,
      selectedColor,
      selectedMaterial,
      selectedSize,
      sort,
    ],
  );
  const catalogQuery = useCatalogProducts(catalogFilters);
  const catalogFacetFilters = useMemo<CatalogFacetFilters>(
    () => ({
      q: searchParams.get('q') || undefined,
      category: effectiveCategory,
      audience,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      material: selectedMaterial || undefined,
      minPrice,
      maxPrice,
      inStock: inStock ? true : undefined,
      onSale: effectiveOnSale,
    }),
    [
      audience,
      effectiveCategory,
      effectiveOnSale,
      inStock,
      maxPrice,
      minPrice,
      searchParams,
      selectedColor,
      selectedMaterial,
      selectedSize,
    ],
  );
  const facetsQuery = useCatalogFacets(catalogFacetFilters);

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileFiltersOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileFiltersOpen]);

  const buildHref = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    let shouldResetPage = false;

    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
      if (key !== 'page') shouldResetPage = true;
    }

    if (shouldResetPage) next.delete('page');
    const query = next.toString();
    return `${basePath}${query ? `?${query}` : ''}`;
  };

  const categoryOptions = useMemo(() => {
    const options = (categoryQuery.data ?? []).map((category) => ({
      label: category.name,
      value: category.slug,
    }));
    if (displayedCategory && !options.some((option) => option.value === displayedCategory)) {
      options.push({ label: displayedCategory, value: displayedCategory });
    }
    return [{ label: 'همه', value: undefined }, ...options];
  }, [categoryQuery.data, displayedCategory]);
  const facetSelectOptions = (
    key: 'size' | 'color' | 'material',
    selected: string,
    emptyLabel: string,
  ) => {
    const options = facetsQuery.data?.groups.find((group) => group.key === key)?.options ?? [];
    const selectedOption = selected ? options.find((option) => option.selected) : undefined;
    const visibleOptions = options.map((option) =>
      option === selectedOption ? { label: option.label, value: selected } : option,
    );

    if (
      selected &&
      !selectedOption &&
      !visibleOptions.some((option) => option.value === selected)
    ) {
      visibleOptions.unshift({ label: selected, value: selected });
    }

    return [{ label: emptyLabel, value: '' }, ...visibleOptions];
  };
  const sizeOptions = facetSelectOptions('size', selectedSize, 'همه اندازه‌ها');
  const colorOptions = facetSelectOptions('color', selectedColor, 'همه رنگ‌ها');
  const materialOptions = facetSelectOptions('material', selectedMaterial, 'همه متریال‌ها');
  const activeFilterCount = [
    selectedCategory,
    selectedSize,
    selectedColor,
    selectedMaterial,
    minPrice,
    maxPrice,
    inStock,
    onSale,
  ].filter(Boolean).length;
  const filterPanel = (
    <div>
      <div className="filter-group">
        <span>دسته‌بندی</span>
        {categoryQuery.isPending && !categoryQuery.data ? (
          <span className="text-xs text-muted-foreground">در حال بارگذاری دسته‌ها...</span>
        ) : null}
        {categoryQuery.isError && !categoryQuery.data ? (
          <span className="text-xs text-warning">دسته‌بندی‌ها در دسترس نیستند.</span>
        ) : null}
        {facetsQuery.isPending && !facetsQuery.data ? (
          <span className="text-xs text-muted-foreground">در حال بارگذاری گزینه‌های فیلتر...</span>
        ) : null}
        {facetsQuery.isError && !facetsQuery.data ? (
          <span className="text-xs text-warning">گزینه‌های فیلتر در دسترس نیستند.</span>
        ) : null}
        {categoryOptions.map((item) => {
          const value = item.value ?? '';
          const selected = displayedCategory === value;
          return (
            <a
              className={`flex min-h-[34px] w-full items-center justify-between px-2 text-start text-xs transition-colors ${selected ? 'bg-accent-soft text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
              href={buildHref({ category: item.value })}
              aria-current={selected ? 'page' : undefined}
              key={item.label}
            >
              {item.label}
              {item.value ? (
                <span className="font-latin text-[10px] text-muted-foreground">
                  {item.value === audience ? 'این بخش' : ''}
                </span>
              ) : null}
            </a>
          );
        })}
      </div>
      <div className="filter-group filter-group--compact">
        <label className="grid gap-2 text-xs font-semibold">
          اندازه
          <select
            className="min-h-10 w-full border border-border bg-surface px-2 text-xs font-normal outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={selectedSize}
            onChange={(event) => {
              window.location.hash = buildHref({ size: event.target.value }).slice(1);
            }}
          >
            {sizeOptions.map((item) => (
              <option value={item.value} key={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-group filter-group--compact">
        <label className="grid gap-2 text-xs font-semibold">
          رنگ
          <select
            className="min-h-10 w-full border border-border bg-surface px-2 text-xs font-normal outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={selectedColor}
            onChange={(event) => {
              window.location.hash = buildHref({ color: event.target.value }).slice(1);
            }}
          >
            {colorOptions.map((item) => (
              <option value={item.value} key={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="filter-group filter-group--compact">
        <label className="grid gap-2 text-xs font-semibold">
          متریال
          <select
            className="min-h-10 w-full border border-border bg-surface px-2 text-xs font-normal outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={selectedMaterial}
            onChange={(event) => {
              window.location.hash = buildHref({ material: event.target.value }).slice(1);
            }}
          >
            {materialOptions.map((item) => (
              <option value={item.value} key={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <form
        className="filter-group grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const next = new URLSearchParams(searchParams);
          for (const key of ['minPrice', 'maxPrice']) {
            const value = String(formData.get(key) ?? '').trim();
            if (value) next.set(key, value);
            else next.delete(key);
          }
          next.delete('page');
          const query = next.toString();
          window.location.hash = `${basePath}${query ? `?${query}` : ''}`.slice(1);
        }}
      >
        <span>محدوده قیمت (تومان)</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="min-h-10 min-w-0 border border-border bg-surface px-2 text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            type="number"
            min="0"
            name="minPrice"
            defaultValue={minPrice ?? ''}
            placeholder="از"
            aria-label="حداقل قیمت"
          />
          <input
            className="min-h-10 min-w-0 border border-border bg-surface px-2 text-[11px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            type="number"
            min="0"
            name="maxPrice"
            defaultValue={maxPrice ?? ''}
            placeholder="تا"
            aria-label="حداکثر قیمت"
          />
        </div>
        <Button className="min-h-10 w-full text-xs" size="sm" type="submit" variant="secondary">
          اعمال قیمت
        </Button>
      </form>
      <div className="filter-group grid gap-3">
        <label className="flex min-h-9 items-center gap-2 text-xs text-muted-foreground">
          <input
            className="h-4 w-4 accent-primary"
            type="checkbox"
            checked={inStock}
            onChange={(event) => {
              window.location.hash = buildHref({
                inStock: event.target.checked ? 'true' : undefined,
              }).slice(1);
            }}
          />
          فقط کالاهای موجود
        </label>
        <label className="flex min-h-9 items-center gap-2 text-xs text-muted-foreground">
          <input
            className="h-4 w-4 accent-primary"
            type="checkbox"
            checked={effectiveOnSale === true}
            disabled={mode === 'sale'}
            onChange={(event) => {
              window.location.hash = buildHref({
                onSale: event.target.checked ? 'true' : undefined,
              }).slice(1);
            }}
          />
          فقط تخفیف‌دارها
        </label>
      </div>
    </div>
  );
  const title =
    mode === 'sale'
      ? 'تخفیف‌های منتخب'
      : mode === 'new'
        ? 'تازه‌های آتلیه'
        : audience
          ? `محصولات ${audienceCopy[audience].label}`
          : 'همه محصولات';
  const totalLabel = catalogQuery.isPending
    ? 'در حال بارگذاری...'
    : `${new Intl.NumberFormat('fa-IR').format(catalogQuery.data?.total ?? 0)} مدل برای انتخاب شما`;

  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <span>فروشگاه</span>
      </div>
      <header className="listing-header">
        <div>
          <span className="section-heading__eyebrow">NOVA / CATALOG</span>
          <h1>{title}</h1>
          <p>{totalLabel}</p>
        </div>
        <label className="sort-control">
          <span className="sr-only">مرتب‌سازی محصولات</span>
          <select
            className="bg-transparent outline-none"
            value={sort}
            onChange={(event) => {
              window.location.hash = buildHref({ sort: event.target.value }).slice(1);
            }}
          >
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
            <option value="name">الفبا</option>
          </select>
          <Icon name="chevron-down" size={16} />
        </label>
      </header>
      <div className="listing-layout lg:grid">
        <aside className="filter-rail" aria-label="فیلتر محصولات">
          <div className="filter-rail__heading">
            <strong>فیلترها</strong>
            <a className="text-xs text-primary hover:underline" href={basePath}>
              حذف همه
            </a>
          </div>
          {filterPanel}
        </aside>
        <div className="listing-content">
          <div className="mobile-filter-bar">
            <button type="button" onClick={() => setMobileFiltersOpen(true)}>
              <Icon name="layers" size={17} /> فیلتر
              {activeFilterCount
                ? ` (${new Intl.NumberFormat('fa-IR').format(activeFilterCount)})`
                : ''}
            </button>
            <label className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-border bg-surface px-2 text-xs">
              <span>مرتب‌سازی</span>
              <select
                className="min-w-0 bg-transparent outline-none"
                value={sort}
                onChange={(event) => {
                  window.location.hash = buildHref({ sort: event.target.value }).slice(1);
                }}
                aria-label="مرتب‌سازی محصولات در موبایل"
              >
                <option value="newest">جدیدترین</option>
                <option value="price_asc">ارزان‌ترین</option>
                <option value="price_desc">گران‌ترین</option>
                <option value="name">الفبا</option>
              </select>
            </label>
          </div>
          <CatalogGrid
            query={catalogQuery}
            isWishlisted={isWishlisted}
            onToggleWishlist={onToggleWishlist}
            onAdd={onAdd}
            emptyTitle="محصولی در این محدوده پیدا نشد"
          />
          {catalogQuery.data ? (
            <CatalogPagination
              page={catalogQuery.data.page}
              limit={catalogQuery.data.limit}
              total={catalogQuery.data.total}
              hrefForPage={(nextPage) => buildHref({ page: String(nextPage) })}
            />
          ) : null}
        </div>
      </div>
      {mobileFiltersOpen ? (
        <div
          className="fixed inset-0 z-[500] flex items-end bg-foreground/40 md:hidden"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileFiltersOpen(false);
          }}
        >
          <section
            className="max-h-[88svh] w-full overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-float"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-catalog-filters-title"
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg" id="mobile-catalog-filters-title">
                فیلترها
              </h2>
              <button
                className="icon-button"
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="بستن فیلترها"
              >
                <Icon name="close" size={19} />
              </button>
            </div>
            {filterPanel}
            <Button
              className="mt-4 w-full"
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
            >
              نمایش نتایج
            </Button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function CatalogPagination({
  page,
  limit,
  total,
  hrefForPage,
}: {
  page: number;
  limit: number;
  total: number;
  hrefForPage: (page: number) => string;
}) {
  const pageCount = Math.ceil(total / limit);
  if (pageCount <= 1) return null;

  const visiblePages = [
    ...new Set(
      [1, page - 1, page, page + 1, pageCount].filter((value) => value >= 1 && value <= pageCount),
    ),
  ].sort((a, b) => a - b);

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="صفحه‌بندی محصولات"
    >
      {page > 1 ? (
        <a
          className="inline-flex min-h-10 items-center border border-border bg-surface px-3 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
          href={hrefForPage(page - 1)}
        >
          قبلی
        </a>
      ) : null}
      {visiblePages.map((value, index) => {
        const previous = visiblePages[index - 1];
        return (
          <span className="inline-flex items-center gap-2" key={value}>
            {previous && value - previous > 1 ? (
              <span className="px-1 text-muted-foreground" aria-hidden="true">
                …
              </span>
            ) : null}
            <a
              className={`inline-flex h-10 min-w-10 items-center justify-center border px-3 text-xs transition-colors ${value === page ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'}`}
              href={hrefForPage(value)}
              aria-current={value === page ? 'page' : undefined}
            >
              {new Intl.NumberFormat('fa-IR').format(value)}
            </a>
          </span>
        );
      })}
      {page < pageCount ? (
        <a
          className="inline-flex min-h-10 items-center border border-border bg-surface px-3 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
          href={hrefForPage(page + 1)}
        >
          بعدی
        </a>
      ) : null}
    </nav>
  );
}

function isNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
}

function normalizeSeoPath(path: string): string {
  const normalized = path.trim().replace(/\/+$/, '');
  return normalized || '/';
}

function ProductDetailSkeleton() {
  return (
    <div
      className="product-detail animate-pulse lg:grid"
      role="status"
      aria-label="در حال بارگذاری محصول"
    >
      <div className="aspect-[4/5] bg-secondary" />
      <div className="space-y-4 py-3">
        <div className="h-4 w-1/3 rounded bg-secondary" />
        <div className="h-10 w-4/5 rounded bg-secondary" />
        <div className="h-6 w-1/3 rounded bg-secondary" />
        <div className="h-24 w-full rounded bg-secondary" />
        <div className="h-12 w-full rounded bg-secondary" />
      </div>
    </div>
  );
}

function ProductPage({
  slug,
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: HomeProps & { slug: string }) {
  const productQuery = useCatalogProduct(slug);
  const relatedAudience = productQuery.data?.categories.find((category) =>
    ['women', 'men', 'children'].includes(category.slug),
  )?.slug as Audience | undefined;
  const relatedQuery = useCatalogProducts(
    { audience: relatedAudience, limit: 4, sort: 'newest' },
    Boolean(productQuery.data),
  );
  const [mediaIndex, setMediaIndex] = useState(0);
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [showShipping, setShowShipping] = useState(false);

  useEffect(() => {
    setMediaIndex(0);
    setSelectedOptionValues({});
    setSelectedSize('');
    setSelectedColor('');
  }, [productQuery.data?.id]);

  useEffect(() => {
    const initial = readInitialRenderContext();
    const initialMatches =
      initial &&
      initial.hashRoute === `#product/${slug}` &&
      normalizeSeoPath(initial.path) === normalizeSeoPath(window.location.pathname);

    if (productQuery.isError || !productQuery.data) {
      if (productQuery.isPending) {
        if (initialMatches) return;
        applySeoDocument(
          document,
          createSeoDocument({
            origin: window.location.origin,
            title: 'NOVA | محصول',
            description: 'در حال بارگذاری مشخصات محصول.',
            noIndex: true,
          }),
        );
        return;
      }
      applySeoDocument(
        document,
        createSeoDocument({
          origin: window.location.origin,
          title: 'NOVA | محصول',
          description: 'جزئیات و مشخصات محصولات نوا.',
          noIndex: true,
        }),
      );
      return;
    }
    if (initialMatches) {
      applySeoDocument(document, initial.seo);
      return;
    }
    const product = toStorefrontProductDetail(productQuery.data);
    applySeoDocument(
      document,
      createSeoDocument({
        origin: window.location.origin,
        title: `${product.name} | NOVA`,
        description: product.description ?? `مشخصات و خرید ${product.name} از فروشگاه نوا.`,
        canonicalPath: `/product/${encodeURIComponent(slug)}`,
        type: 'product',
        imagePath: product.image,
      }),
    );
  }, [productQuery.data, productQuery.isError, productQuery.isPending, slug]);

  if (productQuery.isPending) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <ProductDetailSkeleton />
      </main>
    );
  }
  if (productQuery.isError && isNotFoundError(productQuery.error)) return <NotFoundPage />;
  if (productQuery.isError) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <CatalogErrorState onRetry={() => void productQuery.refetch()} />
      </main>
    );
  }
  if (!productQuery.data) return <NotFoundPage />;

  const product = toStorefrontProductDetail(productQuery.data);
  const variants = product.variants ?? [];
  const normalizedOptions = (product.options ?? []).filter((option) =>
    option.values.some((value) =>
      variants.some((variant) => variant.optionValueIds.includes(value.id)),
    ),
  );
  const usesNormalizedOptions =
    normalizedOptions.length > 0 && variants.some((variant) => variant.optionValueIds.length > 0);
  const sizes = [
    ...new Set(
      variants.map((variant) => variant.size).filter((size): size is string => Boolean(size)),
    ),
  ];
  const colors = [
    ...new Map(
      variants.filter((variant) => variant.color).map((variant) => [variant.color, variant]),
    ).values(),
  ];
  const selectedVariant = usesNormalizedOptions
    ? variants.find((variant) =>
        normalizedOptions.every((option) => {
          const selectedValueId = selectedOptionValues[option.key];
          return (
            selectedValueId !== undefined &&
            selectedValueId !== '' &&
            variant.optionValueIds.includes(selectedValueId)
          );
        }),
      )
    : variants.find((variant) => {
        const matchesSize = sizes.length === 0 || variant.size === selectedSize;
        const matchesColor = colors.length === 0 || variant.color === selectedColor;
        return matchesSize && matchesColor;
      });
  const variantGallery = selectedVariant?.media ?? [];
  const gallery = variantGallery.length > 0 ? variantGallery : (product.media ?? []);
  const activeMedia = gallery[mediaIndex] ?? gallery[0];
  const activeImage = activeMedia?.url ?? product.image;
  const activeAlt = activeMedia?.altText ?? product.alt;
  const activePrice = selectedVariant?.priceToman ?? product.price;
  const activeCompareAt = selectedVariant
    ? resolveCompareAtPrice(activePrice, selectedVariant.compareAtPriceToman)
    : resolveCompareAtPrice(activePrice, product.compareAt);
  const activeAvailable = selectedVariant
    ? selectedVariant.available
    : variants.length
      ? false
      : product.available !== false;
  const hasSelection = usesNormalizedOptions
    ? normalizedOptions.every((option) => Boolean(selectedOptionValues[option.key]))
    : variants.length === 0 ||
      (sizes.length === 0 && colors.length === 0) ||
      Boolean(selectedVariant);
  const activeStock =
    variants.length && !selectedVariant
      ? 'انتخاب کنید'
      : activeAvailable
        ? selectedVariant
          ? 'موجود'
          : product.stock
        : 'ناموجود';
  const wishlisted = isWishlisted(product.slug);
  const relatedItems =
    relatedQuery.data?.items
      .map(toStorefrontProduct)
      .filter((item) => item.slug !== product.slug) ?? [];

  return (
    <main className="shell inner-page product-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <a href={`#products/${product.audience}`}>{audienceCopy[product.audience].label}</a>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-detail lg:grid">
        <div className="product-detail__gallery">
          <div className="product-detail__main-image">
            {activeImage ? (
              <img src={activeImage} alt={activeAlt} />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <Icon name="shirt" size={40} />
              </span>
            )}
          </div>
          {gallery.length > 1 ? (
            <div className="product-detail__thumbs" aria-label="تصاویر محصول">
              {gallery.map((media, index) => (
                <button
                  className={index === mediaIndex ? 'is-active' : ''}
                  type="button"
                  key={`${media.url}-${index}`}
                  onClick={() => setMediaIndex(index)}
                  aria-label={`نمایش تصویر ${index + 1}`}
                  aria-pressed={index === mediaIndex}
                >
                  <img src={media.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <section className="product-detail__info" aria-labelledby="product-title">
          <div className="product-detail__eyebrow">
            <span>{product.category}</span>
            <button
              type="button"
              className={wishlisted ? 'is-selected' : ''}
              onClick={() => onToggleWishlist(product.slug)}
              aria-label={wishlisted ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
              aria-pressed={wishlisted}
            >
              <Icon name="heart" size={19} />
            </button>
          </div>
          <h1 id="product-title">{product.name}</h1>
          <div className="product-detail__price">
            {activeCompareAt ? <del>{formatToman(activeCompareAt)}</del> : null}
            <strong>{formatToman(activePrice)}</strong>
          </div>
          <p className="product-detail__description">
            {product.description ?? 'جزئیات این محصول به‌زودی تکمیل می‌شود.'}
          </p>
          <div className="product-detail__meta">
            <span className={activeAvailable ? '' : 'text-warning'}>
              <Icon name={activeAvailable ? 'check' : 'warning'} size={15} /> {activeStock}
            </span>
            <span>
              <Icon name="truck" size={15} /> ارسال ۲ تا ۴ روز کاری
            </span>
          </div>
          {usesNormalizedOptions ? (
            normalizedOptions.map((option) => (
              <fieldset className="size-picker" key={option.id}>
                <legend>{option.name}</legend>
                <div className="size-picker__options">
                  {option.values.map((value) => {
                    const isAvailable = variants.some(
                      (item) =>
                        item.available &&
                        item.optionValueIds.includes(value.id) &&
                        Object.entries(selectedOptionValues).every(
                          ([selectedKey, selectedValueId]) =>
                            selectedKey === option.key ||
                            item.optionValueIds.includes(selectedValueId),
                        ),
                    );
                    const selected = selectedOptionValues[option.key] === value.id;
                    const swatchVariant = variants.find((item) =>
                      item.optionValueIds.includes(value.id),
                    );
                    const className =
                      option.key === 'color'
                        ? `flex min-h-11 items-center gap-2 border px-3 text-xs ${selected ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`
                        : selected
                          ? 'is-active'
                          : '';

                    return (
                      <button
                        className={className}
                        type="button"
                        key={value.id}
                        disabled={!isAvailable}
                        onClick={() =>
                          setSelectedOptionValues((current) => ({
                            ...current,
                            [option.key]: value.id,
                          }))
                        }
                        aria-pressed={selected}
                      >
                        {option.key === 'color' ? (
                          <span
                            className="h-4 w-4 rounded-full border border-foreground/20"
                            style={{ backgroundColor: swatchVariant?.colorHex ?? undefined }}
                          />
                        ) : null}
                        {value.label}
                      </button>
                    );
                  })}
                </div>
                {!selectedOptionValues[option.key] ? (
                  <p className="field-hint">لطفاً {option.name} را انتخاب کنید.</p>
                ) : null}
              </fieldset>
            ))
          ) : sizes.length ? (
            <fieldset className="size-picker">
              <legend>
                انتخاب اندازه <a href="#size-guide">راهنمای اندازه</a>
              </legend>
              <div className="size-picker__options">
                {sizes.map((size) => {
                  const isAvailable = variants.some(
                    (item) =>
                      item.size === size &&
                      (!selectedColor || item.color === selectedColor) &&
                      item.available,
                  );
                  const selected = selectedVariant?.size === size;
                  return (
                    <button
                      className={selected ? 'is-active' : ''}
                      type="button"
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedSize(size);
                        if (
                          selectedColor &&
                          !variants.some(
                            (item) => item.size === size && item.color === selectedColor,
                          )
                        ) {
                          setSelectedColor('');
                        }
                      }}
                      aria-pressed={selected}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {!selectedVariant ? <p className="field-hint">لطفاً اندازه را انتخاب کنید.</p> : null}
            </fieldset>
          ) : null}
          {!usesNormalizedOptions && colors.length ? (
            <fieldset className="mt-6 border-0 p-0">
              <legend className="text-[13px] font-semibold">انتخاب رنگ</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {colors.map((variant) => {
                  const selected = selectedVariant?.color === variant.color;
                  const isAvailable = variants.some(
                    (item) =>
                      item.color === variant.color &&
                      (!selectedSize || item.size === selectedSize) &&
                      item.available,
                  );
                  return (
                    <button
                      className={`flex min-h-11 items-center gap-2 border px-3 text-xs ${selected ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`}
                      type="button"
                      key={variant.id}
                      disabled={!isAvailable}
                      onClick={() => {
                        setSelectedColor(variant.color ?? '');
                        if (
                          selectedSize &&
                          !variants.some(
                            (item) => item.color === variant.color && item.size === selectedSize,
                          )
                        ) {
                          setSelectedSize('');
                        }
                      }}
                      aria-pressed={selected}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-foreground/20"
                        style={{ backgroundColor: variant.colorHex ?? undefined }}
                      />
                      {variant.color ?? variant.title ?? 'رنگ'}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
          <Button
            className="product-detail__add"
            size="lg"
            type="button"
            onClick={() =>
              hasSelection &&
              activeAvailable &&
              onAdd({
                ...product,
                price: activePrice,
                compareAt: activeCompareAt,
                available: activeAvailable,
                stock: activeStock,
                selectedVariantId: selectedVariant?.id,
              })
            }
            disabled={!hasSelection || !activeAvailable}
          >
            <Icon name="bag" size={18} />{' '}
            {activeAvailable ? 'افزودن به سبد خرید' : 'این محصول ناموجود است'}
          </Button>
          <div className="detail-accordions">
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              aria-expanded={showDetails}
            >
              <span>جزئیات و مراقبت</span>
              <Icon name="chevron-down" size={17} />
            </button>
            {showDetails ? (
              <div className="space-y-2 py-3 text-xs leading-7 text-muted-foreground">
                {product.attributes?.length ? (
                  product.attributes.map((attribute) => (
                    <p key={attribute.key}>
                      <strong className="text-foreground">{attribute.key}:</strong>{' '}
                      {attribute.value}
                    </p>
                  ))
                ) : (
                  <p>ترکیب پارچه، جدول اندازه و روش شست‌وشو برای این محصول ثبت نشده است.</p>
                )}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => setShowShipping((value) => !value)}
              aria-expanded={showShipping}
            >
              <span>ارسال و بازگشت</span>
              <Icon name="chevron-down" size={17} />
            </button>
            {showShipping ? (
              <p>
                ارسال به سراسر ایران طی ۲ تا ۴ روز کاری انجام می‌شود. شرایط بازگشت را در صفحه سیاست
                بازگشت ببینید.
              </p>
            ) : null}
          </div>
        </section>
      </div>
      <section className="home-section product-related">
        <SectionHeading title="شاید این‌ها را هم بپسندید" action="مشاهده همه" href="#products" />
        <CatalogGrid
          query={relatedQuery}
          items={relatedItems}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      </section>
    </main>
  );
}

function CartPage({
  cart,
  isLoading,
  isError,
  onRetry,
  onUpdateItem,
  onRemoveItem,
  onAdd,
  isWishlisted,
  onToggleWishlist,
}: HomeProps & {
  cart: CartView | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onUpdateItem: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
}) {
  const recommendationsQuery = useCatalogProducts({ limit: 4, sort: 'newest' });

  if (isLoading) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <section
          className="cart-layout animate-pulse lg:grid"
          role="status"
          aria-label="در حال بارگذاری سبد خرید"
        >
          <div className="cart-items space-y-3">
            <div className="h-24 rounded-editorial bg-secondary" />
            <div className="h-24 rounded-editorial bg-secondary" />
          </div>
          <div className="h-64 rounded-editorial bg-secondary" />
        </section>
      </main>
    );
  }

  if (isError || !cart) {
    return (
      <main className="shell inner-page mx-auto flex min-h-[55svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
        <section className="w-full max-w-xl border border-border bg-surface p-8 text-center shadow-card">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 text-warning">
            <Icon name="warning" size={22} />
          </span>
          <h1 className="mt-4 text-xl">سبد خرید بارگذاری نشد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.
          </p>
          <Button className="mt-5" type="button" variant="outline" onClick={onRetry}>
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        </section>
      </main>
    );
  }

  if (!cart.items.length) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="سبد خرید شما هنوز خالی است"
          description="از میان انتخاب‌های آتلیه، قطعه‌ای برای روزهای پیش رو پیدا کنید."
          action="مشاهده تازه‌ها"
          href="#products/new"
        />
      </main>
    );
  }
  return (
    <main className="shell inner-page cart-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <span>سبد خرید</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">NOVA / CART</span>
        <h1>سبد خرید</h1>
        <p>{cart.itemCount} کالا در سبد شماست.</p>
      </header>
      <div className="cart-layout lg:grid">
        <section className="cart-items">
          {cart.items.map((item) => (
            <article className="cart-line" key={item.id}>
              <a href={`#product/${item.productSlug}`} aria-label={`مشاهده ${item.productName}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.imageAlt ?? item.productName} />
                ) : (
                  <span className="flex h-full items-center justify-center bg-secondary text-primary">
                    <Icon name="shirt" size={28} />
                  </span>
                )}
              </a>
              <div>
                <span className="section-heading__eyebrow">{item.sku}</span>
                <h2>{item.productName}</h2>
                <p>{item.title ?? 'تنوع انتخاب‌شده'}</p>
                <strong>{formatToman(item.unitPriceToman)}</strong>
                <div
                  className="mt-3 inline-flex items-center border border-border bg-background"
                  aria-label={`تعداد ${item.productName}`}
                >
                  <button
                    className="min-h-9 min-w-9 text-lg text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    aria-label="کاهش تعداد"
                    disabled={item.quantity <= 1}
                    onClick={() => onUpdateItem(item.variantId, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-xs" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    className="min-h-9 min-w-9 text-lg text-muted-foreground transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    type="button"
                    aria-label="افزایش تعداد"
                    disabled={item.quantity >= 99}
                    onClick={() => onUpdateItem(item.variantId, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
                {!item.available ? (
                  <p className="mt-2 text-xs text-warning">
                    این تنوع دیگر موجود نیست و هنگام پرداخت قابل انتخاب نخواهد بود.
                  </p>
                ) : null}
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label={`حذف ${item.productName}`}
                onClick={() => onRemoveItem(item.variantId)}
              >
                <Icon name="close" size={17} />
              </button>
            </article>
          ))}
          <div className="inline-message inline-message--warning">
            <Icon name="info" size={16} /> قیمت و موجودی در مرحله پرداخت دوباره بررسی می‌شود.
          </div>
        </section>
        <aside className="summary-card">
          <h2>خلاصه سفارش</h2>
          <div>
            <span>جمع کالاها</span>
            <strong>{formatToman(cart.subtotalToman)}</strong>
          </div>
          <div>
            <span>ارسال</span>
            <strong>پس از انتخاب آدرس</strong>
          </div>
          <div className="summary-card__total">
            <span>مبلغ قابل پرداخت</span>
            <strong>{formatToman(cart.subtotalToman)}</strong>
          </div>
          <Button asChild size="lg">
            <a href="#checkout/address">
              ادامه فرایند خرید <Icon name="arrow-left" size={17} />
            </a>
          </Button>
          <a className="text-link text-link--center" href="#products">
            ادامه خرید
          </a>
        </aside>
      </div>
      <section className="home-section">
        <SectionHeading title="پیشنهادهای همراه" />
        <CatalogGrid
          query={recommendationsQuery}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      </section>
    </main>
  );
}

function CheckoutPage({
  step,
  queryString = '',
  cart,
  cartLoading,
  cartError,
  onRetryCart,
}: {
  step: string;
  queryString?: string;
  cart: CartView | undefined;
  cartLoading: boolean;
  cartError: boolean;
  onRetryCart: () => void;
}) {
  const params = new URLSearchParams(queryString);
  const routeAddressId = params.get('addressId') ?? '';
  const routeShippingMethod = params.get('shipping') === 'EXPRESS' ? 'EXPRESS' : 'STANDARD';
  const routeCouponCode = params.get('coupon') ?? '';
  const addressesQuery = useCustomerAddresses();
  const submitCheckoutMutation = useSubmitCheckout();
  const [selectedAddressId, setSelectedAddressId] = useState(routeAddressId);
  const [shippingMethod, setShippingMethod] = useState<CheckoutShippingMethod>(routeShippingMethod);
  const [couponCode, setCouponCode] = useState(routeCouponCode);
  const [formError, setFormError] = useState('');
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const addresses = addressesQuery.data;
    const firstAddress = addresses?.[0];
    if (selectedAddressId || !firstAddress) return;
    setSelectedAddressId(addresses.find((address) => address.isDefault)?.id ?? firstAddress.id);
  }, [addressesQuery.data, selectedAddressId]);

  const steps = [
    { key: 'address', label: 'آدرس', href: '#checkout/address' },
    { key: 'shipping', label: 'ارسال', href: '#checkout/shipping' },
    { key: 'payment', label: 'پرداخت', href: '#checkout/payment' },
  ];
  const currentIndex = Math.max(
    0,
    steps.findIndex((item) => item.key === step),
  );
  const addressId = routeAddressId || selectedAddressId;
  const selectedAddress = addressesQuery.data?.find((address) => address.id === addressId);
  const checkoutInput = {
    addressId,
    shippingMethod,
    ...(couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
  };
  const quoteQuery = useCheckoutQuote(
    checkoutInput,
    step === 'payment' && Boolean(addressId) && addressesQuery.isSuccess,
  );
  const stepHref = (target: string) => {
    if (target === 'address') {
      return addressId
        ? `#checkout/address?addressId=${encodeURIComponent(addressId)}`
        : '#checkout/address';
    }
    const stepParams = new URLSearchParams();
    if (addressId) stepParams.set('addressId', addressId);
    stepParams.set('shipping', shippingMethod);
    if (target === 'payment' && couponCode.trim()) {
      stepParams.set('coupon', couponCode.trim());
    }
    const query = stepParams.toString();
    return `#checkout/${target}${query ? `?${query}` : ''}`;
  };
  const idempotencyKey = () => {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        globalThis.crypto?.randomUUID?.() ??
        `nova-checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    return idempotencyKeyRef.current;
  };
  const nextHref =
    step === 'address'
      ? stepHref('shipping')
      : step === 'shipping'
        ? stepHref('payment')
        : '#checkout/confirmation';
  const pageTitle =
    step === 'address' ? 'آدرس تحویل' : step === 'shipping' ? 'روش ارسال' : 'پرداخت امن';

  const goToNextStep = async () => {
    setFormError('');
    if (step === 'address') {
      if (!selectedAddress) {
        setFormError('یک آدرس برای تحویل انتخاب کنید.');
        return;
      }
      window.location.hash = nextHref;
      return;
    }

    if (!addressId) {
      setFormError('ابتدا آدرس تحویل را انتخاب کنید.');
      return;
    }

    if (step !== 'payment') {
      window.location.hash = nextHref;
      return;
    }

    if (quoteQuery.isError) {
      setFormError(apiErrorMessage(quoteQuery.error, 'قیمت نهایی سفارش دریافت نشد.'));
      return;
    }
    if (!quoteQuery.data) {
      setFormError('برای ثبت سفارش، ابتدا قیمت نهایی را دریافت کنید.');
      return;
    }

    try {
      const order = await submitCheckoutMutation.mutateAsync({
        input: checkoutInput,
        idempotencyKey: idempotencyKey(),
      });
      if (order.payment.redirectUrl) {
        window.location.assign(order.payment.redirectUrl);
        return;
      }
      window.location.hash = `#checkout/confirmation?orderNumber=${encodeURIComponent(order.orderNumber)}`;
    } catch (error) {
      setFormError(apiErrorMessage(error, 'ثبت سفارش انجام نشد؛ دوباره تلاش کنید.'));
    }
  };

  if (cartLoading) {
    return (
      <main className="shell inner-page checkout-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <section
          className="checkout-layout animate-pulse lg:grid"
          role="status"
          aria-label="در حال بارگذاری سبد خرید"
        >
          <div className="h-96 rounded bg-secondary" />
          <div className="h-64 rounded bg-secondary" />
        </section>
      </main>
    );
  }

  if (cartError || !cart) {
    return (
      <main className="shell inner-page mx-auto flex min-h-[55svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
        <section className="w-full max-w-xl border border-border bg-surface p-8 text-center shadow-card">
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 text-warning">
            <Icon name="warning" size={22} />
          </span>
          <h1 className="mt-4 text-xl">سبد خرید بارگذاری نشد</h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید.
          </p>
          <Button className="mt-5" type="button" variant="outline" onClick={onRetryCart}>
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        </section>
      </main>
    );
  }

  if (!cart.items.length) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="سبد خرید شما خالی است"
          description="برای تکمیل سفارش، ابتدا یک محصول به سبد خرید اضافه کنید."
          action="مشاهده فروشگاه"
          href="#products"
        />
      </main>
    );
  }

  const needsLogin =
    addressesQuery.isError &&
    addressesQuery.error instanceof ApiClientError &&
    addressesQuery.error.status === 401;
  if (addressesQuery.isPending) {
    return (
      <main className="shell inner-page checkout-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <section
          className="checkout-layout animate-pulse lg:grid"
          role="status"
          aria-label="در حال بارگذاری آدرس‌ها"
        >
          <div className="h-96 rounded bg-secondary" />
          <div className="h-64 rounded bg-secondary" />
        </section>
      </main>
    );
  }

  if (addressesQuery.isError) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title={needsLogin ? 'برای تکمیل خرید وارد شوید' : 'آدرس‌ها بارگذاری نشدند'}
          description={
            needsLogin
              ? 'برای انتخاب آدرس و ثبت سفارش، ابتدا با شماره موبایل خود وارد حساب شوید.'
              : apiErrorMessage(addressesQuery.error, 'دریافت آدرس‌ها ممکن نشد؛ دوباره تلاش کنید.')
          }
          action={needsLogin ? 'ورود به حساب' : 'تلاش دوباره'}
          href={needsLogin ? '#auth' : undefined}
          onAction={needsLogin ? undefined : () => void addressesQuery.refetch()}
        />
      </main>
    );
  }

  if (!addressesQuery.data?.length) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="یک آدرس برای تحویل اضافه کنید"
          description="بدون آدرس تحویل، امکان دریافت قیمت نهایی و ثبت سفارش وجود ندارد."
          action="افزودن آدرس"
          href="#account/addresses/create"
        />
      </main>
    );
  }

  if (step !== 'address' && !selectedAddress) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="آدرس این مرحله مشخص نیست"
          description="برای ادامه، یک آدرس معتبر از حساب خود انتخاب کنید."
          action="انتخاب آدرس"
          href="#checkout/address"
        />
      </main>
    );
  }

  const quote = quoteQuery.data;
  const subtotal = quote?.subtotalToman ?? cart.subtotalToman;
  const discount = quote?.discountToman ?? 0;
  const shipping = quote?.shippingToman;
  const total = quote?.totalToman ?? cart.subtotalToman;

  return (
    <main className="shell inner-page checkout-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#cart">سبد خرید</a>
        <span>/</span>
        <span>تکمیل سفارش</span>
      </div>
      <div className="checkout-layout lg:grid">
        <section className="checkout-main">
          <div className="checkout-stepper" aria-label="مراحل تکمیل سفارش">
            {steps.map((item, index) => (
              <a
                className={index <= currentIndex ? 'is-active' : ''}
                href={stepHref(item.key)}
                key={item.key}
              >
                <span>{index + 1}</span>
                {item.label}
              </a>
            ))}
          </div>
          <header className="simple-page-header">
            <span className="section-heading__eyebrow">مرحله {currentIndex + 1} از ۳</span>
            <h1>{pageTitle}</h1>
            <p>اطلاعات شما فقط برای تکمیل همین سفارش استفاده می‌شود.</p>
          </header>
          {step === 'address' ? (
            <AddressForm
              addresses={addressesQuery.data}
              selectedAddressId={selectedAddressId}
              onSelect={setSelectedAddressId}
            />
          ) : step === 'shipping' ? (
            <ShippingOptions value={shippingMethod} onChange={setShippingMethod} />
          ) : (
            <>
              <PaymentOptions />
              <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
                کد تخفیف (اختیاری)
                <input
                  className="min-h-12 border border-border bg-surface px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="کد تخفیف را وارد کنید"
                  autoComplete="off"
                />
              </label>
              {quoteQuery.isPending ? (
                <div className="inline-message inline-message--info" role="status">
                  <Icon name="refresh" size={16} /> در حال دریافت مبلغ نهایی سفارش...
                </div>
              ) : null}
              {quoteQuery.isError ? (
                <div className="inline-message inline-message--error" role="alert">
                  <Icon name="warning" size={16} />
                  {apiErrorMessage(quoteQuery.error, 'قیمت نهایی سفارش دریافت نشد.')}
                </div>
              ) : null}
            </>
          )}
          {formError ? (
            <div className="inline-message inline-message--error" role="alert">
              <Icon name="warning" size={16} />
              {formError}
            </div>
          ) : null}
          <Button
            className="checkout-next"
            disabled={
              submitCheckoutMutation.isPending ||
              (step === 'address' && !selectedAddress) ||
              (step !== 'address' && !addressId) ||
              (step === 'payment' && (quoteQuery.isPending || !quoteQuery.data))
            }
            size="lg"
            type="button"
            onClick={() => void goToNextStep()}
          >
            {submitCheckoutMutation.isPending
              ? 'در حال ثبت سفارش...'
              : step === 'payment'
                ? 'پرداخت و ثبت سفارش'
                : 'ادامه'}{' '}
            <Icon name="arrow-left" size={17} />
          </Button>
        </section>
        <aside className="summary-card checkout-summary">
          <span className="section-heading__eyebrow">خلاصه سفارش</span>
          <h2>{cart.itemCount} کالا</h2>
          <div>
            <span>مبلغ کالاها</span>
            <strong>{formatToman(subtotal)}</strong>
          </div>
          {discount ? (
            <div>
              <span>تخفیف</span>
              <strong className="text-success">− {formatToman(discount)}</strong>
            </div>
          ) : null}
          <div>
            <span>ارسال</span>
            <strong>{shipping === undefined ? 'پس از انتخاب روش' : formatToman(shipping)}</strong>
          </div>
          <div className="summary-card__total">
            <span>مبلغ نهایی</span>
            <strong>{formatToman(total)}</strong>
          </div>
          {quote ? (
            <p className="mb-3 text-xs leading-7 text-muted-foreground">
              {quote.shippingLabel} · {quote.shippingEstimate}
            </p>
          ) : null}
          <a className="text-link" href="#cart">
            ویرایش سبد <Icon name="arrow-left" size={15} />
          </a>
        </aside>
      </div>
    </main>
  );
}

function AddressForm({
  addresses,
  selectedAddressId,
  onSelect,
}: {
  addresses: CustomerAddress[];
  selectedAddressId: string;
  onSelect: (addressId: string) => void;
}) {
  return (
    <div className="form-card">
      {addresses.map((address) => (
        <label
          className={`option-card ${selectedAddressId === address.id ? 'is-selected' : ''}`}
          key={address.id}
        >
          <input
            checked={selectedAddressId === address.id}
            name="checkout-address"
            onChange={() => onSelect(address.id)}
            type="radio"
          />
          <span>
            <strong>
              {address.label} {address.isDefault ? '· پیش‌فرض' : ''}
            </strong>
            <small>
              {address.recipientName} · {address.province}، {address.city}، {address.addressLine}
            </small>
            <small dir="ltr">
              {address.phone} · {address.postalCode}
            </small>
          </span>
          <Icon name={selectedAddressId === address.id ? 'check' : 'home'} size={18} />
        </label>
      ))}
      <a className="text-link" href="#account/addresses/create">
        افزودن آدرس جدید <Icon name="plus" size={15} />
      </a>
    </div>
  );
}

function ShippingOptions({
  value,
  onChange,
}: {
  value: CheckoutShippingMethod;
  onChange: (value: CheckoutShippingMethod) => void;
}) {
  return (
    <div className="option-list">
      <label className={`option-card ${value === 'STANDARD' ? 'is-selected' : ''}`}>
        <input
          checked={value === 'STANDARD'}
          name="shipping"
          onChange={() => onChange('STANDARD')}
          type="radio"
        />
        <span>
          <strong>ارسال عادی</strong>
          <small>تحویل بین ۲ تا ۴ روز کاری · سراسر ایران</small>
        </span>
        <b>رایگان</b>
      </label>
      <label className={`option-card ${value === 'EXPRESS' ? 'is-selected' : ''}`}>
        <input
          checked={value === 'EXPRESS'}
          name="shipping"
          onChange={() => onChange('EXPRESS')}
          type="radio"
        />
        <span>
          <strong>ارسال سریع</strong>
          <small>تحویل ۱ تا ۲ روز کاری · شهرهای منتخب</small>
        </span>
        <b>۸۹٬۰۰۰ تومان</b>
      </label>
    </div>
  );
}

function PaymentOptions() {
  return (
    <div className="option-list">
      <label className="option-card is-selected">
        <input type="radio" name="payment" defaultChecked />
        <span>
          <strong>پرداخت آنلاین</strong>
          <small>پرداخت امن از طریق درگاه بانکی</small>
        </span>
        <Icon name="check" size={18} />
      </label>
      <div className="inline-message inline-message--info">
        <Icon name="info" size={16} /> پس از بازگشت از درگاه، وضعیت پرداخت توسط سرور بررسی می‌شود.
      </div>
    </div>
  );
}

function ConfirmationPage({ queryString = '' }: { queryString?: string }) {
  const orderNumber = new URLSearchParams(queryString).get('orderNumber') ?? '';
  return (
    <main className="shell inner-page confirmation-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <section className="confirmation-card">
        <span className="confirmation-card__icon">
          <Icon name="check" size={28} />
        </span>
        <span className="section-heading__eyebrow">NOVA / ORDER CONFIRMED</span>
        <h1>سفارش شما ثبت شد</h1>
        <p>
          ممنون که نوا را برای روزهای خود انتخاب کردید. جزئیات سفارش به شماره تماس شما ارسال می‌شود.
        </p>
        {orderNumber ? (
          <strong className="ltr-value" dir="ltr">
            {orderNumber}
          </strong>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">شماره سفارش در حساب شما ثبت می‌شود.</p>
        )}
        <div className="confirmation-card__actions">
          <Button asChild size="lg">
            <a href={orderNumber ? `#order/${encodeURIComponent(orderNumber)}` : '#account/orders'}>
              {orderNumber ? 'پیگیری سفارش' : 'مشاهده سفارش‌ها'}
            </a>
          </Button>
          <a className="text-link" href="#home">
            بازگشت به خانه <Icon name="arrow-left" size={16} />
          </a>
        </div>
      </section>
    </main>
  );
}

const authPhoneStorageKey = 'nova.auth.phone';

function readAuthPhone(): string {
  try {
    return window.sessionStorage.getItem(authPhoneStorageKey) ?? '';
  } catch {
    return '';
  }
}

function writeAuthPhone(phone: string): void {
  try {
    window.sessionStorage.setItem(authPhoneStorageKey, phone);
  } catch {
    // Session storage can be unavailable in privacy-restricted browser contexts.
  }
}

function clearAuthPhone(): void {
  try {
    window.sessionStorage.removeItem(authPhoneStorageKey);
  } catch {
    // Session storage can be unavailable in privacy-restricted browser contexts.
  }
}

function authErrorMessage(error: unknown): string {
  return apiErrorMessage(error, 'ورود انجام نشد؛ دوباره تلاش کنید.');
}

function AuthPage({
  mode,
  queryString = '',
}: {
  mode: 'request' | 'verify';
  queryString?: string;
}) {
  const isVerify = mode === 'verify';
  const requestOtpMutation = useRequestCustomerOtp();
  const verifyOtpMutation = useVerifyCustomerOtp();
  const [phone, setPhone] = useState(() => (isVerify ? readAuthPhone() : ''));
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const challengeId = new URLSearchParams(queryString).get('challengeId') ?? '';
  const isSubmitting = requestOtpMutation.isPending || verifyOtpMutation.isPending;

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (isVerify) {
      if (!challengeId) {
        setFormError('نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.');
        return;
      }
      if (!code.trim()) {
        setFormError('کد تأیید را وارد کنید.');
        return;
      }

      try {
        await verifyOtpMutation.mutateAsync({ challengeId, code: code.trim() });
        clearAuthPhone();
        window.location.hash = '#account';
      } catch (error) {
        setFormError(authErrorMessage(error));
      }
      return;
    }

    if (!phone.trim()) {
      setFormError('شماره موبایل را وارد کنید.');
      return;
    }

    try {
      const result = await requestOtpMutation.mutateAsync({ phone: phone.trim() });
      writeAuthPhone(phone.trim());
      window.location.hash = `#auth/verify?challengeId=${encodeURIComponent(result.challengeId)}`;
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  const resendCode = async () => {
    const storedPhone = phone.trim() || readAuthPhone();
    setFormError('');
    setSuccessMessage('');
    if (!storedPhone) {
      setFormError('شماره موبایل پیدا نشد؛ ابتدا شماره را وارد کنید.');
      return;
    }

    try {
      const result = await requestOtpMutation.mutateAsync({ phone: storedPhone });
      writeAuthPhone(storedPhone);
      setSuccessMessage('کد جدید ارسال شد.');
      window.location.hash = `#auth/verify?challengeId=${encodeURIComponent(result.challengeId)}`;
    } catch (error) {
      setFormError(authErrorMessage(error));
    }
  };

  return (
    <main className="shell inner-page mx-auto flex min-h-[70svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
      <section className="w-full max-w-xl border border-border bg-surface px-6 py-12 text-center shadow-card md:px-12">
        <span className="section-heading__eyebrow">
          NOVA / {isVerify ? 'OTP VERIFY' : 'SIGN IN'}
        </span>
        <span className="mx-auto mb-5 mt-3 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Icon name={isVerify ? 'check' : 'user'} size={24} />
        </span>
        <h1 className="text-3xl leading-relaxed">
          {isVerify ? 'کد ورود را وارد کنید' : 'به نوا خوش آمدید'}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-8 text-muted-foreground">
          {isVerify
            ? 'کد شش‌رقمی ارسال‌شده به شماره شما را وارد کنید. کد تا ۵ دقیقه معتبر است.'
            : 'برای ورود یا ساخت حساب، شماره موبایل خود را وارد کنید تا کد یکبار مصرف برای شما ارسال شود.'}
        </p>
        <form
          className="mx-auto mt-8 flex max-w-md flex-col gap-4 text-right"
          onSubmit={(event) => void submitForm(event)}
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            {isVerify ? 'کد تأیید' : 'شماره موبایل'}
            <input
              className="min-h-12 border border-border bg-background px-4 text-center outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
              dir="ltr"
              inputMode={isVerify ? 'numeric' : 'tel'}
              maxLength={isVerify ? 6 : undefined}
              placeholder={isVerify ? '۱۲۳۴۵۶' : '۰۹۱۲ ۱۲۳ ۴۵۶۷'}
              required
              type={isVerify ? 'text' : 'tel'}
              value={isVerify ? code : phone}
              onChange={(event) =>
                isVerify ? setCode(event.target.value) : setPhone(event.target.value)
              }
              autoComplete={isVerify ? 'one-time-code' : 'tel'}
              aria-invalid={formError ? 'true' : undefined}
            />
          </label>
          {successMessage ? (
            <div className="inline-message inline-message--success" role="status">
              <Icon name="check" size={16} />
              {successMessage}
            </div>
          ) : null}
          {formError ||
          (isVerify && !challengeId ? 'نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.' : '') ? (
            <div className="inline-message inline-message--error" role="alert">
              <Icon name="warning" size={16} />
              {formError || 'نشست ورود پیدا نشد؛ دوباره درخواست کد بدهید.'}
            </div>
          ) : null}
          {isVerify ? (
            <Button disabled={isSubmitting || !challengeId} size="lg" type="submit">
              {verifyOtpMutation.isPending ? 'در حال بررسی...' : 'تأیید و ورود'}{' '}
              <Icon name="arrow-left" size={17} />
            </Button>
          ) : (
            <Button disabled={isSubmitting} size="lg" type="submit">
              {requestOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال کد ورود'}{' '}
              <Icon name="arrow-left" size={17} />
            </Button>
          )}
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
          <a className="text-link" href={isVerify ? '#auth' : '#home'}>
            {isVerify ? 'تغییر شماره' : 'بازگشت به فروشگاه'} <Icon name="arrow-left" size={14} />
          </a>
          {isVerify ? (
            <button
              className="min-h-11 text-primary underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
              onClick={() => void resendCode()}
              type="button"
            >
              {requestOtpMutation.isPending ? 'در حال ارسال...' : 'ارسال دوباره کد'}
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

type AddressFormState = Required<CustomerAddressCreateInput>;

const emptyAddressForm: AddressFormState = {
  label: '',
  recipientName: '',
  phone: '',
  province: '',
  city: '',
  addressLine: '',
  postalCode: '',
  isDefault: false,
};

function toAddressForm(address: CustomerAddress): AddressFormState {
  return {
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}

function addressErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError && error.payload?.error.message) {
    return error.payload.error.message;
  }
  return error instanceof Error ? error.message : 'عملیات آدرس انجام نشد؛ دوباره تلاش کنید.';
}

function AddressBookPage({
  mode = 'list',
  addressId,
}: {
  mode?: 'list' | 'create' | 'edit';
  addressId?: string;
}) {
  const isForm = mode !== 'list';
  const addressesQuery = useCustomerAddresses();
  const createMutation = useCreateCustomerAddress();
  const updateMutation = useUpdateCustomerAddress();
  const setDefaultMutation = useSetCustomerAddressDefault();
  const removeMutation = useRemoveCustomerAddress();
  const addresses = addressesQuery.data ?? [];
  const selectedAddress =
    mode === 'edit'
      ? addressId
        ? addresses.find((address) => address.id === addressId)
        : (addresses.find((address) => address.isDefault) ?? addresses[0])
      : undefined;
  const [form, setForm] = useState<AddressFormState>(emptyAddressForm);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (mode === 'edit' && selectedAddress) {
      setForm(toAddressForm(selectedAddress));
    } else if (mode === 'create') {
      setForm(emptyAddressForm);
    }
  }, [mode, selectedAddress]);

  const unauthorized =
    addressesQuery.error instanceof ApiClientError && addressesQuery.error.status === 401;
  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    setDefaultMutation.error ??
    removeMutation.error;
  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    setDefaultMutation.isPending ||
    removeMutation.isPending;

  const updateField = (field: keyof AddressFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const requiredValues = [
      form.label,
      form.recipientName,
      form.phone,
      form.province,
      form.city,
      form.addressLine,
      form.postalCode,
    ];
    if (requiredValues.some((value) => !value.trim())) {
      setFormError('لطفاً همه بخش‌های آدرس را کامل کنید.');
      return;
    }
    if (mode === 'edit' && !selectedAddress) {
      setFormError('آدرس انتخاب‌شده پیدا نشد.');
      return;
    }

    setFormError('');
    const input: CustomerAddressCreateInput = {
      label: form.label.trim(),
      recipientName: form.recipientName.trim(),
      phone: form.phone.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      addressLine: form.addressLine.trim(),
      postalCode: form.postalCode.trim(),
      isDefault: form.isDefault,
    };

    try {
      if (mode === 'edit' && selectedAddress) {
        await updateMutation.mutateAsync({ addressId: selectedAddress.id, input });
      } else {
        await createMutation.mutateAsync(input);
      }
      window.location.hash = '#account/addresses';
    } catch {
      return;
    }
  };

  if (addressesQuery.isPending) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <section
          className="mx-auto max-w-4xl animate-pulse space-y-4"
          role="status"
          aria-label="در حال بارگذاری آدرس‌ها"
        >
          <div className="h-8 w-1/3 rounded bg-secondary" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-48 rounded-editorial bg-secondary" />
            <div className="h-48 rounded-editorial bg-secondary" />
          </div>
        </section>
      </main>
    );
  }

  if (addressesQuery.isError) {
    return (
      <main className="shell inner-page mx-auto flex min-h-[55svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
        <section
          className="w-full max-w-xl border border-border bg-surface p-8 text-center shadow-card"
          role="alert"
        >
          <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-100 text-warning">
            <Icon name={unauthorized ? 'user' : 'warning'} size={22} />
          </span>
          <h1 className="mt-4 text-xl">
            {unauthorized ? 'برای دیدن آدرس‌ها وارد شوید' : 'بارگذاری آدرس‌ها ممکن نشد'}
          </h1>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {unauthorized
              ? 'آدرس‌های تحویل فقط در حساب کاربری شما قابل مشاهده و مدیریت هستند.'
              : addressErrorMessage(addressesQuery.error)}
          </p>
          {unauthorized ? (
            <Button asChild className="mt-5">
              <a href="#auth/request">ورود به حساب</a>
            </Button>
          ) : (
            <Button
              className="mt-5"
              type="button"
              variant="outline"
              onClick={() => void addressesQuery.refetch()}
            >
              تلاش دوباره
            </Button>
          )}
        </section>
      </main>
    );
  }

  if (mode === 'edit' && !selectedAddress) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="آدرس پیدا نشد"
          description="این آدرس دیگر در حساب شما وجود ندارد."
          action="بازگشت به آدرس‌ها"
          href="#account/addresses"
        />
      </main>
    );
  }

  if (!isForm && !addresses.length) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="هنوز آدرسی ثبت نکرده‌اید"
          description="برای تحویل سریع‌تر سفارش، اولین آدرس خود را اضافه کنید."
          action="افزودن آدرس جدید"
          href="#account/addresses/create"
        />
      </main>
    );
  }

  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#account">حساب کاربری</a>
        <span>/</span>
        <span>آدرس‌ها</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">MY NOVA / ADDRESSES</span>
        <h1>{isForm ? (mode === 'create' ? 'افزودن آدرس جدید' : 'ویرایش آدرس') : 'آدرس‌های من'}</h1>
        <p>آدرس تحویل سفارش‌های شما، جدا و امن نگهداری می‌شود.</p>
      </header>

      {mutationError && !isForm ? (
        <p
          className="mx-auto mb-4 max-w-4xl border border-warning bg-warning-100 px-4 py-3 text-sm text-warning"
          role="alert"
        >
          {addressErrorMessage(mutationError)}
        </p>
      ) : null}

      {isForm ? (
        <form
          className="mx-auto max-w-3xl border border-border bg-surface p-6 shadow-card md:p-8"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium">
              عنوان آدرس
              <input
                className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                value={form.label}
                onChange={(event) => updateField('label', event.target.value)}
                placeholder="مثلاً خانه"
                autoComplete="address-line1"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              نام تحویل‌گیرنده
              <input
                className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                value={form.recipientName}
                onChange={(event) => updateField('recipientName', event.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              شماره تماس
              <input
                className="min-h-12 border border-border bg-background px-3 text-left outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                dir="ltr"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
                autoComplete="tel"
                inputMode="tel"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              کد پستی
              <input
                className="min-h-12 border border-border bg-background px-3 text-left outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                dir="ltr"
                value={form.postalCode}
                onChange={(event) => updateField('postalCode', event.target.value)}
                placeholder="۱۰ رقمی"
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              استان
              <input
                className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                value={form.province}
                onChange={(event) => updateField('province', event.target.value)}
                autoComplete="address-level1"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              شهر
              <input
                className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
                autoComplete="address-level2"
              />
            </label>
          </div>
          <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
            نشانی کامل
            <textarea
              className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              rows={4}
              value={form.addressLine}
              onChange={(event) => updateField('addressLine', event.target.value)}
              placeholder="خیابان، کوچه، پلاک و واحد"
              autoComplete="street-address"
            />
          </label>
          <label className="mt-4 flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
            <input
              className="h-4 w-4 accent-primary"
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) => updateField('isDefault', event.target.checked)}
            />
            این آدرس، آدرس اصلی من باشد
          </label>
          {formError || mutationError ? (
            <p
              className="mt-4 border border-warning bg-warning-100 px-4 py-3 text-sm text-warning"
              role="alert"
            >
              {formError || addressErrorMessage(mutationError)}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" disabled={isMutating}>
              {isMutating ? 'در حال ذخیره...' : 'ذخیره آدرس'}
            </Button>
            <Button asChild variant="outline">
              <a href="#account/addresses">انصراف</a>
            </Button>
          </div>
        </form>
      ) : (
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <article
              className={`border bg-surface p-5 shadow-card ${address.isDefault ? 'border-primary' : 'border-border'}`}
              key={address.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  {address.isDefault ? (
                    <span className="section-heading__eyebrow">پیش‌فرض</span>
                  ) : null}
                  <h2 className="mt-2 text-lg">{address.label}</h2>
                </div>
                {address.isDefault ? (
                  <span className="rounded-pill bg-accent-soft px-3 py-1 text-xs text-primary">
                    آدرس اصلی
                  </span>
                ) : null}
              </div>
              <address className="mt-4 not-italic text-sm leading-8 text-muted-foreground">
                <span className="block font-medium text-foreground">{address.recipientName}</span>
                <span className="block" dir="ltr">
                  {address.phone}
                </span>
                <span className="block">
                  {address.province}، {address.city}، {address.addressLine}
                </span>
                <span className="block">
                  کد پستی: <b dir="ltr">{address.postalCode}</b>
                </span>
              </address>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                <a
                  className="text-link"
                  href={`#account/addresses/edit/${encodeURIComponent(address.id)}`}
                >
                  ویرایش <Icon name="edit" size={15} />
                </a>
                {!address.isDefault ? (
                  <button
                    className="min-h-9 text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={isMutating}
                    onClick={() => setDefaultMutation.mutate(address.id)}
                  >
                    انتخاب به عنوان اصلی
                  </button>
                ) : null}
                <button
                  className="min-h-9 text-destructive underline underline-offset-4 transition-colors hover:text-destructive/80 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  disabled={isMutating}
                  onClick={() => {
                    if (window.confirm('آیا از حذف این آدرس مطمئن هستید؟')) {
                      removeMutation.mutate(address.id);
                    }
                  }}
                >
                  حذف
                </button>
              </div>
            </article>
          ))}
          <a
            className="flex min-h-48 flex-col items-center justify-center gap-3 border border-dashed border-border bg-surface text-center text-primary transition-colors hover:border-primary hover:bg-accent-soft"
            href="#account/addresses/create"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <Icon name="plus" size={21} />
            </span>
            <strong>افزودن آدرس جدید</strong>
            <span className="text-xs text-muted-foreground">برای تحویل سریع‌تر سفارش</span>
          </a>
        </div>
      )}
    </main>
  );
}

const previewStateCopy: Record<
  PreviewState,
  {
    eyebrow: string;
    title: string;
    description: string;
    icon: IconName;
    primary: string;
    primaryHref: string;
    secondary?: string;
    secondaryHref?: string;
  }
> = {
  'cart-conflict': {
    eyebrow: 'CART / STOCK CONFLICT',
    title: 'یک کالا در سبد شما تغییر کرده است',
    description:
      'موجودی یا قیمت یکی از کالاها تغییر کرده است. سبد را دوباره بررسی کنید تا مبلغ نهایی دقیق نمایش داده شود.',
    icon: 'warning',
    primary: 'بررسی سبد خرید',
    primaryHref: '#cart',
    secondary: 'ادامه خرید',
    secondaryHref: '#products',
  },
  'payment-pending': {
    eyebrow: 'PAYMENT / PENDING',
    title: 'در حال بررسی پرداخت',
    description:
      'پرداخت شما هنوز توسط درگاه تأیید نشده است. این صفحه را نبندید؛ وضعیت سفارش به‌صورت امن بررسی می‌شود.',
    icon: 'refresh',
    primary: 'پیگیری سفارش',
    primaryHref: '#order/NV-1405-2481',
    secondary: 'بازگشت به خانه',
    secondaryHref: '#home',
  },
  'payment-failed': {
    eyebrow: 'PAYMENT / FAILED',
    title: 'پرداخت انجام نشد',
    description:
      'پرداخت تأیید نشد اما سبد شما حفظ شده است. می‌توانید دوباره تلاش کنید یا روش پرداخت دیگری انتخاب کنید.',
    icon: 'close',
    primary: 'تلاش دوباره',
    primaryHref: '#checkout/payment',
    secondary: 'بازگشت به سبد',
    secondaryHref: '#cart',
  },
  'payment-recovery': {
    eyebrow: 'PAYMENT / RECOVERY',
    title: 'ادامه پرداخت سفارش',
    description:
      'برای تکمیل سفارش، پرداخت را از همان سبد و مبلغ معتبر ادامه دهید. وضعیت نهایی فقط توسط سرور تأیید می‌شود.',
    icon: 'refresh',
    primary: 'ادامه پرداخت',
    primaryHref: '#checkout/payment',
    secondary: 'مشاهده سفارش',
    secondaryHref: '#order/NV-1405-2481',
  },
  offline: {
    eyebrow: 'NOVA / OFFLINE',
    title: 'ارتباط با نوا برقرار نیست',
    description:
      'اتصال اینترنت را بررسی کنید و دوباره تلاش کنید. اطلاعات فرم سفارش تا جای ممکن در همین صفحه حفظ می‌شود.',
    icon: 'refresh',
    primary: 'تلاش دوباره',
    primaryHref: '#home',
    secondary: 'راهنمای پشتیبانی',
    secondaryHref: '#support',
  },
  error: {
    eyebrow: 'NOVA / ERROR',
    title: 'مشکلی پیش آمد',
    description:
      'این پیش‌نمایش نتوانست صفحه را کامل آماده کند. اگر مشکل ادامه داشت، با پشتیبانی نوا در تماس باشید.',
    icon: 'warning',
    primary: 'بازگشت به خانه',
    primaryHref: '#home',
    secondary: 'تماس با پشتیبانی',
    secondaryHref: '#support',
  },
  maintenance: {
    eyebrow: 'NOVA / MAINTENANCE',
    title: 'نوا برای لحظاتی در حال به‌روزرسانی است',
    description: 'فروشگاه به‌زودی دوباره در دسترس خواهد بود. از شکیبایی شما ممنونیم.',
    icon: 'settings',
    primary: 'تلاش دوباره',
    primaryHref: '#home',
  },
};

function PreviewStatePage({ state }: { state: PreviewState }) {
  const copy = previewStateCopy[state];
  return (
    <main className="shell inner-page mx-auto flex min-h-[70svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
      <section className="w-full max-w-2xl border border-border bg-surface px-6 py-14 text-center shadow-card md:px-12">
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
          <Icon name={copy.icon} size={27} />
        </span>
        <span className="section-heading__eyebrow">{copy.eyebrow}</span>
        <h1 className="mx-auto mt-2 max-w-xl text-3xl leading-relaxed">{copy.title}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-muted-foreground">
          {copy.description}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href={copy.primaryHref}>
              {copy.primary} <Icon name="arrow-left" size={17} />
            </a>
          </Button>
          {copy.secondary && copy.secondaryHref ? (
            <Button asChild size="lg" variant="outline">
              <a href={copy.secondaryHref}>{copy.secondary}</a>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ReturnPage({
  mode = 'request',
  queryString = '',
}: {
  mode?: 'request' | 'status';
  queryString?: string;
}) {
  const orderNumber = new URLSearchParams(queryString).get('orderNumber') ?? '';
  const orderQuery = useCustomerOrder(orderNumber, mode === 'request' && Boolean(orderNumber));
  const returnMutation = useRequestCustomerOrderReturn();
  const [reason, setReason] = useState<CustomerReturnReason>('SIZE_PREFERENCE');
  const [note, setNote] = useState('');
  const [unusedConfirmed, setUnusedConfirmed] = useState(false);
  const [unwashedConfirmed, setUnwashedConfirmed] = useState(false);
  const [tagsAttachedConfirmed, setTagsAttachedConfirmed] = useState(false);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number> | null>(null);
  const [formError, setFormError] = useState('');

  if (mode === 'status')
    return (
      <main className="shell inner-page mx-auto flex min-h-[70svh] w-[calc(100%-2rem)] max-w-[1280px] items-center justify-center bg-background">
        <section className="w-full max-w-2xl border border-border bg-surface px-6 py-14 text-center shadow-card md:px-12">
          <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-success-100 text-success">
            <Icon name="refresh" size={27} />
          </span>
          <span className="section-heading__eyebrow">RETURNS / NV-1405-2481</span>
          <h1 className="mx-auto mt-2 max-w-xl text-3xl leading-relaxed">
            درخواست بازگشت در حال بررسی است
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-muted-foreground">
            درخواست شما ثبت شده و تیم پشتیبانی نوا حداکثر تا یک روز کاری نتیجه بررسی را اعلام
            می‌کند.
          </p>
          <div className="mx-auto mt-7 max-w-md border border-border bg-background p-4 text-right text-sm leading-8">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">وضعیت</span>
              <strong className="text-success">در انتظار بررسی</strong>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <span className="text-muted-foreground">کالا</span>
              <strong>مانتوی لینن کمربندی آوا</strong>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <a href="#account/orders">مشاهده سفارش‌ها</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#support">تماس با پشتیبانی</a>
            </Button>
          </div>
        </section>
      </main>
    );

  if (!orderNumber) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="یک سفارش را برای بازگشت انتخاب کنید"
          description="درخواست بازگشت را از صفحه جزئیات همان سفارش شروع کنید."
          action="مشاهده سفارش‌ها"
          href="#account/orders"
        />
      </main>
    );
  }

  if (orderQuery.isPending) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <section
          className="mx-auto max-w-3xl animate-pulse border border-border bg-surface p-8 shadow-card"
          role="status"
          aria-label="در حال بارگذاری سفارش"
        >
          <div className="h-4 w-40 rounded bg-secondary" />
          <div className="mt-5 h-8 w-64 rounded bg-secondary" />
          <div className="mt-8 h-40 rounded bg-secondary" />
        </section>
      </main>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    const needsLogin =
      orderQuery.error instanceof ApiClientError && orderQuery.error.status === 401;
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title={needsLogin ? 'برای درخواست بازگشت وارد شوید' : 'سفارش بارگذاری نشد'}
          description={
            needsLogin
              ? 'برای ثبت درخواست بازگشت، ابتدا با شماره موبایل خود وارد حساب شوید.'
              : apiErrorMessage(orderQuery.error, 'این سفارش پیدا نشد یا قابل مشاهده نیست.')
          }
          action={needsLogin ? 'ورود به حساب' : 'بازگشت به سفارش‌ها'}
          href={needsLogin ? '#auth' : '#account/orders'}
        />
      </main>
    );
  }

  const order = orderQuery.data;
  if (order.status !== 'DELIVERED') {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="این سفارش هنوز قابل بازگشت نیست"
          description="درخواست بازگشت فقط برای سفارش تحویل‌شده و در مهلت تعیین‌شده امکان‌پذیر است."
          action="مشاهده سفارش"
          href={`#order/${encodeURIComponent(order.orderNumber)}`}
        />
      </main>
    );
  }

  if (order.returnRequest) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="درخواست بازگشت این سفارش ثبت شده است"
          description={`وضعیت فعلی درخواست: ${returnRequestStatusCopy[order.returnRequest.status]}`}
          action="مشاهده سفارش"
          href={`#order/${encodeURIComponent(order.orderNumber)}`}
        />
      </main>
    );
  }

  const initialQuantities: Record<string, number> = Object.fromEntries(
    order.items.map((item) => [item.id, item.quantity]),
  );
  const quantities = selectedQuantities ?? initialQuantities;
  const updateQuantity = (itemId: string, quantity: number) => {
    setSelectedQuantities((current) => {
      const next = { ...(current ?? initialQuantities) };
      if (quantity <= 0) delete next[itemId];
      else next[itemId] = quantity;
      return next;
    });
  };
  const submitReturn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    const items = Object.entries(quantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));
    if (!items.length) {
      setFormError('حداقل یک کالا را برای بازگشت انتخاب کنید.');
      return;
    }
    if (!unusedConfirmed || !unwashedConfirmed || !tagsAttachedConfirmed) {
      setFormError('برای ثبت درخواست، شرایط سلامت و برچسب کالا را تأیید کنید.');
      return;
    }

    try {
      await returnMutation.mutateAsync({
        orderNumber: order.orderNumber,
        input: {
          reason,
          note: note.trim() || null,
          unusedConfirmed,
          unwashedConfirmed,
          tagsAttachedConfirmed,
          items,
        },
      });
      window.location.hash = `#order/${encodeURIComponent(order.orderNumber)}`;
    } catch (error) {
      setFormError(apiErrorMessage(error, 'ثبت درخواست بازگشت انجام نشد؛ دوباره تلاش کنید.'));
    }
  };

  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span>درخواست بازگشت</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">NOVA / RETURNS</span>
        <h1>درخواست بازگشت کالا</h1>
        <p>
          سفارش <span dir="ltr">{order.orderNumber}</span> · درخواست شما پس از بررسی شرایط بازگشت،
          توسط تیم پشتیبانی نوا پیگیری می‌شود.
        </p>
      </header>
      <form
        className="mx-auto max-w-3xl border border-border bg-surface p-6 shadow-card md:p-8"
        onSubmit={(event) => void submitReturn(event)}
      >
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">کالاهای موردنظر</legend>
          {order.items.map((item) => {
            const quantity = quantities[item.id] ?? 0;
            return (
              <label className={`option-card ${quantity ? 'is-selected' : ''}`} key={item.id}>
                <input
                  checked={quantity > 0}
                  onChange={(event) => updateQuantity(item.id, event.target.checked ? 1 : 0)}
                  type="checkbox"
                />
                <span>
                  <strong>{item.productName}</strong>
                  <small>
                    {item.sku} · حداکثر {formatPersianNumber(item.quantity)} عدد
                  </small>
                </span>
                <select
                  aria-label={`تعداد ${item.productName}`}
                  disabled={!quantity}
                  value={quantity}
                  onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                >
                  <option value={0}>انتخاب نکنید</option>
                  {Array.from({ length: item.quantity }, (_, index) => index + 1).map((value) => (
                    <option key={value} value={value}>
                      {formatPersianNumber(value)} عدد
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </fieldset>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
          دلیل بازگشت
          <select
            className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            value={reason}
            onChange={(event) => setReason(event.target.value as CustomerReturnReason)}
          >
            {(Object.entries(returnReasonCopy) as Array<[CustomerReturnReason, string]>).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
          توضیحات تکمیلی
          <textarea
            className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            rows={4}
            placeholder="اگر نکته‌ای درباره درخواست خود دارید، اینجا بنویسید."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <fieldset className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <legend className="font-medium text-foreground">تأیید شرایط بازگشت</legend>
          <label className="flex min-h-10 items-center gap-2">
            <input
              checked={unusedConfirmed}
              onChange={(event) => setUnusedConfirmed(event.target.checked)}
              type="checkbox"
            />
            کالا استفاده نشده است.
          </label>
          <label className="flex min-h-10 items-center gap-2">
            <input
              checked={unwashedConfirmed}
              onChange={(event) => setUnwashedConfirmed(event.target.checked)}
              type="checkbox"
            />
            کالا شسته نشده است.
          </label>
          <label className="flex min-h-10 items-center gap-2">
            <input
              checked={tagsAttachedConfirmed}
              onChange={(event) => setTagsAttachedConfirmed(event.target.checked)}
              type="checkbox"
            />
            برچسب کالا متصل است.
          </label>
        </fieldset>
        {formError ? (
          <div className="inline-message inline-message--error" role="alert">
            <Icon name="warning" size={16} />
            {formError}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={returnMutation.isPending} size="lg" type="submit">
            {returnMutation.isPending ? 'در حال ثبت...' : 'ثبت درخواست بازگشت'}
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>انصراف</a>
          </Button>
        </div>
      </form>
    </main>
  );
}

function AccountPage({ section = 'dashboard' }: { section?: string }) {
  const customerQuery = useCurrentCustomer();
  const customer = customerQuery.data;
  const ordersQuery = useCustomerOrders({ page: 1, limit: 10 }, Boolean(customer));
  const logoutMutation = useLogoutCustomer();
  const [logoutError, setLogoutError] = useState('');
  const titles: Record<string, string> = {
    dashboard: 'حساب کاربری',
    profile: 'اطلاعات شخصی',
    addresses: 'آدرس‌ها',
    orders: 'سفارش‌های من',
    support: 'پشتیبانی',
    security: 'امنیت حساب',
    notifications: 'اعلان‌ها',
  };
  const title = titles[section] ?? titles.dashboard;

  if (customerQuery.isPending) {
    return (
      <main className="shell inner-page account-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <section
          className="mx-auto max-w-3xl animate-pulse border border-border bg-surface p-8 shadow-card"
          role="status"
          aria-label="در حال بارگذاری حساب کاربری"
        >
          <div className="h-4 w-32 rounded bg-secondary" />
          <div className="mt-5 h-8 w-56 rounded bg-secondary" />
          <div className="mt-4 h-4 w-full max-w-md rounded bg-secondary" />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="h-36 rounded bg-secondary" />
            <div className="h-36 rounded bg-secondary" />
          </div>
        </section>
      </main>
    );
  }

  if (customerQuery.isError) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="حساب کاربری بارگذاری نشد"
          description={apiErrorMessage(
            customerQuery.error,
            'دریافت اطلاعات حساب ممکن نشد؛ دوباره تلاش کنید.',
          )}
          action="تلاش دوباره"
          onAction={() => void customerQuery.refetch()}
        />
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="برای دیدن حساب خود وارد شوید"
          description="با شماره موبایل وارد شوید تا سفارش‌ها و آدرس‌های شما در نوا نمایش داده شود."
          action="ورود به حساب"
          href="#auth"
        />
      </main>
    );
  }

  const orders = ordersQuery.data?.items ?? [];
  const latestOrder = orders[0];
  const signOut = async () => {
    setLogoutError('');
    try {
      await logoutMutation.mutateAsync();
      window.location.hash = '#home';
    } catch (error) {
      setLogoutError(apiErrorMessage(error, 'خروج از حساب انجام نشد؛ دوباره تلاش کنید.'));
    }
  };

  return (
    <main className="shell inner-page account-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <span>حساب کاربری</span>
      </div>
      <div className="account-layout lg:grid">
        <aside className="account-nav">
          <div className="account-nav__profile">
            <span aria-hidden="true">ن</span>
            <div>
              <strong>{customer.email ?? 'مشتری نوا'}</strong>
              <small dir="ltr">{customer.phone}</small>
            </div>
          </div>
          {Object.entries({
            dashboard: 'نمای کلی',
            orders: 'سفارش‌های من',
            addresses: 'آدرس‌ها',
            profile: 'اطلاعات شخصی',
            support: 'پشتیبانی',
            security: 'امنیت حساب',
            notifications: 'اعلان‌ها',
          }).map(([key, label]) => (
            <a
              className={section === key ? 'is-active' : ''}
              href={`#account${key === 'dashboard' ? '' : `/${key}`}`}
              key={key}
            >
              <Icon
                name={
                  key === 'orders'
                    ? 'package'
                    : key === 'addresses'
                      ? 'home'
                      : key === 'security'
                        ? 'settings'
                        : key === 'notifications'
                          ? 'bell'
                          : key === 'support'
                            ? 'send'
                            : key === 'profile'
                              ? 'user'
                              : 'grid'
                }
                size={17}
              />
              {label}
            </a>
          ))}
          <button
            className="mt-3 flex min-h-11 items-center gap-2 px-3 text-sm text-destructive transition-colors hover:text-destructive-hover disabled:cursor-not-allowed disabled:opacity-50"
            disabled={logoutMutation.isPending}
            onClick={() => void signOut()}
            type="button"
          >
            <Icon name="close" size={17} />
            {logoutMutation.isPending ? 'در حال خروج...' : 'خروج از حساب'}
          </button>
        </aside>
        <section className="account-content">
          <header className="simple-page-header">
            <span className="section-heading__eyebrow">MY NOVA / ۰۱</span>
            <h1>{title}</h1>
            <p>اطلاعات و سفارش‌های شما در یک نگاه.</p>
          </header>
          {logoutError ? (
            <div className="inline-message inline-message--error" role="alert">
              <Icon name="warning" size={16} />
              {logoutError}
            </div>
          ) : null}
          {section !== 'orders' && ordersQuery.isError ? (
            <div className="inline-message inline-message--error" role="alert">
              <Icon name="warning" size={16} />
              {apiErrorMessage(ordersQuery.error, 'دریافت سفارش‌ها ممکن نشد.')}
              <button
                className="mr-auto min-h-8 underline underline-offset-4"
                onClick={() => void ordersQuery.refetch()}
                type="button"
              >
                تلاش دوباره
              </button>
            </div>
          ) : null}
          {section === 'orders' ? (
            ordersQuery.isPending ? (
              <div
                className="account-order-list animate-pulse"
                role="status"
                aria-label="در حال بارگذاری سفارش‌ها"
              >
                {Array.from({ length: 3 }, (_, index) => (
                  <div className="h-20 rounded bg-secondary" key={index} />
                ))}
              </div>
            ) : ordersQuery.isError ? (
              <div className="inline-message inline-message--error" role="alert">
                <Icon name="warning" size={16} />
                {apiErrorMessage(ordersQuery.error, 'دریافت سفارش‌ها ممکن نشد.')}
                <button
                  className="mr-auto min-h-8 underline underline-offset-4"
                  onClick={() => void ordersQuery.refetch()}
                  type="button"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : orders.length ? (
              <div className="account-order-list">
                {orders.map((order) => (
                  <a
                    className="order-card"
                    href={`#order/${encodeURIComponent(order.orderNumber)}`}
                    key={order.orderId}
                  >
                    <div>
                      <span dir="ltr">{order.orderNumber}</span>
                      <small>
                        {formatPersianDate(order.createdAt)} · {formatToman(order.totalToman)}
                      </small>
                    </div>
                    <strong>{orderStatusCopy[order.status]}</strong>
                    <Icon name="arrow-left" size={17} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border bg-surface p-8 text-center">
                <h2 className="text-xl">هنوز سفارشی ثبت نکرده‌اید</h2>
                <p className="mt-3 text-sm leading-8 text-muted-foreground">
                  وقتی اولین خرید خود را انجام دهید، وضعیت آن را همین‌جا دنبال می‌کنید.
                </p>
                <Button asChild className="mt-6">
                  <a href="#products">مشاهده فروشگاه</a>
                </Button>
              </div>
            )
          ) : (
            <div className="account-panels md:grid-cols-2">
              <div className="account-panel">
                <span className="section-heading__eyebrow">آخرین سفارش</span>
                {ordersQuery.isPending ? (
                  <div className="mt-4 animate-pulse space-y-3" role="status">
                    <div className="h-6 w-48 rounded bg-secondary" />
                    <div className="h-4 w-64 rounded bg-secondary" />
                  </div>
                ) : latestOrder ? (
                  <>
                    <h2>
                      سفارش <span dir="ltr">{latestOrder.orderNumber}</span>
                    </h2>
                    <p>
                      {orderStatusCopy[latestOrder.status]} · {formatToman(latestOrder.totalToman)}
                    </p>
                    <a
                      className="text-link"
                      href={`#order/${encodeURIComponent(latestOrder.orderNumber)}`}
                    >
                      مشاهده جزئیات <Icon name="arrow-left" size={15} />
                    </a>
                  </>
                ) : (
                  <>
                    <h2>هنوز سفارشی ندارید</h2>
                    <p>اولین انتخاب خود را از مجموعه نوا شروع کنید.</p>
                    <a className="text-link" href="#products">
                      مشاهده فروشگاه <Icon name="arrow-left" size={15} />
                    </a>
                  </>
                )}
              </div>
              <div className="account-panel">
                <span className="section-heading__eyebrow">دسترسی سریع</span>
                <a href="#account/addresses">
                  مدیریت آدرس‌ها <Icon name="arrow-left" size={15} />
                </a>
                <a href="#support">
                  پرسش‌های متداول <Icon name="arrow-left" size={15} />
                </a>
                <a href="#size-guide">
                  راهنمای اندازه <Icon name="arrow-left" size={15} />
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function OrderPage({ orderNumber }: { orderNumber: string }) {
  const orderQuery = useCustomerOrder(orderNumber);

  if (orderQuery.isPending) {
    return (
      <main className="shell inner-page order-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <section
          className="order-layout animate-pulse lg:grid"
          role="status"
          aria-label="در حال بارگذاری سفارش"
        >
          <div className="h-80 rounded bg-secondary" />
          <div className="h-64 rounded bg-secondary" />
        </section>
      </main>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="سفارش بارگذاری نشد"
          description={apiErrorMessage(
            orderQuery.error,
            'این سفارش پیدا نشد یا دیگر در حساب شما قابل مشاهده نیست.',
          )}
          action="بازگشت به سفارش‌ها"
          href="#account/orders"
        />
      </main>
    );
  }

  const order = orderQuery.data;
  const events = order.events.length
    ? order.events.map((event, index) => ({
        title:
          index === 0
            ? 'سفارش ثبت شد'
            : event.toStatus
              ? orderStatusCopy[event.toStatus]
              : 'به‌روزرسانی سفارش',
        copy: formatPersianDate(event.createdAt),
        done: true,
      }))
    : [
        {
          title: orderStatusCopy[order.status],
          copy: formatPersianDate(order.updatedAt),
          done: true,
        },
      ];
  const address = order.address;
  return (
    <main className="shell inner-page order-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span dir="ltr">{order.orderNumber}</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">
          ORDER / <span dir="ltr">{order.orderNumber}</span>
        </span>
        <h1>پیگیری سفارش</h1>
        <p>
          {orderStatusCopy[order.status]} · ثبت‌شده در {formatPersianDate(order.createdAt)}
        </p>
      </header>
      <div className="order-layout lg:grid">
        <section className="timeline-card">
          <h2>مسیر سفارش</h2>
          {events.map((event) => (
            <div className={`timeline-event ${event.done ? 'is-done' : ''}`} key={event.title}>
              <span className="timeline-event__dot">
                <Icon name={event.done ? 'check' : 'package'} size={14} />
              </span>
              <div>
                <strong>{event.title}</strong>
                <small>{event.copy}</small>
              </div>
            </div>
          ))}
        </section>
        <aside className="summary-card">
          <span className="section-heading__eyebrow">تحویل به</span>
          <h2>{address?.recipientName ?? 'آدرس ثبت نشده'}</h2>
          <p>
            {address
              ? `${address.province}، ${address.city}، ${address.addressLine}`
              : 'آدرس تحویل برای این سفارش ثبت نشده است.'}
          </p>
          {address ? <p dir="ltr">{address.phone}</p> : null}
          {order.shipment?.trackingReference ? (
            <p>
              کد رهگیری: <span dir="ltr">{order.shipment.trackingReference}</span>
            </p>
          ) : null}
          <div className="summary-card__total">
            <span>مبلغ سفارش</span>
            <strong>{formatToman(order.totalToman)}</strong>
          </div>
          <a className="text-link" href="#support">
            نیاز به کمک دارید؟ <Icon name="arrow-left" size={15} />
          </a>
          {order.status === 'DELIVERED' && !order.returnRequest ? (
            <a
              className="text-link"
              href={`#return/request?orderNumber=${encodeURIComponent(order.orderNumber)}`}
            >
              درخواست بازگشت کالا <Icon name="arrow-left" size={15} />
            </a>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function EditorialPage({ page }: { page: string }) {
  const content: Record<
    string,
    { eyebrow: string; title: string; description: string; image: string }
  > = {
    campaign: {
      eyebrow: 'COLLECTION / ۰۱',
      title: 'فصلِ جزئیات آرام',
      description:
        'روایت پاییز نوا از پارچه‌های طبیعی، فرم‌های ساده و لباس‌هایی که با زندگی روزمره همراه می‌شوند.',
      image: '/assets/nova-women-lifestyle.webp',
    },
    guide: {
      eyebrow: 'NOVA / GUIDE',
      title: 'راهنمای انتخاب لباس',
      description: 'از اندازه‌گیری تا انتخاب فیت؛ چند نکته ساده برای خریدی که بیشتر با شما بماند.',
      image: '/assets/nova-materials.webp',
    },
    article: {
      eyebrow: 'ATELIER NOTES / ۰۲',
      title: 'چرا متریال مهم است؟',
      description:
        'وقتی پارچه را بهتر می‌شناسیم، لباس را هم بهتر انتخاب می‌کنیم. یادداشتی از آتلیه نوا.',
      image: '/assets/nova-materials.webp',
    },
    lookbook: {
      eyebrow: 'LOOKBOOK / ۰۳',
      title: 'چند لایه برای یک روز',
      description: 'چهار ترکیب ساده برای روزهایی که هوا بین دو فصل ایستاده است.',
      image: '/assets/nova-hero-men.webp',
    },
    about: {
      eyebrow: 'ABOUT NOVA',
      title: 'لباس، با فکرِ روزمره',
      description:
        'نوا یک فروشگاه پوشاک ایرانی است؛ برای انتخاب‌هایی که ساده شروع می‌شوند و مدت‌ها ادامه دارند.',
      image: '/assets/nova-women-lifestyle.webp',
    },
    trust: {
      eyebrow: 'NOVA / TRUST',
      title: 'اعتماد، بخشی از طراحی است',
      description:
        'اطلاعات روشن، پشتیبانی انسانی و فرایندی که از انتخاب تا تحویل کنار شما می‌ماند.',
      image: '/assets/nova-materials.webp',
    },
    'size-guide': {
      eyebrow: 'NOVA / SIZE GUIDE',
      title: 'راهنمای اندازه',
      description:
        'با چند اندازه‌گیری ساده، فیت مناسب خود را پیدا کنید و با خیال راحت‌تر انتخاب کنید.',
      image: '/assets/nova-materials.webp',
    },
    'shipping-policy': {
      eyebrow: 'NOVA / SHIPPING',
      title: 'ارسال و تحویل',
      description:
        'سفارش‌ها با بسته‌بندی امن به سراسر ایران ارسال می‌شوند؛ زمان تحویل هر روش پیش از پرداخت نمایش داده می‌شود.',
      image: '/assets/nova-hero-men.webp',
    },
    'returns-policy': {
      eyebrow: 'NOVA / RETURNS',
      title: 'بازگشت کالا',
      description:
        'اگر انتخاب شما مناسب نبود، شرایط و مهلت بازگشت را روشن و مرحله‌به‌مرحله در اختیار شما گذاشته‌ایم.',
      image: '/assets/nova-women-lifestyle.webp',
    },
    'care-guide': {
      eyebrow: 'NOVA / CARE',
      title: 'راهنمای مراقبت',
      description:
        'با نگهداری درست از پارچه و دوخت، لباس‌های نوا برای مدت طولانی‌تری همراه شما می‌مانند.',
      image: '/assets/nova-materials.webp',
    },
    faq: {
      eyebrow: 'NOVA / FAQ',
      title: 'پرسش‌های متداول',
      description:
        'پاسخ پرسش‌های رایج درباره اندازه، ارسال، پرداخت و بازگشت را در یک صفحه جمع کرده‌ایم.',
      image: '/assets/nova-materials.webp',
    },
    contact: {
      eyebrow: 'NOVA / CONTACT',
      title: 'با نوا در تماس باشید',
      description:
        'برای راهنمایی انتخاب، پیگیری سفارش یا هر پرسش دیگر، تیم پشتیبانی نوا کنار شماست.',
      image: '/assets/nova-women-lifestyle.webp',
    },
    privacy: {
      eyebrow: 'NOVA / PRIVACY',
      title: 'حریم خصوصی',
      description:
        'اطلاعات شما فقط برای ارائه خدمات نوا و تکمیل سفارش استفاده می‌شود و با دقت محافظت خواهد شد.',
      image: '/assets/nova-materials.webp',
    },
    terms: {
      eyebrow: 'NOVA / TERMS',
      title: 'شرایط استفاده',
      description: 'قوانین روشن برای خرید، پرداخت، ارسال و استفاده از خدمات فروشگاه نوا.',
      image: '/assets/nova-materials.webp',
    },
    support: {
      eyebrow: 'NOVA / SUPPORT',
      title: 'پشتیبانی نوا',
      description:
        'اگر در انتخاب یا پیگیری سفارش به کمک نیاز دارید، از مسیرهای پشتیبانی نوا با ما در ارتباط باشید.',
      image: '/assets/nova-women-lifestyle.webp',
    },
  };
  const data = content[page] ?? content.article;
  if (!data) return <NotFoundPage />;
  return (
    <main className="shell inner-page editorial-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <span>{data.title}</span>
      </div>
      <section className="editorial-hero lg:grid">
        <img src={data.image} alt="" />
        <div>
          <span className="folio-mark">{data.eyebrow}</span>
          <h1>{data.title}</h1>
          <p>{data.description}</p>
        </div>
      </section>
      <article className="reading-column">
        <p>
          ما در نوا به لباس به‌عنوان بخشی از زندگی نگاه می‌کنیم؛ چیزی که باید با بدن، زمان و روزهای
          واقعی شما هماهنگ باشد.
        </p>
        <h2>سادگی، وقتی دقیق باشد</h2>
        <p>
          انتخاب پارچه، برش، رنگ و حتی بسته‌بندی، کنار هم تجربه‌ای می‌سازند که قرار نیست شلوغ باشد.
          این صفحه یک پیش‌نمایش از محتوای تحریریه و راهنمای خرید نواست.
        </p>
        <div className="reading-note">
          <Icon name="sparkles" size={21} />
          <span>این بخش برای محتوای واقعی، قابل ویرایش و آماده اتصال به API محتواست.</span>
        </div>
      </article>
      <section className="home-section">
        <SectionHeading title="قطعات مرتبط" action="رفتن به فروشگاه" href="#products" />
        <ProductGrid
          items={products.slice(0, 4)}
          isWishlisted={() => false}
          onToggleWishlist={() => undefined}
          onAdd={() => undefined}
        />
      </section>
    </main>
  );
}

function PublishedContentPage({ slug }: { slug: string }) {
  const query = useContentPage(slug);

  useEffect(() => {
    const initial = readInitialRenderContext();
    const initialMatches =
      initial &&
      initial.hashRoute === `#content/${slug}` &&
      normalizeSeoPath(initial.path) === normalizeSeoPath(window.location.pathname);

    if (query.isError || !query.data) {
      if (query.isPending && initialMatches) return;
      if (query.isPending) {
        applySeoDocument(
          document,
          createSeoDocument({
            origin: window.location.origin,
            title: 'NOVA | محتوا',
            description: 'در حال بارگذاری محتوای منتشرشده.',
            noIndex: true,
          }),
        );
        return;
      }
      applySeoDocument(
        document,
        createSeoDocument({
          origin: window.location.origin,
          title: 'NOVA | محتوا',
          description: 'این صفحه محتوا پیدا نشد.',
          noIndex: true,
        }),
      );
      return;
    }
    if (initialMatches) {
      applySeoDocument(document, initial.seo);
      return;
    }

    const description = query.data.body?.slice(0, 320) ?? query.data.title;
    const canonicalPath = `/content/${encodeURIComponent(slug)}`;
    applySeoDocument(
      document,
      createSeoDocument({
        origin: window.location.origin,
        title: `NOVA | ${query.data.title}`,
        description,
        canonicalPath,
        type: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: query.data.title,
          description,
          url: `${window.location.origin}${canonicalPath}`,
          inLanguage: 'fa-IR',
        },
      }),
    );
  }, [query.data, query.isError, query.isPending, slug]);

  if (query.isPending) {
    return (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="در حال بارگذاری محتوا"
          description="محتوای منتشرشده در حال آماده‌سازی است."
          action="بازگشت به خانه"
          href="#home"
        />
      </main>
    );
  }
  if (query.isError || !query.data) {
    return query.error instanceof ApiClientError && query.error.status === 404 ? (
      <NotFoundPage />
    ) : (
      <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
        <EmptyState
          title="محتوا در دسترس نیست"
          description="بارگذاری این صفحه ممکن نشد؛ دوباره تلاش کنید."
          action="بازگشت به خانه"
          href="#home"
        />
      </main>
    );
  }

  const page = query.data;
  return (
    <main className="shell inner-page editorial-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <div className="breadcrumb">
        <a href="#home">خانه</a>
        <span>/</span>
        <span>{page.title}</span>
      </div>
      <section className="editorial-hero">
        <div>
          <span className="folio-mark">NOVA / CONTENT</span>
          <h1>{page.title}</h1>
        </div>
      </section>
      <article className="reading-column">
        {page.body ? <p>{page.body}</p> : null}
        {page.blocks.map((block) => (
          <p key={`${block.kind}-${block.sortOrder}`}>
            {typeof block.payload === 'string'
              ? block.payload
              : typeof block.payload === 'object' &&
                  block.payload !== null &&
                  'text' in block.payload
                ? String((block.payload as { text: unknown }).text)
                : ''}
          </p>
        ))}
      </article>
    </main>
  );
}

type AdminStatusTone = 'success' | 'info' | 'warning' | 'neutral';

const adminStatusClasses: Record<AdminStatusTone, string> = {
  success: 'bg-success-100 text-success',
  info: 'bg-info-100 text-info',
  warning: 'bg-warning-100 text-warning',
  neutral: 'bg-secondary text-muted-foreground',
};

function AdminStatusChip({
  tone = 'neutral',
  children,
}: {
  tone?: AdminStatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md px-2.5 py-1 text-[10px] font-medium ${adminStatusClasses[tone]}`}
    >
      {children}
    </span>
  );
}

function AdminMetricCard({
  label,
  value,
  note,
  icon,
  iconTone,
  orderClass,
}: {
  label: string;
  value: string;
  note: string;
  icon: IconName;
  iconTone: string;
  orderClass: string;
}) {
  return (
    <article
      className={`flex min-h-[124px] flex-col justify-between border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-float md:p-5 ${orderClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${iconTone}`}
        >
          <Icon name={icon} size={20} />
        </span>
        <span className="text-right text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <strong className="block font-display text-2xl leading-none tracking-tight text-foreground md:text-[27px]">
          {value}
        </strong>
        <span className="mt-2 block text-[10px] text-success">{note}</span>
      </div>
    </article>
  );
}

function AdminSalesChart() {
  const labels = ['۱ مرداد', '۵ مرداد', '۱۰ مرداد', '۱۵ مرداد', '۲۰ مرداد', '۲۵ مرداد', '۳۰ مرداد'];
  return (
    <section
      className="overflow-hidden border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="sales-chart-title"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="text-right">
          <span className="section-heading__eyebrow">ANALYTICS / ۳۰ روز</span>
          <h2 id="sales-chart-title" className="mt-1 text-lg md:text-xl">
            فروش و درآمد
          </h2>
        </div>
        <button
          className="inline-flex min-h-10 items-center gap-2 border border-border bg-background px-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          type="button"
        >
          ۳۰ روز گذشته <Icon name="chevron-down" size={14} />
        </button>
      </header>
      <div className="mt-4 flex flex-wrap justify-end gap-4 text-[10px] text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-primary" />
          درآمد (تومان)
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="h-2.5 w-2.5 rounded-full bg-border" />
          تعداد سفارش
        </span>
      </div>
      <div className="mt-2 overflow-x-auto">
        <svg
          className="h-[180px] min-w-[560px] w-full"
          viewBox="0 0 680 230"
          role="img"
          aria-label="نمودار فروش و درآمد در ۳۰ روز گذشته"
          preserveAspectRatio="none"
        >
          <g stroke="currentColor" className="text-border" strokeWidth="1" opacity="0.7">
            <line x1="34" y1="24" x2="650" y2="24" />
            <line x1="34" y1="67" x2="650" y2="67" />
            <line x1="34" y1="110" x2="650" y2="110" />
            <line x1="34" y1="153" x2="650" y2="153" />
            <line x1="34" y1="196" x2="650" y2="196" />
          </g>
          <path
            d="M34 177 C72 178 74 159 112 158 S145 146 168 142 S202 126 230 132 S268 155 292 145 S330 100 356 108 S391 155 420 146 S458 121 482 131 S518 99 548 110 S600 119 650 94"
            fill="none"
            stroke="#712D42"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M34 188 C72 182 76 175 112 179 S150 166 168 172 S200 160 230 168 S267 183 292 173 S330 145 356 157 S388 181 420 176 S456 158 482 165 S520 144 548 153 S604 158 650 145"
            fill="none"
            stroke="#C9C2BC"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M34 177 C72 178 74 159 112 158 S145 146 168 142 S202 126 230 132 S268 155 292 145 S330 100 356 108 S391 155 420 146 S458 121 482 131 S518 99 548 110 S600 119 650 94 L650 196 L34 196 Z"
            fill="#712D42"
            opacity="0.08"
          />
          <g fill="#712D42">
            <circle cx="34" cy="177" r="4" />
            <circle cx="112" cy="158" r="4" />
            <circle cx="168" cy="142" r="4" />
            <circle cx="230" cy="132" r="4" />
            <circle cx="292" cy="145" r="4" />
            <circle cx="356" cy="108" r="4" />
            <circle cx="420" cy="146" r="4" />
            <circle cx="482" cy="131" r="4" />
            <circle cx="548" cy="110" r="4" />
            <circle cx="650" cy="94" r="4" />
          </g>
        </svg>
      </div>
      <div className="flex justify-between gap-2 pr-8 text-[9px] text-muted-foreground" dir="ltr">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </section>
  );
}

function AdminOrderStatus() {
  const statuses = [
    { label: 'در حال پردازش', value: '۲۸٪', color: 'bg-[#d9d1c8]' },
    { label: 'ارسال شده', value: '۴۵٪', color: 'bg-primary' },
    { label: 'تحویل شده', value: '۱۸٪', color: 'bg-[#989492]' },
    { label: 'لغو شده', value: '۶٪', color: 'bg-[#ef7a9d]' },
    { label: 'بازگشت', value: '۳٪', color: 'bg-[#e5ddd5]' },
  ];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="order-status-title"
    >
      <header className="flex items-center justify-between">
        <h2 id="order-status-title" className="text-lg md:text-xl">
          وضعیت سفارش‌ها
        </h2>
        <Icon name="package" size={18} className="text-muted-foreground" />
      </header>
      <div className="mt-5 flex items-center justify-center gap-5">
        <div className="relative h-40 w-40 shrink-0">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 120 120"
            role="img"
            aria-label="۸۴۲ سفارش کل"
          >
            <circle cx="60" cy="60" r="42" fill="none" stroke="#f1ece6" strokeWidth="16" />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#712D42"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="45 55"
              strokeDashoffset="0"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#989492"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="18 82"
              strokeDashoffset="-45"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#d9d1c8"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="28 72"
              strokeDashoffset="-63"
            />
            <circle
              cx="60"
              cy="60"
              r="42"
              fill="none"
              stroke="#ef7a9d"
              strokeWidth="16"
              pathLength="100"
              strokeDasharray="6 94"
              strokeDashoffset="-91"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] text-muted-foreground">کل سفارش‌ها</span>
            <strong className="mt-1 font-display text-2xl">۸۴۲</strong>
          </div>
        </div>
        <ul className="flex min-w-0 flex-1 flex-col gap-3 text-[10px] text-muted-foreground">
          {statuses.map((status) => (
            <li className="flex items-center justify-between gap-3" key={status.label}>
              <span className="inline-flex items-center gap-2">
                <i className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.color}`} />
                {status.label}
              </span>
              <strong className="text-foreground">{status.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const adminLatestOrders = [
  {
    id: '#10042',
    customer: 'علی محمدی',
    amount: '۱٬۲۴۰٬۰۰۰ تومان',
    status: 'در حال پردازش',
    tone: 'info' as AdminStatusTone,
    time: 'امروز ۱۴:۳۲',
  },
  {
    id: '#10041',
    customer: 'سارا رضایی',
    amount: '۳٬۸۵۰٬۰۰۰ تومان',
    status: 'ارسال شده',
    tone: 'success' as AdminStatusTone,
    time: 'امروز ۱۴:۱۸',
  },
  {
    id: '#10040',
    customer: 'مهدی حسینی',
    amount: '۹۸۰٬۰۰۰ تومان',
    status: 'در انتظار پرداخت',
    tone: 'warning' as AdminStatusTone,
    time: 'امروز ۱۴:۰۶',
  },
  {
    id: '#10039',
    customer: 'نازنین احمدی',
    amount: '۴٬۲۹۰٬۰۰۰ تومان',
    status: 'تکمیل شد',
    tone: 'success' as AdminStatusTone,
    time: 'دیروز ۲۲:۴۱',
  },
  {
    id: '#10038',
    customer: 'رضا کریمی',
    amount: '۲٬۱۱۰٬۰۰۰ تومان',
    status: 'ارسال شده',
    tone: 'success' as AdminStatusTone,
    time: 'دیروز ۱۸:۵۵',
  },
];

function AdminLatestOrders({ className = '' }: { className?: string }) {
  return (
    <section
      className={`border border-border bg-surface p-4 shadow-card md:p-5 ${className}`}
      aria-labelledby="latest-orders-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="latest-orders-title" className="text-base md:text-lg">
          آخرین سفارش‌ها
        </h2>
        <a className="text-link text-xs" href="#admin/orders">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {adminLatestOrders.map((order) => (
          <a
            className="grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-2.5 text-right last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-3"
            href={`#admin/orders/${order.id.slice(1)}`}
            key={order.id}
          >
            <span className="font-latin text-[10px] text-muted-foreground" dir="ltr">
              {order.id}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-xs font-medium">{order.customer}</strong>
              <small className="mt-1 block text-[9px] text-muted-foreground">{order.time}</small>
            </span>
            <span className="hidden text-[10px] text-muted-foreground md:block">
              {order.amount}
            </span>
            <AdminStatusChip tone={order.tone}>{order.status}</AdminStatusChip>
          </a>
        ))}
      </div>
    </section>
  );
}

function AdminNewCustomers() {
  const customers = [
    {
      name: 'آرمان صادقی',
      email: 'arman.sadeghi@gmail.com',
      time: 'امروز ۱۳:۳۰',
      image: '/assets/nova-hero-men.webp',
    },
    {
      name: 'نگین مرادی',
      email: 'negin.moradi@gmail.com',
      time: 'امروز ۱۱:۴۵',
      image: '/assets/nova-women-lifestyle.webp',
    },
    {
      name: 'علی کاظمی',
      email: 'ali.kazemi@gmail.com',
      time: 'امروز ۱۰:۱۸',
      image: '/assets/nova-children-lifestyle.webp',
    },
    {
      name: 'مهسا محمدی',
      email: 'mahsa.mohammadi@gmail.com',
      time: 'دیروز ۱۷:۳۶',
      image: '/assets/nova-materials.webp',
    },
    {
      name: 'سینا رضایی',
      email: 'sina.rezaei@gmail.com',
      time: 'دیروز ۱۵:۱۲',
      image: '/assets/nova-product-oxford-shirt.webp',
    },
  ];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="new-customers-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="new-customers-title" className="text-base md:text-lg">
          مشتریان جدید
        </h2>
        <a className="text-link text-xs" href="#admin/customers">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {customers.map((customer) => (
          <div
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
            key={customer.email}
          >
            <img
              className="h-9 w-9 shrink-0 rounded-full object-cover"
              src={customer.image}
              alt=""
            />
            <div className="min-w-0 flex-1 text-right">
              <strong className="block truncate text-xs font-medium">{customer.name}</strong>
              <small className="mt-1 block truncate text-[9px] text-muted-foreground" dir="ltr">
                {customer.email}
              </small>
            </div>
            <time className="shrink-0 text-[9px] text-muted-foreground">{customer.time}</time>
          </div>
        ))}
      </div>
    </section>
  );
}

function AdminPopularProducts() {
  const sales = ['۳۴۸', '۲۹۱', '۱۸۶', '۱۷۳', '۱۵۹'];
  return (
    <section
      className="border border-border bg-surface p-4 shadow-card md:p-5"
      aria-labelledby="popular-products-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="popular-products-title" className="text-base md:text-lg">
          محصولات پرفروش
        </h2>
        <a className="text-link text-xs" href="#admin/products">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {products.slice(0, 5).map((product, index) => (
          <a
            className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0"
            href={`#product/${product.slug}`}
            key={product.slug}
          >
            <img
              className="h-11 w-11 shrink-0 rounded-md bg-background object-contain p-1"
              src={product.image}
              alt=""
            />
            <span className="min-w-0 flex-1 text-right">
              <strong className="block truncate text-xs font-medium">{product.name}</strong>
              <small className="mt-1 block text-[10px] text-muted-foreground">
                {sales[index] ?? '۱۲۴'} فروش
              </small>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function AdminCampaignBanner() {
  return (
    <a
      className="relative isolate flex min-h-[120px] items-center overflow-hidden bg-primary-hover p-5 text-primary-foreground shadow-card md:min-h-[132px] md:px-8"
      href="#campaign"
    >
      <img
        className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40"
        src="/assets/nova-women-lifestyle.webp"
        alt=""
      />
      <span className="absolute inset-0 -z-10 bg-primary-hover/65" />
      <div className="relative ml-auto max-w-lg text-right">
        <span className="section-heading__eyebrow !text-primary-foreground/75">
          NOVA / AUTUMN ۱۴۰۵
        </span>
        <h2 className="mt-1 text-xl md:text-2xl">مجموعه پاییز ۱۴۰۵</h2>
        <p className="mt-1 text-xs leading-7 text-primary-foreground/80">
          الهام از سادگی، ساخته برای زندگی امروز
        </p>
      </div>
      <span className="relative hidden min-h-10 items-center gap-2 border border-primary-foreground/50 bg-primary-foreground px-4 text-xs text-primary-hover md:inline-flex">
        مشاهده و ویرایش <Icon name="arrow-left" size={15} />
      </span>
    </a>
  );
}

function AdminDashboard() {
  const metrics = [
    {
      label: 'محصولات فعال',
      value: '۱٬۲۴۶',
      note: '↑ ۵٪ از ماه گذشته',
      icon: 'package' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-3 xl:order-1',
    },
    {
      label: 'درآمد کل',
      value: '۲۹۸٬۵۰۰٬۰۰۰',
      note: '↑ ۱۸٪ از ماه گذشته',
      icon: 'tag' as IconName,
      iconTone: 'bg-warning-100 text-warning',
      orderClass: 'order-4 xl:order-2',
    },
    {
      label: 'مشتریان جدید',
      value: '۳۴۲',
      note: '↑ ۸٪ از ماه گذشته',
      icon: 'user' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-1 xl:order-3',
    },
    {
      label: 'سفارش‌های جدید',
      value: '۱۲۸',
      note: '↑ ۱۲٪ از ماه گذشته',
      icon: 'bag' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-2 xl:order-4',
    },
  ];
  return (
    <div className="mx-auto max-w-[1120px] space-y-4 md:space-y-5">
      <header className="flex flex-col gap-4 py-1 md:flex-row md:items-end md:justify-between">
        <div className="text-right">
          <span className="section-heading__eyebrow">NOVA / ADMIN DASHBOARD</span>
          <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">
            خوش آمدید، رضا <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-xs leading-7 text-muted-foreground">
            امروز روز خوبی برای ساختن یک برند بهتر است.
          </p>
        </div>
        <button
          className="inline-flex min-h-10 w-max items-center gap-2 border border-border bg-surface px-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          type="button"
        >
          ۳۰ روز گذشته <Icon name="chevron-down" size={14} />
        </button>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="شاخص‌های کلیدی">
        {metrics.map((metric) => (
          <AdminMetricCard {...metric} key={metric.label} />
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.45fr)]">
        <div className="hidden xl:block">
          <AdminOrderStatus />
        </div>
        <AdminSalesChart />
      </div>
      <div className="xl:hidden">
        <AdminLatestOrders />
      </div>
      <div className="hidden gap-4 xl:grid xl:grid-cols-[minmax(230px,0.8fr)_minmax(0,1.4fr)_minmax(260px,0.9fr)]">
        <AdminNewCustomers />
        <AdminLatestOrders />
        <AdminPopularProducts />
      </div>
      <AdminCampaignBanner />
    </div>
  );
}

function staffLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 429) {
      return 'تعداد تلاش‌ها بیش از حد مجاز است؛ کمی بعد دوباره تلاش کنید.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'ایمیل، رمز عبور یا کد تأیید دومرحله‌ای نادرست است.';
    }
    if (error.status === 422) {
      return 'اطلاعات ورود را با قالب درست وارد کنید.';
    }
  }
  return 'ورود به فضای مدیریت انجام نشد؛ دوباره تلاش کنید.';
}

function AdminLoginPage({ sessionExpired = false }: { sessionExpired?: boolean }) {
  const loginMutation = useStaffLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [factor, setFactor] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    loginMutation.mutate(
      { email, password, factor },
      {
        onSuccess: () => {
          window.location.hash = '#admin';
        },
        onError: (error) => setFormError(staffLoginErrorMessage(error)),
      },
    );
  };

  return (
    <main
      className="flex min-h-svh items-center justify-center bg-primary-hover px-4 py-12"
      dir="rtl"
    >
      <section className="w-full max-w-md bg-surface p-7 text-right shadow-float md:p-10">
        <Logo />
        <span className="section-heading__eyebrow mt-12">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-3xl leading-relaxed">ورود به فضای مدیریت</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          برای ادامه، رمز عبور و کد تأیید دومرحله‌ای مدیر را وارد کنید.
        </p>
        {sessionExpired ? (
          <p
            className="mt-4 border border-accent-soft bg-accent-soft/40 px-3 py-2 text-sm leading-7 text-foreground"
            role="status"
          >
            نشست مدیریت منقضی شده است؛ برای ادامه دوباره وارد شوید.
          </p>
        ) : null}
        <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-email">
            ایمیل سازمانی
            <input
              id="staff-email"
              className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              dir="ltr"
              name="email"
              autoComplete="username"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-password">
            رمز عبور
            <input
              id="staff-password"
              className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              dir="ltr"
              name="password"
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="staff-factor">
            کد تأیید دومرحله‌ای یا کد بازیابی
            <input
              id="staff-factor"
              className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              dir="ltr"
              name="factor"
              autoComplete="one-time-code"
              inputMode="numeric"
              required
              type="text"
              value={factor}
              onChange={(event) => setFactor(event.target.value)}
            />
          </label>
          {formError ? (
            <p className="text-sm leading-7 text-primary" role="alert" aria-live="polite">
              {formError}
            </p>
          ) : null}
          <Button size="lg" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'در حال بررسی...' : 'ورود به پنل'}
          </Button>
        </form>
        <a className="text-link mt-5" href="#home">
          بازگشت به فروشگاه <Icon name="arrow-left" size={15} />
        </a>
      </section>
    </main>
  );
}

function AdminLogoutButton({
  className = '',
  compact = false,
  label = 'خروج از حساب',
}: {
  className?: string;
  compact?: boolean;
  label?: string;
}) {
  const logoutMutation = useStaffLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        window.location.hash = '#admin/login';
      },
    });
  };

  return (
    <button
      className={className}
      type="button"
      disabled={logoutMutation.isPending}
      aria-busy={logoutMutation.isPending}
      aria-label={compact ? label : undefined}
      onClick={handleLogout}
    >
      <Icon name="arrow-right" size={17} />
      {compact ? (
        <span className="sr-only">{logoutMutation.isPending ? 'در حال خروج...' : label}</span>
      ) : logoutMutation.isPending ? (
        'در حال خروج...'
      ) : (
        label
      )}
    </button>
  );
}

export function AdminLegacyPage({ page }: { page: string }) {
  const titleMap: Record<string, string> = {
    admin: 'نمای کلی',
    products: 'محصولات',
    categories: 'دسته‌بندی‌ها',
    inventory: 'موجودی',
    orders: 'سفارش‌ها',
    payments: 'پرداخت‌ها',
    promotions: 'کدهای تخفیف',
    customers: 'مشتری‌ها',
    content: 'محتوا',
    audit: 'گزارش فعالیت',
    operations: 'عملیات',
    login: 'ورود مدیر',
    'products/new': 'محصول جدید',
    'products/linen-overshirt/edit': 'ویرایش محصول',
    'products/linen-overshirt/variants': 'تنوع‌ها',
    'products/linen-overshirt/media': 'رسانه محصول',
    'orders/NV-1405-2481': 'جزئیات سفارش',
  };
  const title = titleMap[page] ?? 'پنل مدیریت';
  const nav = [
    ['admin', 'نمای کلی', 'grid'],
    ['products', 'محصولات', 'shirt'],
    ['categories', 'دسته‌بندی‌ها', 'layers'],
    ['inventory', 'موجودی', 'warehouse'],
    ['orders', 'سفارش‌ها', 'package'],
    ['payments', 'پرداخت‌ها', 'tag'],
    ['customers', 'مشتری‌ها', 'users'],
    ['content', 'محتوا', 'book'],
    ['audit', 'گزارش فعالیت', 'eye'],
  ].map(([key, label, icon]) => ({ key, label, icon: icon as IconName }));
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <span className="admin-sidebar__label">فضای مدیریت</span>
        {nav.map((item) => (
          <a
            className={page === item.key ? 'is-active' : ''}
            href={`#admin${item.key === 'admin' ? '' : `/${item.key}`}`}
            key={item.key}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </a>
        ))}
        <AdminLogoutButton className="admin-sidebar__logout flex min-h-11 w-full items-center gap-2 border-0 bg-transparent px-[11px] text-right text-xs text-inherit transition-colors hover:bg-secondary disabled:opacity-50" />
      </aside>
      <section className="admin-content">
        <header className="admin-topbar">
          <AdminLogoutButton
            compact
            label="خروج"
            className="icon-button border-0 md:hidden disabled:opacity-50"
          />
          <button className="icon-button" type="button" aria-label="اعلان‌ها">
            <Icon name="bell" size={19} />
          </button>
          <div>
            <span>سلام، مدیر نوا</span>
            <small>آخرین ورود: امروز ۱۰:۲۴</small>
          </div>
        </header>
        <div className="admin-page">
          <div className="admin-page__heading">
            <div>
              <span className="section-heading__eyebrow">NOVA / ADMIN</span>
              <h1>{title}</h1>
            </div>
            <div className="admin-page__actions">
              <button className="admin-secondary" type="button">
                <Icon name="settings" size={16} />
                تنظیمات
              </button>
              {page === 'products' ? (
                <Button asChild>
                  <a href="#admin/products/new">
                    <Icon name="plus" size={17} />
                    محصول جدید
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="admin-stat-grid">
            <div>
              <span>سفارش‌های امروز</span>
              <strong>۲۴</strong>
              <small className="stat-up">+۱۲٪ نسبت به دیروز</small>
            </div>
            <div>
              <span>در انتظار بررسی</span>
              <strong>۸</strong>
              <small>۳ پرداخت نیازمند توجه</small>
            </div>
            <div>
              <span>موجودی کم</span>
              <strong>۶</strong>
              <small className="stat-warning">نیازمند اقدام</small>
            </div>
            <div>
              <span>فروش این ماه</span>
              <strong>۲۴۹٬۸۰۰٬۰۰۰</strong>
              <small>تومان</small>
            </div>
          </div>
          <div className="admin-panels">
            <section className="admin-panel admin-panel--wide">
              <div className="admin-panel__heading">
                <h2>
                  {page === 'orders'
                    ? 'صف سفارش‌ها'
                    : page === 'products'
                      ? 'محصولات اخیر'
                      : 'کارهای نیازمند اقدام'}
                </h2>
                <a className="text-link" href="#admin/orders">
                  مشاهده همه <Icon name="arrow-left" size={15} />
                </a>
              </div>
              {[
                ['NV-1405-2481', 'مانتوی لینن کمربندی آوا', 'در حال آماده‌سازی'],
                ['NV-1405-2478', 'پیراهن آکسفورد مردانه', 'پرداخت تأیید شد'],
                ['NV-1405-2472', 'ست دورس و شلوار کودک', 'در انتظار پرداخت'],
              ].map(([id, name, status]) => (
                <div className="admin-row" key={id}>
                  <span dir="ltr">{id}</span>
                  <strong>{name}</strong>
                  <span className="status-badge">{status}</span>
                  <button className="icon-button" type="button" aria-label={`مشاهده ${id}`}>
                    <Icon name="arrow-left" size={16} />
                  </button>
                </div>
              ))}
            </section>
            <section className="admin-panel">
              <div className="admin-panel__heading">
                <h2>سلامت عملیات</h2>
                <Icon name="check" size={18} />
              </div>
              {['پرداخت آنلاین', 'ارسال سفارش‌ها', 'رسانه‌ها', 'اعلان‌ها'].map((item) => (
                <div className="health-row" key={item}>
                  <span className="health-dot" />
                  {item}
                  <strong>فعال</strong>
                </div>
              ))}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

type AdminProductStatusFilter = 'all' | AdminCatalogProductStatus;
type AdminProductStockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string | null;
  alt: string;
  lifecycleStatus: AdminCatalogProductStatus;
  stockStatus: AdminProductStockStatus;
};

type AdminLowStockItem = {
  productId: string;
  slug: string;
  name: string;
  stock: number;
  image: string | null;
  alt: string;
};

type AdminOrderPreview = {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  status: string;
  statusTone: 'warning' | 'success' | 'danger';
  date: string;
};

const adminProductRows: AdminProductRow[] = [
  {
    id: 'preview-linen-overshirt',
    slug: 'linen-overshirt',
    name: 'مانتوی لینن کمربندی آوا',
    category: 'مانتو',
    categorySlug: 'outerwear',
    price: 2490000,
    compareAtPrice: 2890000,
    stock: 24,
    image: '/assets/nova-product-linen-overshirt.webp',
    alt: 'مانتوی لینن روشن با کمربند پارچه‌ای',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
  {
    id: 'preview-knit-cardigan',
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    category: 'بافت',
    categorySlug: 'knitwear',
    price: 4200000,
    compareAtPrice: null,
    stock: 3,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'LOW_STOCK',
  },
  {
    id: 'preview-oxford-shirt',
    slug: 'oxford-shirt',
    name: 'پیراهن آکسفورد مردانه',
    category: 'پیراهن',
    categorySlug: 'shirts',
    price: 3650000,
    compareAtPrice: null,
    stock: 15,
    image: '/assets/nova-product-oxford-shirt.webp',
    alt: 'پیراهن آکسفورد آبی روشن',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
  {
    id: 'preview-textured-scarf',
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    category: 'اکسسوری',
    categorySlug: 'accessories',
    price: 890000,
    compareAtPrice: null,
    stock: 2,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'LOW_STOCK',
  },
  {
    id: 'preview-soft-trousers',
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    category: 'شلوار',
    categorySlug: 'trousers',
    price: 2900000,
    compareAtPrice: null,
    stock: 8,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
    lifecycleStatus: 'PUBLISHED',
    stockStatus: 'IN_STOCK',
  },
];

const adminLowStockItems: AdminLowStockItem[] = [
  {
    productId: 'preview-knit-cardigan',
    slug: 'knit-cardigan',
    name: 'ژاکت بافت یقه‌گرد',
    stock: 3,
    image: '/assets/nova-product-knit-cardigan.webp',
    alt: 'ژاکت بافتنی قهوه‌ای روشن',
  },
  {
    productId: 'preview-textured-scarf',
    slug: 'textured-scarf',
    name: 'شال بافت برجسته',
    stock: 2,
    image: '/assets/nova-product-textured-scarf.webp',
    alt: 'شال بافتنی با رنگ خنثی',
  },
  {
    productId: 'preview-soft-trousers',
    slug: 'soft-trousers',
    name: 'شلوار نرم و راسته',
    stock: 4,
    image: '/assets/nova-product-soft-trousers.webp',
    alt: 'شلوار پارچه‌ای نرم به رنگ خاکی',
  },
];

const adminOrderPreviews: AdminOrderPreview[] = [
  {
    id: '#13445',
    orderNumber: 'NV-1405-2481',
    customer: 'نگار محمدی',
    amount: 9800000,
    status: 'در حال آماده‌سازی',
    statusTone: 'warning',
    date: '۱۴۰۵/۰۲/۲۵',
  },
  {
    id: '#13444',
    orderNumber: 'NV-1405-2480',
    customer: 'بهزاد رضایی',
    amount: 4200000,
    status: 'فعال',
    statusTone: 'success',
    date: '۱۴۰۵/۰۲/۲۴',
  },
  {
    id: '#13443',
    orderNumber: 'NV-1405-2479',
    customer: 'سارا حسینی',
    amount: 7650000,
    status: 'در حال آماده‌سازی',
    statusTone: 'warning',
    date: '۱۴۰۵/۰۲/۲۴',
  },
  {
    id: '#13442',
    orderNumber: 'NV-1405-2478',
    customer: 'مهدی کریمی',
    amount: 2900000,
    status: 'فعال',
    statusTone: 'success',
    date: '۱۴۰۵/۰۲/۲۳',
  },
  {
    id: '#13441',
    orderNumber: 'NV-1405-2477',
    customer: 'آتنا موسوی',
    amount: 5500000,
    status: 'در حال آماده‌سازی',
    statusTone: 'warning',
    date: '۱۴۰۵/۰۲/۲۳',
  },
];

function toAdminProductRow(source: AdminCatalogProductListItem): AdminProductRow {
  const category = source.categories[0];

  return {
    id: source.id,
    slug: source.slug,
    name: source.name,
    category: category?.name ?? 'بدون دسته‌بندی',
    categorySlug: category?.slug ?? null,
    price: source.basePriceToman,
    compareAtPrice: source.compareAtPriceToman,
    stock: source.inventory.available,
    image: source.primaryMedia?.url ?? null,
    alt: source.primaryMedia?.altText ?? source.name,
    lifecycleStatus: source.status,
    stockStatus: source.inventory.status,
  };
}

function toAdminLowStockItem(
  source: AdminInventoryItem,
  products: AdminProductRow[],
): AdminLowStockItem {
  const product = products.find(
    (candidate) => candidate.id === source.productId || candidate.slug === source.productSlug,
  );

  return {
    productId: source.productId,
    slug: source.productSlug,
    name: source.productName,
    stock: source.available,
    image: product?.image ?? null,
    alt: product?.alt ?? source.productName,
  };
}

function formatAdminDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function adminOrderStatusLabel(status: AdminOrderSummary['status']): string {
  const labels: Record<AdminOrderSummary['status'], string> = {
    PENDING_PAYMENT: 'در انتظار پرداخت',
    CONFIRMED: 'تایید شده',
    PREPARING: 'در حال آماده‌سازی',
    SHIPPED: 'ارسال شده',
    DELIVERED: 'تحویل شده',
    CANCELLED: 'لغو شده',
    RETURNED: 'مرجوع شده',
  };
  return labels[status];
}

function toAdminOrderPreview(source: AdminOrderSummary): AdminOrderPreview {
  const customer = source.customer?.email || source.customer?.phone || 'مشتری نوا';
  const statusTone: AdminOrderPreview['statusTone'] =
    source.status === 'CANCELLED' || source.status === 'RETURNED'
      ? 'danger'
      : source.status === 'DELIVERED' || source.status === 'SHIPPED'
        ? 'success'
        : 'warning';

  return {
    id: `#${source.orderNumber}`,
    orderNumber: source.orderNumber,
    customer,
    amount: source.totalToman,
    status: adminOrderStatusLabel(source.status),
    statusTone,
    date: formatAdminDate(source.createdAt),
  };
}

function adminLifecycleStatusLabel(status: AdminCatalogProductStatus): string {
  const labels: Record<AdminCatalogProductStatus, string> = {
    DRAFT: 'پیش‌نویس',
    PUBLISHED: 'فعال',
    ARCHIVED: 'بایگانی شده',
  };
  return labels[status];
}

function adminStockStatusLabel(status: AdminProductStockStatus): string {
  const labels: Record<AdminProductStockStatus, string> = {
    IN_STOCK: 'فعال',
    LOW_STOCK: 'موجودی کم',
    OUT_OF_STOCK: 'ناموجود',
  };
  return labels[status];
}

function AdminOperationsLogo({ mobile = false }: { mobile?: boolean } = {}) {
  return (
    <a
      className={`flex w-max flex-col leading-none ${mobile ? 'items-end' : 'items-center'}`}
      href="#admin"
      aria-label="نوا، فضای مدیریت"
    >
      <span className={`${mobile ? 'text-xl' : 'text-[30px]'} font-display tracking-[0.16em]`}>
        نوا
      </span>
      <span className="mt-2 text-[8px] tracking-[0.2em] text-[#e7ded2]/70">ATELIER EDITORIAL</span>
    </a>
  );
}

function AdminProductsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<AdminProductStatusFilter>('all');
  const [quickFilterActive, setQuickFilterActive] = useState(false);
  const [page, setPage] = useState(1);
  const [openActionSlug, setOpenActionSlug] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const staffQuery = useStaffUser();
  const isStaffAuthenticated = Boolean(staffQuery.data) && !isStaffAuthFailure(staffQuery.error);
  const isPreview = import.meta.env.DEV && !isStaffAuthenticated;
  const productListQuery = useMemo(
    () => ({
      page,
      limit: 12,
      q: deferredQuery.trim() || undefined,
      category: category === 'all' ? undefined : category,
      status: status === 'all' ? undefined : status,
      lowStock: quickFilterActive || undefined,
    }),
    [category, deferredQuery, page, quickFilterActive, status],
  );
  const productsQuery = useAdminCatalogProducts(productListQuery, isStaffAuthenticated);
  const categoriesQuery = useAdminCatalogCategories(isStaffAuthenticated);
  const inventoryQuery = useAdminInventory(
    { page: 1, limit: 3, lowStock: true },
    isStaffAuthenticated,
  );
  const ordersQuery = useAdminOrders({ page: 1, limit: 5 }, isStaffAuthenticated);

  useEffect(() => {
    setPage(1);
  }, [category, query, quickFilterActive, status]);

  const liveProducts = useMemo(
    () => productsQuery.data?.items.map(toAdminProductRow) ?? [],
    [productsQuery.data],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (isStaffAuthenticated) return liveProducts;

    return adminProductRows.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.category} ${product.slug}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = category === 'all' || product.categorySlug === category;
      const matchesStatus = status === 'all' || product.lifecycleStatus === status;
      const matchesQuickFilter = !quickFilterActive || product.stockStatus === 'LOW_STOCK';

      return matchesQuery && matchesCategory && matchesStatus && matchesQuickFilter;
    });
  }, [category, isStaffAuthenticated, liveProducts, query, quickFilterActive, status]);

  const categoryOptions = isStaffAuthenticated
    ? (categoriesQuery.data ?? []).map((item) => ({ value: item.slug, label: item.name }))
    : Array.from(
        new Map(
          adminProductRows.map((product) => [
            product.categorySlug ?? product.category,
            { value: product.categorySlug ?? product.category, label: product.category },
          ]),
        ).values(),
      );
  const resultCount = isStaffAuthenticated
    ? (productsQuery.data?.total ?? filteredProducts.length)
    : filteredProducts.length;
  const pageSize = productListQuery.limit;
  const totalPages = isStaffAuthenticated ? Math.max(1, Math.ceil(resultCount / pageSize)) : 1;
  const visibleStart = resultCount === 0 ? 0 : isStaffAuthenticated ? (page - 1) * pageSize + 1 : 1;
  const visibleEnd = isStaffAuthenticated
    ? Math.min(page * pageSize, resultCount)
    : filteredProducts.length;
  const lowStockItems = isStaffAuthenticated
    ? (inventoryQuery.data?.items ?? []).map((item) => toAdminLowStockItem(item, liveProducts))
    : adminLowStockItems;
  const lowStockCount = isStaffAuthenticated
    ? (inventoryQuery.data?.total ?? lowStockItems.length)
    : lowStockItems.length;
  const orderPreviews = isStaffAuthenticated
    ? (ordersQuery.data?.items ?? []).map(toAdminOrderPreview)
    : adminOrderPreviews;
  const isPermissionDenied = [
    productsQuery.error,
    categoriesQuery.error,
    inventoryQuery.error,
    ordersQuery.error,
  ].some(isStaffAuthorizationFailure);
  const dataState = !isStaffAuthenticated
    ? staffQuery.isPending
      ? {
          title: 'در حال بررسی دسترسی',
          message: 'نشست مدیریت شما در حال بررسی است.',
          role: 'status' as const,
        }
      : {
          title: 'ورود مدیر لازم است',
          message: 'برای مشاهده داده‌های واقعی کاتالوگ، با یک حساب مدیر وارد شوید.',
          role: 'alert' as const,
        }
    : isPermissionDenied
      ? {
          title: 'دسترسی کافی نیست',
          message: 'نقش کاربری شما اجازه مشاهده یکی از بخش‌های این صفحه را نمی‌دهد.',
          role: 'alert' as const,
        }
      : productsQuery.isPending && !productsQuery.data
        ? {
            title: 'در حال دریافت محصولات',
            message: 'فهرست محصولات از سرور در حال دریافت است.',
            role: 'status' as const,
          }
        : productsQuery.isError && !productsQuery.data
          ? {
              title: 'دریافت محصولات ناموفق بود',
              message: 'اتصال به سرویس کاتالوگ برقرار نشد. دوباره تلاش کنید.',
              role: 'alert' as const,
            }
          : null;

  const setQuickFilter = () => {
    setQuickFilterActive((current) => !current);
  };

  return (
    <main className="min-h-svh bg-background text-foreground" dir="rtl">
      <div className="flex min-h-svh flex-row">
        <aside className="hidden w-[240px] flex-none flex-col bg-primary-hover px-4 py-7 text-primary-foreground lg:flex">
          <AdminOperationsLogo />
          <span className="mt-12 px-3 text-[10px] text-primary-foreground/55">فضای مدیریت</span>
          <nav className="mt-3 flex flex-col gap-1" aria-label="ناوبری مدیریت">
            {[
              ['admin', 'فضای مدیریت', 'home'],
              ['products', 'محصولات', 'bag'],
              ['inventory', 'موجودی کم', 'warning'],
              ['orders', 'سفارش‌ها', 'package'],
              ['customers', 'مشتریان', 'users'],
              ['promotions', 'تخفیف‌ها', 'tag'],
              ['audit', 'گزارش‌ها', 'eye'],
              ['operations', 'تنظیمات', 'settings'],
            ].map(([key, label, icon]) => (
              <a
                className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-xs transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-primary-foreground/85 hover:bg-primary/70'}`}
                href={`#admin${key === 'admin' ? '' : `/${key}`}`}
                key={key}
              >
                <Icon name={icon as IconName} size={18} />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <AdminLogoutButton
            label="خروج"
            className="mt-auto flex min-h-11 items-center gap-3 border-0 border-t border-primary-foreground/15 bg-transparent px-3 pt-5 text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground disabled:opacity-50"
          />
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8" dir="ltr">
            <div className="hidden items-center gap-3 lg:flex">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="button"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={19} />
              </button>
              <img
                className="h-10 w-10 rounded-full object-cover"
                src="/assets/nova-hero-men.webp"
                alt=""
              />
              <div className="text-right" dir="rtl">
                <strong className="block text-xs font-medium">الهام احمدی</strong>
                <span className="mt-1 block text-[10px] text-muted-foreground">مدیر فروشگاه</span>
              </div>
            </div>

            <div className="hidden text-right lg:ml-auto lg:block" dir="rtl">
              <span className="text-lg font-medium">فضای مدیریت</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                عملیات فروشگاه نوا
              </span>
            </div>

            <div className="flex items-center justify-between lg:hidden" dir="ltr">
              <AdminLogoutButton
                compact
                label="خروج"
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              />
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href="#admin"
                aria-label="داشبورد مدیریت"
              >
                <Icon name="menu" size={20} />
              </a>
              <span className="text-base font-medium" dir="rtl">
                فضای مدیریت
              </span>
              <AdminOperationsLogo mobile />
            </div>
          </header>

          <div className="mx-auto max-w-[1220px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            <section
              className="rounded-panel border border-border bg-surface p-3 shadow-card sm:p-4"
              aria-label="فیلتر محصولات"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  className="order-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-5"
                  href="#admin/products/new"
                >
                  <Icon name="plus" size={17} />
                  محصول جدید
                </a>

                <label className="relative order-2 min-w-0 sm:order-4 sm:flex-1 sm:basis-[230px]">
                  <span className="sr-only">جست‌وجو در محصولات</span>
                  <Icon
                    name="search"
                    size={18}
                    className="pointer-events-none absolute inset-y-0 right-3 my-auto text-muted-foreground"
                  />
                  <input
                    className="min-h-11 w-full rounded-control border border-border bg-background px-10 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="جست‌وجو در محصولات..."
                    type="search"
                  />
                </label>

                <button
                  className={`order-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-3 ${quickFilterActive ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-background hover:border-primary hover:text-primary'}`}
                  type="button"
                  aria-pressed={quickFilterActive}
                  onClick={setQuickFilter}
                >
                  <Icon name="filter" size={17} />
                  فیلترها
                </button>

                <label className="relative order-4 min-w-0 sm:order-2 sm:min-w-[138px]">
                  <span className="sr-only">دسته‌بندی</span>
                  <select
                    className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">همه دسته‌بندی‌ها</option>
                    {categoryOptions.map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="chevron-down"
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </label>

                <label className="relative order-5 min-w-0 sm:order-1 sm:min-w-[138px]">
                  <span className="sr-only">وضعیت</span>
                  <select
                    className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as AdminProductStatusFilter);
                      setPage(1);
                    }}
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="PUBLISHED">فعال</option>
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="ARCHIVED">بایگانی شده</option>
                  </select>
                  <Icon
                    name="chevron-down"
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </label>
              </div>
            </section>

            {isPreview ? (
              <p className="mt-3 text-right text-[10px] text-muted-foreground" role="status">
                پیش‌نمایش محلی · برای داده‌های واقعی، نشست مدیر را برقرار کنید.
              </p>
            ) : null}

            {dataState && !isPreview ? (
              <section
                className="mt-4 rounded-panel border border-border bg-surface p-8 text-center shadow-card"
                role={dataState.role}
              >
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon name={dataState.role === 'alert' ? 'warning' : 'refresh'} size={22} />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{dataState.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-muted-foreground">
                  {dataState.message}
                </p>
                <button
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  type="button"
                  onClick={() =>
                    void (isStaffAuthenticated ? productsQuery.refetch() : staffQuery.refetch())
                  }
                >
                  <Icon name="refresh" size={16} />
                  دوباره تلاش کنید
                </button>
              </section>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.45fr)]">
                <aside className="order-1 space-y-4">
                  <section
                    className="rounded-panel border border-border bg-surface p-4 shadow-card"
                    aria-labelledby="admin-low-stock-title"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="warning" size={20} className="text-warning" />
                        <h2 className="text-base font-semibold" id="admin-low-stock-title">
                          موجودی کم
                        </h2>
                      </div>
                      <span className="rounded-full bg-warning-100 px-2 py-1 text-[10px] text-warning">
                        {formatPersianNumber(lowStockCount)} مورد
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {lowStockItems.map((item) => (
                        <a
                          className="flex items-center gap-3 py-3 transition-colors first:pt-4 last:pb-1 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href="#admin/inventory"
                          key={`${item.productId}-${item.slug}`}
                        >
                          {item.image ? (
                            <img
                              className="h-14 w-14 rounded-control border border-border bg-background object-cover"
                              src={item.image}
                              alt={item.alt}
                              loading="lazy"
                            />
                          ) : (
                            <span
                              className="flex h-14 w-14 items-center justify-center rounded-control border border-border bg-background text-muted-foreground"
                              aria-hidden="true"
                            >
                              <Icon name="shirt" size={20} />
                            </span>
                          )}
                          <span className="min-w-0 flex-1 text-right">
                            <strong className="block truncate text-xs font-medium">
                              {item.name}
                            </strong>
                            <small className="mt-1 block text-[10px] text-warning">
                              {formatPersianNumber(item.stock)} عدد باقی مانده
                            </small>
                          </span>
                          <Icon
                            name="arrow-left"
                            size={16}
                            className="shrink-0 text-muted-foreground"
                          />
                        </a>
                      ))}
                    </div>
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-xs text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      href="#admin/inventory"
                    >
                      مشاهده همه
                      <Icon name="arrow-left" size={15} />
                    </a>
                  </section>

                  <section
                    className="rounded-panel border border-border bg-surface p-4 shadow-card"
                    aria-labelledby="admin-orders-title"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="package" size={19} className="text-muted-foreground" />
                        <h2 className="text-base font-semibold" id="admin-orders-title">
                          سفارش‌ها
                        </h2>
                      </div>
                      <a
                        className="text-[10px] text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        href="#admin/orders"
                      >
                        مشاهده همه
                      </a>
                    </div>
                    <div className="divide-y divide-border">
                      {orderPreviews.map((order) => (
                        <a
                          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 first:pt-4 last:pb-1 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href={`#admin/orders/${order.orderNumber}`}
                          key={order.id}
                        >
                          <span className="text-[10px] text-muted-foreground" dir="ltr">
                            {order.id}
                          </span>
                          <span className="min-w-0 text-right">
                            <strong className="block truncate text-[11px] font-medium">
                              {order.customer}
                            </strong>
                            <small className="mt-1 block text-[9px] text-muted-foreground">
                              {order.date}
                            </small>
                          </span>
                          <span className="text-left">
                            <strong className="block whitespace-nowrap text-[10px] font-medium">
                              {formatToman(order.amount)}
                            </strong>
                            <small
                              className={`mt-1 block whitespace-nowrap rounded px-1.5 py-1 text-[9px] ${order.statusTone === 'warning' ? 'bg-warning-100 text-warning' : order.statusTone === 'danger' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                            >
                              {order.status}
                            </small>
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>
                </aside>

                <section
                  className="order-2 min-w-0 overflow-hidden rounded-panel border border-border bg-surface shadow-card"
                  aria-labelledby="admin-products-title"
                >
                  <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-5 sm:px-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold" id="admin-products-title">
                        محصولات
                      </h2>
                      <span className="rounded-full bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                        {formatPersianNumber(resultCount)} محصول
                      </span>
                    </div>
                    <span className="hidden text-[10px] text-muted-foreground sm:inline">
                      {isPreview
                        ? 'پیش‌نمایش محلی'
                        : productsQuery.isFetching
                          ? 'در حال بروزرسانی...'
                          : 'همگام با سرور'}
                    </span>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[520px] table-fixed border-collapse text-right text-xs">
                      <caption className="sr-only">فهرست محصولات نوا</caption>
                      <thead className="bg-background text-[10px] text-muted-foreground">
                        <tr>
                          <th className="w-[32%] px-4 py-3 font-medium" scope="col">
                            محصول
                          </th>
                          <th className="w-[11%] px-3 py-3 font-medium" scope="col">
                            دسته‌بندی
                          </th>
                          <th className="w-[18%] px-3 py-3 font-medium" scope="col">
                            قیمت
                          </th>
                          <th className="w-[9%] px-3 py-3 font-medium" scope="col">
                            موجودی
                          </th>
                          <th className="w-[15%] px-3 py-3 font-medium" scope="col">
                            وضعیت
                          </th>
                          <th className="w-[15%] px-4 py-3 text-left font-medium" scope="col">
                            عملیات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr
                            className="border-t border-border transition-colors hover:bg-background"
                            key={product.slug}
                          >
                            <th className="px-4 py-3 text-right font-normal" scope="row">
                              <a
                                className="flex min-w-0 items-center gap-2 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                href={`#admin/products/${product.slug}/edit`}
                              >
                                {product.image ? (
                                  <img
                                    className="h-12 w-12 shrink-0 rounded-control border border-border bg-background object-cover"
                                    src={product.image}
                                    alt={product.alt}
                                    loading="lazy"
                                  />
                                ) : (
                                  <span
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-border bg-background text-muted-foreground"
                                    aria-hidden="true"
                                  >
                                    <Icon name="shirt" size={18} />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <strong className="block truncate text-xs font-medium">
                                    {product.name}
                                  </strong>
                                  <small
                                    className="mt-1 block truncate text-[9px] text-muted-foreground"
                                    dir="ltr"
                                  >
                                    {product.slug}
                                  </small>
                                </span>
                              </a>
                            </th>
                            <td className="truncate whitespace-nowrap px-3 py-3 text-muted-foreground">
                              {product.category}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[10px]">
                              {formatToman(product.price)}
                            </td>
                            <td className="px-3 py-3 font-medium">
                              {formatPersianNumber(product.stock)}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-control px-2.5 py-1.5 text-[10px] ${product.lifecycleStatus !== 'PUBLISHED' ? 'bg-secondary text-muted-foreground' : product.stockStatus === 'LOW_STOCK' ? 'bg-warning-100 text-warning' : product.stockStatus === 'OUT_OF_STOCK' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                              >
                                {product.lifecycleStatus !== 'PUBLISHED'
                                  ? adminLifecycleStatusLabel(product.lifecycleStatus)
                                  : adminStockStatusLabel(product.stockStatus)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative flex items-center justify-end gap-2">
                                <button
                                  className="flex h-9 w-9 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                  type="button"
                                  aria-label={`گزینه‌های ${product.name}`}
                                  aria-expanded={openActionSlug === product.slug}
                                  aria-controls={`admin-product-actions-${product.slug}`}
                                  onClick={() =>
                                    setOpenActionSlug((current) =>
                                      current === product.slug ? null : product.slug,
                                    )
                                  }
                                >
                                  <Icon name="more-vertical" size={17} />
                                </button>
                                <a
                                  className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                  href={`#admin/products/${product.slug}/edit`}
                                  aria-label={`ویرایش ${product.name}`}
                                >
                                  <Icon name="edit" size={16} />
                                </a>
                                {openActionSlug === product.slug ? (
                                  <div
                                    className="absolute left-0 top-11 z-10 w-36 rounded-control border border-border bg-surface p-1 text-right shadow-float"
                                    id={`admin-product-actions-${product.slug}`}
                                  >
                                    <a
                                      className="block rounded px-2.5 py-2 text-[10px] hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                      href={`#admin/products/${product.slug}/edit`}
                                    >
                                      ویرایش محصول
                                    </a>
                                    <a
                                      className="block rounded px-2.5 py-2 text-[10px] hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                      href={`#product/${product.slug}`}
                                    >
                                      مشاهده در فروشگاه
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 px-3 pb-3 md:hidden">
                    {filteredProducts.map((product) => (
                      <article
                        className="flex items-center gap-3 rounded-control border border-border bg-background p-3"
                        key={product.slug}
                      >
                        {product.image ? (
                          <img
                            className="h-14 w-14 shrink-0 rounded-control border border-border bg-surface object-cover"
                            src={product.image}
                            alt={product.alt}
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control border border-border bg-surface text-muted-foreground"
                            aria-hidden="true"
                          >
                            <Icon name="shirt" size={20} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1 text-right">
                          <a
                            className="block truncate text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={`#admin/products/${product.slug}/edit`}
                          >
                            {product.name}
                          </a>
                          <span className="mt-1 block text-[10px] text-muted-foreground">
                            {product.category} · {formatToman(product.price)}
                          </span>
                          <span
                            className={`mt-2 inline-flex rounded-control px-2 py-1 text-[9px] ${product.lifecycleStatus !== 'PUBLISHED' ? 'bg-secondary text-muted-foreground' : product.stockStatus === 'LOW_STOCK' ? 'bg-warning-100 text-warning' : product.stockStatus === 'OUT_OF_STOCK' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                          >
                            {formatPersianNumber(product.stock)} موجودی ·{' '}
                            {product.lifecycleStatus !== 'PUBLISHED'
                              ? adminLifecycleStatusLabel(product.lifecycleStatus)
                              : adminStockStatusLabel(product.stockStatus)}
                          </span>
                        </div>
                        <a
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href={`#admin/products/${product.slug}/edit`}
                          aria-label={`ویرایش ${product.name}`}
                        >
                          <Icon name="edit" size={16} />
                        </a>
                      </article>
                    ))}
                  </div>

                  {resultCount === 0 ? (
                    <p className="border-t border-border px-4 py-12 text-center text-xs text-muted-foreground">
                      محصولی با این فیلترها پیدا نشد.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-[10px] text-muted-foreground sm:px-5">
                    <span>
                      نمایش {formatPersianNumber(visibleStart)} تا {formatPersianNumber(visibleEnd)}{' '}
                      از {formatPersianNumber(resultCount)} محصول
                    </span>
                    <nav className="flex items-center gap-1" aria-label="صفحه‌بندی محصولات">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                        type="button"
                        aria-label="صفحه قبلی"
                        disabled={page <= 1 || !isStaffAuthenticated}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        <Icon name="arrow-right" size={15} />
                      </button>
                      <button
                        className="flex h-8 min-w-8 items-center justify-center rounded-control bg-primary px-2 text-[10px] text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        type="button"
                        aria-current="page"
                      >
                        {formatPersianNumber(page)}
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        type="button"
                        aria-label="صفحه بعدی"
                        disabled={page >= totalPages || !isStaffAuthenticated}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      >
                        <Icon name="arrow-left" size={15} />
                      </button>
                    </nav>
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-1 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur lg:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {[
          ['admin', 'خانه', 'home'],
          ['products', 'محصولات', 'bag'],
          ['inventory', 'موجودی کم', 'warning'],
          ['orders', 'سفارش‌ها', 'package'],
          ['operations', 'بیشتر', 'menu'],
        ].map(([key, label, icon]) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-control text-[9px] transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
            href={`#admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon as IconName} size={18} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

function AdminSessionLoading() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4" dir="rtl">
      <section className="w-full max-w-md bg-surface p-8 text-right shadow-float" role="status">
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-2xl leading-relaxed">در حال بررسی دسترسی</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          نشست مدیریت شما در حال بررسی است.
        </p>
      </section>
    </main>
  );
}

function AdminPermissionDeniedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4" dir="rtl">
      <section className="w-full max-w-md bg-surface p-8 text-right shadow-float" role="alert">
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-2xl leading-relaxed">دسترسی کافی نیست</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          حساب کاربری شما برای مشاهده این بخش از فضای مدیریت مجوز لازم را ندارد.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#admin"
          >
            بازگشت به داشبورد
          </a>
          <AdminLogoutButton className="inline-flex min-h-11 items-center gap-2 border-0 bg-transparent px-2 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50" />
        </div>
      </section>
    </main>
  );
}

function AdminPage({ page }: { page: string }) {
  const isLoginPage = page === 'login';
  const staffQuery = useStaffUser(!isLoginPage);
  const authFailure = isStaffAuthFailure(staffQuery.error);
  const authorizationFailure = isStaffAuthorizationFailure(staffQuery.error);
  const hasStaffSession = Boolean(staffQuery.data) && !authFailure;
  const allowDevelopmentPreview = import.meta.env.DEV && !staffQuery.data;

  if (isLoginPage) return <AdminLoginPage />;
  if (authorizationFailure) return <AdminPermissionDeniedPage />;
  if (staffQuery.isPending && !allowDevelopmentPreview) return <AdminSessionLoading />;
  if (authFailure && staffQuery.data) return <AdminLoginPage sessionExpired />;
  if (!hasStaffSession && !allowDevelopmentPreview) return <AdminLoginPage />;
  if (page === 'products') return <AdminProductsPage />;
  if (page !== 'admin') return <AdminLegacyPage page={page} />;

  const nav = [
    ['admin', 'داشبورد', 'home'],
    ['products', 'محصولات', 'shirt'],
    ['categories', 'دسته‌بندی‌ها', 'layers'],
    ['orders', 'سفارش‌ها', 'package'],
    ['customers', 'مشتریان', 'users'],
    ['marketing', 'بازاریابی', 'send'],
    ['content', 'محتوا', 'book'],
    ['audit', 'گزارش‌ها', 'eye'],
    ['promotions', 'تخفیف‌ها', 'tag'],
    ['operations', 'تنظیمات', 'settings'],
  ].map(([key, label, icon]) => ({ key, label, icon: icon as IconName }));

  return (
    <main className="admin-shell min-h-svh bg-[#f6f6f4] text-foreground">
      <aside className="admin-sidebar flex-[0_0_194px] !bg-surface !text-foreground px-3 py-6">
        <Logo descriptor="ADMIN PANEL" />
        <span className="admin-sidebar__label !text-muted-foreground">فضای مدیریت</span>
        <nav className="flex flex-col gap-1" aria-label="ناوبری مدیریت">
          {nav.map((item) => (
            <a
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-xs !text-foreground/80 transition-colors ${page === item.key || page.startsWith(`${item.key}/`) ? '!bg-primary !text-primary-foreground' : 'hover:!bg-secondary'}`}
              href={`#admin${item.key === 'admin' ? '' : `/${item.key}`}`}
              key={item.key}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t !border-border pt-5">
          <div className="flex items-center gap-3 px-2">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src="/assets/nova-hero-men.webp"
              alt=""
            />
            <div className="min-w-0 text-right">
              <strong className="block truncate text-xs !text-foreground">رضا سواری</strong>
              <small className="mt-1 block text-[9px] !text-muted-foreground">مدیر سیستم</small>
            </div>
          </div>
          <AdminLogoutButton className="mt-4 flex min-h-10 w-full items-center gap-2 border-0 bg-transparent px-2 text-right text-[10px] !text-muted-foreground transition-colors hover:!text-foreground disabled:opacity-50" />
        </div>
      </aside>
      <section className="admin-content min-h-svh w-full">
        <header
          className="admin-topbar !flex-row min-h-[68px] gap-3 bg-surface px-4 py-3 md:px-6"
          dir="ltr"
        >
          <div className="!flex !flex-row w-full items-center justify-between md:!hidden" dir="ltr">
            <AdminLogoutButton
              compact
              label="خروج"
              className="icon-button border-0 disabled:opacity-50"
            />
            <a className="icon-button" href="#admin" aria-label="داشبورد">
              <Icon name="menu" size={20} />
            </a>
            <Logo descriptor="ADMIN PANEL" />
            <a className="icon-button" href="#admin" aria-label="اعلان‌ها">
              <Icon name="bell" size={19} />
            </a>
          </div>
          <form
            className="hidden w-full max-w-[375px] items-center gap-2 rounded-md border border-border bg-background px-3 md:flex"
            dir="rtl"
            onSubmit={(event) => event.preventDefault()}
          >
            <Icon name="search" size={18} className="text-muted-foreground" />
            <input
              className="min-h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
              aria-label="جست‌وجو در پنل مدیریت"
              placeholder="جست‌وجو در محصولات، سفارش‌ها، مشتریان ..."
            />
            <kbd className="hidden rounded bg-secondary px-2 py-1 text-[9px] text-muted-foreground lg:inline-block">
              Ctrl K
            </kbd>
          </form>
          <div className="ml-auto hidden !flex-row items-center gap-4 md:flex" dir="rtl">
            <button
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
              type="button"
              aria-label="اعلان‌ها"
            >
              <Icon name="bell" size={19} />
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">
                ۱
              </span>
            </button>
            <img
              className="h-9 w-9 rounded-full bg-secondary object-cover"
              src="/assets/nova-hero-men.webp"
              alt="پروفایل رضا سواری"
            />
            <span className="hidden text-xs text-muted-foreground lg:inline">
              پنجشنبه ۲۵ شهریور ۱۴۰۵
            </span>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary transition-colors hover:bg-accent-soft"
              type="button"
              aria-label="تغییر پوسته"
            >
              <Icon name="sparkles" size={19} />
            </button>
          </div>
        </header>
        <div className="admin-page bg-[#f6f6f4] p-4 pb-24 md:p-6 md:pb-8 lg:p-8">
          <AdminDashboard />
        </div>
      </section>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur md:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {[
          ['admin', 'داشبورد', 'home'],
          ['products', 'محصولات', 'shirt'],
          ['orders', 'سفارش‌ها', 'package'],
          ['operations', 'بیشتر', 'menu'],
        ].map(([key, label, icon]) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] ${page === key ? 'text-primary' : 'text-muted-foreground'}`}
            href={`#admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon as IconName} size={19} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}

function EmptyState({
  title,
  description,
  action,
  href,
  onAction,
}: {
  title: string;
  description?: string;
  action: string;
  href?: string;
  onAction?: () => void;
}) {
  return (
    <section className="empty-state">
      <span className="empty-state__icon">
        <Icon name="layers" size={25} />
      </span>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {onAction ? (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      ) : (
        <Button asChild>
          <a href={href ?? '#home'}>{action}</a>
        </Button>
      )}
    </section>
  );
}

function NotFoundPage() {
  return (
    <main className="shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background">
      <EmptyState
        title="این صفحه پیدا نشد"
        description="به نظر می‌رسد مسیر تغییر کرده است؛ از خانه دوباره شروع کنید."
        action="بازگشت به خانه"
        href="#home"
      />
    </main>
  );
}

function RouteView({
  route,
  cart,
  cartLoading,
  cartError,
  onRetryCart,
  onUpdateCartItem,
  onRemoveCartItem,
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: {
  route: string;
  cart: CartView | undefined;
  cartLoading: boolean;
  cartError: boolean;
  onRetryCart: () => void;
  onUpdateCartItem: (variantId: string, quantity: number) => void;
  onRemoveCartItem: (variantId: string) => void;
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: Product) => void;
}) {
  const resolved = parseHashRoute(route);

  switch (resolved.kind) {
    case 'home':
      return (
        <HomePage isWishlisted={isWishlisted} onToggleWishlist={onToggleWishlist} onAdd={onAdd} />
      );
    case 'auth-request':
      return <AuthPage mode="request" />;
    case 'auth-verify':
      return <AuthPage mode="verify" queryString={resolved.queryString} />;
    case 'category':
      return (
        <CategoryPage
          audience={resolved.audience}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      );
    case 'products':
      return (
        <ProductsPage
          audience={resolved.audience}
          mode={resolved.mode}
          queryString={resolved.queryString}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      );
    case 'product':
      return (
        <ProductPage
          slug={resolved.slug}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      );
    case 'cart':
      return (
        <CartPage
          cart={cart}
          isLoading={cartLoading}
          isError={cartError}
          onRetry={onRetryCart}
          onUpdateItem={onUpdateCartItem}
          onRemoveItem={onRemoveCartItem}
          isWishlisted={isWishlisted}
          onToggleWishlist={onToggleWishlist}
          onAdd={onAdd}
        />
      );
    case 'preview-state':
      return <PreviewStatePage state={resolved.state} />;
    case 'checkout-confirmation':
      return <ConfirmationPage queryString={resolved.queryString} />;
    case 'checkout':
      return (
        <CheckoutPage
          step={resolved.step}
          queryString={resolved.queryString}
          cart={cart}
          cartLoading={cartLoading}
          cartError={cartError}
          onRetryCart={onRetryCart}
        />
      );
    case 'account':
      return <AccountPage section={resolved.section} />;
    case 'address-list':
      return <AddressBookPage />;
    case 'address-create':
      return <AddressBookPage mode="create" />;
    case 'address-edit':
      return <AddressBookPage mode="edit" addressId={resolved.addressId} />;
    case 'order':
      return <OrderPage orderNumber={resolved.orderNumber} />;
    case 'return':
      return (
        <ReturnPage
          mode={resolved.status ? 'status' : undefined}
          queryString={resolved.queryString}
        />
      );
    case 'editorial':
      return <EditorialPage page={resolved.page} />;
    case 'content':
      return <PublishedContentPage slug={resolved.slug} />;
    case 'admin':
      return <AdminPage page={resolved.page} />;
    case 'not-found':
      return <NotFoundPage />;
  }
}

export function App() {
  const route = useHashRoute();
  useScrollToTop(route);
  const cartQuery = useCart(!route.startsWith('#admin'));
  const customerQuery = useCurrentCustomer(!route.startsWith('#admin'));
  const { mutate: mergeGuestCart, isPending: isMergingGuestCart } = useMergeGuestCart();
  const addCartItemMutation = useAddCartItem();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const cart = cartQuery.data;
  const cartCount = cart?.itemCount ?? 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [wishlist, setWishlist] = useState<Set<string>>(() => new Set());
  const cartMergeAttemptRef = useRef<string | null>(null);

  useEffect(() => {
    const initial = readInitialRenderContext();
    const initialMatches =
      initial &&
      initial.hashRoute === route &&
      normalizeSeoPath(initial.path) === normalizeSeoPath(window.location.pathname);
    const isDataRoute = route.startsWith('#product/') || route.startsWith('#content/');
    const seo = initialMatches ? initial.seo : clientSeoForHashRoute(route, window.location.origin);
    if (isDataRoute && !initialMatches) return;
    applySeoDocument(document, seo);
  }, [route]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const customerId = customerQuery.data?.id;
    const currentCart = cartQuery.data;
    if (!currentCart || !shouldMergeGuestCart(currentCart, customerId)) return;

    const attemptKey = `${customerId}:${currentCart.id ?? 'guest'}`;
    if (cartMergeAttemptRef.current === attemptKey || isMergingGuestCart) return;
    cartMergeAttemptRef.current = attemptKey;

    mergeGuestCart(undefined, {
      onError: (error) => {
        if (getCartMergeConflicts(error).length > 0) {
          setToast('بخشی از سبد خرید نیازمند بررسی است.');
          window.location.hash = '#cart/conflict';
          return;
        }
        setToast('ورود انجام شد، اما ادغام سبد خرید انجام نشد.');
      },
    });
  }, [cartQuery.data, customerQuery.data?.id, isMergingGuestCart, mergeGuestCart]);

  useEffect(() => {
    if (route === '#search') setSearchOpen(true);
  }, [route]);

  const addToCart = (product: Product) => {
    const selectedVariant = product.selectedVariantId
      ? product.variants?.find((variant) => variant.id === product.selectedVariantId)
      : undefined;
    const variant = selectedVariant ?? product.variants?.find((candidate) => candidate.available);
    if (!variant || !variant.available) {
      setToast('این محصول در حال حاضر قابل افزودن به سبد نیست');
      return;
    }

    const idempotencyKey = globalThis.crypto?.randomUUID?.();
    addCartItemMutation.mutate(
      { variantId: variant.id, quantity: 1, idempotencyKey },
      {
        onSuccess: () => setToast(`«${product.name}» به سبد خرید اضافه شد`),
        onError: (error) =>
          setToast(error instanceof Error ? error.message : 'افزودن کالا به سبد ممکن نشد'),
      },
    );
  };

  const updateCartItem = (variantId: string, quantity: number) => {
    updateCartItemMutation.mutate(
      { variantId, quantity },
      {
        onError: (error) =>
          setToast(error instanceof Error ? error.message : 'تغییر تعداد کالا ممکن نشد'),
      },
    );
  };

  const removeCartItem = (variantId: string) => {
    removeCartItemMutation.mutate(variantId, {
      onError: (error) =>
        setToast(error instanceof Error ? error.message : 'حذف کالا از سبد ممکن نشد'),
    });
  };

  const toggleWishlist = (slug: string) => {
    setWishlist((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  return (
    <div
      className={`app-root min-h-svh bg-background ${route.startsWith('#admin') ? 'app-root--admin' : ''}`}
      dir="rtl"
    >
      {!route.startsWith('#admin') ? (
        <Header
          cartCount={cartCount}
          onSearch={() => setSearchOpen(true)}
          onMenu={() => setMenuOpen(true)}
        />
      ) : null}
      <RouteView
        route={route}
        cart={cart}
        cartLoading={cartQuery.isPending}
        cartError={cartQuery.isError}
        onRetryCart={() => void cartQuery.refetch()}
        onUpdateCartItem={updateCartItem}
        onRemoveCartItem={removeCartItem}
        isWishlisted={(slug) => wishlist.has(slug)}
        onToggleWishlist={toggleWishlist}
        onAdd={addToCart}
      />
      {!route.startsWith('#admin') ? <MobileBottomNav cartCount={cartCount} /> : null}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      {toast ? (
        <div
          className="toast fixed z-[600] flex items-center bg-primary-hover text-primary-foreground shadow-float"
          role="status"
          aria-live="polite"
        >
          <Icon name="check" size={17} />
          {toast}
          <a href="#cart">مشاهده سبد</a>
        </div>
      ) : null}
    </div>
  );
}
