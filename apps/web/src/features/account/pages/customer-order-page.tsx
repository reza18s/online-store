import { useState, type FormEvent } from 'react';

import { Button, Textarea as UiTextarea } from '@nova/ui';

import { useCurrentCustomer } from '@/features/auth/api/auth-api';
import { useCancelCustomerOrder, useCustomerOrder } from '@/features/orders/api/orders-api';
import { Icon } from '@/shared/ui/icon';
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
} from '@/features/account/state/account-state';

import { LoadingState } from '@/features/account/components/loading-state';

import { OrderDetailError } from '@/features/account/components/order-detail-error';

import { PageFrame } from '@/features/account/pages/page-frame';

import { SessionState } from '@/features/account/components/session-state';

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
        <a href="/account/orders">سفارش‌ها</a>
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
      <section className="timeline-card nova-order-timeline">
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
      <div className="nova-customer-order-layout">
        <section className="nova-order-card nova-order-items" aria-labelledby="order-items-title">
          <header>
            <h2 id="order-items-title">اقلام سفارش</h2>
            <span>{order.items.length} کالا</span>
          </header>
          {order.items.length ? (
            <div className="nova-order-items__list">
              {order.items.map((item) => (
                <article className="nova-order-item" key={item.id}>
                  <div className="nova-order-item__media" aria-hidden="true">
                    <Icon name="shirt" size={24} />
                  </div>
                  <div className="nova-order-item__copy">
                    <h3>{item.productName}</h3>
                    <p>
                      {item.quantity} عدد · هر عدد {formatToman(item.unitPriceToman)}
                    </p>
                  </div>
                  <strong>{formatToman(item.totalToman)}</strong>
                </article>
              ))}
            </div>
          ) : (
            <p className="nova-order-empty">جزئیات اقلام این سفارش در دسترس نیست.</p>
          )}
        </section>

        <section className="nova-order-card nova-order-totals" aria-labelledby="order-total-title">
          <h2 id="order-total-title">خلاصه مالی</h2>
          <dl>
            <div>
              <dt>جمع کالاها</dt>
              <dd>{formatToman(order.subtotalToman)}</dd>
            </div>
            {order.discountToman > 0 ? (
              <div className="is-discount">
                <dt>تخفیف</dt>
                <dd>−{formatToman(order.discountToman)}</dd>
              </div>
            ) : null}
            <div>
              <dt>هزینه ارسال</dt>
              <dd>{order.shippingToman > 0 ? formatToman(order.shippingToman) : 'رایگان'}</dd>
            </div>
            {order.taxToman > 0 ? (
              <div>
                <dt>مالیات</dt>
                <dd>{formatToman(order.taxToman)}</dd>
              </div>
            ) : null}
            <div className="nova-order-totals__grand">
              <dt>مبلغ پرداخت‌شده</dt>
              <dd>{formatToman(order.totalToman)}</dd>
            </div>
          </dl>
          <p>
            وضعیت پرداخت:{' '}
            {order.paymentStatus === 'PAID'
              ? 'پرداخت شده'
              : order.paymentStatus === 'REFUNDED'
                ? 'بازپرداخت شده'
                : order.paymentStatus === 'FAILED'
                  ? 'ناموفق'
                  : 'در انتظار'}
          </p>
        </section>

        <div className="nova-order-details">
          <section className="nova-order-card" aria-labelledby="order-address-title">
            <h2 id="order-address-title">
              <Icon name="home" size={17} /> اطلاعات ارسال
            </h2>
            {order.address ? (
              <>
                <strong>{order.address.recipientName}</strong>
                <p>
                  {order.address.province}، {order.address.city}، {order.address.addressLine}
                </p>
                <p dir="ltr">{order.address.phone}</p>
                <small>کد پستی: {order.address.postalCode}</small>
              </>
            ) : (
              <p>آدرس تحویل برای این سفارش ثبت نشده است.</p>
            )}
          </section>

          <section className="nova-order-card" aria-labelledby="order-payment-title">
            <h2 id="order-payment-title">
              <Icon name="check" size={17} /> روش پرداخت
            </h2>
            <strong>
              {order.paymentStatus === 'PAID'
                ? 'پرداخت موفق'
                : order.paymentStatus === 'REFUNDED'
                  ? 'بازپرداخت شده'
                  : order.paymentStatus === 'FAILED'
                    ? 'پرداخت ناموفق'
                    : 'در انتظار پرداخت'}
            </strong>
            <p>{formatToman(order.payment?.amountToman ?? order.totalToman)}</p>
            {order.payment?.paidAt ? (
              <small>پرداخت در {formatPersianDate(order.payment.paidAt)}</small>
            ) : null}
            {order.refunds.map((refund) => (
              <small key={refund.id}>
                بازپرداخت {formatToman(refund.amountToman)} ·{' '}
                {refund.status === 'SUCCEEDED'
                  ? 'موفق'
                  : refund.status === 'FAILED'
                    ? 'ناموفق'
                    : 'در انتظار'}
              </small>
            ))}
          </section>

          <section className="nova-order-card" aria-labelledby="order-shipment-title">
            <h2 id="order-shipment-title">
              <Icon name="truck" size={17} /> اطلاعات مرسوله
            </h2>
            {order.shipment ? (
              <>
                <strong>{order.shipment.method}</strong>
                <p>{order.shipment.provider}</p>
                <small>
                  {order.shipment.trackingReference ? (
                    <>
                      کد رهگیری: <bdi dir="ltr">{order.shipment.trackingReference}</bdi>
                    </>
                  ) : (
                    'کد رهگیری هنوز ثبت نشده است.'
                  )}
                </small>
                {order.shipment.deliveredAt ? (
                  <small>تحویل در {formatPersianDate(order.shipment.deliveredAt)}</small>
                ) : null}
              </>
            ) : (
              <p>اطلاعات مرسوله پس از آماده‌سازی سفارش نمایش داده می‌شود.</p>
            )}
          </section>
        </div>

        <div className="nova-customer-order__actions">
          {canCancelCustomerOrder(order) ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCancelOpen((current) => !current);
                setCancelError('');
              }}
            >
              لغو سفارش
            </Button>
          ) : null}
          {order.returnRequest ? (
            <a
              className="text-link"
              href={`/return/status?orderNumber=${encodeURIComponent(order.orderNumber)}`}
            >
              مشاهده وضعیت بازگشت و بازپرداخت <Icon name="arrow-left" size={15} />
            </a>
          ) : eligibility.eligible ? (
            <a
              className="text-link"
              href={`/return/request?orderNumber=${encodeURIComponent(order.orderNumber)}`}
            >
              درخواست بازگشت کالا <Icon name="arrow-left" size={15} />
            </a>
          ) : order.status === 'DELIVERED' ? (
            <p className="nova-order-return-note">
              {eligibility.reason === 'expired'
                ? 'مهلت هفت‌روزه بازگشت این سفارش تمام شده است.'
                : 'این سفارش در حال حاضر شرایط بازگشت را ندارد.'}
            </p>
          ) : null}
          <a className="text-link" href="/support">
            تماس با پشتیبانی <Icon name="arrow-left" size={15} />
          </a>
        </div>
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
