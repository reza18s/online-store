import { useState, type FormEvent } from 'react';
import { type AdminCatalogProductListQuery } from '@nova/api-client';
import { Button, Select as UiSelect } from '@nova/ui';
import {
  useAdminCatalogCategories,
  useAdminCatalogProducts,
} from '../../../lib/admin/admin-catalog-api';
import { useAdminInventory } from '../../../lib/admin/admin-inventory-api';

import { Icon } from '../../ui/icon';

import { FilterInput } from './filter-input';

import { LoadingState } from './loading-state';

import { LowStockCard } from './low-stock-card';

import { Pagination } from './pagination';

import { ProductCard } from './product-card';

import { ProductTableRow } from './product-table-row';

import { QueryState } from './query-state';

import { StatePanel } from './state-panel';

import { formatNumber } from './format-number';

import { hasAdminRole } from './has-admin-role';

export function CatalogView({ roles }: { roles: readonly string[] }) {
  const canWrite = hasAdminRole(roles, ['admin']);
  const [filters, setFilters] = useState<AdminCatalogProductListQuery>({ page: 1, limit: 8 });
  const [search, setSearch] = useState('');
  const productsQuery = useAdminCatalogProducts(filters);
  const categoriesQuery = useAdminCatalogCategories();
  const lowStockQuery = useAdminInventory({ page: 1, limit: 4, lowStock: true, status: 'ALL' });
  const products = productsQuery.data?.items ?? [];
  const lowStock = lowStockQuery.data?.items ?? [];

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim() || undefined, page: 1 }));
  }

  if (productsQuery.isPending && !productsQuery.data)
    return <LoadingState label="در حال دریافت محصولات..." />;
  if (productsQuery.isError && !productsQuery.data)
    return (
      <QueryState
        pending={false}
        error={productsQuery.error}
        hasData={false}
        onRetry={() => void productsQuery.refetch()}
      >
        {null}
      </QueryState>
    );
  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">
            CATALOG / PRODUCT CONTROL
          </p>
          <h2 className="mt-2 text-2xl font-semibold">محصولات</h2>
          <p className="mt-1 text-xs leading-7 text-muted-foreground">
            ایجاد، ویرایش، انتشار و اتصال محصول به طبقه‌بندی و تنوع‌ها.
          </p>
        </div>
        {canWrite ? (
          <Button asChild>
            <a href="#admin/catalog/products/new">
              <Icon name="plus" size={17} /> محصول جدید
            </a>
          </Button>
        ) : (
          <span className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface px-4 text-xs text-muted-foreground">
            <Icon name="eye" size={16} /> فقط مشاهده
          </span>
        )}
      </header>
      <form
        className="grid gap-3 border border-border bg-surface p-4 shadow-card md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(160px,.7fr))_auto]"
        onSubmit={submitFilters}
      >
        <FilterInput
          label="جست‌وجو در محصولات"
          onChange={setSearch}
          placeholder="نام یا شناسه محصول..."
          value={search}
        />
        <label className="block text-xs text-muted-foreground">
          وضعیت
          <UiSelect
            aria-label="فیلتر وضعیت محصول"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                status: (event.target.value || undefined) as AdminCatalogProductListQuery['status'],
              }))
            }
            value={filters.status ?? ''}
          >
            <option value="">همه وضعیت‌ها</option>
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشرشده</option>
            <option value="ARCHIVED">آرشیوشده</option>
          </UiSelect>
        </label>
        <label className="block text-xs text-muted-foreground">
          دسته‌بندی
          <UiSelect
            aria-label="فیلتر دسته‌بندی"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                category: event.target.value || undefined,
              }))
            }
            value={filters.category ?? ''}
          >
            <option value="">همه دسته‌ها</option>
            {(categoriesQuery.data ?? [])
              .filter((category) => !category.archivedAt)
              .map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
          </UiSelect>
        </label>
        <Button type="submit">
          <Icon name="search" size={16} /> اعمال فیلتر
        </Button>
      </form>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          className="border border-border bg-surface shadow-card"
          aria-labelledby="admin-catalog-list-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
            <h3 className="font-semibold" id="admin-catalog-list-title">
              فهرست محصولات
            </h3>
            <span className="text-xs text-muted-foreground">
              {formatNumber(productsQuery.data?.total ?? 0)} محصول
            </span>
          </div>
          {products.length === 0 ? (
            <div className="p-5">
              <StatePanel
                icon="bag"
                title="محصولی با این فیلتر پیدا نشد"
                description="جست‌وجو یا وضعیت محصول را تغییر دهید."
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[780px] border-collapse text-right text-xs">
                  <caption className="sr-only">محصولات واقعی کاتالوگ</caption>
                  <thead className="bg-background text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 font-medium" scope="col">
                        محصول
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        دسته‌بندی
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        قیمت
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        موجودی
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        وضعیت
                      </th>
                      <th className="px-4 py-3 font-medium" scope="col">
                        <span className="sr-only">عملیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <ProductTableRow key={product.id} product={product} />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 p-3 md:hidden">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="p-4 md:p-5">
                <Pagination
                  limit={productsQuery.data?.limit ?? 8}
                  page={productsQuery.data?.page ?? 1}
                  total={productsQuery.data?.total ?? 0}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </section>
        <LowStockCard items={lowStock} query={lowStockQuery} />
      </div>
    </div>
  );
}
