# Page Context

## Page

**Path:** `src/features/account/pages/customer-order-page.tsx`

```tsx
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


### 2. Textarea

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


### 3. EmptyState

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


### 4. LoadingState

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


### 5. OrderDetailError

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


### 6. SessionState

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


### 7. PageFrame

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


### 8. Icon

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

- Page: `src/features/account/pages/customer-order-page.tsx`
- Custom component files: 8
- Total files included: 9
