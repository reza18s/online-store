import { type CustomerOrderDetail } from '@nova/api-client';

import {
  formatPersianNumber,
  getReturnEligibility,
  getReturnOrderState,
  returnRequestStatusCopy,
} from '../../../lib/account/account-state';

import { EmptyState } from './empty-state';

import { PageFrame } from '../../../pages/account/account-pages-functions/page-frame';

export function ReturnOrderState({
  order,
  orderNumber,
}: {
  order: CustomerOrderDetail;
  orderNumber: string;
}) {
  const state = getReturnOrderState(order);
  const eligibility = getReturnEligibility(order);
  if (state === 'requested' && order.returnRequest)
    return (
      <PageFrame>
        <EmptyState
          title="درخواست بازگشت این سفارش ثبت شده است"
          description={`وضعیت فعلی درخواست: ${returnRequestStatusCopy[order.returnRequest.status]}`}
          action="مشاهده سفارش"
          href={`#order/${encodeURIComponent(order.orderNumber)}`}
        />
      </PageFrame>
    );
  if (state === 'ineligible')
    return (
      <PageFrame>
        <EmptyState
          title={
            eligibility.reason === 'expired'
              ? 'مهلت بازگشت تمام شده است'
              : 'این سفارش قابل بازگشت نیست'
          }
          description={
            eligibility.reason === 'not-delivered'
              ? 'درخواست بازگشت فقط پس از تحویل سفارش امکان‌پذیر است.'
              : eligibility.reason === 'payment-unconfirmed' ||
                  eligibility.reason === 'shipment-unconfirmed'
                ? 'وضعیت پرداخت و تحویل باید توسط سرور تأیید شود.'
                : eligibility.reason === 'missing-delivery-date' ||
                    eligibility.reason === 'delivery-date-in-future'
                  ? 'تاریخ تحویل معتبر نیست؛ برای بررسی با پشتیبانی تماس بگیرید.'
                  : `مهلت بازگشت این سفارش ${formatPersianNumber(7)} روز پس از تحویل است.`
          }
          action="مشاهده سفارش"
          href={`#order/${encodeURIComponent(orderNumber)}`}
        />
      </PageFrame>
    );
  return (
    <PageFrame>
      <EmptyState
        title="هنوز درخواست بازگشتی ثبت نشده است"
        description="این سفارش شرایط بازگشت را دارد. برای شروع، درخواست بازگشت کالا را ثبت کنید."
        action="ثبت درخواست بازگشت"
        href={`#return/request?orderNumber=${encodeURIComponent(orderNumber)}`}
        icon="package"
      />
    </PageFrame>
  );
}
