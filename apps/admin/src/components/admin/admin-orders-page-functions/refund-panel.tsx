import { type AdminOrderDetail } from '@nova/api-client';

import { REFUND_STATUS_LABELS } from '../../../pages/admin/admin-orders-page-shared';

import { PanelHeading } from './panel-heading';

import { StatusChip } from './status-chip';

import { adminPaymentAttemptStatusLabel } from './admin-payment-attempt-status-label';

import { formatDate } from './format-date';

import { formatToman } from './format-toman';

export function RefundPanel({
  refunds,
  payment,
}: {
  refunds: AdminOrderDetail['refunds'];
  payment: AdminOrderDetail['payment'];
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-refund-title"
    >
      <PanelHeading icon="rotate" title="بازپرداخت‌ها" id="admin-order-refund-title" />
      {refunds.length ? (
        <div className="divide-y divide-border">
          {refunds.map((refund) => (
            <div className="space-y-2 p-4 md:p-5" key={refund.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{formatToman(refund.amountToman)}</span>
                <StatusChip
                  label={REFUND_STATUS_LABELS[refund.status] ?? refund.status}
                  status={refund.status}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
                <span>{formatDate(refund.createdAt)}</span>
                <span dir="ltr">شناسه داخلی: {refund.id}</span>
              </div>
              {refund.reason ? (
                <p className="text-xs leading-6 text-muted-foreground">دلیل: {refund.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">بازپرداختی برای این سفارش ثبت نشده است.</p>
          {payment ? (
            <p className="mt-2 text-xs text-muted-foreground">
              وضعیت تلاش پرداخت: {adminPaymentAttemptStatusLabel(payment.status)}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
