import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';

import {
  useAdminCatalogCategories,
  useAdminCatalogProducts,
  useStaffUser,
} from '../../lib/admin/admin-catalog-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from '../../lib/admin/admin-auth';

import { useAdminInventory } from '../../lib/admin/admin-inventory-api';
import { useAdminOrders } from '../../lib/admin/admin-orders-api';

import { Icon, type IconName } from '../ui/icon';

import type { AdminProductStatusFilter } from '../app/app-shared';
import {
  ADMIN_PREVIEW_NOTICE,
  adminLowStockItems,
  adminOrderPreviews,
  adminProductRows,
} from '../app/app-shared';

import { AdminLogoutButton } from './admin-logout-button';

import { AdminOperationsLogo } from './admin-operations-logo';

import { adminLifecycleStatusLabel } from './admin-lifecycle-status-label';

import { adminStockStatusLabel } from './admin-stock-status-label';

import { formatPersianNumber } from '../../utils/app/format-persian-number';

import { formatToman } from '../../utils/app/format-toman';

import { toAdminLowStockItem } from '../../utils/app/to-admin-low-stock-item';

import { toAdminOrderPreview } from '../../utils/app/to-admin-order-preview';

import { toAdminProductRow } from '../../utils/app/to-admin-product-row';

export function AdminProductsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState<AdminProductStatusFilter>('all');
  const [quickFilterActive, setQuickFilterActive] = useState(false);
  const [page, setPage] = useState(1);
  const [openActionSlug, setOpenActionSlug] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const staffQuery = useStaffUser();
  const isStaffAuthenticated = Boolean(staffQuery.data) && !isStaffAuthFailure(staffQuery.error);
  const isPreview = import.meta.env.DEV && !isStaffAuthenticated;
  const productListQuery = useMemo(
    () => ({
      page,
      limit: 12,
      q: deferredQuery.trim() || undefined,
      category: category === 'all' ? undefined : category,
      status: status === 'all' ? undefined : status,
      lowStock: quickFilterActive || undefined,
    }),
    [category, deferredQuery, page, quickFilterActive, status],
  );
  const productsQuery = useAdminCatalogProducts(productListQuery, isStaffAuthenticated);
  const categoriesQuery = useAdminCatalogCategories(isStaffAuthenticated);
  const inventoryQuery = useAdminInventory(
    { page: 1, limit: 3, lowStock: true },
    isStaffAuthenticated,
  );
  const ordersQuery = useAdminOrders({ page: 1, limit: 5 }, isStaffAuthenticated);

  useEffect(() => {
    setPage(1);
  }, [category, query, quickFilterActive, status]);

  const liveProducts = useMemo(
    () => productsQuery.data?.items.map(toAdminProductRow) ?? [],
    [productsQuery.data],
  );

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (isStaffAuthenticated) return liveProducts;

    return adminProductRows.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.category} ${product.slug}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = category === 'all' || product.categorySlug === category;
      const matchesStatus = status === 'all' || product.lifecycleStatus === status;
      const matchesQuickFilter = !quickFilterActive || product.stockStatus === 'LOW_STOCK';

      return matchesQuery && matchesCategory && matchesStatus && matchesQuickFilter;
    });
  }, [category, isStaffAuthenticated, liveProducts, query, quickFilterActive, status]);

  const categoryOptions = isStaffAuthenticated
    ? (categoriesQuery.data ?? []).map((item) => ({ value: item.slug, label: item.name }))
    : Array.from(
        new Map(
          adminProductRows.map((product) => [
            product.categorySlug ?? product.category,
            { value: product.categorySlug ?? product.category, label: product.category },
          ]),
        ).values(),
      );
  const resultCount = isStaffAuthenticated
    ? (productsQuery.data?.total ?? filteredProducts.length)
    : filteredProducts.length;
  const pageSize = productListQuery.limit;
  const totalPages = isStaffAuthenticated ? Math.max(1, Math.ceil(resultCount / pageSize)) : 1;
  const visibleStart = resultCount === 0 ? 0 : isStaffAuthenticated ? (page - 1) * pageSize + 1 : 1;
  const visibleEnd = isStaffAuthenticated
    ? Math.min(page * pageSize, resultCount)
    : filteredProducts.length;
  const lowStockItems = isStaffAuthenticated
    ? (inventoryQuery.data?.items ?? []).map((item) => toAdminLowStockItem(item, liveProducts))
    : adminLowStockItems;
  const lowStockCount = isStaffAuthenticated
    ? (inventoryQuery.data?.total ?? lowStockItems.length)
    : lowStockItems.length;
  const orderPreviews = isStaffAuthenticated
    ? (ordersQuery.data?.items ?? []).map(toAdminOrderPreview)
    : adminOrderPreviews;
  const isPermissionDenied = [
    productsQuery.error,
    categoriesQuery.error,
    inventoryQuery.error,
    ordersQuery.error,
  ].some(isStaffAuthorizationFailure);
  const dataState = !isStaffAuthenticated
    ? staffQuery.isPending
      ? {
          title: 'در حال بررسی دسترسی',
          message: 'نشست مدیریت شما در حال بررسی است.',
          role: 'status' as const,
        }
      : {
          title: 'ورود مدیر لازم است',
          message: 'برای مشاهده داده‌های واقعی کاتالوگ، با یک حساب مدیر وارد شوید.',
          role: 'alert' as const,
        }
    : isPermissionDenied
      ? {
          title: 'دسترسی کافی نیست',
          message: 'نقش کاربری شما اجازه مشاهده یکی از بخش‌های این صفحه را نمی‌دهد.',
          role: 'alert' as const,
        }
      : productsQuery.isPending && !productsQuery.data
        ? {
            title: 'در حال دریافت محصولات',
            message: 'فهرست محصولات از سرور در حال دریافت است.',
            role: 'status' as const,
          }
        : productsQuery.isError && !productsQuery.data
          ? {
              title: 'دریافت محصولات ناموفق بود',
              message: 'اتصال به سرویس کاتالوگ برقرار نشد. دوباره تلاش کنید.',
              role: 'alert' as const,
            }
          : null;

  const setQuickFilter = () => {
    setQuickFilterActive((current) => !current);
  };

  return (
    <main className="min-h-svh bg-background text-foreground" dir="rtl">
      <div className="flex min-h-svh flex-row">
        <aside className="hidden w-[240px] flex-none flex-col bg-primary-hover px-4 py-7 text-primary-foreground lg:flex">
          <AdminOperationsLogo />
          <span className="mt-12 px-3 text-[10px] text-primary-foreground/55">فضای مدیریت</span>
          <nav className="mt-3 flex flex-col gap-1" aria-label="ناوبری مدیریت">
            {[
              ['admin', 'فضای مدیریت', 'home'],
              ['products', 'محصولات', 'bag'],
              ['inventory', 'موجودی کم', 'warning'],
              ['orders', 'سفارش‌ها', 'package'],
              ['customers', 'مشتریان', 'users'],
              ['promotions', 'تخفیف‌ها', 'tag'],
              ['audit', 'گزارش‌ها', 'eye'],
              ['operations', 'تنظیمات', 'settings'],
            ].map(([key, label, icon]) => (
              <a
                className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-xs transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-primary-foreground/85 hover:bg-primary/70'}`}
                href={`#admin${key === 'admin' ? '' : `/${key}`}`}
                key={key}
              >
                <Icon name={icon as IconName} size={18} />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <AdminLogoutButton
            label="خروج"
            className="mt-auto flex min-h-11 items-center gap-3 border-0 border-t border-primary-foreground/15 bg-transparent px-3 pt-5 text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground disabled:opacity-50"
          />
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8" dir="ltr">
            <div className="hidden items-center gap-3 lg:flex">
              <Button
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="button"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={19} />
              </Button>
              <img
                className="h-10 w-10 rounded-full object-cover"
                src="/assets/nova-hero-men.webp"
                alt=""
              />
              <div className="text-right" dir="rtl">
                <strong className="block text-xs font-medium">مدیر نمونه</strong>
                <span className="mt-1 block text-[10px] text-muted-foreground">حساب نمایشی</span>
              </div>
            </div>

            <div className="hidden text-right lg:ml-auto lg:block" dir="rtl">
              <span className="text-lg font-medium">فضای مدیریت</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                عملیات فروشگاه نوا
              </span>
            </div>

            <div className="flex items-center justify-between lg:hidden" dir="ltr">
              <AdminLogoutButton
                compact
                label="خروج"
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              />
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href="#admin"
                aria-label="داشبورد مدیریت"
              >
                <Icon name="menu" size={20} />
              </a>
              <span className="text-base font-medium" dir="rtl">
                فضای مدیریت
              </span>
              <AdminOperationsLogo mobile />
            </div>
          </header>

          <div className="mx-auto max-w-[1220px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            <section
              className="rounded-panel border border-border bg-surface p-3 shadow-card sm:p-4"
              aria-label="فیلتر محصولات"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <a
                  className="order-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-5"
                  href="#admin/products/new"
                >
                  <Icon name="plus" size={17} />
                  محصول جدید
                </a>

                <label className="relative order-2 min-w-0 sm:order-4 sm:flex-1 sm:basis-[230px]">
                  <span className="sr-only">جست‌وجو در محصولات</span>
                  <Icon
                    name="search"
                    size={18}
                    className="pointer-events-none absolute inset-y-0 right-3 my-auto text-muted-foreground"
                  />
                  <UiInput
                    className="min-h-11 w-full rounded-control border border-border bg-background px-10 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="جست‌وجو در محصولات..."
                    type="search"
                  />
                </label>

                <Button
                  className={`order-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:order-3 ${quickFilterActive ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-background hover:border-primary hover:text-primary'}`}
                  type="button"
                  aria-pressed={quickFilterActive}
                  onClick={setQuickFilter}
                >
                  <Icon name="filter" size={17} />
                  فیلترها
                </Button>

                <label className="relative order-4 min-w-0 sm:order-2 sm:min-w-[138px]">
                  <span className="sr-only">دسته‌بندی</span>
                  <UiSelect
                    className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="all">همه دسته‌بندی‌ها</option>
                    {categoryOptions.map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </UiSelect>
                  <Icon
                    name="chevron-down"
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </label>

                <label className="relative order-5 min-w-0 sm:order-1 sm:min-w-[138px]">
                  <span className="sr-only">وضعیت</span>
                  <UiSelect
                    className="min-h-11 w-full appearance-none rounded-control border border-border bg-background px-3 pl-9 text-xs outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as AdminProductStatusFilter);
                      setPage(1);
                    }}
                  >
                    <option value="all">همه وضعیت‌ها</option>
                    <option value="PUBLISHED">فعال</option>
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="ARCHIVED">بایگانی شده</option>
                  </UiSelect>
                  <Icon
                    name="chevron-down"
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </label>
              </div>
            </section>

            {isPreview ? (
              <p className="mt-3 text-right text-[10px] text-muted-foreground" role="status">
                {ADMIN_PREVIEW_NOTICE} · برای داده‌های واقعی، نشست مدیر را برقرار کنید.
              </p>
            ) : null}

            {dataState && !isPreview ? (
              <section
                className="mt-4 rounded-panel border border-border bg-surface p-8 text-center shadow-card"
                role={dataState.role}
              >
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary">
                  <Icon name={dataState.role === 'alert' ? 'warning' : 'refresh'} size={22} />
                </span>
                <h2 className="mt-4 text-lg font-semibold">{dataState.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-muted-foreground">
                  {dataState.message}
                </p>
                <Button
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  type="button"
                  onClick={() =>
                    void (isStaffAuthenticated ? productsQuery.refetch() : staffQuery.refetch())
                  }
                >
                  <Icon name="refresh" size={16} />
                  دوباره تلاش کنید
                </Button>
              </section>
            ) : (
              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.45fr)]">
                <aside className="order-1 space-y-4">
                  <section
                    className="rounded-panel border border-border bg-surface p-4 shadow-card"
                    aria-labelledby="admin-low-stock-title"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="warning" size={20} className="text-warning" />
                        <h2 className="text-base font-semibold" id="admin-low-stock-title">
                          موجودی کم
                        </h2>
                      </div>
                      <span className="rounded-full bg-warning-100 px-2 py-1 text-[10px] text-warning">
                        {formatPersianNumber(lowStockCount)} مورد
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {lowStockItems.map((item) => (
                        <a
                          className="flex items-center gap-3 py-3 transition-colors first:pt-4 last:pb-1 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href="#admin/inventory"
                          key={`${item.productId}-${item.slug}`}
                        >
                          {item.image ? (
                            <img
                              className="h-14 w-14 rounded-control border border-border bg-background object-cover"
                              src={item.image}
                              alt={item.alt}
                              loading="lazy"
                            />
                          ) : (
                            <span
                              className="flex h-14 w-14 items-center justify-center rounded-control border border-border bg-background text-muted-foreground"
                              aria-hidden="true"
                            >
                              <Icon name="shirt" size={20} />
                            </span>
                          )}
                          <span className="min-w-0 flex-1 text-right">
                            <strong className="block truncate text-xs font-medium">
                              {item.name}
                            </strong>
                            <small className="mt-1 block text-[10px] text-warning">
                              {isPreview
                                ? 'موجودی نمونه'
                                : `${formatPersianNumber(item.stock)} عدد باقی مانده`}
                            </small>
                          </span>
                          <Icon
                            name="arrow-left"
                            size={16}
                            className="shrink-0 text-muted-foreground"
                          />
                        </a>
                      ))}
                    </div>
                    <a
                      className="mt-3 inline-flex items-center gap-2 text-xs text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      href="#admin/inventory"
                    >
                      مشاهده همه
                      <Icon name="arrow-left" size={15} />
                    </a>
                  </section>

                  <section
                    className="rounded-panel border border-border bg-surface p-4 shadow-card"
                    aria-labelledby="admin-orders-title"
                  >
                    <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                      <div className="flex items-center gap-2">
                        <Icon name="package" size={19} className="text-muted-foreground" />
                        <h2 className="text-base font-semibold" id="admin-orders-title">
                          سفارش‌ها
                        </h2>
                      </div>
                      <a
                        className="text-[10px] text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        href="#admin/orders"
                      >
                        مشاهده همه
                      </a>
                    </div>
                    <div className="divide-y divide-border">
                      {orderPreviews.map((order) => (
                        <a
                          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 first:pt-4 last:pb-1 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href={`#admin/orders/${order.orderNumber}`}
                          key={order.id}
                        >
                          <span className="text-[10px] text-muted-foreground" dir="ltr">
                            {order.id}
                          </span>
                          <span className="min-w-0 text-right">
                            <strong className="block truncate text-[11px] font-medium">
                              {order.customer}
                            </strong>
                            <small className="mt-1 block text-[9px] text-muted-foreground">
                              {order.date}
                            </small>
                          </span>
                          <span className="text-left">
                            <strong className="block whitespace-nowrap text-[10px] font-medium">
                              {isPreview ? 'مبلغ نمونه' : formatToman(order.amount)}
                            </strong>
                            <small
                              className={`mt-1 block whitespace-nowrap rounded px-1.5 py-1 text-[9px] ${order.statusTone === 'warning' ? 'bg-warning-100 text-warning' : order.statusTone === 'danger' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                            >
                              {order.status}
                            </small>
                          </span>
                        </a>
                      ))}
                    </div>
                  </section>
                </aside>

                <section
                  className="order-2 min-w-0 overflow-hidden rounded-panel border border-border bg-surface shadow-card"
                  aria-labelledby="admin-products-title"
                >
                  <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-5 sm:px-5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold" id="admin-products-title">
                        محصولات
                      </h2>
                      <span className="rounded-full bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                        {formatPersianNumber(resultCount)} محصول
                      </span>
                    </div>
                    <span className="hidden text-[10px] text-muted-foreground sm:inline">
                      {isPreview
                        ? 'پیش‌نمایش محلی'
                        : productsQuery.isFetching
                          ? 'در حال بروزرسانی...'
                          : 'همگام با سرور'}
                    </span>
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[520px] table-fixed border-collapse text-right text-xs">
                      <caption className="sr-only">فهرست محصولات نوا</caption>
                      <thead className="bg-background text-[10px] text-muted-foreground">
                        <tr>
                          <th className="w-[32%] px-4 py-3 font-medium" scope="col">
                            محصول
                          </th>
                          <th className="w-[11%] px-3 py-3 font-medium" scope="col">
                            دسته‌بندی
                          </th>
                          <th className="w-[18%] px-3 py-3 font-medium" scope="col">
                            قیمت
                          </th>
                          <th className="w-[9%] px-3 py-3 font-medium" scope="col">
                            موجودی
                          </th>
                          <th className="w-[15%] px-3 py-3 font-medium" scope="col">
                            وضعیت
                          </th>
                          <th className="w-[15%] px-4 py-3 text-left font-medium" scope="col">
                            عملیات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr
                            className="border-t border-border transition-colors hover:bg-background"
                            key={product.slug}
                          >
                            <th className="px-4 py-3 text-right font-normal" scope="row">
                              <a
                                className="flex min-w-0 items-center gap-2 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                href={`#admin/products/${product.slug}/edit`}
                              >
                                {product.image ? (
                                  <img
                                    className="h-12 w-12 shrink-0 rounded-control border border-border bg-background object-cover"
                                    src={product.image}
                                    alt={product.alt}
                                    loading="lazy"
                                  />
                                ) : (
                                  <span
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-control border border-border bg-background text-muted-foreground"
                                    aria-hidden="true"
                                  >
                                    <Icon name="shirt" size={18} />
                                  </span>
                                )}
                                <span className="min-w-0">
                                  <strong className="block truncate text-xs font-medium">
                                    {product.name}
                                  </strong>
                                  <small
                                    className="mt-1 block truncate text-[9px] text-muted-foreground"
                                    dir="ltr"
                                  >
                                    {product.slug}
                                  </small>
                                </span>
                              </a>
                            </th>
                            <td className="truncate whitespace-nowrap px-3 py-3 text-muted-foreground">
                              {product.category}
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-[10px]">
                              {isPreview ? 'قیمت نمونه' : formatToman(product.price)}
                            </td>
                            <td className="px-3 py-3 font-medium">
                              {isPreview ? 'موجودی نمونه' : formatPersianNumber(product.stock)}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`inline-flex rounded-control px-2.5 py-1.5 text-[10px] ${product.lifecycleStatus !== 'PUBLISHED' ? 'bg-secondary text-muted-foreground' : product.stockStatus === 'LOW_STOCK' ? 'bg-warning-100 text-warning' : product.stockStatus === 'OUT_OF_STOCK' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                              >
                                {product.lifecycleStatus !== 'PUBLISHED'
                                  ? adminLifecycleStatusLabel(product.lifecycleStatus)
                                  : adminStockStatusLabel(product.stockStatus)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="relative flex items-center justify-end gap-2">
                                <Button
                                  className="flex h-9 w-9 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                  type="button"
                                  aria-label={`گزینه‌های ${product.name}`}
                                  aria-expanded={openActionSlug === product.slug}
                                  aria-controls={`admin-product-actions-${product.slug}`}
                                  onClick={() =>
                                    setOpenActionSlug((current) =>
                                      current === product.slug ? null : product.slug,
                                    )
                                  }
                                >
                                  <Icon name="more-vertical" size={17} />
                                </Button>
                                <a
                                  className="flex h-9 w-9 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                  href={`#admin/products/${product.slug}/edit`}
                                  aria-label={`ویرایش ${product.name}`}
                                >
                                  <Icon name="edit" size={16} />
                                </a>
                                {openActionSlug === product.slug ? (
                                  <div
                                    className="absolute left-0 top-11 z-10 w-36 rounded-control border border-border bg-surface p-1 text-right shadow-float"
                                    id={`admin-product-actions-${product.slug}`}
                                  >
                                    <a
                                      className="block rounded px-2.5 py-2 text-[10px] hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                      href={`#admin/products/${product.slug}/edit`}
                                    >
                                      ویرایش محصول
                                    </a>
                                    <a
                                      className="block rounded px-2.5 py-2 text-[10px] hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                      href={`#product/${product.slug}`}
                                    >
                                      مشاهده در فروشگاه
                                    </a>
                                  </div>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="space-y-2 px-3 pb-3 md:hidden">
                    {filteredProducts.map((product) => (
                      <article
                        className="flex items-center gap-3 rounded-control border border-border bg-background p-3"
                        key={product.slug}
                      >
                        {product.image ? (
                          <img
                            className="h-14 w-14 shrink-0 rounded-control border border-border bg-surface object-cover"
                            src={product.image}
                            alt={product.alt}
                            loading="lazy"
                          />
                        ) : (
                          <span
                            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-control border border-border bg-surface text-muted-foreground"
                            aria-hidden="true"
                          >
                            <Icon name="shirt" size={20} />
                          </span>
                        )}
                        <div className="min-w-0 flex-1 text-right">
                          <a
                            className="block truncate text-xs font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={`#admin/products/${product.slug}/edit`}
                          >
                            {product.name}
                          </a>
                          <span className="mt-1 block text-[10px] text-muted-foreground">
                            {product.category} ·{' '}
                            {isPreview ? 'قیمت نمونه' : formatToman(product.price)}
                          </span>
                          <span
                            className={`mt-2 inline-flex rounded-control px-2 py-1 text-[9px] ${product.lifecycleStatus !== 'PUBLISHED' ? 'bg-secondary text-muted-foreground' : product.stockStatus === 'LOW_STOCK' ? 'bg-warning-100 text-warning' : product.stockStatus === 'OUT_OF_STOCK' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                          >
                            {isPreview
                              ? 'موجودی نمونه'
                              : `${formatPersianNumber(product.stock)} موجودی`}{' '}
                            ·{' '}
                            {product.lifecycleStatus !== 'PUBLISHED'
                              ? adminLifecycleStatusLabel(product.lifecycleStatus)
                              : adminStockStatusLabel(product.stockStatus)}
                          </span>
                        </div>
                        <a
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-border text-muted-foreground hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          href={`#admin/products/${product.slug}/edit`}
                          aria-label={`ویرایش ${product.name}`}
                        >
                          <Icon name="edit" size={16} />
                        </a>
                      </article>
                    ))}
                  </div>

                  {resultCount === 0 ? (
                    <p className="border-t border-border px-4 py-12 text-center text-xs text-muted-foreground">
                      محصولی با این فیلترها پیدا نشد.
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-4 text-[10px] text-muted-foreground sm:px-5">
                    <span>
                      نمایش {formatPersianNumber(visibleStart)} تا {formatPersianNumber(visibleEnd)}{' '}
                      از {formatPersianNumber(resultCount)} محصول
                    </span>
                    <nav className="flex items-center gap-1" aria-label="صفحه‌بندی محصولات">
                      <Button
                        className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                        type="button"
                        aria-label="صفحه قبلی"
                        disabled={page <= 1 || !isStaffAuthenticated}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        <Icon name="arrow-right" size={15} />
                      </Button>
                      <Button
                        className="flex h-8 min-w-8 items-center justify-center rounded-control bg-primary px-2 text-[10px] text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        type="button"
                        aria-current="page"
                      >
                        {formatPersianNumber(page)}
                      </Button>
                      <Button
                        className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        type="button"
                        aria-label="صفحه بعدی"
                        disabled={page >= totalPages || !isStaffAuthenticated}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      >
                        <Icon name="arrow-left" size={15} />
                      </Button>
                    </nav>
                  </div>
                </section>
              </div>
            )}
          </div>
        </section>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-1 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur lg:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {[
          ['admin', 'خانه', 'home'],
          ['products', 'محصولات', 'bag'],
          ['inventory', 'موجودی کم', 'warning'],
          ['orders', 'سفارش‌ها', 'package'],
          ['operations', 'بیشتر', 'menu'],
        ].map(([key, label, icon]) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-control text-[9px] transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
            href={`#admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon as IconName} size={18} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
