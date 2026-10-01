import { useEffect, useState, type FormEvent } from 'react';
import { type AdminInventoryListQuery } from '@nova/api-client';
import { Button, Checkbox, Select as UiSelect } from '@nova/ui';

import {
  useAdminInventory,
  useAdminInventoryItem,
  useAdjustAdminInventory,
  useUpdateAdminInventoryReorderPoint,
} from '@/features/catalog/api/inventory/admin-inventory-api';

import { Icon } from '@/shared/ui/icon';

import { FilterInput } from '@/features/catalog/components/catalog-inventory/filter-input';

import { InventoryDetail } from '@/features/catalog/components/catalog-inventory/inventory-detail';

import { InventoryRow } from '@/features/catalog/components/catalog-inventory/inventory-row';

import { LoadingState } from '@/features/catalog/components/catalog-inventory/loading-state';

import { Pagination } from '@/features/catalog/components/catalog-inventory/pagination';

import { QueryState } from '@/features/catalog/components/catalog-inventory/query-state';

import { StatePanel } from '@/features/catalog/components/catalog-inventory/state-panel';

import { adminCatalogInventoryErrorMessage } from '@/features/catalog/components/catalog-inventory/admin-catalog-inventory-error-message';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { hasAdminRole } from '@/features/catalog/components/catalog-inventory/has-admin-role';

import { validateInventoryAdjustment } from '@/features/catalog/components/catalog-inventory/validate-inventory-adjustment';

