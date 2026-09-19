import { type FormEvent } from 'react';

import { Button, Input as UiInput, Textarea as UiTextarea } from '@nova/ui';

import type { useAdminInventoryItem } from '../../../lib/admin/admin-inventory-api';

import { Icon } from '../../ui/icon';

import { LoadingState } from './loading-state';

import { StatePanel } from './state-panel';

import { adminCatalogInventoryErrorMessage } from './admin-catalog-inventory-error-message';

import { formatDate } from './format-date';

import { formatNumber } from './format-number';

import { isInventoryDiscrepancy } from './is-inventory-discrepancy';

import { isOfflineError } from './is-offline-error';

import { ltr } from './ltr';

import { resolveInventoryDetailState } from './resolve-inventory-detail-state';

import { statusLabel } from './status-label';

export function InventoryDetail({
  detailQuery,
  enabled,
  canOperate,
  delta,
  reason,
  reorderPoint,
  setDelta,
  setReason,
  setReorderPoint,
  onAdjust,
  onReorder,
  adjusting,
  reordering,
}: {
  detailQuery: ReturnType<typeof useAdminInventoryItem>;
  enabled: boolean;
  canOperate: boolean;
  delta: string;
  reason: string;
  reorderPoint: string;
  setDelta: (value: string) => void;
  setReason: (value: string) => void;
  setReorderPoint: (value: string) => void;
  onAdjust: (event: FormEvent<HTMLFormElement>) => void;
  onReorder: (event: FormEvent<HTMLFormElement>) => void;
  adjusting: boolean;
  reordering: boolean;
}) {
  const item = detailQuery.data;
  const detailState = resolveInventoryDetailState({
    hasItem: Boolean(item),
    enabled,
    isPending: detailQuery.isPending,
    isError: detailQuery.isError,
  });
  if (detailState === 'loading')
    return (
      <div className="border border-border bg-surface p-5 shadow-card">
        <LoadingState label="در حال دریافت جزئیات موجودی..." />
      </div>
    );
  if (detailState === 'error')
    return (
      <StatePanel
        icon={isOfflineError(detailQuery.error) ? 'refresh' : 'warning'}
        title={
          isOfflineError(detailQuery.error)
            ? 'اتصال شبکه در دسترس نیست'
            : 'دریافت اطلاعات انجام نشد'
        }
        description={adminCatalogInventoryErrorMessage(
          detailQuery.error,
          'جزئیات موجودی در دسترس نیست.',
        )}
        action={
          <Button onClick={() => void detailQuery.refetch()} variant="outline">
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        }
        tone="danger"
      />
    );
  if (!item)
    return (
      <StatePanel
        icon="warehouse"
        title="یک تنوع را انتخاب کنید"
        description="برای مشاهده جزئیات و ثبت عملیات، یک ردیف از فهرست موجودی را انتخاب کنید."
      />
    );
  const discrepancy = isInventoryDiscrepancy(item);
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="inventory-detail-title"
    >
      <div className="border-b border-border px-5 py-5">
        <p className="text-[10px] font-semibold tracking-[0.14em] text-warning">INVENTORY DETAIL</p>
        <h3 className="mt-2 text-lg font-semibold" id="inventory-detail-title">
          {item.productName}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {item.variantTitle ?? 'تنوع اصلی'} · {ltr(item.sku)}
        </p>
      </div>
      {detailQuery.isPending ? (
        <div className="p-5">
          <LoadingState label="در حال دریافت جزئیات موجودی..." />
        </div>
      ) : detailQuery.isError ? (
        <div className="p-5">
          <p className="text-xs text-destructive">
            {adminCatalogInventoryErrorMessage(detailQuery.error, 'جزئیات موجودی در دسترس نیست.')}
          </p>
          <Button className="mt-4" onClick={() => void detailQuery.refetch()} variant="outline">
            <Icon name="refresh" size={16} /> تلاش دوباره
          </Button>
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ['فیزیکی', item.onHand],
                ['رزروشده', item.reserved],
                ['قابل فروش', item.available],
                ['نقطه سفارش', item.reorderPoint],
              ] as const
            ).map(([label, value]) => (
              <div className="border border-border bg-background p-3" key={label}>
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="mt-2 text-lg font-semibold">{formatNumber(value)}</p>
              </div>
            ))}
          </div>
          {discrepancy ? (
            <p
              className="flex gap-2 border border-warning/30 bg-warning-soft px-3 py-3 text-xs leading-6 text-warning"
              role="alert"
            >
              <Icon className="mt-1 shrink-0" name="warning" size={15} />
              مغایرت داده: فیزیکی منهای رزروشده با قابل فروش برابر نیست.
            </p>
          ) : null}
          <p className="text-[10px] text-muted-foreground">
            آخرین تغییر: {formatDate(item.updatedAt)}
          </p>
          {canOperate ? (
            <>
              <form className="border-t border-border pt-5" onSubmit={onAdjust}>
                <h4 className="text-sm font-semibold">اصلاح موجودی</h4>
                <div className="mt-3 grid gap-3">
                  <label className="text-xs text-muted-foreground">
                    مقدار تغییر
                    <UiInput
                      className="mt-2 min-h-11 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      inputMode="numeric"
                      onChange={(event) => setDelta(event.target.value)}
                      placeholder="مثلاً 5 یا -2"
                      value={delta}
                    />
                  </label>
                  <label className="text-xs text-muted-foreground">
                    دلیل ثبت
                    <UiTextarea
                      className="mt-2 min-h-20 w-full border border-border bg-background px-3 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="دلیل عملیاتی تغییر..."
                      value={reason}
                    />
                  </label>
                  <Button loading={adjusting} type="submit">
                    <Icon name="rotate" size={16} /> ثبت اصلاح
                  </Button>
                </div>
              </form>
              <form className="border-t border-border pt-5" onSubmit={onReorder}>
                <h4 className="text-sm font-semibold">نقطه سفارش مجدد</h4>
                <label className="mt-3 block text-xs text-muted-foreground">
                  حداقل قابل سفارش
                  <UiInput
                    className="mt-2 min-h-11 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    dir="ltr"
                    inputMode="numeric"
                    onChange={(event) => setReorderPoint(event.target.value)}
                    value={reorderPoint}
                  />
                </label>
                <Button className="mt-3" loading={reordering} type="submit">
                  ذخیره نقطه سفارش
                </Button>
              </form>
            </>
          ) : (
            <p className="border border-border bg-background px-3 py-3 text-xs leading-6 text-muted-foreground">
              نقش فعلی فقط اجازه مشاهده دارد؛ ثبت اصلاح و نقطه سفارش برای عملیات یا مدیر فعال است.
            </p>
          )}
          <div className="border-t border-border pt-5">
            <h4 className="text-sm font-semibold">حرکت‌های اخیر</h4>
            {item.recentMovements?.length ? (
              <div className="mt-3 divide-y divide-border">
                {item.recentMovements.map((movement) => (
                  <div
                    className="flex items-center justify-between gap-3 py-3 text-xs"
                    key={movement.id}
                  >
                    <span>
                      <span className="block font-medium">{statusLabel(movement.type)}</span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {formatDate(movement.createdAt)}
                      </span>
                    </span>
                    <span
                      className={movement.quantity > 0 ? 'text-success' : 'text-destructive'}
                      dir="ltr"
                    >
                      {movement.quantity > 0 ? '+' : ''}
                      {formatNumber(movement.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">حرکت اخیری ثبت نشده است.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
