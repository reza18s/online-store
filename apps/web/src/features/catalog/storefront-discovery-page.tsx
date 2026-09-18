import { useEffect, useMemo, useState, type ReactNode } from 'react';

import type {
  CatalogAudience,
  CatalogFacetOption,
  CatalogProductOption,
  CatalogSort,
  CatalogProductVariant,
} from '@nova/api-client';
import { Button, Checkbox, Input as UiInput, Select as UiSelect } from '@nova/ui';

import { Icon } from '../../shared/icon';
import {
  toStorefrontProduct,
  toStorefrontProductDetail,
  useCatalogCategories,
  useCatalogFacets,
  useCatalogProduct,
  useCatalogProducts,
  useCatalogSuggestions,
  type CatalogFacetFilters,
  type CatalogFilters,
  type StorefrontProduct,
} from './catalog-api';
import { useAddCartItem } from '../cart/cart-api';

export type StorefrontDiscoveryView = 'home' | 'category' | 'listing' | 'search' | 'product';

export interface StorefrontDiscoveryPageProps {
  view: StorefrontDiscoveryView;
  audience?: CatalogAudience;
  mode?: 'new' | 'sale' | 'accessories';
  slug?: string;
  queryString?: string;
  isWishlisted?: (slug: string) => boolean;
  onToggleWishlist?: (slug: string) => void;
}

export interface DiscoveryQueryState {
  q: string;
  category: string;
  size: string;
  color: string;
  material: string;
  minPrice?: number;
  maxPrice?: number;
  inStock: boolean;
  onSale: boolean;
  sort: CatalogSort;
  page: number;
}

const audienceCopy: Record<
  CatalogAudience,
  { label: string; title: string; description: string; image: string }
> = {
  women: {
    label: 'زنانه',
    title: 'لباس‌هایی برای روزهای روشن',
    description: 'رویه‌های سبک، بافت‌های آرام و جزئیاتی که هر روز را شخصی‌تر می‌کنند.',
    image: '/assets/nova-hero-editorial-v2.png',
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

const sortValues = new Set<CatalogSort>(['newest', 'price_asc', 'price_desc', 'name']);

export function formatToman(amount: number): string {
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}

function optionalNumber(value: string | null): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function positivePage(value: string | null): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function parseDiscoveryQuery(
  queryString = '',
  mode?: StorefrontDiscoveryPageProps['mode'],
): DiscoveryQueryState {
  const params = new URLSearchParams(
    queryString.startsWith('?') ? queryString.slice(1) : queryString,
  );
  const queryCategory = params.get('category') ?? '';
  return {
    q: params.get('q')?.trim() ?? '',
    category: mode === 'accessories' ? 'accessories' : queryCategory,
    size: params.get('size') ?? '',
    color: params.get('color') ?? '',
    material: params.get('material') ?? '',
    minPrice: optionalNumber(params.get('minPrice')),
    maxPrice: optionalNumber(params.get('maxPrice')),
    inStock: params.get('inStock') === 'true',
    onSale: mode === 'sale' || params.get('onSale') === 'true',
    sort: sortValues.has(params.get('sort') as CatalogSort)
      ? (params.get('sort') as CatalogSort)
      : 'newest',
    page: positivePage(params.get('page')),
  };
}

export function discoveryFiltersFromQuery(
  state: DiscoveryQueryState,
  audience?: CatalogAudience,
): CatalogFilters {
  return {
    q: state.q || undefined,
    category: state.category || undefined,
    audience,
    size: state.size || undefined,
    color: state.color || undefined,
    material: state.material || undefined,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStock: state.inStock ? true : undefined,
    onSale: state.onSale ? true : undefined,
    sort: state.sort,
    page: state.page,
    limit: 8,
  };
}

export function discoveryFacetFiltersFromQuery(
  state: DiscoveryQueryState,
  audience?: CatalogAudience,
): CatalogFacetFilters {
  const filters = discoveryFiltersFromQuery(state, audience);
  return Object.fromEntries(
    Object.entries(filters).filter(([key]) => key !== 'sort' && key !== 'page' && key !== 'limit'),
  ) as CatalogFacetFilters;
}

export function buildDiscoveryHref(
  baseHash: string,
  queryString: string,
  changes: Record<string, string | undefined>,
): string {
  const params = new URLSearchParams(
    queryString.startsWith('?') ? queryString.slice(1) : queryString,
  );
  let resetPage = false;
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined || value === '') params.delete(key);
    else params.set(key, value);
    if (key !== 'page') resetPage = true;
  }
  if (resetPage) params.delete('page');
  const query = params.toString();
  return `${baseHash}${query ? `?${query}` : ''}`;
}

export function preserveFacetSelection(
  options: readonly CatalogFacetOption[],
  selected: string,
): CatalogFacetOption[] {
  if (!selected || options.some((option) => option.value === selected)) return [...options];
  return [{ value: selected, label: selected, count: 0, selected: true }, ...options];
}

export function structuredVariantOptions(
  product: Pick<StorefrontProduct, 'variants' | 'options'>,
): CatalogProductOption[] {
  const variants = product.variants ?? [];
  return (product.options ?? []).filter((option) =>
    option.values.some((value) =>
      variants.some((variant) => variant.optionValueIds.includes(value.id)),
    ),
  );
}

