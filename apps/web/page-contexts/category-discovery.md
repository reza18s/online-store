# Page Context

## Page

**Path:** `src/features/catalog/components/category-discovery.tsx`

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
import { catalogCategorySlugsByAudience } from '@/features/catalog/components/catalog-category-slugs-by-audience';
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
    catalogCategorySlugsByAudience[audience].includes(category.slug),
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

  const renderFilters = (openCategoryByDefault: boolean) => (
    <div className="category-filters">
      <FilterSelect
        label="دسته‌بندی"
        defaultOpen={openCategoryByDefault}
        isLoading={categoryQuery.isPending}
        value={state.category}
        options={categoryOptions}
        onChange={(value) => update({ category: value })}
      />
      <FilterSelect
        label="سایز"
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
        label="جنس"
        isLoading={facetsQuery.isPending}
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
          <div className="category-toolbar__desktop-filters">{renderFilters(true)}</div>
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


### 2. Checkbox

**Path:** `../../packages/ui/src/checkbox.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      className={cn(
        'nova-checkbox h-5 w-5 shrink-0 accent-primary align-middle transition-[background-color,border-color,box-shadow] duration-[140ms] checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        className,
      )}
    />
  ),
);

Checkbox.displayName = 'Checkbox';

```

---


### 3. Input

**Path:** `../../packages/ui/src/input.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'nova-input flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

```

---


### 4. Select

**Path:** `../../packages/ui/src/select.tsx`

```tsx
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from './cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'nova-select flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
      className,
    )}
    {...props}
  />
));

Select.displayName = 'Select';

```

---


### 5. AddToCartFeedback

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


### 6. CatalogQueryState

**Path:** `src/features/catalog/components/catalog-query-state.tsx`

```tsx
import { type ReactNode } from 'react';

import { ApiClientError } from '@nova/api-client';

import type { useCatalogProducts } from '@/features/catalog/api/catalog-api';

import { CatalogRefreshNotice } from '@/features/catalog/components/catalog-refresh-notice';

import { MessageCard } from '@/features/catalog/components/message-card';

import { ProductSkeleton } from '@/features/catalog/components/product-skeleton';

import { shouldShowCatalogRefreshNotice } from '@/features/catalog/components/should-show-catalog-refresh-notice';

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
    const serviceUnavailable = query.error instanceof ApiClientError && query.error.status >= 500;
    return (
      <MessageCard
        title={
          offline
            ? 'اتصال اینترنت برقرار نیست'
            : serviceUnavailable
              ? 'سرویس فهرست محصولات در دسترس نیست'
              : 'بارگذاری محصولات ممکن نشد'
        }
        description={
          offline
            ? 'اتصال خود را بررسی کنید و دوباره تلاش کنید.'
            : serviceUnavailable
              ? 'ارتباط با سرور محصولات برقرار نشد. پس از بررسی وضعیت سامانه دوباره تلاش کنید.'
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

```

---


### 7. CatalogRefreshNotice

**Path:** `src/features/catalog/components/catalog-refresh-notice.tsx`

```tsx
import { Button } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

export function CatalogRefreshNotice({ onRetry }: { onRetry: () => void }) {
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

```

---


### 8. FilterSelect

**Path:** `src/features/catalog/components/filter-select.tsx`

```tsx
import { useEffect, useId, useRef, useState } from 'react';

import type { CatalogFacetOption } from '@nova/api-client';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

type FilterSelectAppearance = 'list' | 'size' | 'swatches';
const visibleOptionLimit = 5;

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  isLoading = false,
  disabled = false,
  defaultOpen,
  appearance = 'list',
  showAllOption = true,
  showMoreOptions = false,
}: {
  label: string;
  value: string;
  options: readonly CatalogFacetOption[];
  onChange: (value: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  defaultOpen?: boolean;
  appearance?: FilterSelectAppearance;
  showAllOption?: boolean;
  showMoreOptions?: boolean;
}) {
  const groupName = 'filter-' + useId();
  const optionsId = groupName + '-options';
  const [isOpen, setIsOpen] = useState(() => defaultOpen ?? (label === 'دسته‌بندی' && !value));
  const [isShowingAllOptions, setIsShowingAllOptions] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const selectedOptionIndex = options.findIndex((option) => option.value === value);
  const shouldShowMore =
    appearance === 'list' && showMoreOptions && options.length > visibleOptionLimit;
  const visibleOptions =
    shouldShowMore && !isShowingAllOptions
      ? selectedOptionIndex >= visibleOptionLimit && selectedOption
        ? [...options.slice(0, visibleOptionLimit - 1), selectedOption]
        : options.slice(0, visibleOptionLimit)
      : options;

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      return;
    }
    if (!isOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [disabled, isOpen]);

  return (
    <div
      ref={rootRef}
      className={'filter-select filter-select--' + appearance + (isOpen ? ' is-open' : '')}
    >
      <button
        ref={triggerRef}
        className="filter-select__trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={optionsId}
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="filter-select__label">{label}</span>
        {selectedOption ? (
          <span className="filter-select__selected" title={selectedOption.label}>
            {selectedOption.label}
          </span>
        ) : null}
        <span className="filter-select__chevron" aria-hidden="true">
          <Icon name="chevron-down" size={15} />
        </span>
      </button>
      <div className="filter-select__options" id={optionsId} hidden={!isOpen}>
        {isLoading ? (
          <div
            className="filter-select__loading"
            role="status"
            aria-label={'در حال بارگذاری ' + label}
          >
            <span />
            <span />
            <span />
            <span />
          </div>
        ) : options.length === 0 ? (
          <div className="filter-select__empty" role="status">
            موردی برای نمایش نیست
          </div>
        ) : (
          <>
            <fieldset
              className={'filter-select__group filter-select__group--' + appearance}
              disabled={disabled}
            >
              <legend className="sr-only">{label}</legend>
              {showAllOption ? (
                <label
                  className={
                    'filter-select__option filter-select__option--' +
                    appearance +
                    (!value ? ' is-selected' : '')
                  }
                >
                  <input
                    type="radio"
                    name={groupName}
                    value=""
                    checked={!value}
                    onChange={() => onChange('')}
                  />
                  <span className="filter-select__indicator" aria-hidden="true">
                    {!value ? <Icon name="check" size={12} /> : null}
                  </span>
                  <span className="filter-select__option-label">همه</span>
                </label>
              ) : null}
              {visibleOptions.map((option) => {
                const isSelected = value === option.value;
                const showSwatch = appearance === 'swatches' && Boolean(option.hex);

                return (
                  <label
                    className={
                      'filter-select__option filter-select__option--' +
                      appearance +
                      (isSelected ? ' is-selected' : '')
                    }
                    key={option.value}
                  >
                    <input
                      type="radio"
                      name={groupName}
                      value={option.value}
                      checked={isSelected}
                      onChange={() => onChange(option.value)}
                    />
                    <span
                      className={
                        'filter-select__indicator' +
                        (showSwatch ? ' filter-select__indicator--swatch' : '')
                      }
                      style={showSwatch ? { backgroundColor: option.hex ?? undefined } : undefined}
                      aria-hidden="true"
                    >
                      {!showSwatch && isSelected ? <Icon name="check" size={12} /> : null}
                    </span>
                    <span className="filter-select__option-label">{option.label}</span>
                    {option.count > 0 ? (
                      <small className="filter-select__count">
                        {formatPersianNumber(option.count)}
                      </small>
                    ) : null}
                  </label>
                );
              })}
            </fieldset>
            {shouldShowMore ? (
              <button
                className="filter-select__more"
                type="button"
                aria-expanded={isShowingAllOptions}
                onClick={() => setIsShowingAllOptions((showing) => !showing)}
              >
                {isShowingAllOptions ? 'نمایش کمتر' : 'مشاهده بیشتر'}
                <Icon name="chevron-down" size={13} />
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

```

---


### 9. MessageCard

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


### 10. Pagination

**Path:** `src/features/catalog/components/pagination.tsx`

```tsx
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function Pagination({
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
            {formatPersianNumber(value)}
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

```

---


### 11. ProductCard

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


### 12. ProductGrid

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


### 13. ProductSkeleton

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


### 14. Icon

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

- Page: `src/features/catalog/components/category-discovery.tsx`
- Custom component files: 14
- Total files included: 15
