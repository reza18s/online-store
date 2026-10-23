# Page Context

## Page

**Path:** `src/features/catalog/components/product-discovery.tsx`

```tsx
import { useEffect, useState } from 'react';
import type { CatalogAudience } from '@nova/api-client';
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import {
  toStorefrontProduct,
  toStorefrontProductDetail,
  useCatalogProduct,
  useCatalogProducts,
} from '@/features/catalog/api/catalog-api';
import { useAddCartItem } from '@/features/cart/api/cart-api';
import { trackAnalyticsEvent } from '@/shared/analytics/analytics';

import type { StorefrontDiscoveryPageProps } from '@/features/catalog/pages/storefront-discovery-page-shared';
import { audienceCopy } from '@/features/catalog/pages/storefront-discovery-page-shared';

import { AddToCartFeedback } from '@/features/catalog/components/add-to-cart-feedback';

import { MessageCard } from '@/features/catalog/components/message-card';

import { ProductGrid } from '@/features/catalog/components/product-grid';

import { ProductSkeleton } from '@/features/catalog/components/product-skeleton';

import { formatToman } from '@/shared/utils/format-toman';

import { productAddButtonLabel } from '@/features/catalog/components/product-add-button-label';

import { resolveVariant } from '@/features/catalog/components/resolve-variant';

import { shouldShowProductLoading } from '@/features/catalog/components/should-show-product-loading';

import { structuredVariantOptions } from '@/features/catalog/components/structured-variant-options';

import { useProductAdder } from '@/features/catalog/components/use-product-adder';

import { validCompareAt } from '@/features/catalog/components/valid-compare-at';

export function ProductDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
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
  useEffect(() => {
    if (!productQuery.data) return;
    trackAnalyticsEvent({
      name: 'product_view',
      properties: { productId: productQuery.data.id, slug: productQuery.data.slug },
    });
  }, [productQuery.data?.id, productQuery.data?.slug]);
  if (shouldShowProductLoading(slug, productQuery.isPending) && !productQuery.data)
    return (
      <main className="shell inner-page product-page">
        <ProductSkeleton count={1} />
      </main>
    );
  if (productQuery.isError && !productQuery.data)
    return (
      <main className="shell system-page">
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
      <main className="shell system-page">
        <MessageCard
          title="این محصول پیدا نشد"
          description="ممکن است مسیر تغییر کرده یا محصول دیگر منتشر نباشد."
          icon="layers"
        />
      </main>
    );
  const product = toStorefrontProductDetail(productQuery.data);
  const isWishlisted = props.isWishlisted?.(product.slug) ?? false;
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
    <main className="shell inner-page product-page">
      <div className="breadcrumb">
        <a href="/" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <a href={`/products/${product.audience}`} className="hover:text-primary">
          {audienceCopy[product.audience].label}
        </a>
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-detail">
        <section aria-label="تصاویر محصول" className="product-detail__gallery">
          <div className="product-detail__main-image">
            {media?.url || product.image ? (
              <img src={media?.url ?? product.image}
                alt={media?.altText ?? product.alt}
              />
            ) : (
              <span className="flex h-full items-center justify-center text-muted-foreground">
                <Icon name="shirt" size={40} />
              </span>
            )}
          </div>
          {gallery.length > 1 ? (
            <div className="product-detail__thumbs">
              {gallery.map((item, index) => (
                <Button
                  className={index === mediaIndex ? 'is-active' : ''}
                  type="button"
                  aria-label={`نمایش تصویر ${index + 1}`}
                  aria-pressed={index === mediaIndex}
                  onClick={() => setMediaIndex(index)}
                  key={`${item.url}-${index}`}
                >
                  <img src={item.url} alt="" />
                </Button>
              ))}
            </div>
          ) : null}
        </section>
        <section className="product-detail__info" aria-labelledby="product-title">
          <div className="product-detail__eyebrow">
            <span>{product.category}</span>
            <Button
              className={`icon-button ${isWishlisted ? 'is-selected' : ''}`}
              type="button"
              aria-label={
                isWishlisted
                  ? `حذف ${product.name} از علاقه‌مندی‌ها`
                  : `افزودن ${product.name} به علاقه‌مندی‌ها`
              }
              aria-pressed={isWishlisted}
              onClick={() => (props.onToggleWishlist ?? (() => undefined))(product.slug)}
            >
              <Icon name="heart" size={19} />
            </Button>
          </div>
          <h1 id="product-title">
            {product.name}
          </h1>
          {product.description ? (
            <p className="product-detail__description">{product.description}</p>
          ) : null}
          <div className="product-detail__price">
            {compareAt ? (
              <del>
                {formatToman(compareAt)}
              </del>
            ) : null}
            <strong>{formatToman(price)}</strong>
          </div>
          <p className={available ? 'product-detail__availability is-available' : 'product-detail__availability is-unavailable'} role="status">
            {variants.length && !selectedVariant
              ? 'انتخاب کنید'
              : available
                ? product.stock === 'رو به اتمام'
                  ? 'رو به اتمام'
                  : 'موجود'
                : 'ناموجود'}
          </p>
          {variantOptions.map((option) => (
            <fieldset className="size-picker" key={option.id}>
              <legend>{option.name}</legend>
              <div className="size-picker__options">
                {option.values.map((value) => (
                  <Button
                    className={selectedOptionValues[option.key] === value.id ? 'is-active' : ''}
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
            <fieldset className="size-picker">
              <legend>اندازه</legend>
              <div className="size-picker__options">
                {legacySizes.map((value) => (
                  <Button
                    className={selectedSize === value ? 'is-active' : ''}
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
            <fieldset className="size-picker">
              <legend>رنگ</legend>
              <div className="size-picker__options">
                {legacyColors.map((value) => (
                  <Button
                    className={selectedColor === value ? 'is-active' : ''}
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
            className="product-detail__add"
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
          <div className="product-detail__delivery">
            <p>ارسال به تهران، بین دوشنبه تا چهارشنبه</p>
            <p>امکان مرجوعی تا ۷ روز مطابق شرایط کالا</p>
          </div>
        </section>
      </div>
      {relatedQuery.data?.items.length ? (
        <section className="product-related" aria-labelledby="related-title">
          <h2 id="related-title">
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

```

