import { ADMIN_PREVIEW_NOTICE } from '../app/app-shared';

import { useAdminProductsPage } from './admin-products-page-functions/use-admin-products-page';

import { AdminProductsDataState } from './admin-products-page-functions/admin-products-data-state';

import { AdminProductsFilters } from './admin-products-page-functions/admin-products-filters';

import { AdminProductsOverview } from './admin-products-page-functions/admin-products-overview';

import { AdminProductsPageFrame } from './admin-products-page-functions/admin-products-page-frame';

import { AdminProductsTable } from './admin-products-page-functions/admin-products-table';

export function AdminProductsPage() {
  const {
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
  } = useAdminProductsPage();

  return (
    <AdminProductsPageFrame>
      <AdminProductsFilters
        query={query}
        onQueryChange={setQuery}
        quickFilterActive={quickFilterActive}
        onQuickFilter={setQuickFilter}
        category={category}
        categoryOptions={categoryOptions}
        onCategoryChange={(value) => {
          setCategory(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
      />

      {isPreview ? (
        <p className="mt-3 text-right text-[10px] text-muted-foreground" role="status">
          {ADMIN_PREVIEW_NOTICE} · برای داده‌های واقعی، نشست مدیر را برقرار کنید.
        </p>
      ) : null}

      {dataState && !isPreview ? (
        <AdminProductsDataState
          title={dataState.title}
          message={dataState.message}
          role={dataState.role}
          onRetry={() =>
            void (isStaffAuthenticated ? productsQuery.refetch() : staffQuery.refetch())
          }
        />
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.45fr)]">
          <AdminProductsOverview
            lowStockItems={lowStockItems}
            lowStockCount={lowStockCount}
            orderPreviews={orderPreviews}
            isPreview={isPreview}
          />
          <AdminProductsTable
            products={filteredProducts}
            resultCount={resultCount}
            isPreview={isPreview}
            isFetching={productsQuery.isFetching}
            openActionSlug={openActionSlug}
            onActionToggle={setOpenActionSlug}
            page={page}
            totalPages={totalPages}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
            isStaffAuthenticated={isStaffAuthenticated}
            onPageChange={setPage}
          />
        </div>
      )}
    </AdminProductsPageFrame>
  );
}
