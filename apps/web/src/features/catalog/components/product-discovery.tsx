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
