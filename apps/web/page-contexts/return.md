# Page Context

## Page

**Path:** `src/features/account/pages/customer-return-page.tsx`

```tsx
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
                  {order.items.map((item) => {
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
                        <span className="nova-return-request-item__media" aria-hidden="true">
                          <Icon name="shirt" size={22} />
                        </span>
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

```

---

## Custom Components


### 1. Button

**Path:** `../../packages/ui/src/button.tsx`

```tsx
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

import { cn } from './cn';

export const buttonVariants = cva(
  'nova-button inline-flex min-h-11 items-center justify-center gap-2 rounded-pill border border-transparent px-4 text-center text-sm font-semibold leading-5 transition-[background-color,border-color,color,transform] duration-[140ms] ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:border-border disabled:bg-secondary disabled:text-muted-foreground disabled:opacity-100 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:translate-y-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-foreground',
        secondary: 'bg-secondary text-foreground hover:bg-accent-soft hover:text-primary-hover',
        outline:
          'border-primary bg-transparent text-primary hover:border-primary-hover hover:bg-accent-soft hover:text-primary-hover',
        ghost: 'bg-transparent text-foreground hover:bg-secondary',
        destructive: 'bg-destructive text-primary-foreground hover:bg-destructive-hover',
      },
      size: {
        sm: 'min-h-11 px-3 text-[13px]',
        md: 'min-h-12',
        lg: 'min-h-[52px] px-5',
        icon: 'h-11 min-h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled = false,
      'aria-busy': ariaBusy,
      'aria-disabled': ariaDisabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;

    return (
      <Component
        aria-busy={loading || ariaBusy || undefined}
        aria-disabled={isDisabled || ariaDisabled || undefined}
        className={cn(buttonVariants({ variant, size, className }))}
        data-loading={loading ? 'true' : undefined}
        disabled={asChild ? disabled : isDisabled}
        ref={ref}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-e-transparent motion-reduce:animate-none"
          />
        ) : null}
        {asChild ? <Slottable>{children}</Slottable> : children}
      </Component>
    );
  },
);

Button.displayName = 'Button';

```

---


### 2. Checkbox

**Path:** `../../packages/ui/src/checkbox.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      className={cn(
        'nova-checkbox h-5 w-5 shrink-0 accent-primary align-middle transition-[background-color,border-color,box-shadow] duration-[140ms] checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
        className,
      )}
    />
  ),
);

Checkbox.displayName = 'Checkbox';

```

---


### 3. Select

**Path:** `../../packages/ui/src/select.tsx`

```tsx
import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from './cn';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'nova-select flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
      className,
    )}
    {...props}
  />
));

Select.displayName = 'Select';

```

---


### 4. Textarea

**Path:** `../../packages/ui/src/textarea.tsx`

```tsx
import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

import { cn } from './cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'nova-textarea min-h-28 w-full resize-y rounded-control border border-border bg-background px-3 py-3 text-sm leading-7 text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';

```

---


### 5. EmptyState

**Path:** `src/features/account/components/empty-state.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

export function EmptyState({
  title,
  description,
  action,
  href = '/',
  onAction,
  icon = 'layers',
}: {
  title: string;
  description: string;
  action: string;
  href?: string;
  onAction?: () => void;
  icon?: 'layers' | 'user' | 'warning' | 'refresh' | 'package';
}) {
  return (
    <section className="empty-state" role="status">
      <span className="empty-state__icon">
        <Icon name={icon} size={25} />
      </span>
      <h1>{title}</h1>
      <p>{description}</p>
      {onAction ? (
        <Button type="button" onClick={onAction}>
          {action}
        </Button>
      ) : (
        <Button asChild>
          <a href={href}>{action}</a>
        </Button>
      )}
    </section>
  );
}

```

---


### 6. LoadingState

**Path:** `src/features/account/components/loading-state.tsx`

```tsx
export function LoadingState({ label, rows = 2 }: { label: string; rows?: number }) {
  return (
    <section className="mx-auto max-w-4xl animate-pulse space-y-4" role="status" aria-label={label}>
      <div className="h-4 w-36 rounded bg-secondary" />
      <div className="h-8 w-64 rounded bg-secondary" />
      <div className="h-4 w-full max-w-md rounded bg-secondary" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: rows }, (_, index) => (
          <div className="h-36 rounded-editorial bg-secondary" key={index} />
        ))}
      </div>
    </section>
  );
}

```

---


### 7. OrderDetailError

**Path:** `src/features/account/components/order-detail-error.tsx`

