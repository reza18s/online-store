import { Icon } from '@/shared/ui/icon';
import { toStorefrontProduct, useCatalogProducts } from '@/features/catalog/api/catalog-api';

import type { StorefrontDiscoveryPageProps } from '@/features/catalog/pages/storefront-discovery-page-shared';
import { audienceCopy } from '@/features/catalog/pages/storefront-discovery-page-shared';

import { AddToCartFeedback } from '@/features/catalog/components/add-to-cart-feedback';

import { CatalogQueryState } from '@/features/catalog/components/catalog-query-state';

import { ProductGrid } from '@/features/catalog/components/product-grid';

import { useProductAdder } from '@/features/catalog/components/use-product-adder';

export function CategoryDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const audience = props.audience ?? 'women';
  const copy = audienceCopy[audience];
  const productsQuery = useCatalogProducts({ audience, limit: 8, sort: 'newest' });
  const adder = useProductAdder();
  const products = productsQuery.data?.items.map(toStorefrontProduct) ?? [];
  return (
    <main className="shell inner-page category-page">
      <div className="breadcrumb">
        <a href="/" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <span>{copy.label}</span>
      </div>
      <section className="category-hero">
        <img
          className="category-hero__image"
          src={copy.image}
          alt={`تصویر ادیتوریال دسته ${copy.label}`}
        />
        <div className="category-hero__copy">
          <span className="section-heading__eyebrow">کالکشن / {copy.label}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <a
            className="editorial-cta"
            href={`/products/${audience}`}
          >
            مشاهده محصولات <Icon name="arrow-left" size={16} />
          </a>
        </div>
      </section>
      <section aria-labelledby="category-products-title" className="category-products">
        <div className="section-heading">
          <h2 id="category-products-title">
            انتخاب‌های محبوب {copy.label}
          </h2>
          <a className="text-link" href={`/products/${audience}`}>
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
      <section className="guide-callout">
        <div>
          <span className="section-heading__eyebrow">راهنمای انتخاب</span>
          <h2>سایز درست، حس درست</h2>
          <p>
            برای هر مدل، اندازه‌گیری و پیشنهاد فیت را کنار مشخصات محصول گذاشته‌ایم.
          </p>
        </div>
        <a className="text-link" href="/size-guide">
          مشاهده راهنمای اندازه
        </a>
      </section>
    </main>
  );
}
