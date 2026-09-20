import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import {
  useAdminCatalogCategories,
  useAdminCatalogProducts,
} from '@/features/catalog/api/catalog/admin-catalog-api';
import {
  isStaffAuthFailure,
  isStaffAuthorizationFailure,
  useStaffUser,
} from '@/features/auth';

import { useAdminInventory } from '@/features/catalog/api/inventory/admin-inventory-api';
import { useAdminOrders } from '@/features/orders/api/admin-orders-api';

import type { AdminProductStatusFilter } from '@/shared/fixtures/app-shared';
import { adminLowStockItems, adminOrderPreviews, adminProductRows } from '@/shared/fixtures/app-shared';

import { toAdminLowStockItem } from '@/shared/utils/to-admin-low-stock-item';
import { toAdminOrderPreview } from '@/shared/utils/to-admin-order-preview';
import { toAdminProductRow } from '@/shared/utils/to-admin-product-row';

export function useAdminProductsPage() {
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

  return {
    query,
    setQuery,
    category,
    setCategory,
    status,
    setStatus,
    quickFilterActive,
    page,
    setPage,
    openActionSlug,
    setOpenActionSlug,
    isStaffAuthenticated,
    isPreview,
    productListQuery,
    productsQuery,
    staffQuery,
    categoryOptions,
    filteredProducts,
    resultCount,
    totalPages,
    visibleStart,
    visibleEnd,
    lowStockItems,
    lowStockCount,
    orderPreviews,
    dataState,
    setQuickFilter,
  };
}