---

## Custom Components


### 1. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 2. AddToCartFeedback

**Path:** `src/features/catalog/components/add-to-cart-feedback.tsx`

```tsx
export function AddToCartFeedback({ message, error }: { message: string; error?: boolean }) {
  return (
    <p
      className={`text-sm ${error ? 'text-destructive' : 'text-success'}`}
      role={error ? 'alert' : 'status'}
    >
      {message}
    </p>
  );
}

```

---


### 3. MessageCard

**Path:** `src/features/catalog/components/message-card.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function MessageCard({
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

```

---


### 4. ProductCard

**Path:** `src/features/catalog/components/product-card.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { type StorefrontProduct } from '@/features/catalog/api/catalog-api';
import { availabilityLabel } from '@/features/catalog/components/availability-label';

import { formatToman } from '@/shared/utils/format-toman';

import { validCompareAt } from '@/features/catalog/components/valid-compare-at';

export function ProductCard({
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
    <article className={`product-card${disabled ? ' is-unavailable' : ''}`}>
      <div className="product-card__media">
        <a
          href={`/product/${encodeURIComponent(product.slug)}`}
          aria-label={`مشاهده ${product.name}`}
        >
          {product.image ? (
            <img src={product.image} alt={product.alt} loading="lazy" />
          ) : (
            <span className="product-card__placeholder">
              <Icon name="shirt" size={32} />
            </span>
          )}
        </a>
        {disabled ? (
          <span className="product-card__sold-out" aria-hidden="true">
            <span>ناموجود</span>
          </span>
        ) : null}
        <Button
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
        </Button>
        {product.tag ? <span className="product-card__tag">{product.tag}</span> : null}
      </div>

      <div className="product-card__body">
        <a className="product-card__title" href={`/product/${encodeURIComponent(product.slug)}`}>
          {product.name}
        </a>
        <div className="product-card__meta">
          <span>{product.category}</span>
          {!disabled ? (
            <span className={product.stock === 'رو به اتمام' ? 'is-warning' : ''}>
              {availabilityLabel(product)}
            </span>
          ) : null}
        </div>
        <div className="product-card__footer">
          <div className="product-card__price">
            {compareAt ? <del>{formatToman(compareAt)}</del> : null}
            <strong>{formatToman(product.price)}</strong>
          </div>
        </div>
        {product.colors.length > 0 ? (
          <div className="product-card__swatches" aria-label="رنگ‌های موجود">
            {product.colors.slice(0, 4).map((color) => (
              <span style={{ backgroundColor: color }} key={color} />
            ))}
          </div>
        ) : null}
        <Button
          className="product-card__add"
          type="button"
          disabled={disabled}
          aria-label={
            disabled ? `${product.name} قابل افزودن نیست` : `افزودن ${product.name} به سبد`
          }
          onClick={() => onAdd(product)}
        >
          <Icon name="bag" size={16} />
          {disabled ? 'ناموجود' : 'افزودن به سبد خرید'}
        </Button>
      </div>
    </article>
  );
}

```

---


### 5. ProductGrid

**Path:** `src/features/catalog/components/product-grid.tsx`

```tsx
import { type StorefrontProduct } from '@/features/catalog/api/catalog-api';

import { ProductCard } from '@/features/catalog/components/product-card';

export function ProductGrid({
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
    <div className="product-grid">
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

```

---


### 6. ProductSkeleton

**Path:** `src/features/catalog/components/product-skeleton.tsx`

```tsx
export function ProductSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="product-grid product-grid--loading"
      role="status"
      aria-label="در حال بارگذاری محصولات"
    >
      {Array.from({ length: count }, (_, index) => (
        <div className="product-skeleton motion-safe:animate-pulse" key={index} aria-hidden="true">
          <div className="product-skeleton__media" />
          <div className="product-skeleton__body">
            <div className="product-skeleton__title" />
            <div className="product-skeleton__meta" />
            <div className="product-skeleton__price" />
            <div className="product-skeleton__swatches">
              <span />
              <span />
              <span />
            </div>
            <div className="product-skeleton__action" />
          </div>
        </div>
      ))}
    </div>
  );
}

```

---


### 7. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

```

---


## Summary

- Page: `src/features/catalog/components/product-discovery.tsx`
- Custom component files: 7
- Total files included: 8
