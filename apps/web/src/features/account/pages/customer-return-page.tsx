import { useState, type FormEvent } from 'react';
import { type CustomerReturnReason } from '@nova/api-client';
import { Button, Checkbox, Select as UiSelect, Textarea as UiTextarea } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { useCurrentCustomer } from '@/features/auth/api/auth-api';
import { useCustomerOrder, useRequestCustomerOrderReturn } from '@/features/orders/api/orders-api';

import {
  apiErrorMessage,
  formatPersianDate,
  formatPersianNumber,
  formatToman,
  getReturnEligibility,
  isCustomerActive,
  isOfflineError,
  isUnauthorizedError,
  returnReasonCopy,
  refundStatusCopy,
  returnRequestStatusCopy,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '@/features/account/state/account-state';

import type { SubmittedCustomerOrder } from '@/features/account/pages/account-pages-shared';

import { EmptyState } from '@/features/account/components/empty-state';

import { LoadingState } from '@/features/account/components/loading-state';

import { OrderDetailError } from '@/features/account/components/order-detail-error';

import { PageFrame } from '@/features/account/pages/page-frame';

import { ReturnOrderState } from '@/features/account/components/return-order-state';

import { SessionState } from '@/features/account/components/session-state';

import { getSubmittedOrderForRoute } from '@/features/account/components/get-submitted-order-for-route';

import './customer-return-request.reference.css';

export function CustomerReturnPage({
  mode = 'request',
  orderNumber = '',
}: {
  mode?: 'request' | 'status';
  orderNumber?: string;
}) {
  const customerQuery = useCurrentCustomer();
  const active = isCustomerActive(customerQuery.data);
  const orderQuery = useCustomerOrder(orderNumber, active && Boolean(orderNumber));
  const returnMutation = useRequestCustomerOrderReturn();
  const [reason, setReason] = useState<CustomerReturnReason>('SIZE_PREFERENCE');
  const [note, setNote] = useState('');
  const [confirmed, setConfirmed] = useState({ unused: false, unwashed: false, tags: false });
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<SubmittedCustomerOrder>();
  const online = useOnlineStatus();
  useCustomerCacheBoundary(customerQuery.data?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending || (active && Boolean(orderNumber) && orderQuery.isPending))
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری درخواست بازگشت" rows={1} />
      </PageFrame>
    );
  if (customerQuery.isError)
    return (
      <OrderDetailError error={customerQuery.error} onRetry={() => void customerQuery.refetch()} />
    );
  if (!customerQuery.data || !active)
    return (
      <SessionState
        title="بازگشت کالا"
        description="برای پیگیری یا ثبت درخواست بازگشت ابتدا وارد حساب شوید."
      >
        <span />
      </SessionState>
    );
  if (!orderNumber)
    return (
      <PageFrame>
        <EmptyState
          title="یک سفارش را انتخاب کنید"
          description="درخواست بازگشت را از صفحه جزئیات همان سفارش شروع کنید تا اطلاعات واقعی سفارش بررسی شود."
          action="مشاهده سفارش‌ها"
          href="/account/orders"
        />
      </PageFrame>
    );
  if (orderQuery.isError || !orderQuery.data)
    return <OrderDetailError error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />;
  const currentSubmittedOrder = getSubmittedOrderForRoute(submittedOrder, orderNumber);
  const order = currentSubmittedOrder ?? orderQuery.data;
  if (mode === 'status')
    return order.returnRequest ? (
      <PageFrame>
        <section className="mx-auto max-w-2xl border border-border bg-surface p-8 shadow-card">
          <span className="section-heading__eyebrow">
            RETURNS / <span dir="ltr">{order.orderNumber}</span>
          </span>
          <h1 className="mt-3 text-2xl">وضعیت درخواست بازگشت</h1>
          <p className="mt-3 text-sm leading-8 text-muted-foreground">
            وضعیت فعلی درخواست شما:{' '}
            <strong className="text-foreground">
              {returnRequestStatusCopy[order.returnRequest.status]}
            </strong>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            ثبت درخواست: {formatPersianDate(order.returnRequest.requestedAt)}
          </p>
          <section
            className="mt-6 border-t border-border pt-5"
            aria-labelledby="refund-status-title"
          >
            <h2 id="refund-status-title" className="text-lg">
              وضعیت بازپرداخت
            </h2>
            {order.refunds.length > 0 ? (
              <div className="mt-3 grid gap-3">
                {order.refunds.map((refund) => (
                  <div
                    className="flex flex-wrap items-start justify-between gap-3 border border-border bg-background px-4 py-3"
                    key={refund.id}
                  >
                    <div>
                      <strong>{refundStatusCopy[refund.status]}</strong>
                      <p className="mt-1 text-sm text-muted-foreground">
                        مبلغ: {formatToman(refund.amountToman)}
                      </p>
                    </div>
                    <div className="text-left text-xs text-muted-foreground">
                      <p>ثبت: {formatPersianDate(refund.createdAt)}</p>
                      {refund.completedAt ? (
                        <p className="mt-1">تکمیل: {formatPersianDate(refund.completedAt)}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                هنوز رکورد بازپرداختی برای این سفارش از سرور دریافت نشده است.
              </p>
            )}
          </section>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href={`/order/${encodeURIComponent(order.orderNumber)}`}>مشاهده سفارش</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/support">تماس با پشتیبانی</a>
            </Button>
          </div>
        </section>
      </PageFrame>
    ) : (
      <ReturnOrderState order={order} orderNumber={orderNumber} />
    );
  const eligibility = getReturnEligibility(order);
  if (!eligibility.eligible) return <ReturnOrderState order={order} orderNumber={orderNumber} />;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    if (selectedItemIds.length === 0) {
      setFormError('حداقل یک کالا را برای بازگشت انتخاب کنید.');
      return;
    }
    if (!confirmed.unused || !confirmed.unwashed || !confirmed.tags) {
      setFormError('برای ثبت درخواست، شرایط سلامت و برچسب کالا را تأیید کنید.');
      return;
    }
    try {
      const result = await returnMutation.mutateAsync({
        orderNumber: order.orderNumber,
        input: {
          reason,
          note: note.trim() || null,
          unusedConfirmed: confirmed.unused,
          unwashedConfirmed: confirmed.unwashed,
          tagsAttachedConfirmed: confirmed.tags,
          items: order.items
            .filter((item) => selectedItemIds.includes(item.id))
            .map((item) => ({ orderItemId: item.id, quantity: item.quantity })),
        },
      });
      setSubmittedOrder({ routeOrderNumber: orderNumber, order: result });
    } catch (error) {
      setFormError(
        !online || isOfflineError(error)
          ? 'اتصال برقرار نیست؛ درخواست بازگشت ثبت نشد.'
          : apiErrorMessage(
              error,
              'ثبت درخواست بازگشت انجام نشد؛ وضعیت سفارش را دوباره بررسی کنید.',
            ),
      );
    }
  };
  return (
    <PageFrame className="nova-return-request-page">
      <div className="nova-return-request-shell">
        <aside className="nova-return-request-art" aria-label="NOVA returns">
          <img src="/assets/nova-women-lifestyle.webp" alt="استایل زنانه نوا" />
          <span aria-hidden="true" />
          <div>
            <strong>اعتماد شما برای ما ارزشمند است.</strong>
            <p>بازگشت آسان، تجربه‌ای مطمئن.</p>
            <small>NOVA</small>
          </div>
        </aside>

        <section className="nova-return-request-content">
          <header className="nova-return-request-header">
            <h1>درخواست بازگشت کالا</h1>
            <p>در چند مرحله، کالای خود را برای بازگشت ثبت کنید.</p>
            <a className="nova-return-request-cancel" href={`/order/${encodeURIComponent(order.orderNumber)}`}>
              انصراف
            </a>
          </header>

          <div className="nova-return-request-steps" aria-label="مراحل درخواست بازگشت">
            {[
              ['۱', 'انتخاب سفارش'],
              ['۲', 'انتخاب کالا'],
              ['۳', 'دلیل بازگشت'],
              ['۴', 'تکمیل اطلاعات'],
              ['۵', 'ارسال درخواست'],
            ].map(([n, label], index) => (
              <div className={index === 0 ? 'is-active' : ''} key={n}>
                <b>{n}</b>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <form className="nova-return-request-form" onSubmit={(event) => void submit(event)}>
            <section className="nova-return-request-form__left">
              <label className="nova-return-request-box">
                <strong>۱. انتخاب سفارش</strong>
                <span className="nova-return-request-select">
                  <UiSelect value={order.orderNumber} onChange={() => undefined}>
                    <option value={order.orderNumber}>
                      سفارش شماره {order.orderNumber}
                    </option>
                  </UiSelect>
                  <Icon name="chevron-down" size={16} />
                </span>
              </label>

              <fieldset className="nova-return-request-box">
                <legend>۲. انتخاب کالاهای قابل بازگشت</legend>
                <p>کالاهایی که قصد بازگشت آن‌ها را دارید انتخاب کنید.</p>
                <div className="nova-return-request-items">
                  {order.items.map((item, index) => {
                    const selected = selectedItemIds.includes(item.id);
                    return (
                      <label className={selected ? 'is-selected' : ''} key={item.id}>
                        <Checkbox
                          checked={selected}
                          onChange={(event) =>
                            setSelectedItemIds((current) =>
                              event.target.checked
                                ? [...current, item.id]
                                : current.filter((id) => id !== item.id),
                            )
                          }
                        />
                        <img
                          src={
                            index % 2 === 0
                              ? '/assets/nova-product-knit-cardigan.webp'
                              : '/assets/nova-hero-men.webp'
                          }
                          alt=""
                        />
                        <span>
                          <strong>{item.productName}</strong>
                          <small>
                            <span dir="ltr">{item.sku}</span> · {formatPersianNumber(item.quantity)} عدد
                          </small>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <aside className="nova-return-request-support">
                <Icon name="users" size={27} />
                <div><strong>سوالی دارید؟</strong><small>تیم پشتیبانی نوا همراه شماست.</small></div>
                <a href="/support">تماس با پشتیبانی</a>
              </aside>
            </section>

            <section className="nova-return-request-form__right">
              <label className="nova-return-request-box">
                <strong>۳. دلیل بازگشت</strong>
                <span className="nova-return-request-select">
                  <UiSelect
                    value={reason}
                    onChange={(event) => setReason(event.target.value as CustomerReturnReason)}
                  >
                    {(Object.entries(returnReasonCopy) as Array<[CustomerReturnReason, string]>).map(
                      ([value, label]) => <option key={value} value={value}>{label}</option>,
                    )}
                  </UiSelect>
                  <Icon name="chevron-down" size={16} />
                </span>
              </label>

              <label className="nova-return-request-box">
                <strong>۴. توضیحات تکمیلی (اختیاری)</strong>
                <UiTextarea
                  rows={4}
                  maxLength={500}
                  placeholder="توضیحات خود را در اینجا بنویسید..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
                <small>{formatPersianNumber(note.length)} / ۵۰۰</small>
              </label>

              <fieldset className="nova-return-request-box nova-return-request-conditions">
                <legend>۵. تأیید شرایط بازگشت</legend>
                {(
                  [
                    ['unused', 'کالا استفاده نشده است.'],
                    ['unwashed', 'کالا شسته نشده است.'],
                    ['tags', 'برچسب کالا متصل است.'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key}>
                    <Checkbox
                      checked={confirmed[key]}
                      onChange={(event) =>
                        setConfirmed((current) => ({ ...current, [key]: event.target.checked }))
                      }
                    />
                    {label}
                  </label>
                ))}
              </fieldset>

              {formError ? <p className="nova-return-request-message is-error" role="alert">{formError}</p> : null}
              {currentSubmittedOrder?.returnRequest ? (
                <p className="nova-return-request-message is-success" role="status">
                  درخواست بازگشت ثبت شد و اکنون در وضعیت «
                  {returnRequestStatusCopy[currentSubmittedOrder.returnRequest.status]}» قرار دارد.
                </p>
              ) : null}

              <Button
                className="nova-return-request-submit"
                disabled={returnMutation.isPending || Boolean(currentSubmittedOrder?.returnRequest)}
                loading={returnMutation.isPending}
                type="submit"
              >
                {returnMutation.isPending ? 'در حال ثبت...' : 'ارسال درخواست بازگشت'}
                <Icon name="arrow-left" size={16} />
              </Button>
            </section>
          </form>
        </section>

        <aside className="nova-return-request-sidebar" aria-label="حساب کاربری">
          <div className="nova-return-request-sidebar__profile">
            <img src="/assets/nova-women-lifestyle.webp" alt="" />
            <strong>{customerQuery.data.email ?? 'مشتری نوا'}</strong>
            <span dir="ltr">{customerQuery.data.phone}</span>
          </div>
          <nav>
            <a href="/account"><Icon name="home" size={17} /> داشبورد حساب</a>
            <a href="/account/profile"><Icon name="user" size={17} /> اطلاعات شخصی</a>
            <a href="/account/orders" className="is-active"><Icon name="bag" size={17} /> سفارش‌های من</a>
            <a href="/return" className="is-active-soft"><Icon name="rotate" size={17} /> درخواست‌های بازگشت</a>
            <a href="/account/addresses"><Icon name="home" size={17} /> آدرس‌ها</a>
            <a href="/support"><Icon name="users" size={17} /> پشتیبانی</a>
          </nav>
          <a href="/returns-policy" className="nova-return-request-sidebar__promo">
            <img src="/assets/nova-home-mobile-story.webp" alt="" />
            <span aria-hidden="true" />
            <div><strong>زیبایی در انتخاب آگاهانه</strong><small>مشاهده راهنما</small></div>
          </a>
        </aside>
      </div>
    </PageFrame>
  );
}