export function resolveVariant(
  product: Pick<StorefrontProduct, 'variants' | 'options'>,
  selectedOptionValues: Record<string, string>,
  selectedSize: string,
  selectedColor: string,
): CatalogProductVariant | undefined {
  const variants = product.variants ?? [];
  if (!variants.length) return undefined;
  const optionKeys = structuredVariantOptions(product);
  if (optionKeys.length && variants.some((variant) => variant.optionValueIds.length)) {
    if (!optionKeys.every((option) => Boolean(selectedOptionValues[option.key]))) return undefined;
    return variants.find((variant) =>
      optionKeys.every((option) =>
        variant.optionValueIds.includes(selectedOptionValues[option.key]!),
      ),
    );
  }
  const sizes = new Set(variants.map((variant) => variant.size).filter(Boolean));
  const colors = new Set(variants.map((variant) => variant.color).filter(Boolean));
  return variants.find(
    (variant) =>
      (!sizes.size || variant.size === selectedSize) &&
      (!colors.size || variant.color === selectedColor),
  );
}

function validCompareAt(price: number, compareAt: number | null | undefined): number | null {
  return compareAt !== null && compareAt !== undefined && compareAt > price ? compareAt : null;
}

function availabilityLabel(product: StorefrontProduct): string {
  return product.stock ?? (product.available === false ? 'ناموجود' : 'موجود');
}

export function productAddButtonLabel(
  variantCount: number,
  hasSelectedVariant: boolean,
  available: boolean,
): string {
  if (variantCount > 0 && !hasSelectedVariant) return 'انتخاب کنید';
  return available ? 'افزودن به سبد خرید' : 'ناموجود';
}

export function shouldShowProductLoading(slug: string, isPending: boolean): boolean {
  return Boolean(slug) && isPending;
}

function routeTo(hash: string): void {
  if (typeof window !== 'undefined') window.location.hash = hash.replace(/^#/, '');
}

function MessageCard({
  title,
  description,
  icon,
  action,
  onAction,
  tone = 'neutral',
}: {
  title: string;
  description: string;
  icon: 'info' | 'warning' | 'layers';
  action?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'warning' | 'error';
}) {
  return (
    <section
      className={`rounded-editorial border bg-surface p-7 text-center shadow-card ${tone === 'error' ? 'border-error text-destructive' : tone === 'warning' ? 'border-warning' : 'border-border'}`}
      role={tone === 'neutral' ? undefined : 'alert'}
    >
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="mt-4 text-lg text-foreground">{title}</h2>
      <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-7 text-muted-foreground">
        {description}
      </p>
      {action && onAction ? (
        <Button className="mt-5" type="button" variant="outline" onClick={onAction}>
          <Icon name="refresh" size={16} />
          {action}
        </Button>
      ) : null}
    </section>
  );
}

function ProductSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4"
      role="status"
      aria-label="در حال بارگذاری محصولات"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="min-w-0 motion-safe:animate-pulse" key={index}>
          <div className="aspect-square rounded-editorial bg-secondary" />
          <div className="mt-3 h-3 w-2/5 rounded bg-secondary" />
          <div className="mt-2 h-4 w-4/5 rounded bg-secondary" />
          <div className="mt-3 h-3 w-1/2 rounded bg-secondary" />
        </div>
      ))}
    </div>
  );
}

export function shouldShowCatalogRefreshNotice(isError: boolean, hasData: boolean): boolean {
  return isError && hasData;
}

function CatalogRefreshNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border border-warning bg-warning-soft p-4 text-sm"
      role="alert"
    >
      <span>به‌روزرسانی نتایج انجام نشد؛ اطلاعات فعلی ممکن است قدیمی باشد.</span>
      <Button type="button" size="sm" variant="outline" onClick={onRetry}>
        <Icon name="refresh" size={16} />
        تلاش دوباره
      </Button>
    </div>
  );
}

