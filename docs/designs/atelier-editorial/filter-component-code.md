# Category filter component code

This bundle copies the current storefront category-filter implementation from the source files. The integrated filter is owned by CategoryDiscovery; it is not a standalone component file.

The design reference at [filter.png](./filter.png) shows additional controls that are not present in the current implementation. The code below currently provides category, size, color, and material selects; stock and sale toggles; a category sidebar with price inputs; and the mobile filter sheet.

## Reusable select component

Source: [`apps/web/src/features/catalog/components/filter-select.tsx`](../../../apps/web/src/features/catalog/components/filter-select.tsx)

```tsx
import type { CatalogFacetOption } from '@nova/api-client';
import { Select as UiSelect } from '@nova/ui';

export function FilterSelect({
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
    <label className="filter-select">
      <span>{label}</span>
      <UiSelect
        className="filter-select__control"
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
```

## Integrated category filter and page module

Source: [`apps/web/src/features/catalog/components/category-discovery.tsx`](../../../apps/web/src/features/catalog/components/category-discovery.tsx)

This complete module includes the query state, filter controls, desktop sidebar, mobile sheet, and surrounding category-page components that share the same state.

```tsx
import { useState } from 'react';

import type { CatalogAudience, CatalogFacetOption } from '@nova/api-client';
import { Button, Checkbox, Input as UiInput, Select as UiSelect } from '@nova/ui';

import {
  toStorefrontProduct,
  useCatalogCategories,
  useCatalogFacets,
  useCatalogProducts,
} from '@/features/catalog/api/catalog-api';
import type { StorefrontDiscoveryPageProps } from '@/features/catalog/pages/storefront-discovery-page-shared';
import { audienceCopy } from '@/features/catalog/pages/storefront-discovery-page-shared';
import { AddToCartFeedback } from '@/features/catalog/components/add-to-cart-feedback';
import { buildDiscoveryHref } from '@/features/catalog/components/build-discovery-href';
import { CatalogQueryState } from '@/features/catalog/components/catalog-query-state';
import { discoveryFacetFiltersFromQuery } from '@/features/catalog/components/discovery-facet-filters-from-query';
import { discoveryFiltersFromQuery } from '@/features/catalog/components/discovery-filters-from-query';
import { FilterSelect } from '@/features/catalog/components/filter-select';
import { Pagination } from '@/features/catalog/components/pagination';
import { parseDiscoveryQuery } from '@/features/catalog/components/parse-discovery-query';
import { preserveFacetSelection } from '@/features/catalog/components/preserve-facet-selection';
import { ProductGrid } from '@/features/catalog/components/product-grid';
import { routeTo } from '@/features/catalog/components/route-to';
import { useProductAdder } from '@/features/catalog/components/use-product-adder';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

const categorySlugs: Record<CatalogAudience, string[]> = {
  women: ['outerwear', 'knitwear', 'trousers', 'shirts', 'accessories'],
  men: ['accessories', 'knitwear', 'outerwear', 'trousers', 'shirts'],
  children: ['children', 'kidswear'],
};

const categoryImages: Record<string, { src: string; alt: string }> = {
  accessories: { src: '/assets/nova-product-textured-scarf.webp', alt: 'شال و اکسسوری نوا' },
  knitwear: { src: '/assets/nova-product-knit-cardigan.webp', alt: 'بافت نرم و گرم' },
  outerwear: { src: '/assets/nova-category-men-hero.webp', alt: 'رویه‌های مردانه نوا' },
  trousers: { src: '/assets/nova-product-soft-trousers.webp', alt: 'شلوارهای راحت و خوش‌دوخت' },
  shirts: { src: '/assets/nova-product-oxford-shirt.webp', alt: 'پیراهن‌های نوا' },
  children: { src: '/assets/nova-category-children-hero.webp', alt: 'لباس‌های راحت کودک نوا' },
  kidswear: { src: '/assets/nova-children-lifestyle.webp', alt: 'استایل روزمره کودک نوا' },
};

const childrenCategoryCopy: Record<
  string,
  { title: string; shortTitle: string; description: string }
> = {
  children: {
    title: 'لباس‌های دخترانه',
    shortTitle: 'دخترانه',
    description: 'رنگ‌های لطیف برای خیال‌های بزرگ',
  },
  kidswear: {
    title: 'لباس‌های پسرانه',
    shortTitle: 'پسرانه',
    description: 'استایل‌های راحت برای ماجراجویی هر روز',
  },
};

const sortLabels = [
  ['newest', 'جدیدترین'],
  ['price_asc', 'ارزان‌ترین'],
  ['price_desc', 'گران‌ترین'],
  ['name', 'الفبایی'],
] as const;

function asOptions(
  categories: readonly { slug: string; name: string }[],
  selected: string,
): CatalogFacetOption[] {
  return categories.map((category) => ({
    value: category.slug,
    label: category.name,
    count: 0,
    selected: category.slug === selected,
  }));
}

export function CategoryDiscovery({ props }: { props: StorefrontDiscoveryPageProps }) {
  const audience = props.audience ?? 'women';
  const copy = audienceCopy[audience];
  const baseRoute = `/category/${audience}`;
  const state = parseDiscoveryQuery(props.queryString);
  const categoryQuery = useCatalogCategories();
  const productsQuery = useCatalogProducts(discoveryFiltersFromQuery(state, audience));
  const facetsQuery = useCatalogFacets(discoveryFacetFiltersFromQuery(state, audience));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const adder = useProductAdder();
  const products = productsQuery.data?.items.map(toStorefrontProduct) ?? [];
  const availableCategories = (categoryQuery.data ?? []).filter((category) =>
    categorySlugs[audience].includes(category.slug),
  );
  const categoryOptions = asOptions(availableCategories, state.category);
  const groups = new Map(
    (facetsQuery.data?.groups ?? []).map((group) => [group.key, group.options]),
  );
  const sizeOptions = preserveFacetSelection(groups.get('size') ?? [], state.size);
  const colorOptions = preserveFacetSelection(groups.get('color') ?? [], state.color);
  const materialOptions = preserveFacetSelection(groups.get('material') ?? [], state.material);
  const update = (changes: Record<string, string | undefined>) =>
    routeTo(buildDiscoveryHref(baseRoute, props.queryString ?? '', changes));
  const categoryCards = availableCategories.map((category) => ({
    ...category,
    image: categoryImages[category.slug] ?? {
      src: '/assets/nova-materials.webp',
      alt: 'پارچه‌های آتلیه نوا',
    },
  }));

  const filters = (
    <div className="category-filters">
      <FilterSelect
        label="دسته‌بندی"
        value={state.category}
        options={categoryOptions}
        onChange={(value) => update({ category: value })}
      />
      <FilterSelect
        label="سایز"
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
        label="جنس"
        value={state.material}
        options={materialOptions}
        onChange={(value) => update({ material: value })}
      />
      <label className="category-filter-check">
        <Checkbox
          checked={state.inStock}
          onChange={(event) => update({ inStock: event.target.checked ? 'true' : undefined })}
        />
        فقط موجود
      </label>
      <label className="category-filter-check">
        <Checkbox
          checked={state.onSale}
          onChange={(event) => update({ onSale: event.target.checked ? 'true' : undefined })}
        />
        پیشنهاد ویژه
      </label>
      <a className="category-filter-reset" href={baseRoute}>
        پاک‌کردن فیلترها
      </a>
    </div>
  );

  return (
    <main className={`shell inner-page category-page category-page--${audience}`}>
      <div className="breadcrumb">
        <a href="/" className="hover:text-primary">
          خانه
        </a>
        <span aria-hidden="true">/</span>
        <span>{copy.label}</span>
      </div>

      {audience === 'children' ? (
        <div className="category-hero-layout category-hero-layout--children">
          <CategoryHero audience={audience} />
          <CategoryCardStack
            categories={categoryCards.map((category) => ({
              ...category,
              ...(childrenCategoryCopy[category.slug] ?? {
                title: category.name,
                shortTitle: category.name,
                description: 'پوشاک راحت برای روزهای پرماجرای کودک',
              }),
            }))}
          />
        </div>
      ) : (
        <CategoryHero audience={audience} />
      )}

      {audience === 'men' ? <CategoryQuickRail categories={categoryCards} /> : null}

      <div className="category-toolbar">
        <div className="category-toolbar__result" aria-live="polite">
          <strong>{copy.label}</strong>
          <span>
            {productsQuery.isPending
              ? 'در حال دریافت محصولات…'
              : `${formatPersianNumber(productsQuery.data?.total ?? 0)} محصول`}
          </span>
        </div>
        <div className="category-toolbar__controls">
          <Button
            className="category-mobile-filter"
            type="button"
            variant="outline"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <Icon name="filter" size={17} /> فیلترها
          </Button>
          {audience !== 'men' ? (
            <a
              className="category-toolbar__desktop-filter"
              href={`#category-filter-rail-${audience}`}
            >
              <Icon name="filter" size={17} /> فیلترها
            </a>
          ) : null}
          <label className="category-sort">
            <span>مرتب‌سازی</span>
            <UiSelect
              value={state.sort}
              onChange={(event) => update({ sort: event.target.value })}
              aria-label="مرتب‌سازی محصولات"
            >
              {sortLabels.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </UiSelect>
          </label>
          <div className="category-toolbar__desktop-filters">{filters}</div>
        </div>
      </div>

      {audience !== 'men' ? (
        <div className={`category-results-layout category-results-layout--${audience}`}>
          <CategorySidebar
            audience={audience}
            categories={availableCategories}
            selectedCategory={state.category}
            sizeOptions={sizeOptions}
            selectedSize={state.size}
            colorOptions={colorOptions}
            selectedColor={state.color}
            materialOptions={materialOptions}
            selectedMaterial={state.material}
            minPrice={state.minPrice}
            maxPrice={state.maxPrice}
            isInStock={state.inStock}
            isOnSale={state.onSale}
            onUpdate={update}
          />
          <CategoryResults
            audience={audience}
            products={products}
            productsQuery={productsQuery}
            props={props}
            adder={adder}
            baseRoute={baseRoute}
          />
        </div>
      ) : (
        <CategoryResults
          audience={audience}
          products={products}
          productsQuery={productsQuery}
          props={props}
          adder={adder}
          baseRoute={baseRoute}
        />
      )}

      <section className="guide-callout">
        <div>
          <span className="section-heading__eyebrow">راهنمای انتخاب</span>
          <h2>سایز درست، حس درست</h2>
          <p>برای هر مدل، اندازه‌گیری و پیشنهاد فیت را کنار مشخصات محصول گذاشته‌ایم.</p>
        </div>
        <a className="text-link" href="/size-guide">
          مشاهده راهنمای اندازه
        </a>
      </section>

      {mobileFiltersOpen ? (
        <div
          className="listing-filter-overlay category-filter-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setMobileFiltersOpen(false);
          }}
        >
          <section
            className="listing-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-mobile-filters-title"
            onKeyDown={(event) => {
              if (event.key === 'Escape') setMobileFiltersOpen(false);
            }}
          >
            <div className="listing-filter-sheet__heading">
              <h2 id="category-mobile-filters-title">فیلترها</h2>
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

function CategorySidebar({
  audience,
  categories,
  selectedCategory,
  sizeOptions,
  selectedSize,
  colorOptions,
  selectedColor,
  materialOptions,
  selectedMaterial,
  minPrice,
  maxPrice,
  isInStock,
  isOnSale,
  onUpdate,
}: {
  audience: CatalogAudience;
  categories: readonly { slug: string; name: string }[];
  selectedCategory: string;
  sizeOptions: CatalogFacetOption[];
  selectedSize: string;
  colorOptions: CatalogFacetOption[];
  selectedColor: string;
  materialOptions: CatalogFacetOption[];
  selectedMaterial: string;
  minPrice?: number;
  maxPrice?: number;
  isInStock: boolean;
  isOnSale: boolean;
  onUpdate: (changes: Record<string, string | undefined>) => void;
}) {
  const idPrefix = `category-filter-${audience}`;
  const radioGroup = (
    title: string,
    key: string,
    options: readonly CatalogFacetOption[],
    selected: string,
  ) => (
    <fieldset className="category-sidebar__group">
      <legend>{title}</legend>
      <label className="category-sidebar__option">
        <input
          type="radio"
          name={`${idPrefix}-${key}`}
          checked={!selected}
          onChange={() => onUpdate({ [key]: undefined })}
        />
        <span>همه</span>
      </label>
      {options.map((option) => (
        <label className="category-sidebar__option" key={option.value}>
          <input
            type="radio"
            name={`${idPrefix}-${key}`}
            checked={selected === option.value}
            onChange={() => onUpdate({ [key]: option.value })}
          />
          {key === 'color' && option.hex ? (
            <i aria-hidden="true" style={{ backgroundColor: option.hex }} />
          ) : null}
          <span>{option.label}</span>
          {option.count > 0 ? <small>{formatPersianNumber(option.count)}</small> : null}
        </label>
      ))}
    </fieldset>
  );

  return (
    <aside
      id={`category-filter-rail-${audience}`}
      className="category-filter-rail"
      aria-label={`فیلتر محصولات ${audienceCopy[audience].label}`}
    >
      <fieldset className="category-sidebar__group">
        <legend>دسته‌بندی</legend>
        <label className="category-sidebar__option">
          <input
            type="radio"
            name={`${idPrefix}-category`}
            checked={!selectedCategory}
            onChange={() => onUpdate({ category: undefined })}
          />
          <span>همه دسته‌ها</span>
        </label>
        {categories.map((category) => (
          <label className="category-sidebar__option" key={category.slug}>
            <input
              type="radio"
              name={`${idPrefix}-category`}
              checked={selectedCategory === category.slug}
              onChange={() => onUpdate({ category: category.slug })}
            />
            <span>{category.name}</span>
          </label>
        ))}
      </fieldset>
      {radioGroup('سایز', 'size', sizeOptions, selectedSize)}
      {radioGroup('رنگ', 'color', colorOptions, selectedColor)}
      <fieldset className="category-sidebar__group">
        <legend>قیمت (تومان)</legend>
        <div className="category-sidebar__price">
          <label>
            <span>از</span>
            <UiInput
              type="number"
              min="0"
              inputMode="numeric"
              value={minPrice ?? ''}
              aria-label="حداقل قیمت"
              onChange={(event) => onUpdate({ minPrice: event.currentTarget.value || undefined })}
            />
          </label>
          <label>
            <span>تا</span>
            <UiInput
              type="number"
              min="0"
              inputMode="numeric"
              value={maxPrice ?? ''}
              aria-label="حداکثر قیمت"
              onChange={(event) => onUpdate({ maxPrice: event.currentTarget.value || undefined })}
            />
          </label>
        </div>
      </fieldset>
      {materialOptions.length
        ? radioGroup('جنس', 'material', materialOptions, selectedMaterial)
        : null}
      <label className="category-sidebar__option category-sidebar__toggle">
        <Checkbox
          checked={isInStock}
          onChange={(event) => onUpdate({ inStock: event.target.checked ? 'true' : undefined })}
        />
        <span>فقط موجود</span>
      </label>
      <label className="category-sidebar__option category-sidebar__toggle">
        <Checkbox
          checked={isOnSale}
          onChange={(event) => onUpdate({ onSale: event.target.checked ? 'true' : undefined })}
        />
        <span>پیشنهاد ویژه</span>
      </label>
      <a className="category-filter-reset" href={`/category/${audience}`}>
        پاک‌کردن فیلترها
      </a>
    </aside>
  );
}

function CategoryHero({ audience }: { audience: CatalogAudience }) {
  const copy = audienceCopy[audience];
  const image = {
    women: '/assets/nova-category-women-hero.webp',
    men: '/assets/nova-category-men-hero.webp',
    children: '/assets/nova-category-children-hero.webp',
  }[audience];
  return (
    <section className={`category-hero category-hero--${audience}`}>
      <img
        className="category-hero__image"
        src={image}
        alt={`پوشاک ${copy.label} در فضای آتلیه نوا`}
      />
      <div className="category-hero__copy">
        {audience !== 'men' ? (
          <span className="section-heading__eyebrow">
            NOVA {audience === 'children' ? 'KIDS' : 'WOMEN'}
          </span>
        ) : null}
        <h1>{copy.title}</h1>
        {copy.lead ? <p className="category-hero__lead">{copy.lead}</p> : null}
        <p>{copy.description}</p>
        <a className="editorial-cta" href={`/products/${audience}`}>
          {copy.ctaLabel} <Icon name="arrow-left" size={16} />
        </a>
        {audience === 'women' ? (
          <span className="category-hero__signature">
            TIMELESS&nbsp;&nbsp; ELEGANT&nbsp;&nbsp; PERSIAN
          </span>
        ) : null}
      </div>
      {audience === 'women' ? (
        <aside className="category-hero__note" aria-label="داستان کالکشن زنانه">
          <span>لباس‌هایی برای داستان زندگی شما</span>
          <em>
            A MORE
            <br />
            BEAUTIFUL
            <br />
            YOU
          </em>
        </aside>
      ) : null}
    </section>
  );
}

function CategoryCardStack({
  categories,
}: {
  categories: Array<{
    slug: string;
    title: string;
    shortTitle: string;
    description: string;
    image: { src: string; alt: string };
  }>;
}) {
  return (
    <nav className="category-card-stack" aria-label="دسته‌های لباس کودک">
      {categories.map((category) => (
        <a
          className="category-image-card"
          href={`/products/children?category=${encodeURIComponent(category.slug)}`}
          key={category.slug}
        >
          <img src={category.image.src} alt={category.image.alt} loading="lazy" />
          <span className="category-image-card__copy">
            <strong className="category-image-card__title--desktop">{category.title}</strong>
            <strong aria-hidden="true" className="category-image-card__title--mobile">
              {category.shortTitle}
            </strong>
            <small>{category.description}</small>
            <span className="category-image-card__action">
              <Icon name="arrow-left" size={14} /> مشاهده
            </span>
          </span>
        </a>
      ))}
    </nav>
  );
}

function CategoryQuickRail({
  categories,
}: {
  categories: Array<{ slug: string; name: string; image: { src: string; alt: string } }>;
}) {
  const visualOrder = ['shirts', 'trousers', 'outerwear', 'knitwear', 'accessories'];
  const orderedCategories = [...categories].sort(
    (left, right) => visualOrder.indexOf(left.slug) - visualOrder.indexOf(right.slug),
  );

  return (
    <nav className="category-quick-rail" aria-label="دسته‌های پوشاک مردانه">
      {orderedCategories.map((category) => (
        <a
          href={`/products/men?category=${encodeURIComponent(category.slug)}`}
          className="category-quick-card"
          key={category.slug}
        >
          <img src={category.image.src} alt={category.image.alt} loading="lazy" />
          <span>{category.name}</span>
          <Icon name="arrow-left" size={15} />
        </a>
      ))}
    </nav>
  );
}

function CategoryResults({
  audience,
  products,
  productsQuery,
  props,
  adder,
  baseRoute,
}: {
  audience: CatalogAudience;
  products: ReturnType<typeof toStorefrontProduct>[];
  productsQuery: ReturnType<typeof useCatalogProducts>;
  props: StorefrontDiscoveryPageProps;
  adder: ReturnType<typeof useProductAdder>;
  baseRoute: string;
}) {
  const copy = audienceCopy[audience];
  return (
    <section aria-labelledby="category-products-title" className="category-products">
      {audience === 'women' ? (
        <div className="category-products__heading category-products__heading--women">
          <div className="category-products__heading-copy">
            <h2 id="category-products-title">{copy.label}</h2>
          </div>
          <div className="category-products__heading-actions">
            <span className="category-products__count" aria-live="polite">
              {productsQuery.isPending
                ? 'در حال دریافت محصولات…'
                : `${formatPersianNumber(productsQuery.data?.total ?? 0)} محصول`}
            </span>
            <a className="text-link" href={`/products/${audience}`}>
              مشاهده همه
            </a>
          </div>
          <p className="category-products__summary">{copy.description}</p>
        </div>
      ) : (
        <div className="section-heading">
          <h2 id="category-products-title">انتخاب‌های محبوب {copy.label}</h2>
          <a className="text-link" href={`/products/${audience}`}>
            مشاهده همه
          </a>
        </div>
      )}
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
  );
}
```

## Filter styling

Source: [`apps/web/src/styles/storefront-reference.css`](../../../apps/web/src/styles/storefront-reference.css)

### Shared mobile sheet

```css
.listing-filter-overlay {
  position: fixed;
  z-index: 500;
  inset: 0;
  display: none;
  align-items: end;
  background: rgb(26 18 14 / 42%);
}
.listing-filter-sheet {
  width: 100%;
  max-height: 88svh;
  overflow-y: auto;
  border-radius: 18px 18px 0 0;
  padding: 17px;
  background: var(--nova-ref-surface);
  box-shadow: 0 -15px 45px rgb(39 24 16 / 12%);
}
.listing-filter-sheet__heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.listing-filter-sheet__heading h2 { font-size: 17px; }
.listing-filter-sheet__apply { width: 100%; margin-top: 14px; border-radius: 9px !important; }
```

### Desktop category filters

These rules are inside the source stylesheet's @media (min-width: 768px) block.

```css
@media (min-width: 768px) {
.category-toolbar__controls {
  display: flex;
  align-items: center;
  gap: 10px;
}
.category-toolbar__desktop-filters {
  min-width: 0;
}
.category-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.category-filters .filter-select {
  display: flex;
  align-items: center;
  gap: 5px;
}
.category-filters .filter-select > span {
  font-size: 12px;
  white-space: nowrap;
}
.category-filters .filter-select__control {
  min-width: 105px;
  max-width: 145px;
}
.category-filter-check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #514740;
  font-size: 12px;
  white-space: nowrap;
}
.category-filter-reset {
  color: var(--nova-ref-wine);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.category-filter-reset:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.category-sort {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--nova-ref-muted);
  font-size: 12px;
  white-space: nowrap;
}
.category-sort select {
  min-width: 108px;
  min-height: 38px !important;
  border: 1px solid var(--nova-ref-line) !important;
  border-radius: 8px !important;
  padding-inline: 9px !important;
  background: white !important;
  font-size: 12px !important;
}
.category-mobile-filter {
  display: none !important;
}
.category-results-layout {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr);
  align-items: start;
  gap: 15px;
  direction: ltr;
}
.category-filter-rail {
  position: sticky;
  top: calc(var(--header-height) + 10px);
  border: 1px solid var(--nova-ref-line);
  border-radius: 13px;
  padding: 13px;
  background: var(--nova-ref-surface);
  box-shadow: var(--nova-ref-shadow);
  direction: rtl;
}
.category-sidebar__group {
  display: grid;
  gap: 2px;
  margin: 0;
  border: 0;
  border-bottom: 1px solid var(--nova-ref-line);
  padding: 0 0 11px;
}
.category-sidebar__group + .category-sidebar__group {
  margin-top: 10px;
}
.category-sidebar__group legend {
  width: 100%;
  margin-bottom: 6px;
  color: var(--nova-ref-ink);
  font-size: 14px;
  font-weight: 750;
}
.category-sidebar__option {
  display: flex;
  min-height: 28px;
  align-items: center;
  gap: 7px;
  color: #574c45;
  font-size: 12px;
  cursor: pointer;
}
.category-sidebar__option input[type='radio'] {
  width: 16px;
  height: 16px;
  accent-color: var(--nova-ref-wine);
}
.category-sidebar__option > i {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border: 1px solid var(--nova-ref-line-strong);
  border-radius: 50%;
}
.category-sidebar__option small {
  margin-inline-start: auto;
  color: #9b8d82;
  font-size: 12px;
}
.category-sidebar__price {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.category-sidebar__price label {
  display: grid;
  gap: 4px;
  color: var(--nova-ref-muted);
  font-size: 12px;
}
.category-sidebar__price input {
  min-width: 0;
  min-height: 36px !important;
  border: 1px solid var(--nova-ref-line) !important;
  border-radius: 8px !important;
  padding-inline: 8px !important;
  background: white !important;
  font-size: 12px !important;
}
.category-sidebar__toggle {
  min-height: 36px;
  margin-top: 6px;
}
.category-filter-rail > .category-filter-reset {
  display: inline-flex;
  margin-top: 10px;
}
.category-filter-rail .category-filters {
  display: grid;
  align-items: stretch;
  gap: 13px;
}
.category-filter-rail .filter-select {
  display: grid;
  gap: 5px;
}
.category-filter-rail .filter-select__control {
  width: 100%;
  max-width: none;
}
.category-filter-rail .category-filter-check {
  min-height: 31px;
}
}
```

### Mobile category filters

These rules are inside the source stylesheet's @media (max-width: 767px) block.

```css
@media (max-width: 767px) {
  .category-toolbar {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    border: 0;
    border-radius: 0;
    padding: 2px 0;
    background: transparent;
    box-shadow: none;
  }
  .category-toolbar__result strong {
    font-size: 13px;
  }
  .category-toolbar__result span {
    font-size: 12px;
  }
  .category-toolbar__controls {
    width: auto;
    gap: 6px;
  }
  .category-toolbar__desktop-filters {
    display: none;
  }
  .category-mobile-filter {
    display: inline-flex !important;
    min-height: 39px !important;
    border-color: var(--nova-ref-line) !important;
    border-radius: 8px !important;
    padding-inline: 9px !important;
    background: var(--nova-ref-surface) !important;
    font-size: 12px !important;
  }
  .category-sort {
    gap: 0;
  }
  .category-sort > span {
    display: none;
  }
  .category-sort select {
    min-width: 112px;
    min-height: 39px !important;
    border-radius: 8px !important;
  }
  .category-filter-rail {
    display: none;
  }
  .category-results-layout {
    display: block;
  }
  .category-products {
    gap: 9px;
  }
  .category-products .section-heading h2 {
    font-size: 16px;
  }
  .category-page .guide-callout {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
    border-radius: 12px;
    padding: 14px;
  }
  .category-filter-overlay {
    display: flex;
  }
  .category-filters {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: end;
    gap: 10px;
  }
  .category-filters .filter-select {
    display: grid;
    gap: 4px;
  }
  .category-filters .filter-select__control {
    width: 100%;
    max-width: none;
    min-width: 0;
  }
  .category-filter-check {
    min-height: 36px;
    white-space: normal;
  }
  .category-filter-reset {
    min-height: 36px;
    align-content: center;
  }
}
```

### Sidebar anchor spacing

```css
.category-filter-rail[id] { scroll-margin-top: calc(var(--header-height) + 22px); }
```

## Supporting source

Filter values are parsed from and written to the category URL. The integrated module uses these existing helpers and catalog APIs:

- [`parse-discovery-query.ts`](../../../apps/web/src/features/catalog/components/parse-discovery-query.ts)
- [`build-discovery-href.ts`](../../../apps/web/src/features/catalog/components/build-discovery-href.ts)
- [`route-to.ts`](../../../apps/web/src/features/catalog/components/route-to.ts)
- [`discovery-filters-from-query.ts`](../../../apps/web/src/features/catalog/components/discovery-filters-from-query.ts)
- [`discovery-facet-filters-from-query.ts`](../../../apps/web/src/features/catalog/components/discovery-facet-filters-from-query.ts)
- [`preserve-facet-selection.ts`](../../../apps/web/src/features/catalog/components/preserve-facet-selection.ts)
- [`catalog-api.ts`](../../../apps/web/src/features/catalog/api/catalog-api.ts)
