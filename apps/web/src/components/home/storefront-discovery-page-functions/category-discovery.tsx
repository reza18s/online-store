import { Icon } from '../../ui/icon';
import { toStorefrontProduct, useCatalogProducts } from '../../../lib/catalog/catalog-api';

import type { StorefrontDiscoveryPageProps } from '../../../pages/catalog/storefront-discovery-page-shared';
import { audienceCopy } from '../../../pages/catalog/storefront-discovery-page-shared';

import { AddToCartFeedback } from './add-to-cart-feedback';

import { CatalogQueryState } from './catalog-query-state';

import { ProductGrid } from './product-grid';

import { useProductAdder } from './use-product-adder';

export function CategoryDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
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
