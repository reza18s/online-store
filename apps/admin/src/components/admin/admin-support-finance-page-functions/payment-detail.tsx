import { type AdminPaymentAttempt } from '@nova/api-client';

import type { QueryResult } from '../../../pages/admin/admin-support-finance-page-shared';

import { DetailField } from './detail-field';

import { LoadingRows } from './loading-rows';

import { StateCard } from './state-card';

import { StatusBadge } from './status-badge';

import { adminOrderHref } from './admin-order-href';

import { formatDate } from './format-date';

import { formatToman } from './format-toman';

import { ltr } from './ltr';

import { statusLabel } from './status-label';

export function PaymentDetail({ query }: { query: QueryResult<AdminPaymentAttempt> }) {
  if (query.isPending)
    return (
      <div className="mt-4">
        <LoadingRows />
      </div>
    );
  if (query.isError || !query.data) {
    return (
      <div className="mt-4">
        <StateCard
          icon="warning"
          title="جزئیات پرداخت در دسترس نیست"
          description="جزئیات این تلاش پرداخت قابل دریافت نیست؛ دوباره تلاش کنید."
          action="تلاش دوباره"
          onAction={() => void query.refetch()}
          role="alert"
        />
      </div>
    );
  }
  const payment = query.data;
  return (
    <section className="mt-5 border-t border-border pt-5" aria-labelledby="payment-detail-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="section-heading__eyebrow">PAYMENT / REDACTED DETAIL</span>
          <h3 className="mt-1 text-base" id="payment-detail-title">
            جزئیات تلاش پرداخت
          </h3>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailField label="شناسه تلاش">{ltr(payment.id, 'break-all')}</DetailField>
        <DetailField label="شماره سفارش">
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={adminOrderHref(payment.orderNumber)}
          >
            {ltr(payment.orderNumber)}
          </a>
        </DetailField>
        <DetailField label="شناسه تراکنش درگاه">
          {payment.providerTransactionId
            ? ltr(payment.providerTransactionId, 'break-all')
            : 'ثبت نشده'}
        </DetailField>
        <DetailField label="مبلغ">{formatToman(payment.amountToman)}</DetailField>
        <DetailField label="وضعیت سفارش">{statusLabel(payment.orderStatus)}</DetailField>
        <DetailField label="وضعیت پرداخت">{statusLabel(payment.paymentStatus)}</DetailField>
        <DetailField label="آخرین تغییر">{ltr(formatDate(payment.updatedAt))}</DetailField>
        <DetailField label="پرداخت موفق">{ltr(formatDate(payment.paidAt))}</DetailField>
      </dl>
      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-sm">بازپرداخت‌ها</h4>
        {payment.refunds.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            برای این تلاش بازپرداختی ثبت نشده است.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {payment.refunds.map((refund) => (
              <li
                className="rounded-control border border-border bg-background p-3 text-xs"
                key={refund.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{formatToman(refund.amountToman)}</span>
                  <StatusBadge status={refund.status} />
                </div>
                <p className="mt-2 text-muted-foreground">
                  شناسه بازپرداخت: {ltr(refund.id, 'break-all')}
                </p>
                <p className="mt-1 text-muted-foreground">
                  ثبت: {ltr(formatDate(refund.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
