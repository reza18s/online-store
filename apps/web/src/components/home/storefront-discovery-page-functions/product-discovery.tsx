import { useEffect, useState } from 'react';
import type { CatalogAudience } from '@nova/api-client';
import { Button } from '@nova/ui';
import { Icon } from '../../ui/icon';
import {
  toStorefrontProduct,
  toStorefrontProductDetail,
  useCatalogProduct,
  useCatalogProducts,
} from '../../../lib/catalog/catalog-api';
import { useAddCartItem } from '../../../lib/cart/cart-api';

import type { StorefrontDiscoveryPageProps } from '../../../pages/catalog/storefront-discovery-page-shared';
import { audienceCopy } from '../../../pages/catalog/storefront-discovery-page-shared';

import { AddToCartFeedback } from './add-to-cart-feedback';

import { MessageCard } from './message-card';

import { ProductGrid } from './product-grid';

import { ProductSkeleton } from './product-skeleton';

import { formatToman } from './format-toman';

import { productAddButtonLabel } from './product-add-button-label';

import { resolveVariant } from './resolve-variant';

import { shouldShowProductLoading } from './should-show-product-loading';

import { structuredVariantOptions } from './structured-variant-options';

import { useProductAdder } from './use-product-adder';

import { validCompareAt } from './valid-compare-at';

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
