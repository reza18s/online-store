import { useState, type FormEvent } from 'react';
import { type CustomerReturnReason } from '@nova/api-client';
import { Button, Checkbox, Select as UiSelect, Textarea as UiTextarea } from '@nova/ui';

import { useCurrentCustomer } from '../../../lib/auth/auth-api';
import { useCustomerOrder, useRequestCustomerOrderReturn } from '../../../lib/orders/orders-api';

import {
  apiErrorMessage,
  formatPersianDate,
  formatPersianNumber,
  getReturnEligibility,
  isCustomerActive,
  isOfflineError,
  isUnauthorizedError,
  returnReasonCopy,
  returnRequestStatusCopy,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '../../../lib/account/account-state';

import type { SubmittedCustomerOrder } from '../account-pages-shared';

import { EmptyState } from '../../../components/account/account-pages-functions/empty-state';

import { LoadingState } from '../../../components/account/account-pages-functions/loading-state';

import { OrderDetailError } from '../../../components/account/account-pages-functions/order-detail-error';

import { PageFrame } from './page-frame';

import { ReturnOrderState } from '../../../components/account/account-pages-functions/return-order-state';

import { SessionState } from '../../../components/account/account-pages-functions/session-state';

import { getSubmittedOrderForRoute } from '../../../components/account/account-pages-functions/get-submitted-order-for-route';

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
          href="#account/orders"
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
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>مشاهده سفارش</a>
            </Button>
            <Button asChild variant="outline">
              <a href="#support">تماس با پشتیبانی</a>
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
    <PageFrame>
      <div className="breadcrumb">
        <a href="#account/orders">سفارش‌ها</a>
        <span>/</span>
        <span>درخواست بازگشت</span>
      </div>
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">NOVA / RETURNS</span>
        <h1>درخواست بازگشت کالا</h1>
        <p>
          سفارش <span dir="ltr">{order.orderNumber}</span> · مهلت بازگشت از تاریخ تحویل توسط سرور
          بررسی می‌شود.
        </p>
      </header>
      <form
        className="mx-auto max-w-3xl border border-border bg-surface p-6 shadow-card md:p-8"
        onSubmit={(event) => void submit(event)}
      >
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">کالاهای موردنظر</legend>
          {order.items.map((item) => {
            const selected = selectedItemIds.includes(item.id);
            return (
              <label className={`option-card ${selected ? 'is-selected' : ''}`} key={item.id}>
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
                <span>
                  <strong>{item.productName}</strong>
                  <small>
                    <span dir="ltr">{item.sku}</span> · {formatPersianNumber(item.quantity)} عدد
                  </small>
                </span>
                <span className="text-xs text-muted-foreground">کل این قلم</span>
              </label>
            );
          })}
        </fieldset>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
          دلیل بازگشت
          <UiSelect
            className="min-h-12 border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            value={reason}
            onChange={(event) => setReason(event.target.value as CustomerReturnReason)}
          >
            {(Object.entries(returnReasonCopy) as Array<[CustomerReturnReason, string]>).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </UiSelect>
        </label>
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium">
          توضیحات تکمیلی
          <UiTextarea
            className="border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-accent-soft"
            rows={4}
            maxLength={500}
            placeholder="اگر نکته‌ای درباره درخواست خود دارید، اینجا بنویسید."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <fieldset className="mt-4 grid gap-2 text-sm text-muted-foreground">
          <legend className="font-medium text-foreground">تأیید شرایط بازگشت</legend>
          {(
            [
              ['unused', 'کالا استفاده نشده است.'],
              ['unwashed', 'کالا شسته نشده است.'],
              ['tags', 'برچسب کالا متصل است.'],
            ] as const
          ).map(([key, label]) => (
            <label className="flex min-h-11 items-center gap-2" key={key}>
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
        {formError ? (
          <p
            className="mt-4 border border-warning bg-warning-100 px-4 py-3 text-sm text-warning"
            role="alert"
          >
            {formError}
          </p>
        ) : null}
        {currentSubmittedOrder?.returnRequest ? (
          <p
            className="mt-4 border border-success bg-success-100 px-4 py-3 text-sm text-success"
            role="status"
          >
            درخواست بازگشت ثبت شد و اکنون در وضعیت «
            {returnRequestStatusCopy[currentSubmittedOrder.returnRequest.status]}» قرار دارد.
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={returnMutation.isPending || Boolean(currentSubmittedOrder?.returnRequest)}
            loading={returnMutation.isPending}
            size="lg"
            type="submit"
          >
            {returnMutation.isPending ? 'در حال ثبت...' : 'ثبت درخواست بازگشت'}
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={`#order/${encodeURIComponent(order.orderNumber)}`}>انصراف</a>
          </Button>
        </div>
      </form>
    </PageFrame>
  );
}