export function CatalogQueryState({
  query,
  emptyTitle = 'محصولی برای نمایش پیدا نشد',
  children,
}: {
  query: ReturnType<typeof useCatalogProducts>;
  emptyTitle?: string;
  children: ReactNode;
}) {
  if (query.isPending && !query.data) return <ProductSkeleton />;
  if (query.isError && !query.data) {
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    return (
      <MessageCard
        title={offline ? 'اتصال اینترنت برقرار نیست' : 'بارگذاری محصولات ممکن نشد'}
        description={
          offline
            ? 'اتصال خود را بررسی کنید و دوباره تلاش کنید.'
            : 'لطفاً چند لحظه بعد دوباره تلاش کنید.'
        }
        icon={offline ? 'info' : 'warning'}
        action="تلاش دوباره"
        onAction={() => void query.refetch()}
        tone="warning"
      />
    );
  }
  const refreshNotice = shouldShowCatalogRefreshNotice(query.isError, Boolean(query.data)) ? (
    <CatalogRefreshNotice onRetry={() => void query.refetch()} />
  ) : null;
  if (query.data && !query.data.items.length) {
    return (
      <div className="space-y-3">
        {refreshNotice}
        <MessageCard
          title={emptyTitle}
          description="فیلترها را تغییر دهید یا از انتخاب‌های تازه نوا دیدن کنید."
          icon="layers"
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {refreshNotice}
      {query.isFetching ? (
        <p className="text-xs text-muted-foreground" role="status">
          در حال به‌روزرسانی نتایج...
        </p>
      ) : null}
      {children}
    </div>
  );
}

function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: {
  product: StorefrontProduct;
  isWishlisted: boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: StorefrontProduct) => void;
}) {
  const compareAt = validCompareAt(product.price, product.compareAt);
  const variants = product.variants ?? [];
  const disabled =
    product.available === false ||
    (variants.length > 0 && !variants.some((variant) => variant.available));
  return (
    <article className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-editorial bg-secondary">
        <a
          href={`#product/${encodeURIComponent(product.slug)}`}
          aria-label={`مشاهده ${product.name}`}
        >
          {product.image ? (
            <img
              className="h-full w-full object-cover"
              src={product.image}
              alt={product.alt}
              loading="lazy"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-muted-foreground">
              <Icon name="shirt" size={32} />
            </span>
          )}
        </a>
        <Button
          className={`icon-button absolute end-2 top-2 bg-surface/90 ${isWishlisted ? 'text-primary' : ''}`}
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
        </Button>
        {product.tag ? (
          <span className="absolute start-2 top-2 rounded-control bg-success-soft px-2 py-1 text-[10px] text-success">
            {product.tag}
          </span>
        ) : null}
      </div>
      <div className="space-y-1.5 pt-2.5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>{product.category}</span>
          <span className={product.stock === 'رو به اتمام' ? 'text-warning' : ''}>
            {availabilityLabel(product)}
          </span>
        </div>
        <a
          className="block text-sm font-semibold leading-6 hover:text-primary focus-visible:text-primary"
          href={`#product/${encodeURIComponent(product.slug)}`}
        >
          {product.name}
        </a>
        <div className="flex items-end justify-between gap-2">
          <div className="text-[13px] font-bold text-primary">
            {compareAt ? (
              <del className="block text-[11px] font-normal text-muted-foreground">
                {formatToman(compareAt)}
              </del>
            ) : null}
            <strong>{formatToman(product.price)}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1" aria-label="رنگ‌های موجود">
              {product.colors.map((color) => (
                <span
                  className="h-3.5 w-3.5 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                  key={color}
                />
              ))}
            </div>
            <Button
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:-translate-y-px hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              type="button"
              disabled={disabled}
              aria-label={
                disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
              }
              onClick={() => onAdd(product)}
            >
              <Icon name="plus" size={17} />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({
  products,
  isWishlisted,
  onToggleWishlist,
  onAdd,
}: {
  products: StorefrontProduct[];
  isWishlisted: (slug: string) => boolean;
  onToggleWishlist: (slug: string) => void;
  onAdd: (product: StorefrontProduct) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      {products.map((product) => (
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

function AddToCartFeedback({ message, error }: { message: string; error?: boolean }) {
  return (
    <p
      className={`text-sm ${error ? 'text-destructive' : 'text-success'}`}
      role={error ? 'alert' : 'status'}
    >
      {message}
    </p>
  );
}

function useProductAdder() {
  const mutation = useAddCartItem();
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  const add = (product: StorefrontProduct) => {
    const variant = product.selectedVariantId
      ? product.variants?.find((item) => item.id === product.selectedVariantId)
      : product.variants?.find((item) => item.available);
    if (!variant || !variant.available) {
      setFeedback({ message: 'این محصول بدون انتخاب تنوع قابل افزودن نیست.', error: true });
      return;
    }
    mutation.mutate(
      { variantId: variant.id, quantity: 1, idempotencyKey: globalThis.crypto?.randomUUID?.() },
      {
        onSuccess: () => setFeedback({ message: `«${product.name}» به سبد خرید اضافه شد.` }),
        onError: (error) =>
          setFeedback({
            message: error instanceof Error ? error.message : 'افزودن کالا به سبد ممکن نشد.',
            error: true,
          }),
      },
    );
  };
  return { add, feedback, isPending: mutation.isPending };
}

function HomeDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const productsQuery = useCatalogProducts({ limit: 8, sort: 'newest' });
  const adder = useProductAdder();
  const isWishlisted = props.isWishlisted ?? (() => false);
  const onToggleWishlist = props.onToggleWishlist ?? (() => undefined);
  const products = productsQuery.data?.items.map(toStorefrontProduct) ?? [];
  const lookbookStories = [
    {
      title: 'شهر در پاییز',
      description: 'لایه‌هایی گرم برای قدم‌زدن‌های ماندگار',
      image: '/assets/nova-women-lifestyle.webp',
      href: '#campaign',
    },
    {
      title: 'مینیمال، همیشه زیباست',
      description: 'فرم‌های ساده برای جزئیات روزمره',
      image: '/assets/nova-hero-editorial-v2.png',
      href: '#category/women',
    },
    {
      title: 'تعادل در هر فصل',
      description: 'استایلی برای تمام لحظه‌ها',
      image: '/assets/nova-hero-men.webp',
      href: '#category/men',
    },
    {
      title: 'شب‌های تهران',
      description: 'وقتی استایل، داستان می‌گوید',
      image: '/assets/nova-materials.webp',
      href: '#article',
    },
  ];
  return (
    <main className="lookbook-home bg-background">
      <div className="shell">
        <section className="lookbook-hero" aria-labelledby="storefront-home-title">
          <img
            src="/assets/nova-hero-editorial-v2.png"
            alt="استایل زنانه نوا در آتلیه‌ای با نور گرم"
          />
          <div className="lookbook-hero__shade" aria-hidden="true" />
          <div className="lookbook-hero__copy">
            <span>NOVA LOOKBOOK</span>
            <h1 id="storefront-home-title">استایل‌هایی برای زندگی واقعی</h1>
            <p>ترکیبی از ظرافت، شخصیت و لحظه‌های خاص؛ الهام بگیرید، سبک خود را پیدا کنید.</p>
            <a className="lookbook-button" href="#campaign">
              مشاهده لوک‌بوک <Icon name="arrow-left" size={16} />
            </a>
            <small>REAL PEOPLE · BEAUTIFUL STORIES</small>
          </div>
          <aside className="lookbook-hero__note" aria-hidden="true">
            <p>بیش از مد، یک سبک زندگی.</p>
            <span>
              TIMELESS
              <br />
              ELEGANT
              <br />
              PERSIAN
              <br />
              ALWAYS YOU
            </span>
          </aside>
        </section>

        <section className="lookbook-stories" aria-labelledby="lookbook-stories-title">
          <div className="lookbook-section-heading">
            <div>
              <span>NOVA / EDITORIAL STORIES</span>
              <h2 id="lookbook-stories-title">مجموعه استایل‌ها</h2>
            </div>
            <a href="#campaign">
              مشاهده همه <Icon name="arrow-left" size={14} />
            </a>
          </div>
          <div className="lookbook-stories__grid">
            {lookbookStories.map((story) => (
              <a className="lookbook-story-card" href={story.href} key={story.title}>
                <img src={story.image} alt="" loading="lazy" />
                <div>
                  <strong>{story.title}</strong>
                  <p>{story.description}</p>
                  <span>
                    مشاهده استایل <Icon name="arrow-left" size={13} />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="lookbook-manifesto" aria-labelledby="lookbook-manifesto-title">
          <div className="lookbook-manifesto__portrait">
            <img
              src="/assets/nova-women-lifestyle.webp"
              alt="پرتره زن با استایل کلاسیک نوا"
              loading="lazy"
            />
            <blockquote>مد، راهی برای گفتن داستان خود است.</blockquote>
          </div>
          <div className="lookbook-manifesto__copy">
            <span>NOVA / PERSONAL STYLE</span>
            <h2 id="lookbook-manifesto-title">لحظه‌هایی که می‌مانند</h2>
            <p>
              هر استایل، بخشی از یک روایت است؛ از صبح‌های آرام تا شب‌های فراموش‌نشدنی. لوک‌بوک نوا،
              الهام‌گرفته از زنان واقعی و زندگی‌های زیباست.
            </p>
            <a href="#article">
              کاوش در لوک‌بوک <Icon name="arrow-left" size={14} />
            </a>
          </div>
          <a className="lookbook-manifesto__aside" href="#campaign">
            <img
              src="/assets/nova-materials.webp"
              alt="جزئیات معماری و بافت‌های الهام‌بخش نوا"
              loading="lazy"
            />
            <span>زیباتر از دیروز، برای فردایی روشن‌تر</span>
          </a>
        </section>

        <section className="lookbook-products" aria-labelledby="new-arrivals-title">
          <div className="lookbook-section-heading">
            <div>
              <span>SHOP THE LOOK</span>
              <h2 id="new-arrivals-title">آیتم‌های این استایل</h2>
            </div>
            <a href="#products/new">
              مشاهده همه <Icon name="arrow-left" size={14} />
            </a>
          </div>
          <CatalogQueryState query={productsQuery}>
            <div className="lookbook-products__grid">
              {products.slice(0, 6).map((product) => (
                <article className="lookbook-product" key={product.slug}>
                  <div className="lookbook-product__media">
                    <a
                      href={`#product/${encodeURIComponent(product.slug)}`}
                      aria-label={`مشاهده ${product.name}`}
                    >
                      {product.image ? (
                        <img src={product.image} alt={product.alt} loading="lazy" />
                      ) : (
                        <Icon name="shirt" size={30} />
                      )}
                    </a>
                    <Button
                      className={`icon-button lookbook-product__favorite ${isWishlisted(product.slug) ? 'is-selected' : ''}`}
                      type="button"
                      aria-label={
                        isWishlisted(product.slug)
                          ? `حذف ${product.name} از علاقه‌مندی‌ها`
                          : `افزودن ${product.name} به علاقه‌مندی‌ها`
                      }
                      aria-pressed={isWishlisted(product.slug)}
                      onClick={() => onToggleWishlist(product.slug)}
                    >
                      <Icon name="heart" size={15} />
                    </Button>
                  </div>
                  <a
                    className="lookbook-product__name"
                    href={`#product/${encodeURIComponent(product.slug)}`}
                  >
                    {product.name}
                  </a>
                  <button
                    className="lookbook-product__price"
                    type="button"
                    onClick={() => adder.add(product)}
                    disabled={adder.isPending}
                  >
                    {formatToman(product.price)}
                  </button>
                </article>
              ))}
              <a className="lookbook-shop-card" href="#products/new">
                <span>استایل کامل این لوک</span>
                <strong>خرید مجموعه</strong>
                <Icon name="arrow-left" size={17} />
              </a>
            </div>
          </CatalogQueryState>
          {adder.feedback ? <AddToCartFeedback {...adder.feedback} /> : null}
        </section>
      </div>
    </main>
  );
}

function CategoryDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const audience = props.audience ?? 'women';
  const copy = audienceCopy[audience];
  const productsQuery = useCatalogProducts({ audience, limit: 8, sort: 'newest' });
  const adder = useProductAdder();
  const products = productsQuery.data?.items.map(toStorefrontProduct) ?? [];
  return (
    <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] space-y-8 bg-background py-6 md:py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <a href="#home" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <span>{copy.label}</span>
      </div>
      <section className="grid overflow-hidden rounded-editorial border border-border bg-surface md:grid-cols-2">
        <img
          className="min-h-64 w-full object-cover md:min-h-[420px]"
          src={copy.image}
          alt={`تصویر ادیتوریال دسته ${copy.label}`}
        />
        <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
          <span className="text-xs text-primary">کالکشن / {copy.label}</span>
          <h1 className="text-2xl md:text-3xl">{copy.title}</h1>
          <p className="text-sm leading-7 text-muted-foreground">{copy.description}</p>
          <a
            className="inline-flex min-h-11 w-max items-center gap-2 rounded-pill bg-primary px-4 text-sm font-semibold text-primary-foreground"
            href={`#products/${audience}`}
          >
            مشاهده محصولات <Icon name="arrow-left" size={16} />
          </a>
        </div>
      </section>
      <section aria-labelledby="category-products-title" className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl" id="category-products-title">
            انتخاب‌های محبوب {copy.label}
          </h2>
          <a className="text-sm text-primary underline" href={`#products/${audience}`}>
            مشاهده همه
          </a>
        </div>
        <CatalogQueryState
          query={productsQuery}
          emptyTitle={`هنوز محصولی در دسته ${copy.label} منتشر نشده است`}
        >
          <ProductGrid
            products={products}
            isWishlisted={props.isWishlisted ?? (() => false)}
            onToggleWishlist={props.onToggleWishlist ?? (() => undefined)}
            onAdd={adder.add}
          />
        </CatalogQueryState>
        {adder.feedback ? <AddToCartFeedback {...adder.feedback} /> : null}
      </section>
      <section className="grid gap-4 rounded-editorial border border-border bg-secondary p-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <span className="text-xs text-primary">راهنمای انتخاب</span>
          <h2 className="mt-2 text-lg">سایز درست، حس درست</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            برای هر مدل، اندازه‌گیری و پیشنهاد فیت را کنار مشخصات محصول گذاشته‌ایم.
          </p>
        </div>
        <a className="text-sm text-primary underline" href="#size-guide">
          مشاهده راهنمای اندازه
        </a>
      </section>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly CatalogFacetOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-h-11 flex-col gap-1 text-xs font-semibold">
      <span>{label}</span>
      <UiSelect
        className="min-h-11 border border-border bg-surface px-3 outline-none focus:border-primary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">همه</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.count ? ` (${option.count})` : ''}
          </option>
        ))}
      </UiSelect>
    </label>
  );
}

function ListingDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const state = useMemo(
    () => parseDiscoveryQuery(props.queryString, props.mode),
    [props.mode, props.queryString],
  );
  const baseHash = props.audience
    ? `#products/${props.audience}`
    : props.mode
      ? `#products/${props.mode}`
      : '#products';
  const categoryQuery = useCatalogCategories();
  const productsQuery = useCatalogProducts(discoveryFiltersFromQuery(state, props.audience));
  const facetsQuery = useCatalogFacets(discoveryFacetFiltersFromQuery(state, props.audience));
  const suggestionsQuery = useCatalogSuggestions(state.q, Boolean(state.q));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const adder = useProductAdder();
  const update = (changes: Record<string, string | undefined>) =>
    routeTo(buildDiscoveryHref(baseHash, props.queryString ?? '', changes));
  const selectedCategory = state.category;
  const categoryOptions = (categoryQuery.data ?? []).map((category) => ({
    value: category.slug,
    label: category.name,
    count: 0,
    selected: category.slug === selectedCategory,
  }));
  const groups = new Map(
    (facetsQuery.data?.groups ?? []).map((group) => [group.key, group.options]),
  );
  const sizeOptions = preserveFacetSelection(groups.get('size') ?? [], state.size);
  const colorOptions = preserveFacetSelection(groups.get('color') ?? [], state.color);
  const materialOptions = preserveFacetSelection(groups.get('material') ?? [], state.material);
  const title = state.q
    ? `نتایج جست‌وجوی «${state.q}»`
    : props.mode === 'sale'
      ? 'تخفیف‌های منتخب'
      : props.mode === 'new'
        ? 'تازه‌های آتلیه'
        : props.audience
          ? `محصولات ${audienceCopy[props.audience].label}`
          : 'همه محصولات';
  const products = productsQuery.data?.items.map(toStorefrontProduct) ?? [];
  const filters = (
    <div className="space-y-4">
      <FilterSelect
        label="دسته‌بندی"
        value={selectedCategory}
        options={categoryOptions}
        onChange={(value) => update({ category: value })}
      />
      <FilterSelect
        label="اندازه"
        value={state.size}
        options={sizeOptions}
        onChange={(value) => update({ size: value })}
      />
      <FilterSelect
        label="رنگ"
        value={state.color}
        options={colorOptions}
        onChange={(value) => update({ color: value })}
      />
      <FilterSelect
        label="متریال"
        value={state.material}
        options={materialOptions}
        onChange={(value) => update({ material: value })}
      />
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <Checkbox
          checked={state.inStock}
          onChange={(event) => update({ inStock: event.target.checked ? 'true' : undefined })}
        />{' '}
        فقط موجود
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <Checkbox
          checked={state.onSale}
          onChange={(event) => update({ onSale: event.target.checked ? 'true' : undefined })}
        />{' '}
        پیشنهاد ویژه
      </label>
      <a className="text-xs text-primary underline" href={baseHash}>
        حذف همه فیلترها
      </a>
    </div>
  );
  return (
    <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] space-y-6 bg-background py-6 md:space-y-8 md:py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <a href="#home" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <span>فروشگاه</span>
      </div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs text-primary">NOVA / CATALOG</span>
          <h1 className="mt-2 text-2xl md:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {productsQuery.isPending
              ? 'در حال بارگذاری...'
              : `${new Intl.NumberFormat('fa-IR').format(productsQuery.data?.total ?? 0)} مدل برای انتخاب شما`}
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-2 border border-border bg-surface px-3 text-xs">
          <span>مرتب‌سازی</span>
          <UiSelect
            className="bg-transparent outline-none"
            value={state.sort}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
            <option value="name">الفبا</option>
          </UiSelect>
        </label>
      </header>
      {state.q ? (
        <section className="border border-border bg-surface p-4" aria-label="پیشنهادهای جست‌وجو">
          <label className="sr-only" htmlFor="discovery-search">
            عبارت جست‌وجو
          </label>
          <UiInput
            id="discovery-search"
            className="min-h-11 w-full border border-border bg-background px-3 outline-none focus:border-primary"
            dir="auto"
            value={state.q}
            onChange={(event) => update({ q: event.target.value || undefined })}
          />
          <div className="mt-3 flex flex-wrap gap-2" aria-live="polite">
            {suggestionsQuery.isPending ? (
              <span className="text-xs text-muted-foreground">در حال جست‌وجو...</span>
            ) : (
              suggestionsQuery.data?.map((suggestion) => (
                <a
                  className="min-h-11 border border-border px-3 py-2 text-xs hover:border-primary hover:text-primary"
                  href={
                    suggestion.type === 'CATEGORY'
                      ? `#products?category=${encodeURIComponent(suggestion.slug)}`
                      : `#product/${encodeURIComponent(suggestion.slug)}`
                  }
                  key={`${suggestion.type}:${suggestion.id}`}
                >
                  {suggestion.label}
                </a>
              ))
            )}
          </div>
        </section>
      ) : null}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          className="flex-1"
          type="button"
          variant="outline"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Icon name="layers" size={16} /> فیلترها
        </Button>
        <label className="flex min-h-11 flex-1 items-center justify-center gap-2 border border-border bg-surface px-2 text-xs">
          <span>مرتب‌سازی</span>
          <UiSelect
            className="min-w-0 bg-transparent"
            value={state.sort}
            onChange={(event) => update({ sort: event.target.value })}
          >
            <option value="newest">جدیدترین</option>
            <option value="price_asc">ارزان‌ترین</option>
            <option value="price_desc">گران‌ترین</option>
            <option value="name">الفبا</option>
          </UiSelect>
        </label>
      </div>
      <div className="grid gap-8 md:grid-cols-[minmax(190px,296px)_minmax(0,1fr)]">
        <aside className="hidden border-e border-border pe-5 md:block" aria-label="فیلتر محصولات">
          {filters}
        </aside>
        <section className="space-y-5" aria-label="نتایج محصولات">
          <CatalogQueryState query={productsQuery}>
            <ProductGrid
              products={products}
              isWishlisted={props.isWishlisted ?? (() => false)}
              onToggleWishlist={props.onToggleWishlist ?? (() => undefined)}
              onAdd={adder.add}
            />
          </CatalogQueryState>
          {productsQuery.data ? (
            <Pagination
              page={productsQuery.data.page}
              limit={productsQuery.data.limit}
              total={productsQuery.data.total}
              hrefForPage={(page) =>
                buildDiscoveryHref(baseHash, props.queryString ?? '', { page: String(page) })
              }
            />
          ) : null}
          {adder.feedback ? <AddToCartFeedback {...adder.feedback} /> : null}
        </section>
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
            aria-labelledby="mobile-discovery-filters-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setMobileFiltersOpen(false);
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg" id="mobile-discovery-filters-title">
                فیلترها
              </h2>
              <Button
                className="icon-button"
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="بستن فیلترها"
              >
                <Icon name="close" />
              </Button>
            </div>
            {filters}
            <Button
              className="mt-5 w-full"
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

function Pagination({
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
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (pageCount <= 1) return null;
  const pages = [
    ...new Set(
      [1, page - 1, page, page + 1, pageCount].filter((value) => value >= 1 && value <= pageCount),
    ),
  ].sort((a, b) => a - b);
  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-2"
      aria-label="صفحه‌بندی محصولات"
    >
      {page > 1 ? (
        <a
          className="inline-flex min-h-11 items-center border border-border bg-surface px-3 text-xs hover:border-primary"
          href={hrefForPage(page - 1)}
        >
          قبلی
        </a>
      ) : null}
      {pages.map((value, index) => (
        <span className="inline-flex items-center gap-2" key={value}>
          {pages[index - 1] !== undefined && value - pages[index - 1]! > 1 ? (
            <span aria-hidden="true">…</span>
          ) : null}
          <a
            className={`inline-flex h-11 min-w-11 items-center justify-center border px-3 text-xs ${value === page ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:border-primary'}`}
            href={hrefForPage(value)}
            aria-current={value === page ? 'page' : undefined}
          >
            {new Intl.NumberFormat('fa-IR').format(value)}
          </a>
        </span>
      ))}
      {page < pageCount ? (
        <a
          className="inline-flex min-h-11 items-center border border-border bg-surface px-3 text-xs hover:border-primary"
          href={hrefForPage(page + 1)}
        >
          بعدی
        </a>
      ) : null}
    </nav>
  );
}

function ProductDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const slug = props.slug ?? '';
  const productQuery = useCatalogProduct(slug);
  const relatedQuery = useCatalogProducts(
    {
      audience: productQuery.data?.categories.find((category) =>
        ['women', 'men', 'children'].includes(category.slug),
      )?.slug as CatalogAudience | undefined,
      limit: 4,
      sort: 'newest',
    },
    Boolean(productQuery.data),
  );
  const [selectedOptionValues, setSelectedOptionValues] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [mediaIndex, setMediaIndex] = useState(0);
  const adder = useAddCartItem();
  const relatedAdder = useProductAdder();
  const [feedback, setFeedback] = useState<{ message: string; error?: boolean }>();
  useEffect(() => {
    setSelectedOptionValues({});
    setSelectedSize('');
    setSelectedColor('');
    setMediaIndex(0);
    setFeedback(undefined);
  }, [productQuery.data?.id]);
  if (shouldShowProductLoading(slug, productQuery.isPending) && !productQuery.data)
    return (
      <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background py-6">
        <ProductSkeleton count={1} />
      </main>
    );
  if (productQuery.isError && !productQuery.data)
    return (
      <main className="shell mx-auto flex min-h-[55svh] w-[calc(100%-2rem)] max-w-[1280px] items-center bg-background py-8">
        <MessageCard
          title="بارگذاری محصول ممکن نشد"
          description="لطفاً اتصال خود را بررسی کنید و دوباره تلاش کنید."
          icon="warning"
          action="تلاش دوباره"
          onAction={() => void productQuery.refetch()}
          tone="warning"
        />
      </main>
    );
  if (!productQuery.data)
    return (
      <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background py-8">
        <MessageCard
          title="این محصول پیدا نشد"
          description="ممکن است مسیر تغییر کرده یا محصول دیگر منتشر نباشد."
          icon="layers"
        />
      </main>
    );
  const product = toStorefrontProductDetail(productQuery.data);
  const variants = product.variants ?? [];
  const variantOptions = structuredVariantOptions(product);
  const usesStructuredVariantOptions =
    variantOptions.length > 0 && variants.some((variant) => variant.optionValueIds.length > 0);
  const legacySizes = usesStructuredVariantOptions
    ? []
    : [
        ...new Set(
          variants
            .map((variant) => variant.size)
            .filter((value): value is string => Boolean(value)),
        ),
      ];
  const legacyColors = usesStructuredVariantOptions
    ? []
    : [
        ...new Set(
          variants
            .map((variant) => variant.color)
            .filter((value): value is string => Boolean(value)),
        ),
      ];
  const selectedVariant = resolveVariant(
    product,
    selectedOptionValues,
    selectedSize,
    selectedColor,
  );
  const gallery = selectedVariant?.media?.length ? selectedVariant.media : (product.media ?? []);
  const media = gallery[mediaIndex] ?? gallery[0];
  const price = selectedVariant?.priceToman ?? product.price;
  const compareAt = validCompareAt(
    price,
    selectedVariant ? selectedVariant.compareAtPriceToman : product.compareAt,
  );
  const hasVariantSelection = !variants.length || Boolean(selectedVariant);
  const available = selectedVariant
    ? selectedVariant.available
    : !variants.length && product.available !== false;
  const addDisabled = adder.isPending || !hasVariantSelection || !available;
  const submitAdd = () => {
    if (!selectedVariant && variants.length) {
      setFeedback({ message: 'لطفاً تنوع محصول را انتخاب کنید.', error: true });
      return;
    }
    if (!selectedVariant && !available) {
      setFeedback({ message: 'این محصول در حال حاضر موجود نیست.', error: true });
      return;
    }
    if (!selectedVariant) {
      setFeedback({ message: 'این محصول تنوع قابل افزودن ندارد.', error: true });
      return;
    }
    adder.mutate(
      {
        variantId: selectedVariant.id,
        quantity: 1,
        idempotencyKey: globalThis.crypto?.randomUUID?.(),
      },
      {
        onSuccess: () => setFeedback({ message: `«${product.name}» به سبد خرید اضافه شد.` }),
        onError: (error) =>
          setFeedback({
            message: error instanceof Error ? error.message : 'افزودن کالا به سبد ممکن نشد.',
            error: true,
          }),
      },
    );
  };
  return (
    <main className="shell mx-auto w-[calc(100%-2rem)] max-w-[1280px] space-y-8 bg-background py-6 md:py-10">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <a href="#home" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <a href={`#products/${product.audience}`} className="hover:text-primary">
          {audienceCopy[product.audience].label}
        </a>
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <section aria-label="تصاویر محصول" className="space-y-3">
          <div className="aspect-[4/5] overflow-hidden rounded-editorial bg-secondary">
            {media?.url || product.image ? (
              <img
                className="h-full w-full object-cover"
                src={media?.url ?? product.image}
                alt={media?.altText ?? product.alt}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <Icon name="shirt" size={40} />
              </span>
            )}
          </div>
          {gallery.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((item, index) => (
                <Button
                  className={`h-20 w-16 shrink-0 overflow-hidden rounded-control border ${index === mediaIndex ? 'border-primary' : 'border-border'}`}
                  type="button"
                  aria-label={`نمایش تصویر ${index + 1}`}
                  aria-pressed={index === mediaIndex}
                  onClick={() => setMediaIndex(index)}
                  key={`${item.url}-${index}`}
                >
                  <img className="h-full w-full object-cover" src={item.url} alt="" />
                </Button>
              ))}
            </div>
          ) : null}
        </section>
        <section className="space-y-5" aria-labelledby="product-title">
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{product.category}</span>
            <Button
              className="icon-button"
              type="button"
              aria-label="افزودن به علاقه‌مندی‌ها"
              onClick={() => (props.onToggleWishlist ?? (() => undefined))(product.slug)}
            >
              <Icon name="heart" size={19} />
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl" id="product-title">
            {product.name}
          </h1>
          {product.description ? (
            <p className="text-sm leading-8 text-muted-foreground">{product.description}</p>
          ) : null}
          <div className="text-lg font-bold text-primary">
            {compareAt ? (
              <del className="me-2 text-sm font-normal text-muted-foreground">
                {formatToman(compareAt)}
              </del>
            ) : null}
            <strong>{formatToman(price)}</strong>
          </div>
          <p className={available ? 'text-sm text-success' : 'text-sm text-warning'} role="status">
            {variants.length && !selectedVariant
              ? 'انتخاب کنید'
              : available
                ? product.stock === 'رو به اتمام'
                  ? 'رو به اتمام'
                  : 'موجود'
                : 'ناموجود'}
          </p>
          {variantOptions.map((option) => (
            <fieldset className="space-y-2" key={option.id}>
              <legend className="text-sm font-semibold">{option.name}</legend>
              <div className="flex flex-wrap gap-2">
                {option.values.map((value) => (
                  <Button
                    className={`min-h-11 border px-3 text-sm ${selectedOptionValues[option.key] === value.id ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`}
                    type="button"
                    aria-pressed={selectedOptionValues[option.key] === value.id}
                    onClick={() =>
                      setSelectedOptionValues((current) => ({ ...current, [option.key]: value.id }))
                    }
                    key={value.id}
                  >
                    {value.label}
                  </Button>
                ))}
              </div>
            </fieldset>
          ))}
          {legacySizes.length ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">اندازه</legend>
              <div className="flex flex-wrap gap-2">
                {legacySizes.map((value) => (
                  <Button
                    className={`min-h-11 min-w-11 border px-3 text-sm ${selectedSize === value ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`}
                    type="button"
                    aria-pressed={selectedSize === value}
                    onClick={() => setSelectedSize(value)}
                    key={value}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </fieldset>
          ) : null}
          {legacyColors.length ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">رنگ</legend>
              <div className="flex flex-wrap gap-2">
                {legacyColors.map((value) => (
                  <Button
                    className={`min-h-11 min-w-11 border px-3 text-sm ${selectedColor === value ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`}
                    type="button"
                    aria-pressed={selectedColor === value}
                    onClick={() => setSelectedColor(value)}
                    key={value}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </fieldset>
          ) : null}
          <Button
            className="w-full"
            type="button"
            size="lg"
            disabled={addDisabled}
            loading={adder.isPending}
            onClick={submitAdd}
          >
            {productAddButtonLabel(variants.length, Boolean(selectedVariant), available)}{' '}
            <Icon name="bag" size={17} />
          </Button>
          {feedback ? <AddToCartFeedback {...feedback} /> : null}
          <div className="border-t border-border pt-4 text-sm leading-7 text-muted-foreground">
            <p>ارسال به تهران، بین دوشنبه تا چهارشنبه</p>
            <p>امکان مرجوعی تا ۷ روز مطابق شرایط کالا</p>
          </div>
        </section>
      </div>
      {relatedQuery.data?.items.length ? (
        <section className="space-y-5" aria-labelledby="related-title">
          <h2 className="text-xl" id="related-title">
            پیشنهادهای همراه
          </h2>
          <ProductGrid
            products={relatedQuery.data.items.map(toStorefrontProduct)}
            isWishlisted={props.isWishlisted ?? (() => false)}
            onToggleWishlist={props.onToggleWishlist ?? (() => undefined)}
            onAdd={relatedAdder.add}
          />
          {relatedAdder.feedback ? <AddToCartFeedback {...relatedAdder.feedback} /> : null}
        </section>
      ) : null}
    </main>
  );
}

export function StorefrontDiscoveryPage(props: StorefrontDiscoveryPageProps) {
  switch (props.view) {
    case 'home':
      return <HomeDiscovery props={props} />;
    case 'category':
      return <CategoryDiscovery props={props} />;
    case 'product':
      return <ProductDiscovery props={props} />;
    case 'listing':
    case 'search':
      return <ListingDiscovery props={props} />;
  }
}