```tsx
import {
  apiErrorMessage,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
} from '@/features/account/state/account-state';

import { EmptyState } from '@/features/account/components/empty-state';

import { PageFrame } from '@/features/account/pages/page-frame';

export function OrderDetailError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const needsLogin = isUnauthorizedError(error);
  const offline = isOfflineError(error);
  return (
    <PageFrame>
      <EmptyState
        title={
          needsLogin
            ? 'نشست شما منقضی شده است'
            : offline
              ? 'اتصال اینترنت برقرار نیست'
              : isPermissionError(error)
                ? 'این سفارش قابل مشاهده نیست'
                : 'سفارش بارگذاری نشد'
        }
        description={
          needsLogin
            ? 'برای دیدن اطلاعات سفارش دوباره وارد حساب شوید.'
            : offline
              ? 'پس از اتصال دوباره، جزئیات سفارش را دریافت کنید.'
              : apiErrorMessage(error, 'این سفارش پیدا نشد یا دیگر در حساب شما قابل مشاهده نیست.')
        }
        action={needsLogin ? 'ورود دوباره' : 'تلاش دوباره'}
        href={needsLogin ? '/auth' : '/account/orders'}
        onAction={needsLogin || isPermissionError(error) ? undefined : onRetry}
        icon={offline ? 'refresh' : needsLogin ? 'user' : 'warning'}
      />
    </PageFrame>
  );
}

```

---


### 8. ReturnOrderState

**Path:** `src/features/account/components/return-order-state.tsx`

```tsx
import { type CustomerOrderDetail } from '@nova/api-client';

import {
  formatPersianNumber,
  getReturnEligibility,
  getReturnOrderState,
  returnRequestStatusCopy,
} from '@/features/account/state/account-state';

import { EmptyState } from '@/features/account/components/empty-state';

import { PageFrame } from '@/features/account/pages/page-frame';

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
          action="پیگیری وضعیت بازگشت"
          href={`/return/status?orderNumber=${encodeURIComponent(order.orderNumber)}`}
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
          href={`/order/${encodeURIComponent(orderNumber)}`}
        />
      </PageFrame>
    );
  return (
    <PageFrame>
      <EmptyState
        title="هنوز درخواست بازگشتی ثبت نشده است"
        description="این سفارش شرایط بازگشت را دارد. برای شروع، درخواست بازگشت کالا را ثبت کنید."
        action="ثبت درخواست بازگشت"
        href={`/return/request?orderNumber=${encodeURIComponent(orderNumber)}`}
        icon="package"
      />
    </PageFrame>
  );
}

```

---


### 9. SessionState

**Path:** `src/features/account/components/session-state.tsx`

```tsx
import { type ReactNode } from 'react';

import { useCurrentCustomer } from '@/features/auth/api/auth-api';

import {
  apiErrorMessage,
  isCustomerActive,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '@/features/account/state/account-state';

import { EmptyState } from '@/features/account/components/empty-state';

import { LoadingState } from '@/features/account/components/loading-state';

import { PageFrame } from '@/features/account/pages/page-frame';

export function SessionState({
  title = 'حساب کاربری',
  description = 'اطلاعات خصوصی شما فقط پس از ورود به حساب نمایش داده می‌شود.',
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  const customerQuery = useCurrentCustomer();
  const online = useOnlineStatus();
  useCustomerCacheBoundary(customerQuery.data?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending) {
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری حساب کاربری" />
      </PageFrame>
    );
  }
  if (customerQuery.isError) {
    const expired = isUnauthorizedError(customerQuery.error);
    const permission = isPermissionError(customerQuery.error);
    const offline = !online || isOfflineError(customerQuery.error);
    return (
      <PageFrame>
        <EmptyState
          title={
            expired
              ? 'نشست شما منقضی شده است'
              : permission
                ? 'دسترسی به حساب ممکن نیست'
                : offline
                  ? 'اتصال اینترنت برقرار نیست'
                  : 'حساب کاربری بارگذاری نشد'
          }
          description={
            expired
              ? 'برای حفاظت از اطلاعات سفارش‌ها و آدرس‌ها دوباره وارد حساب شوید.'
              : permission
                ? 'این حساب در حال حاضر اجازه استفاده از این بخش را ندارد.'
                : offline
                  ? 'اتصال را بررسی کنید و برای دریافت دوباره اطلاعات تلاش کنید.'
                  : apiErrorMessage(
                      customerQuery.error,
                      'دریافت اطلاعات حساب ممکن نشد؛ دوباره تلاش کنید.',
                    )
          }
          action={expired ? 'ورود دوباره' : 'تلاش دوباره'}
          href={expired ? '/auth' : '/account'}
          onAction={expired || permission ? undefined : () => void customerQuery.refetch()}
          icon={expired || permission ? 'user' : offline ? 'refresh' : 'warning'}
        />
      </PageFrame>
    );
  }
  if (!customerQuery.data || !isCustomerActive(customerQuery.data)) {
    return (
      <PageFrame>
        <EmptyState
          title={customerQuery.data ? 'حساب شما در دسترس نیست' : `برای دیدن ${title} وارد شوید`}
          description={
            customerQuery.data
              ? 'این حساب امکان استفاده از بخش‌های مشتری را ندارد. برای راهنمایی با پشتیبانی تماس بگیرید.'
              : description
          }
          action={customerQuery.data ? 'تماس با پشتیبانی' : 'ورود به حساب'}
          href={customerQuery.data ? '/support' : '/auth'}
          icon="user"
        />
      </PageFrame>
    );
  }
  return <>{children}</>;
}

```

