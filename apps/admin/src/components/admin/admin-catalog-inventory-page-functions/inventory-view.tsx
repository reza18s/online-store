import { useEffect, useState, type FormEvent } from 'react';
import { type AdminInventoryListQuery } from '@nova/api-client';
import { Button, Checkbox, Select as UiSelect } from '@nova/ui';

import {
  useAdminInventory,
  useAdminInventoryItem,
  useAdjustAdminInventory,
  useUpdateAdminInventoryReorderPoint,
} from '../../../lib/admin/admin-inventory-api';

import { Icon } from '../../ui/icon';

import { FilterInput } from './filter-input';

import { InventoryDetail } from './inventory-detail';

import { InventoryRow } from './inventory-row';

import { LoadingState } from './loading-state';

import { Pagination } from './pagination';

import { QueryState } from './query-state';

import { StatePanel } from './state-panel';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { formatNumber } from './format-number';

import { hasAdminRole } from './has-admin-role';

import { validateInventoryAdjustment } from './validate-inventory-adjustment';

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
  return (
    <div className="space-y-5">
      <header>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-warning">
          INVENTORY / CONTROL ROOM
        </p>
        <h2 className="mt-2 text-2xl font-semibold">موجودی</h2>
        <p className="mt-1 text-xs leading-7 text-muted-foreground">
          موجودی فیزیکی، رزروشده، قابل فروش و نقطه سفارش مجدد را از سرویس مدیریت بررسی کنید.
        </p>
      </header>
      <form
        className="grid gap-3 border border-border bg-surface p-4 shadow-card md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(150px,.7fr))_auto]"
        onSubmit={submitFilters}
      >
        <FilterInput
          label="جست‌وجوی کالا یا SKU"
          onChange={setSearch}
          placeholder="نام محصول یا SKU..."
          value={search}
        />
        <label className="block text-xs text-muted-foreground">
          وضعیت تنوع
          <UiSelect
            aria-label="فیلتر وضعیت تنوع"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
        <label className="flex min-h-12 items-center gap-3 border border-border bg-background px-3 text-xs">
          <Checkbox
            checked={filters.lowStock === true}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                page: 1,
                lowStock: event.target.checked || undefined,
              }))
            }
          />{' '}
          فقط موجودی کم
        </label>
        <Button type="submit">
          <Icon name="search" size={16} /> اعمال فیلتر
        </Button>
      </form>
      {error ? (
        <p
          className="border border-destructive/30 bg-error-soft px-4 py-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {success ? (
        <p
          className="border border-success/30 bg-success-soft px-4 py-3 text-xs text-success"
          role="status"
        >
          {success}
        </p>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <h3 className="font-semibold">فهرست موجودی</h3>
            <span className="text-xs text-muted-foreground">
              {formatNumber(query.data?.total ?? 0)} تنوع
            </span>
          </div>
          {items.length === 0 ? (
            <div className="p-5">
              <StatePanel
                icon="warehouse"
                title="موجودی‌ای با این فیلتر پیدا نشد"
                description="فیلتر موجودی کم یا عبارت جست‌وجو را تغییر دهید."
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
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
          <div className="p-4 md:p-5">
            <Pagination
              limit={query.data?.limit ?? 8}
              page={query.data?.page ?? 1}
              total={query.data?.total ?? 0}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        </section>
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
    </div>
  );
}