export function InventoryView({
  roles,
  initialVariantId,
}: {
  roles: readonly string[];
  initialVariantId?: string;
}) {
  const canOperate = hasAdminRole(roles, ['operations', 'admin']);
  const [filters, setFilters] = useState<AdminInventoryListQuery>({
    page: 1,
    limit: 8,
    status: 'ALL',
  });
  const [search, setSearch] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState(initialVariantId ?? '');
  const query = useAdminInventory(filters);
  const detailQuery = useAdminInventoryItem(selectedVariantId);
  const adjustMutation = useAdjustAdminInventory();
  const reorderMutation = useUpdateAdminInventoryReorderPoint();
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const items = query.data?.items ?? [];

  useEffect(() => {
    if (detailQuery.data) setReorderPoint(String(detailQuery.data.reorderPoint));
  }, [detailQuery.data?.updatedAt, detailQuery.data?.variantId]);
  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim() || undefined, page: 1 }));
  }
  async function adjust(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issues = validateInventoryAdjustment(delta, reason);
    if (issues.length || !detailQuery.data) {
      setError(issues.join(' '));
      return;
    }
    setError('');
    setSuccess('');
    try {
      await adjustMutation.mutateAsync({
        variantId: detailQuery.data.variantId,
        input: {
          delta: Number(delta),
          reason: reason.trim(),
          expectedUpdatedAt: detailQuery.data.updatedAt,
        },
      });
      setDelta('');
      setReason('');
      setSuccess('تغییر موجودی ثبت شد و نسخه تازه بارگیری شد.');
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'تغییر موجودی ثبت نشد.'));
    }
  }
  async function saveReorder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !detailQuery.data ||
      !Number.isSafeInteger(Number(reorderPoint)) ||
      Number(reorderPoint) < 0
    ) {
      setError('نقطه سفارش مجدد باید عدد صحیح نامنفی باشد.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await reorderMutation.mutateAsync({
        variantId: detailQuery.data.variantId,
        input: {
          reorderPoint: Number(reorderPoint),
          expectedUpdatedAt: detailQuery.data.updatedAt,
        },
      });
      setSuccess('نقطه سفارش مجدد ذخیره شد.');
    } catch (mutationError) {
      setError(adminCatalogInventoryErrorMessage(mutationError, 'نقطه سفارش مجدد ذخیره نشد.'));
    }
  }

  if (query.isPending && !query.data) return <LoadingState label="در حال دریافت موجودی..." />;
  if (query.isError && !query.data)
    return (
      <QueryState
        pending={false}
        error={query.error}
        hasData={false}
        onRetry={() => void query.refetch()}
      >
        {null}
      </QueryState>
    );
  const totalOnHand = items.reduce((sum, item) => sum + item.onHand, 0);
  const totalReserved = items.reduce((sum, item) => sum + item.reserved, 0);
  const lowStockCount = items.filter((item) => item.stockStatus === 'LOW_STOCK').length;
  const outOfStockCount = items.filter((item) => item.stockStatus === 'OUT_OF_STOCK').length;

  return (
    <div className="admin-reference-inventory">
      <header className="admin-reference-inventory__header">
        <div>
          <span className="section-heading__eyebrow">NOVA / INVENTORY</span>
          <h2>موجودی</h2>
          <p>نمای کلی موجودی محصولات و مدیریت انبار بر اساس داده‌های واقعی سرویس مدیریت.</p>
        </div>
        {canOperate ? (
          <a className="admin-reference-inventory__add" href="/admin/catalog/products/new">
            <Icon name="plus" size={17} /> محصول جدید
          </a>
        ) : null}
      </header>

      <section className="admin-reference-inventory-metrics" aria-label="خلاصه موجودی">
        <article>
          <span className="is-green"><Icon name="warehouse" size={21} /></span>
          <div><strong>{formatNumber(totalOnHand)}</strong><small>مجموع موجودی این صفحه</small></div>
        </article>
        <article>
          <span className="is-amber"><Icon name="warning" size={21} /></span>
          <div><strong>{formatNumber(lowStockCount)}</strong><small>موجودی کم</small></div>
        </article>
        <article>
          <span className="is-red"><Icon name="close" size={21} /></span>
          <div><strong>{formatNumber(outOfStockCount)}</strong><small>ناموجود</small></div>
        </article>
        <article>
          <span className="is-gold"><Icon name="package" size={21} /></span>
          <div><strong>{formatNumber(totalReserved)}</strong><small>رزرو شده</small></div>
        </article>
      </section>

      <form className="admin-reference-inventory-filters" onSubmit={submitFilters}>
        <FilterInput
          label="جست‌وجو"
          onChange={setSearch}
          placeholder="جست‌وجوی محصول یا SKU..."
          value={search}
        />
        <label>
          <span>وضعیت تنوع</span>
          <UiSelect
            aria-label="فیلتر وضعیت تنوع"
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                status: (event.target.value || 'ALL') as AdminInventoryListQuery['status'],
              }))
            }
            value={filters.status ?? 'ALL'}
          >
            <option value="ALL">همه تنوع‌ها</option>
            <option value="ACTIVE">فعال</option>
            <option value="INACTIVE">غیرفعال</option>
          </UiSelect>
        </label>
        <label className="admin-reference-inventory-filters__check">
          <Checkbox
            checked={filters.lowStock === true}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                lowStock: event.target.checked || undefined,
              }))
            }
          />
          فقط موجودی کم
        </label>
        <Button type="submit" variant="outline">
          <Icon name="filter" size={16} /> فیلترها
        </Button>
      </form>

      {error ? <p className="admin-reference-message is-error" role="alert">{error}</p> : null}
      {success ? <p className="admin-reference-message is-success" role="status">{success}</p> : null}

      <section className="admin-reference-inventory-table">
        <div className="admin-reference-inventory-table__head" aria-hidden="true">
          <span>محصول</span>
          <span>SKU</span>
          <span>قابل فروش</span>
          <span>رزرو</span>
          <span>فیزیکی</span>
          <span>حد سفارش</span>
          <span>وضعیت</span>
          <span />
        </div>

        {items.length === 0 ? (
          <div className="admin-reference-inventory-table__empty">
            <StatePanel
              icon="warehouse"
              title="موجودی‌ای با این فیلتر پیدا نشد"
              description="فیلتر موجودی کم یا عبارت جست‌وجو را تغییر دهید."
            />
          </div>
        ) : (
          <div className="admin-reference-inventory-table__rows">
            {items.map((item) => (
              <InventoryRow
                item={item}
                selected={item.variantId === selectedVariantId}
                onSelect={setSelectedVariantId}
                key={item.id}
              />
            ))}
          </div>
        )}

        <div className="admin-reference-inventory-table__footer">
          <span>{formatNumber(query.data?.total ?? 0)} تنوع</span>
          <Pagination
            limit={query.data?.limit ?? 8}
            page={query.data?.page ?? 1}
            total={query.data?.total ?? 0}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </div>
      </section>

      {selectedVariantId ? (
        <div className="admin-reference-inventory-detail">
          <InventoryDetail
            detailQuery={detailQuery}
            enabled={Boolean(selectedVariantId)}
            canOperate={canOperate}
            delta={delta}
            reason={reason}
            reorderPoint={reorderPoint}
            setDelta={setDelta}
            setReason={setReason}
            setReorderPoint={setReorderPoint}
            onAdjust={adjust}
            onReorder={saveReorder}
            adjusting={adjustMutation.isPending}
            reordering={reorderMutation.isPending}
          />
        </div>
      ) : null}
    </div>
  );
}
