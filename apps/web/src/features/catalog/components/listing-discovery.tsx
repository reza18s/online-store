import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

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
import { catalogCategorySlugsByAudience } from '@/features/catalog/components/catalog-category-slugs-by-audience';

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

gsap.registerPlugin(useGSAP);

const mobileFocusSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(true);
  const [desktopFilterRailMounted, setDesktopFilterRailMounted] = useState(true);
  const desktopFilterToggleRef = useRef<HTMLButtonElement>(null);
  const desktopListingLayoutRef = useRef<HTMLDivElement>(null);
  const desktopFilterRailRef = useRef<HTMLElement>(null);
  const desktopHasExitedRef = useRef(false);
  const desktopMotionIntentRef = useRef(0);
  const previousDesktopFiltersOpenRef = useRef(desktopFiltersOpen);
  const desktopAnimationRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileFilterSheetMounted, setMobileFilterSheetMounted] = useState(false);
  const [mobileFiltersClosing, setMobileFiltersClosing] = useState(false);
  const mobileFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileFilterOverlayRef = useRef<HTMLDivElement>(null);
  const mobileFilterSheetRef = useRef<HTMLElement>(null);
  const mobileHasExitedRef = useRef(true);
  const mobileMotionIntentRef = useRef(0);
  const mobileAnimationRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const closeMobileFiltersRef = useRef<() => void>(() => undefined);
  const listingContentRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchDraft, setSearchDraft] = useState(state.q ?? '');
  const [isMobileSearch, setIsMobileSearch] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const syncMobileSearch = () => setIsMobileSearch(mediaQuery.matches);

    syncMobileSearch();
    mediaQuery.addEventListener('change', syncMobileSearch);

    return () => mediaQuery.removeEventListener('change', syncMobileSearch);
  }, []);

  useEffect(() => {
    setSearchDraft(state.q ?? '');
  }, [state.q]);

  useEffect(() => {
    const syncSearchDraftFromHistory = () => {
      setSearchDraft(new URLSearchParams(window.location.search).get('q') ?? '');
    };

    window.addEventListener('popstate', syncSearchDraftFromHistory);

    return () => window.removeEventListener('popstate', syncSearchDraftFromHistory);
  }, []);

  useEffect(() => {
    if (!mobileFiltersOpen) return;

    const sheet = mobileFilterSheetRef.current;
    if (!sheet) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    const getFocusableElements = () =>
      Array.from(sheet.querySelectorAll<HTMLElement>(mobileFocusSelector)).filter(
        (element) => element.getClientRects().length > 0,
      );
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileFiltersRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.body.style.overflow = 'hidden';
    const initialFocusFrame = window.requestAnimationFrame(() => {
      getFocusableElements()[0]?.focus({ preventScroll: true });
    });
    document.addEventListener('keydown', handleTabKey);

    return () => {
      window.cancelAnimationFrame(initialFocusFrame);
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener('keydown', handleTabKey);
      if (previousActiveElement?.isConnected) previousActiveElement.focus();
      else mobileFilterTriggerRef.current?.focus();
    };
  }, [mobileFiltersOpen]);

  useGSAP(
    () => {
      const layout = desktopListingLayoutRef.current;
      const rail = desktopFilterRailRef.current;
      if (!desktopFilterRailMounted || !layout || !rail) return;

      const previousOpen = previousDesktopFiltersOpenRef.current;
      previousDesktopFiltersOpenRef.current = desktopFiltersOpen;
      if (previousOpen === desktopFiltersOpen && !desktopHasExitedRef.current) return;

      desktopAnimationRef.current?.kill();
      const motionIntent = desktopMotionIntentRef.current;
      const wantsOpen = desktopFiltersOpen;
      const currentColumns = layout.style.gridTemplateColumns;
      const currentGap = layout.style.columnGap;
      layout.style.removeProperty('grid-template-columns');
      layout.style.removeProperty('column-gap');
      const openStyle = window.getComputedStyle(layout);
      const openTrackSizes = openStyle.gridTemplateColumns.split(/\s+/).map(Number.parseFloat);
      const openGap = Number.parseFloat(openStyle.columnGap || '0');
      if (currentColumns) layout.style.gridTemplateColumns = currentColumns;
      if (currentGap) layout.style.columnGap = currentGap;

      const [railWidth = 0, resultsWidth = 0] = openTrackSizes;
      const openColumns = `${railWidth}px ${resultsWidth}px`;
      const targetColumns = wantsOpen ? openColumns : `0px ${layout.clientWidth}px`;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (wantsOpen && desktopHasExitedRef.current) {
        gsap.set(layout, { gridTemplateColumns: `0px ${layout.clientWidth}px`, columnGap: 0 });
        gsap.set(rail, { autoAlpha: 0, x: 18 });
        desktopHasExitedRef.current = false;
      }

      const finishTransition = () => {
        if (motionIntent !== desktopMotionIntentRef.current) return;
        if (!wantsOpen) {
          desktopHasExitedRef.current = true;
          setDesktopFilterRailMounted(false);
          return;
        }
        gsap.set(layout, { clearProps: 'all' });
        gsap.set(rail, { clearProps: 'all' });
      };

      if (reducedMotion) {
        gsap.set(layout, { gridTemplateColumns: targetColumns, columnGap: wantsOpen ? openGap : 0 });
        gsap.set(rail, { autoAlpha: wantsOpen ? 1 : 0, x: wantsOpen ? 0 : 18 });
        finishTransition();
        return;
      }

      const transition = gsap.timeline({ onComplete: finishTransition });
      desktopAnimationRef.current = transition;
      const ease = wantsOpen ? 'power2.out' : 'power2.in';
      transition
        .to(layout, {
          gridTemplateColumns: targetColumns,
          columnGap: wantsOpen ? openGap : 0,
          duration: 0.24,
          ease,
          overwrite: 'auto',
        }, 0)
        .to(rail, {
          autoAlpha: wantsOpen ? 1 : 0,
          x: wantsOpen ? 0 : 18,
          duration: 0.24,
          ease,
          overwrite: 'auto',
        }, 0);
    },
    { dependencies: [desktopFiltersOpen, desktopFilterRailMounted], scope: desktopListingLayoutRef },
  );

  useGSAP(
    () => {
      const overlay = mobileFilterOverlayRef.current;
      const sheet = mobileFilterSheetRef.current;
      if (!mobileFilterSheetMounted || !overlay || !sheet) return;

      mobileAnimationRef.current?.kill();
      const motionIntent = mobileMotionIntentRef.current;
      const isClosing = mobileFiltersClosing;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!isClosing && mobileHasExitedRef.current) {
        gsap.set(overlay, { autoAlpha: 0 });
        gsap.set(sheet, { y: 14, scale: 0.985 });
        mobileHasExitedRef.current = false;
      }

      const finishTransition = () => {
        if (motionIntent !== mobileMotionIntentRef.current) return;
        if (isClosing) {
          mobileHasExitedRef.current = true;
          setMobileFiltersOpen(false);
          setMobileFilterSheetMounted(false);
          setMobileFiltersClosing(false);
          return;
        }
        gsap.set([overlay, sheet], { clearProps: 'all' });
      };

      if (reducedMotion) {
        gsap.set(overlay, { autoAlpha: isClosing ? 0 : 1 });
        gsap.set(sheet, { y: isClosing ? 14 : 0, scale: isClosing ? 0.985 : 1 });
        finishTransition();
        return;
      }

      const transition = gsap.timeline({ onComplete: finishTransition });
      mobileAnimationRef.current = transition;
      const ease = isClosing ? 'power2.in' : 'power2.out';
      transition
        .to(overlay, {
          autoAlpha: isClosing ? 0 : 1,
          duration: 0.24,
          ease,
          overwrite: 'auto',
        }, 0)
        .to(sheet, {
          y: isClosing ? 14 : 0,
          scale: isClosing ? 0.985 : 1,
          duration: 0.24,
          ease,
          overwrite: 'auto',
        }, 0);
    },
    { dependencies: [mobileFilterSheetMounted, mobileFiltersClosing], scope: mobileFilterOverlayRef },
  );

  useLayoutEffect(() => {
    if (desktopFilterRailMounted) return;
    const layout = desktopListingLayoutRef.current;
    const rail = desktopFilterRailRef.current;
    if (!layout || !rail) return;
    gsap.set(layout, { clearProps: 'all' });
    gsap.set(rail, { clearProps: 'all' });
  }, [desktopFilterRailMounted]);

  const adder = useProductAdder();
  const update = (changes: Record<string, string | undefined>) =>
    routeTo(buildDiscoveryHref(baseRoute, props.queryString ?? '', changes));
  const openDesktopFilters = () => {
    desktopMotionIntentRef.current += 1;
    setDesktopFilterRailMounted(true);
    setDesktopFiltersOpen(true);
  };
  const closeDesktopFilters = () => {
    if (!desktopFiltersOpen) return;
    desktopMotionIntentRef.current += 1;
    setDesktopFiltersOpen(false);
    desktopFilterToggleRef.current?.focus();
  };
  const toggleDesktopFilters = () => {
    if (desktopFiltersOpen) {
      closeDesktopFilters();
      return;
    }
    openDesktopFilters();
  };
  const openMobileFilters = () => {
    if (mobileFiltersOpen && !mobileFiltersClosing) return;
    mobileMotionIntentRef.current += 1;
    setMobileFilterSheetMounted(true);
    setMobileFiltersClosing(false);
    setMobileFiltersOpen(true);
  };
  const closeMobileFilters = () => {
    if (!mobileFiltersOpen || mobileFiltersClosing) return;
    mobileMotionIntentRef.current += 1;
    setMobileFiltersClosing(true);
  };
  useLayoutEffect(() => {
    closeMobileFiltersRef.current = closeMobileFilters;
  });
  const showResults = () => {
    listingContentRef.current?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
  };
  const selectedCategory = state.category;
  const audienceCategorySlugs = props.audience
    ? catalogCategorySlugsByAudience[props.audience]
    : undefined;
  const categoryOptions = (categoryQuery.data ?? [])
    .filter((category) => !audienceCategorySlugs || audienceCategorySlugs.includes(category.slug))
    .map((category) => ({
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
  const priceMaximum =
    Math.ceil(
      Math.max(
        3_000_000,
        state.minPrice ?? 0,
        state.maxPrice ?? 0,
        ...(productsQuery.data?.items.map((product) => product.priceToman) ?? []),
      ) / 500_000,
    ) * 500_000;
  const priceParts = [
    state.minPrice !== undefined ? `از ${formatPersianNumber(state.minPrice)}` : undefined,
    state.maxPrice !== undefined ? `تا ${formatPersianNumber(state.maxPrice)}` : undefined,
  ].filter((part): part is string => part !== undefined);
  const activeFilterChips = [
    selectedCategory && props.mode !== 'accessories'
      ? {
          key: 'category',
          label:
            categoryOptions.find((option) => option.value === selectedCategory)?.label ??
            selectedCategory,
        }
      : null,
    state.size
      ? {
          key: 'size',
          label: sizeOptions.find((option) => option.value === state.size)?.label ?? state.size,
        }
      : null,
    state.color
      ? {
          key: 'color',
          label: colorOptions.find((option) => option.value === state.color)?.label ?? state.color,
        }
      : null,
    state.material
      ? {
          key: 'material',
          label:
            materialOptions.find((option) => option.value === state.material)?.label ??
            state.material,
        }
      : null,
    priceParts.length > 0 ? { key: 'price', label: `قیمت: ${priceParts.join(' · ')} تومان` } : null,
    state.inStock ? { key: 'inStock', label: 'فقط موجود' } : null,
    state.onSale && props.mode !== 'sale' ? { key: 'onSale', label: 'تخفیف ویژه' } : null,
  ].filter((chip): chip is { key: string; label: string } => chip !== null);
  const renderFilters = (openPrimaryGroups: boolean, openVisualFacets = false) => (
    <div className="listing-filters">
      <FilterSelect
        label="دسته‌بندی"
        defaultOpen={openPrimaryGroups}
        showAllOption={false}
        showMoreOptions
        isLoading={categoryQuery.isPending}
        value={selectedCategory}
        options={categoryOptions}
        onChange={(value) => update({ category: value })}
      />
      <ListingPriceFilter
        minPrice={state.minPrice}
        maxPrice={state.maxPrice}
        maximum={priceMaximum}
        defaultOpen={openPrimaryGroups}
        onUpdate={update}
      />
      <FilterSelect
        label="سایز"
        defaultOpen={openVisualFacets}
        appearance="size"
        showAllOption={false}
        isLoading={facetsQuery.isPending}
        value={state.size}
        options={sizeOptions}
        onChange={(value) => update({ size: value })}
      />
      <FilterSelect
        label="رنگ"
        defaultOpen={openVisualFacets}
        appearance="swatches"
        showAllOption={false}
        isLoading={facetsQuery.isPending}
        value={state.color}
        options={colorOptions}
        onChange={(value) => update({ color: value })}
      />
      <FilterSelect
        label="جنس پارچه"
        showAllOption={false}
        showMoreOptions
        isLoading={facetsQuery.isPending}
        value={state.material}
        options={materialOptions}
        onChange={(value) => update({ material: value })}
      />
      <ListingStatusFilter
        inStock={state.inStock}
        onSale={state.onSale}
        onInStockChange={(checked) => update({ inStock: checked ? 'true' : undefined })}
        onSaleChange={(checked) => update({ onSale: checked ? 'true' : undefined })}
      />
    </div>
  );
  return (
    <main className={'shell inner-page listing-page' + (state.q ? ' listing-page--search' : '')}>
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
        <div className="listing-header__tools">
          <Button
            ref={desktopFilterToggleRef}
            className={'listing-header__filter-toggle' + (desktopFiltersOpen ? ' is-active' : '')}
            type="button"
            variant="outline"
            aria-expanded={desktopFiltersOpen}
            aria-controls="listing-filter-rail"
            onClick={toggleDesktopFilters}
          >
            <Icon name="filter" size={16} />
            <span>فیلترها</span>
            {activeFilterChips.length > 0 ? (
              <small className="listing-filter-count">
                {formatPersianNumber(activeFilterChips.length)}
              </small>
            ) : null}
          </Button>
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
        </div>
      </header>
      {state.q ? (
        <section className="listing-search-box" aria-label="جست‌وجوی محصولات">
          <form
            className="listing-search-box__form"
            role="search"
            aria-label="جست‌وجوی محصولات"
            onSubmit={(event) => {
              event.preventDefault();
              update({ q: searchDraft.trim() || undefined });
            }}
          >
            <label className="sr-only" htmlFor="discovery-search">
              عبارت جست‌وجو
            </label>
            <div className="listing-search-box__controls">
              <UiInput
                ref={searchInputRef}
                id="discovery-search"
                className="listing-search-box__input"
                dir="auto"
                value={searchDraft}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchDraft(value);
                  if (!isMobileSearch) update({ q: value || undefined });
                }}
              />
              {isMobileSearch && searchDraft ? (
                <Button
                  className="listing-search-box__clear"
                  type="button"
                  variant="outline"
                  aria-label="پاک کردن عبارت جست‌وجو"
                  onClick={() => {
                    setSearchDraft('');
                    searchInputRef.current?.focus();
                  }}
                >
                  <Icon name="close" size={16} />
                </Button>
              ) : null}
              <Button
                className="listing-search-box__submit"
                type="submit"
                variant="primary"
                aria-label="جست‌وجو"
              >
                <Icon name="search" size={17} />
              </Button>
            </div>
          </form>
          {searchDraft.trim() === state.q.trim() ? (
            <div
              className="listing-search-box__suggestions"
              aria-label="پیشنهادهای جست‌وجو"
              aria-live="polite"
              tabIndex={0}
            >
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
          ) : null}
        </section>
      ) : null}
      {activeFilterChips.length > 0 ? (
        <div className="listing-active-filters" aria-label="فیلترهای اعمال‌شده">
          <span className="listing-active-filters__count">
            <strong>{formatPersianNumber(productsQuery.data?.total ?? 0)}</strong> نتیجه
          </span>
          {activeFilterChips.length > 0 ? (
            <div className="listing-active-filters__chips">
              {activeFilterChips.map((chip) => (
                <button
                  className="listing-active-filters__chip"
                  key={chip.key}
                  type="button"
                  aria-label={`حذف فیلتر ${chip.label}`}
                  onClick={() =>
                    update(
                      chip.key === 'price'
                        ? { minPrice: undefined, maxPrice: undefined }
                        : { [chip.key]: undefined },
                    )
                  }
                >
                  <span>{chip.label}</span>
                  <Icon name="close" size={12} aria-hidden="true" />
                </button>
              ))}
              <a className="listing-active-filters__clear" href={baseRoute}>
                حذف همه
              </a>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mobile-filter-bar">
        <Button
          ref={mobileFilterTriggerRef}
          className="mobile-filter-bar__button"
          type="button"
          variant="outline"
          aria-expanded={mobileFiltersOpen}
          aria-controls="listing-filter-sheet"
          onClick={openMobileFilters}
        >
          <Icon name="filter" size={16} />
          <span>فیلترها</span>
          {activeFilterChips.length > 0 ? (
            <small className="listing-filter-count">
              {formatPersianNumber(activeFilterChips.length)}
            </small>
          ) : null}
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
      <div
        ref={desktopListingLayoutRef}
        className={'listing-layout' + (desktopFilterRailMounted ? '' : ' listing-layout--filters-closed')}
      >
        <aside
          ref={desktopFilterRailRef}
          hidden={!desktopFilterRailMounted}
          id="listing-filter-rail"
          className="filter-rail"
          aria-label="فیلتر محصولات"
        >
          <div className="filter-rail__heading">
            <strong>فیلترها</strong>
            <div className="filter-rail__heading-actions">
              <a className="listing-filter-reset" href={baseRoute}>
                حذف همه
              </a>
              <Button
                className="filter-rail__close"
                type="button"
                aria-label="بستن فیلترها"
                onClick={closeDesktopFilters}
              >
                <Icon name="close" size={16} />
              </Button>
            </div>
          </div>
          <div className="filter-rail__body">{renderFilters(true, true)}</div>
          <div className="filter-rail__footer">
            <Button className="listing-filter-sheet__apply" type="button" onClick={showResults}>
              اعمال فیلتر ({formatPersianNumber(productsQuery.data?.total ?? 0)} نتیجه)
            </Button>
            <a className="listing-filter-sheet__reset" href={baseRoute}>
              حذف همه فیلترها
            </a>
          </div>
        </aside>
        <section
          ref={listingContentRef}
          id="listing-results"
          tabIndex={-1}
          className="listing-content"
          aria-label="نتایج محصولات"
        >
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
      <div
        ref={mobileFilterOverlayRef}
        hidden={!mobileFilterSheetMounted}
        className="listing-filter-overlay"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target !== event.currentTarget) return;
          event.preventDefault();
          mobileFilterSheetRef.current
            ?.querySelector<HTMLElement>(mobileFocusSelector)
            ?.focus({ preventScroll: true });
          closeMobileFilters();
        }}
      >
        <section
          ref={mobileFilterSheetRef}
          id="listing-filter-sheet"
          className="listing-filter-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-discovery-filters-title"
        >
          <div className="listing-filter-sheet__heading">
            <h2 className="text-lg" id="mobile-discovery-filters-title">
              فیلترها
            </h2>
            <Button
              className="icon-button"
              type="button"
              onClick={closeMobileFilters}
              aria-label="بستن فیلترها"
            >
              <Icon name="close" />
            </Button>
          </div>
          {renderFilters(true)}
          <div className="listing-filter-sheet__footer">
            <Button
              className="listing-filter-sheet__apply"
              type="button"
              onClick={closeMobileFilters}
            >
              اعمال فیلتر ({formatPersianNumber(productsQuery.data?.total ?? 0)} نتیجه)
            </Button>
            <a className="listing-filter-sheet__reset" href={baseRoute}>
              حذف همه فیلترها
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}

function ListingStatusFilter({
  inStock,
  onSale,
  onInStockChange,
  onSaleChange,
}: {
  inStock: boolean;
  onSale: boolean;
  onInStockChange: (checked: boolean) => void;
  onSaleChange: (checked: boolean) => void;
}) {
  const id = useId();
  const optionsId = 'listing-status-' + id;
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = Number(inStock) + Number(onSale);

  return (
    <section className={'listing-status-filter' + (isOpen ? ' is-open' : '')}>
      <button
        className="listing-status-filter__trigger"
        type="button"
        aria-expanded={isOpen}
        aria-controls={optionsId}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>موجودی</span>
        {activeCount > 0 ? (
          <small className="listing-status-filter__count">{formatPersianNumber(activeCount)}</small>
        ) : null}
        <Icon name="chevron-down" size={15} aria-hidden="true" />
      </button>
      <div className="listing-status-filter__options" id={optionsId} hidden={!isOpen}>
        <label className="listing-filter-check">
          <Checkbox checked={inStock} onChange={(event) => onInStockChange(event.target.checked)} />
          فقط موجود
        </label>
        <label className="listing-filter-check">
          <Checkbox checked={onSale} onChange={(event) => onSaleChange(event.target.checked)} />
          تخفیف ویژه
        </label>
      </div>
    </section>
  );
}

function ListingPriceFilter({
  minPrice,
  maxPrice,
  maximum,
  defaultOpen,
  onUpdate,
}: {
  minPrice?: number;
  maxPrice?: number;
  maximum: number;
  defaultOpen: boolean;
  onUpdate: (changes: Record<string, string | undefined>) => void;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const selectedMinimum = Math.max(0, minPrice ?? 0);
  const selectedMaximum = Math.max(selectedMinimum, maxPrice ?? maximum);
  const startPercent = (selectedMinimum / maximum) * 100;
  const endPercent = (selectedMaximum / maximum) * 100;
  const trackStyle = {
    background: `linear-gradient(to right, var(--nova-ref-line-strong) 0 ${startPercent}%, var(--nova-ref-wine) ${startPercent}% ${endPercent}%, var(--nova-ref-line-strong) ${endPercent}% 100%)`,
  };

  return (
    <section className={'listing-price-filter' + (isOpen ? ' is-open' : '')}>
      <button
        className="listing-price-filter__trigger"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span>قیمت (تومان)</span>
        <Icon name="chevron-down" size={15} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="listing-price-filter__body">
          <div className="listing-price-filter__range">
            <div className="listing-price-filter__track" style={trackStyle} aria-hidden="true" />
            <input
              className="listing-price-filter__range-input listing-price-filter__range-input--min"
              type="range"
              min="0"
              max={maximum}
              step="50000"
              value={Math.min(selectedMinimum, selectedMaximum)}
              aria-label="حداقل قیمت"
              aria-valuetext={`${formatPersianNumber(selectedMinimum)} تومان`}
              onChange={(event) => {
                const nextMinimum = Math.min(Number(event.currentTarget.value), selectedMaximum);
                onUpdate({ minPrice: nextMinimum > 0 ? String(nextMinimum) : undefined });
              }}
            />
            <input
              className="listing-price-filter__range-input listing-price-filter__range-input--max"
              type="range"
              min="0"
              max={maximum}
              step="50000"
              value={Math.max(selectedMaximum, selectedMinimum)}
              aria-label="حداکثر قیمت"
              aria-valuetext={`${formatPersianNumber(selectedMaximum)} تومان`}
              onChange={(event) => {
                const nextMaximum = Math.max(Number(event.currentTarget.value), selectedMinimum);
                onUpdate({
                  maxPrice: nextMaximum < maximum ? String(nextMaximum) : undefined,
                });
              }}
            />
          </div>
          <div className="listing-price-filter__inputs">
            <label>
              <span className="sr-only">حداکثر قیمت</span>
              <UiInput
                type="number"
                min="0"
                placeholder={formatPersianNumber(maximum)}
                inputMode="numeric"
                value={maxPrice ?? ''}
                aria-label="حداکثر قیمت"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (!value) {
                    onUpdate({ maxPrice: undefined });
                    return;
                  }

                  const nextMaximum = Math.max(Number(value), minPrice ?? 0);
                  onUpdate({
                    maxPrice: nextMaximum < maximum ? String(nextMaximum) : undefined,
                  });
                }}
              />
            </label>
            <span className="listing-price-filter__to">تا</span>
            <label>
              <span className="sr-only">حداقل قیمت</span>
              <UiInput
                type="number"
                min="0"
                placeholder={formatPersianNumber(500_000)}
                inputMode="numeric"
                value={minPrice ?? ''}
                aria-label="حداقل قیمت"
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (!value) {
                    onUpdate({ minPrice: undefined });
                    return;
                  }

                  const nextMinimum = Math.min(Number(value), maxPrice ?? maximum);
                  onUpdate({ minPrice: nextMinimum > 0 ? String(nextMinimum) : undefined });
                }}
              />
            </label>
          </div>
        </div>
      ) : null}
    </section>
  );
}
