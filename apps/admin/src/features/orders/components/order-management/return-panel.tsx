import { type AdminOrderDetail, type AdminReturnReviewStatus } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import {
  canReviewReturnStatus,
  RETURN_REVIEW_OPTIONS,
  RETURN_STATUS_LABELS,
} from '@/features/orders/pages/admin-orders-page-shared';

import { PanelHeading } from '@/features/orders/components/order-management/panel-heading';

import { StatusChip } from '@/features/orders/components/order-management/status-chip';

import { formatDate } from '@/features/orders/components/order-management/format-date';

import { formatSnapshot } from '@/features/orders/components/order-management/format-snapshot';

export function ReturnPanel({
  request,
  canReview,
  onReview,
  orderItems,
}: {
  request: AdminOrderDetail['returnRequest'];
  canReview: boolean;
  onReview: (target: AdminReturnReviewStatus) => void;
  orderItems: AdminOrderDetail['items'];
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-return-title"
    >
      <PanelHeading icon="rotate" title="بررسی بازگشت" id="admin-order-return-title" />
      {request ? (
        <div className="space-y-4 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">وضعیت درخواست</span>
            <StatusChip
              label={RETURN_STATUS_LABELS[request.status] ?? request.status}
              status={request.status}
            />
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">دلیل</dt>
              <dd>{request.reason}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">درخواست در</dt>
              <dd>{formatDate(request.requestedAt)}</dd>
            </div>
            {request.reviewedAt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">بررسی در</dt>
                <dd>{formatDate(request.reviewedAt)}</dd>
              </div>
            ) : null}
            {request.receivedAt ? (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">دریافت در</dt>
                <dd>{formatDate(request.receivedAt)}</dd>
              </div>
            ) : null}
          </dl>
          {request.note ? (
            <div className="border border-border bg-background p-3 text-xs leading-6">
              <strong className="block text-[11px]">یادداشت مشتری</strong>
              <p className="mt-1 text-muted-foreground">{request.note}</p>
            </div>
          ) : null}
          <div>
            <h3 className="text-xs font-medium">اقلام درخواست بازگشت</h3>
            <ul className="mt-2 divide-y divide-border border border-border">
              {request.items.map((returnItem) => {
                const orderItem = orderItems.find((item) => item.id === returnItem.orderItemId);
                return (
                  <li className="space-y-1 p-3 text-xs" key={returnItem.orderItemId}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-medium">
                        {orderItem?.productName ?? `قلم ${returnItem.orderItemId}`}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        تعداد: {formatPersianNumber(returnItem.quantity)}
                      </span>
                    </div>
                    {orderItem ? (
                      <>
                        <span className="block text-[10px] text-muted-foreground" dir="ltr">
                          SKU: {orderItem.sku}
                        </span>
                        <span className="block text-[10px] text-primary">
                          {formatSnapshot(orderItem.variantSnapshot)}
                        </span>
                      </>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="grid gap-2">
            {RETURN_REVIEW_OPTIONS.map(([status, label]) => (
              <Button
                disabled={
                  !canReview ||
                  !canReviewReturnStatus(request.status, status)
                }
                key={status}
                onClick={() => onReview(status)}
                size="sm"
                variant={status === 'RECEIVED' ? 'primary' : 'outline'}
              >
                {request.status === 'RECEIVED' && status === 'RECEIVED'
                  ? 'تلاش دوباره بازپرداخت'
                  : label}
              </Button>
            ))}
          </div>
          {!canReview ? (
            <p className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
              <Icon name="info" size={15} />
              نقش فعلی اجازه بررسی درخواست بازگشت را ندارد.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="p-5 text-sm leading-7 text-muted-foreground">
          برای این سفارش درخواست بازگشتی ثبت نشده است.
        </p>
      )}
    </section>
  );
}
