import { useEffect, useMemo, useState } from 'react';

import { Button, Checkbox, Input as UiInput, Select as UiSelect } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';
import {
  toStorefrontProduct,
  useCatalogCategories,
  useCatalogFacets,
  useCatalogProducts,
  useCatalogSuggestions,
} from '@/features/catalog/api/catalog-api';

import type { StorefrontDiscoveryPageProps } from '@/features/catalog/pages/storefront-discovery-page-shared';
import { audienceCopy } from '@/features/catalog/pages/storefront-discovery-page-shared';

import { AddToCartFeedback } from '@/features/catalog/components/add-to-cart-feedback';

import { CatalogQueryState } from '@/features/catalog/components/catalog-query-state';

import { FilterSelect } from '@/features/catalog/components/filter-select';

import { Pagination } from '@/features/catalog/components/pagination';

import { ProductGrid } from '@/features/catalog/components/product-grid';

import { buildDiscoveryHref } from '@/features/catalog/components/build-discovery-href';

import { discoveryFacetFiltersFromQuery } from '@/features/catalog/components/discovery-facet-filters-from-query';

import { discoveryFiltersFromQuery } from '@/features/catalog/components/discovery-filters-from-query';

import { parseDiscoveryQuery } from '@/features/catalog/components/parse-discovery-query';

import { preserveFacetSelection } from '@/features/catalog/components/preserve-facet-selection';

import { routeTo } from '@/features/catalog/components/route-to';

import { useProductAdder } from '@/features/catalog/components/use-product-adder';
import { trackAnalyticsEvent } from '@/shared/analytics/analytics';

export function ListingDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const state = useMemo(
    () => parseDiscoveryQuery(props.queryString, props.mode),
    [props.mode, props.queryString],
  );
  const baseRoute = props.audience
    ? `/products/${props.audience}`
    : props.mode
      ? `/products/${props.mode}`
      : '/products';
  const categoryQuery = useCatalogCategories();
  const productsQuery = useCatalogProducts(discoveryFiltersFromQuery(state, props.audience));
  const facetsQuery = useCatalogFacets(discoveryFacetFiltersFromQuery(state, props.audience));
  const suggestionsQuery = useCatalogSuggestions(state.q, Boolean(state.q));
  useEffect(() => {
    if (!state.q) return;
    trackAnalyticsEvent({ name: 'search', properties: { queryLength: state.q.length } });
  }, [state.q]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const adder = useProductAdder();
  const update = (changes: Record<string, string | undefined>) =>
    routeTo(buildDiscoveryHref(baseRoute, props.queryString ?? '', changes));
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
  const renderFilters = (openCategoryByDefault: boolean) => (
    <div className="listing-filters">
      <FilterSelect
        label="دسته‌بندی"
        defaultOpen={openCategoryByDefault}
        isLoading={categoryQuery.isPending}
        value={selectedCategory}
        options={categoryOptions}
        onChange={(value) => update({ category: value })}
      />
      <FilterSelect
        label="اندازه"
        isLoading={facetsQuery.isPending}
        value={state.size}
        options={sizeOptions}
        onChange={(value) => update({ size: value })}
      />
      <FilterSelect
        label="رنگ"
        isLoading={facetsQuery.isPending}
        value={state.color}
        options={colorOptions}
        onChange={(value) => update({ color: value })}
      />
      <FilterSelect
        label="متریال"
        isLoading={facetsQuery.isPending}
        value={state.material}
        options={materialOptions}
        onChange={(value) => update({ material: value })}
      />
      <label className="listing-filter-check">
        <Checkbox
          checked={state.inStock}
          onChange={(event) => update({ inStock: event.target.checked ? 'true' : undefined })}
        />{' '}
        فقط موجود
      </label>
      <label className="listing-filter-check">
        <Checkbox
          checked={state.onSale}
          onChange={(event) => update({ onSale: event.target.checked ? 'true' : undefined })}
        />{' '}
        پیشنهاد ویژه
      </label>
      <a className="listing-filter-reset" href={baseRoute}>
        حذف همه فیلترها
      </a>
    </div>
  );
  return (
    <main className="shell inner-page listing-page">
      <div className="breadcrumb">
        <a href="/" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <span>فروشگاه</span>
      </div>
      <header className="listing-header">
        <div>
          <span className="section-heading__eyebrow">NOVA / CATALOG</span>
          <h1>{title}</h1>
          <p>
            {productsQuery.isPending
              ? 'در حال بارگذاری...'
              : `${formatPersianNumber(productsQuery.data?.total ?? 0)} مدل برای انتخاب شما`}
          </p>
        </div>
        <label className="sort-control">
          <span>مرتب‌سازی</span>
          <UiSelect
            className="sort-control__select"
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
        <section className="listing-search-box" aria-label="پیشنهادهای جست‌وجو">
          <label className="sr-only" htmlFor="discovery-search">
            عبارت جست‌وجو
          </label>
          <UiInput
            id="discovery-search"
            className="listing-search-box__input"
            dir="auto"
            value={state.q}
            onChange={(event) => update({ q: event.target.value || undefined })}
          />
          <div className="listing-search-box__suggestions" aria-live="polite">
            {suggestionsQuery.isPending ? (
              <span className="text-xs text-muted-foreground">در حال جست‌وجو...</span>
            ) : (
              suggestionsQuery.data?.map((suggestion) => (
                <a
                  className="listing-search-box__suggestion"
                  href={
                    suggestion.type === 'CATEGORY'
                      ? `/products?category=${encodeURIComponent(suggestion.slug)}`
                      : `/product/${encodeURIComponent(suggestion.slug)}`
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
      <div className="mobile-filter-bar">
        <Button
          className="mobile-filter-bar__button"
          type="button"
          variant="outline"
          onClick={() => setMobileFiltersOpen(true)}
        >
          <Icon name="layers" size={16} /> فیلترها
        </Button>
        <label className="mobile-filter-bar__sort">
          <span>مرتب‌سازی</span>
          <UiSelect
            className="mobile-filter-bar__select"
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
      <div className="listing-layout">
        <aside className="filter-rail" aria-label="فیلتر محصولات">
          {renderFilters(true)}
        </aside>
        <section className="listing-content" aria-label="نتایج محصولات">
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
                buildDiscoveryHref(baseRoute, props.queryString ?? '', { page: String(page) })
              }
            />
          ) : null}
          {adder.feedback ? <AddToCartFeedback {...adder.feedback} /> : null}
        </section>
      </div>
      {mobileFiltersOpen ? (
        <div
          className="listing-filter-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileFiltersOpen(false);
          }}
        >
          <section
            className="listing-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-discovery-filters-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setMobileFiltersOpen(false);
            }}
          >
            <div className="listing-filter-sheet__heading">
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
            {renderFilters(false)}
            <Button
              className="listing-filter-sheet__apply"
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