---


### 10. PageFrame

**Path:** `src/features/account/pages/page-frame.tsx`

```tsx
import { type ReactNode } from 'react';

export function PageFrame({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`shell inner-page mx-auto w-[calc(100%-2rem)] max-w-[1280px] bg-background ${className}`}
    >
      {children}
    </main>
  );
}

```

---


### 11. Icon

**Path:** `src/shared/ui/icon.tsx`

```tsx
import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bag'
  | 'bell'
  | 'book'
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'close'
  | 'dress'
  | 'edit'
  | 'eye'
  | 'filter'
  | 'grid'
  | 'heart'
  | 'home'
  | 'info'
  | 'instagram'
  | 'layers'
  | 'mail'
  | 'menu'
  | 'more-vertical'
  | 'package'
  | 'plus'
  | 'refresh'
  | 'rotate'
  | 'search'
  | 'send'
  | 'settings'
  | 'shield'
  | 'shirt'
  | 'sparkles'
  | 'tag'
  | 'truck'
  | 'user'
  | 'users'
  | 'warehouse'
  | 'warning';

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

const iconPaths: Record<IconName, ReactNode> = {
  'arrow-left': <path d="m9 5 7 7-7 7" />,
  'arrow-right': <path d="m15 5-7 7 7 7" />,
  bag: (
    <>
      <path d="M5 8.5h14l-1 11H6l-1-11Z" />
      <path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" />
      <path d="M10 21h4" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7 3v4M17 3v4M3.5 9h17" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  dress: (
    <>
      <path d="M9 4.5a3 3 0 0 0 6 0" />
      <path d="m9 6-2 4 2 1-3 8h8l-3-8 2-1-2-4" />
      <path d="m15 6 2 4-2 1 3 8h-8" />
    </>
  ),
  edit: (
    <>
      <path d="m4 16.5-.7 4.2 4.2-.7L19 8.5 15.5 5 4 16.5Z" />
      <path d="m13.5 7 3.5 3.5M4 20.5l3.5-3.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  filter: (
    <>
      <path d="M4 5h16" />
      <path d="M7 12h10" />
      <path d="M10 19h4" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  heart: (
    <path d="M20.8 8.8c0 5.2-8.8 10.4-8.8 10.4S3.2 14 3.2 8.8A4.7 4.7 0 0 1 12 6.5a4.7 4.7 0 0 1 8.8 2.3Z" />
  ),
  home: (
    <>
      <path d="m3.5 10.5 8.5-7 8.5 7" />
      <path d="M5.5 9.5v10h13v-10M9 19.5v-5h6v5" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5v5M12 7.5h.01" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M17.5 6.5h.01" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7 7.5 5.5L19.5 7" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  'more-vertical': (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </>
  ),
  package: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4.5 7.8 7.5 4.2 7.5-4.2M12 12v9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-13.6-5.7L4 7.5" />
      <path d="M4 4v3.5h3.5M4 13a8 8 0 0 0 13.6 5.7l2.4-2.2" />
      <path d="M20 20v-3.5h-3.5" />
    </>
  ),
  rotate: (
    <>
      <path d="M4 12a8 8 0 0 1 13.6-5.7L20 8.5" />
      <path d="M20 5v3.5h-3.5M20 12a8 8 0 0 1-13.6 5.7L4 15.5" />
      <path d="M4 19v-3.5h3.5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  send: <path d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-2.6V20a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H6v-2.6h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V5h2.6v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v2.6H21a1.7 1.7 0 0 0-1.6 1Z" />
    </>
  ),
  shield: <path d="M12 3.5 19 6v5.5c0 4.3-2.7 7.7-7 9-4.3-1.3-7-4.7-7-9V6l7-2.5Z" />,
  shirt: (
    <>
      <path d="m8 5 4 2 4-2 4 3-2.5 4-2-1v9h-7v-9l-2 1L4 8l4-3Z" />
      <path d="M10 6.5a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  sparkles: (
    <>
      <path d="m8 3 1.2 3.8L13 8l-3.8 1.2L8 13l-1.2-3.8L3 8l3.8-1.2L8 3Z" />
      <path d="m17 12 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3ZM17 3v3M18.5 4.5h-3" />
    </>
  ),
  tag: (
    <>
      <path d="M4 4h7l9 9-7 7-9-9V4Z" />
      <circle cx="8" cy="8" r="1" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7V9Z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 4 5" />
    </>
  ),
  warehouse: (
    <>
      <path d="m3 9 9-5 9 5v11H3V9Z" />
      <path d="M7 20v-6h10v6M7 10h.01M12 10h.01M17 10h.01" />
    </>
  ),
  warning: (
    <>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4M12 16h.01" />
    </>
  ),
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width={size}
      {...props}
    >
      {iconPaths[name]}
    </svg>
  );
}

```

---


## Summary

- Page: `src/features/account/pages/customer-return-page.tsx`
- Custom component files: 11
- Total files included: 12
