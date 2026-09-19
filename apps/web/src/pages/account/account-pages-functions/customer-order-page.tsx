import { useState, type FormEvent } from 'react';

import { Button, Textarea as UiTextarea } from '@nova/ui';

import { useCurrentCustomer } from '../../../lib/auth/auth-api';
import { useCancelCustomerOrder, useCustomerOrder } from '../../../lib/orders/orders-api';
import { Icon } from '../../../components/ui/icon';
import {
  apiErrorMessage,
  canCancelCustomerOrder,
  formatPersianDate,
  formatToman,
  getReturnEligibility,
  isCustomerActive,
  isUnauthorizedError,
  orderStatusCopy,
  shouldShowCustomerOrderLoading,
  useCustomerCacheBoundary,
} from '../../../lib/account/account-state';

import { LoadingState } from '../../../components/account/account-pages-functions/loading-state';

import { OrderDetailError } from '../../../components/account/account-pages-functions/order-detail-error';

import { PageFrame } from './page-frame';

import { SessionState } from '../../../components/account/account-pages-functions/session-state';

export function CustomerOrderPage({ orderNumber }: { orderNumber: string }) {
  const customerQuery = useCurrentCustomer();
  const orderQuery = useCustomerOrder(
    orderNumber,
    isCustomerActive(customerQuery.data) && Boolean(orderNumber),
  );
  const cancelMutation = useCancelCustomerOrder();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  useCustomerCacheBoundary(customerQuery.data?.id, isUnauthorizedError(customerQuery.error));

  if (
    shouldShowCustomerOrderLoading({
      customerPending: customerQuery.isPending,
      customerActive: isCustomerActive(customerQuery.data),
      hasOrderNumber: Boolean(orderNumber),
      orderPending: orderQuery.isPending,
    })
  )
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری سفارش" rows={2} />
      </PageFrame>
    );
  if (customerQuery.isError)
    return (
      <OrderDetailError error={customerQuery.error} onRetry={() => void customerQuery.refetch()} />
    );
  if (!customerQuery.data || !isCustomerActive(customerQuery.data))
    return (
      <SessionState
        title="جزئیات سفارش"
        description="برای مشاهده جزئیات سفارش ابتدا وارد حساب شوید."
      >
        <span />
      </SessionState>
    );
  if (orderQuery.isError || !orderQuery.data)
    return <OrderDetailError error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />;
  const order = orderQuery.data;
  const events = order.events.length
    ? order.events
    : [{ fromStatus: null, toStatus: order.status, createdAt: order.updatedAt }];
  const eligibility = getReturnEligibility(order);
  const submitCancel = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCancelError('');
    if (!cancelReason.trim()) {
      setCancelError('دلیل لغو را وارد کنید.');
      return;
    }
    try {
      await cancelMutation.mutateAsync({
        orderNumber: order.orderNumber,
        input: { reason: cancelReason.trim() },
      });
      setCancelOpen(false);
      setCancelSuccess(true);
    } catch (error) {
      setCancelError(
        apiErrorMessage(error, 'لغو سفارش انجام نشد؛ وضعیت سفارش را دوباره بررسی کنید.'),
      );
    }
  };
  return (
    <PageFrame className="order-page">
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span dir="ltr">{order.orderNumber}</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">
          ORDER / <span dir="ltr">{order.orderNumber}</span>
        </span>
        <h1>پیگیری سفارش</h1>
        <p>
          {orderStatusCopy[order.status]} · ثبت‌شده در {formatPersianDate(order.createdAt)}
        </p>
      </header>
      {cancelSuccess ? (
        <p
          className="mb-4 border border-success bg-success-100 px-4 py-3 text-sm text-success"
          role="status"
        >
          درخواست لغو سفارش ثبت شد؛ وضعیت و بازپرداخت فقط از پاسخ سرور پیروی می‌کند.
        </p>
      ) : null}
      <div className="order-layout lg:grid">
        <section className="timeline-card">
          <h2>مسیر سفارش</h2>
          {events.map((event, index) => (
            <div className="timeline-event is-done" key={`${event.createdAt}-${index}`}>
              <span className="timeline-event__dot">
                <Icon name="check" size={14} />
              </span>
              <div>
                <strong>
                  {index === 0
                    ? 'سفارش ثبت شد'
                    : event.toStatus
                      ? orderStatusCopy[event.toStatus]
                      : 'به‌روزرسانی سفارش'}
                </strong>
                <small>{formatPersianDate(event.createdAt)}</small>
              </div>
            </div>
          ))}
          {order.shipment ? (
            <div className="timeline-event is-done">
              <span className="timeline-event__dot">
                <Icon name="truck" size={14} />
              </span>
              <div>
                <strong>
                  وضعیت ارسال:{' '}
                  {order.shipment.status === 'DELIVERED'
                    ? 'تحویل شده'
                    : order.shipment.status === 'SHIPPED'
                      ? 'ارسال شده'
                      : 'در حال آماده‌سازی'}
                </strong>
                <small>
                  {order.shipment.trackingReference ? (
                    <span dir="ltr">{order.shipment.trackingReference}</span>
                  ) : (
                    'کد رهگیری هنوز ثبت نشده است'
                  )}
                </small>
              </div>
            </div>
          ) : null}
        </section>
        <aside className="summary-card">
          <span className="section-heading__eyebrow">تحویل به</span>
          <h2>{order.address?.recipientName ?? 'آدرس ثبت نشده'}</h2>
          <p>
            {order.address
              ? `${order.address.province}، ${order.address.city}، ${order.address.addressLine}`
              : 'آدرس تحویل برای این سفارش ثبت نشده است.'}
          </p>
          {order.address ? <p dir="ltr">{order.address.phone}</p> : null}
          {order.shipment?.trackingReference ? (
            <p>
              کد رهگیری: <span dir="ltr">{order.shipment.trackingReference}</span>
            </p>
          ) : null}
          <div className="summary-card__total">
            <span>مبلغ سفارش</span>
            <strong>{formatToman(order.totalToman)}</strong>
          </div>
          <p className="text-sm text-muted-foreground">
            وضعیت پرداخت:{' '}
            {order.paymentStatus === 'PAID'
              ? 'پرداخت شده'
              : order.paymentStatus === 'REFUNDED'
                ? 'بازپرداخت شده'
                : order.paymentStatus === 'FAILED'
                  ? 'ناموفق'
                  : 'در انتظار'}
          </p>
          {canCancelCustomerOrder(order) ? (
            <Button
              className="mt-4 min-h-11 text-sm text-destructive underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              type="button"
              onClick={() => {
                setCancelOpen((current) => !current);
                setCancelError('');
              }}
            >
              لغو سفارش
            </Button>
          ) : null}
          {eligibility.eligible ? (
            <a
              className="text-link"
              href={`#return/request?orderNumber=${encodeURIComponent(order.orderNumber)}`}
            >
              درخواست بازگشت کالا <Icon name="arrow-left" size={15} />
            </a>
          ) : order.status === 'DELIVERED' ? (
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              {eligibility.reason === 'expired'
                ? 'مهلت هفت‌روزه بازگشت این سفارش تمام شده است.'
                : 'این سفارش در حال حاضر شرایط بازگشت را ندارد.'}
            </p>
          ) : null}
        </aside>
      </div>
      {cancelOpen && canCancelCustomerOrder(order) ? (
        <form
          className="mx-auto mt-5 max-w-2xl border border-warning bg-surface p-5 shadow-card"
          onSubmit={(event) => void submitCancel(event)}
        >
          <h2>لغو سفارش</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            این درخواست توسط سرور بررسی می‌شود. اگر پرداخت انجام شده باشد، بازپرداخت نیز از همان
            مسیر پیگیری خواهد شد.
          </p>
          <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
            دلیل لغو
            <UiTextarea
              className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
              rows={3}
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              maxLength={500}
            />
          </label>
          {cancelError ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {cancelError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="submit"
              variant="destructive"
              disabled={cancelMutation.isPending}
              loading={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'در حال ثبت...' : 'تأیید لغو سفارش'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              انصراف
            </Button>
          </div>
        </form>
      ) : null}
    </PageFrame>
  );
}
