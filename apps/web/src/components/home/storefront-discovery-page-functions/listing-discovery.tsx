import { useMemo, useState } from 'react';

import { Button, Checkbox, Input as UiInput, Select as UiSelect } from '@nova/ui';
import { Icon } from '../../ui/icon';
import {
  toStorefrontProduct,
  useCatalogCategories,
  useCatalogFacets,
  useCatalogProducts,
  useCatalogSuggestions,
} from '../../../lib/catalog/catalog-api';

import type { StorefrontDiscoveryPageProps } from '../../../pages/catalog/storefront-discovery-page-shared';
import { audienceCopy } from '../../../pages/catalog/storefront-discovery-page-shared';

import { AddToCartFeedback } from './add-to-cart-feedback';

import { CatalogQueryState } from './catalog-query-state';

import { FilterSelect } from './filter-select';

import { Pagination } from './pagination';

import { ProductGrid } from './product-grid';

import { buildDiscoveryHref } from './build-discovery-href';

import { discoveryFacetFiltersFromQuery } from './discovery-facet-filters-from-query';

import { discoveryFiltersFromQuery } from './discovery-filters-from-query';

import { parseDiscoveryQuery } from './parse-discovery-query';

import { preserveFacetSelection } from './preserve-facet-selection';

import { routeTo } from './route-to';

import { useProductAdder } from './use-product-adder';

export function ListingDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
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
