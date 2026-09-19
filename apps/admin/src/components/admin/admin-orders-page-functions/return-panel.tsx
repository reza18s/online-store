import { type AdminOrderDetail, type AdminReturnReviewStatus } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import {
  RETURN_REVIEW_OPTIONS,
  RETURN_STATUS_LABELS,
} from '../../../pages/admin/admin-orders-page-shared';

import { PanelHeading } from './panel-heading';

import { StatusChip } from './status-chip';

import { formatDate } from './format-date';

export function ReturnPanel({
  request,
  canReview,
  onReview,
}: {
  request: AdminOrderDetail['returnRequest'];
  canReview: boolean;
  onReview: (target: AdminReturnReviewStatus) => void;
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
          </dl>
          <div className="grid gap-2">
            {RETURN_REVIEW_OPTIONS.map(([status, label]) => (
              <Button
                disabled={
                  !canReview ||
                  request.status === status ||
                  (request.status !== 'REQUESTED' && status !== 'RECEIVED')
                }
                key={status}
                onClick={() => onReview(status)}
                size="sm"
                variant={status === 'RECEIVED' ? 'primary' : 'outline'}
              >
                {label}
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
