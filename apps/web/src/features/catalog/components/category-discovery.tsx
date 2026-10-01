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
  accessories: { src: '/assets/nova-materials.webp', alt: 'جزئیات پارچه و اکسسوری' },
  knitwear: { src: '/assets/nova-product-knit-cardigan.webp', alt: 'بافت نرم و گرم' },
  outerwear: { src: '/assets/nova-women-lifestyle.webp', alt: 'رویه‌های روزمره نوا' },
  trousers: { src: '/assets/nova-product-soft-trousers.webp', alt: 'شلوارهای راحت و خوش‌دوخت' },
  shirts: { src: '/assets/nova-product-oxford-shirt.webp', alt: 'پیراهن‌های نوا' },
  children: { src: '/assets/nova-category-children-hero.webp', alt: 'لباس‌های راحت کودک نوا' },
  kidswear: { src: '/assets/nova-category-children-hero.webp', alt: 'استایل کودکانه نوا' },
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
          <CategoryCardStack categories={categoryCards} />
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
      </div>
      {audience === 'women' ? (
        <aside className="category-hero__note" aria-label="داستان کالکشن زنانه">
          <span>لباس‌هایی برای داستان زندگی شما</span>
          <em>TIMELESS<br />ELEGANT<br />PERSIAN</em>
        </aside>
      ) : null}
    </section>
  );
}

function CategoryCardStack({
  categories,
}: {
  categories: Array<{ slug: string; name: string; image: { src: string; alt: string } }>;
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
          <span>{category.name}</span>
          <Icon name="arrow-left" size={15} />
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
  return (
    <nav className="category-quick-rail" aria-label="دسته‌های پوشاک مردانه">
      {categories.map((category) => (
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
      <div className="section-heading">
        <h2 id="category-products-title">انتخاب‌های محبوب {copy.label}</h2>
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
