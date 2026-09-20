import type { Dispatch, SetStateAction } from 'react';

import { Button } from '@nova/ui';

import type { AdminProductRow } from '../../app/app-shared';

import { Icon } from '../../ui/icon';

import { adminLifecycleStatusLabel } from '../admin-lifecycle-status-label';

import { adminStockStatusLabel } from '../admin-stock-status-label';

import { formatPersianNumber } from '../../../utils/app/format-persian-number';

import { formatToman } from '../../../utils/app/format-toman';

type AdminProductsTableProps = {
  products: AdminProductRow[];
  resultCount: number;
  isPreview: boolean;
  isFetching: boolean;
  openActionSlug: string | null;
  onActionToggle: Dispatch<SetStateAction<string | null>>;
  page: number;
  totalPages: number;
  visibleStart: number;
  visibleEnd: number;
  isStaffAuthenticated: boolean;
  onPageChange: Dispatch<SetStateAction<number>>;
};

export function AdminProductsTable({
  products,
  resultCount,
  isPreview,
  isFetching,
  openActionSlug,
  onActionToggle,
  page,
  totalPages,
  visibleStart,
  visibleEnd,
  isStaffAuthenticated,
  onPageChange,
}: AdminProductsTableProps) {
  return (
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
          {isPreview ? 'پیش‌نمایش محلی' : isFetching ? 'در حال بروزرسانی...' : 'همگام با سرور'}
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
            {products.map((product) => (
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
                      <strong className="block truncate text-xs font-medium">{product.name}</strong>
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
                        onActionToggle((current) =>
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
        {products.map((product) => (
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
                {product.category} · {isPreview ? 'قیمت نمونه' : formatToman(product.price)}
              </span>
              <span
                className={`mt-2 inline-flex rounded-control px-2 py-1 text-[9px] ${product.lifecycleStatus !== 'PUBLISHED' ? 'bg-secondary text-muted-foreground' : product.stockStatus === 'LOW_STOCK' ? 'bg-warning-100 text-warning' : product.stockStatus === 'OUT_OF_STOCK' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
              >
                {isPreview ? 'موجودی نمونه' : `${formatPersianNumber(product.stock)} موجودی`} ·{' '}
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
          نمایش {formatPersianNumber(visibleStart)} تا {formatPersianNumber(visibleEnd)} از{' '}
          {formatPersianNumber(resultCount)} محصول
        </span>
        <nav className="flex items-center gap-1" aria-label="صفحه‌بندی محصولات">
          <Button
            className="flex h-8 w-8 items-center justify-center rounded-control border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
            type="button"
            aria-label="صفحه قبلی"
            disabled={page <= 1 || !isStaffAuthenticated}
            onClick={() => onPageChange((current) => Math.max(1, current - 1))}
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
            onClick={() => onPageChange((current) => Math.min(totalPages, current + 1))}
          >
            <Icon name="arrow-left" size={15} />
          </Button>
        </nav>
      </div>
    </section>
  );
}
