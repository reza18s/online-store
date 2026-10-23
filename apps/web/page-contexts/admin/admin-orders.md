# Page Context

## Page

**Path:** `src/features/orders/components/order-management/OrdersView.tsx`

```tsx
import { useState } from 'react';
import { type AdminOrderListQuery } from '@nova/api-client';
import { Button } from '@nova/ui';
import { useAdminOrders } from '@/features/orders/api/admin-orders-api';
import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import { SHIPMENT_STATUS_LABELS } from '@/features/orders/pages/admin-orders-page-shared';

import { ListFilters } from '@/features/orders/components/order-management/list-filters';

import { OrderMetricCard } from '@/features/orders/components/order-management/order-metric-card';

import { Pagination } from '@/features/orders/components/order-management/pagination';

import { PaymentChip } from '@/features/orders/components/order-management/payment-chip';

import { PermissionPanel } from '@/features/orders/components/order-management/permission-panel';

import { StatePanel } from '@/features/orders/components/order-management/state-panel';

import { StatusChip } from '@/features/orders/components/order-management/status-chip';

import { adminOrderErrorMessage } from '@/features/orders/components/order-management/admin-order-error-message';

import { formatDate } from '@/features/orders/components/order-management/format-date';

import { formatToman } from '@/shared/utils/format-toman';

import { hasAdminStaffRole } from '@/features/orders/components/order-management/has-admin-staff-role';

export function OrdersView({
  staffRoles,
  detailHref = (orderNumber) => `/admin/orders/${encodeURIComponent(orderNumber)}`,
}: {
  staffRoles?: readonly string[];
  detailHref?: (orderNumber: string) => string;
}) {
  const canView = hasAdminStaffRole(staffRoles);
  const [filters, setFilters] = useState<AdminOrderListQuery>({ page: 1, limit: 10 });
  const ordersQuery = useAdminOrders(filters, canView);

  if (!canView) return <PermissionPanel />;
  if (ordersQuery.isPending && !ordersQuery.data) {
    return (
      <StatePanel
        icon="package"
        title="در حال دریافت سفارش‌ها"
        description="فهرست واقعی سفارش‌ها از سرویس مدیریت بارگیری می‌شود."
      />
    );
  }
  if (ordersQuery.isError) {
    return (
      <StatePanel
        icon="warning"
        title="دریافت سفارش‌ها ممکن نشد"
        description={adminOrderErrorMessage(ordersQuery.error, 'دوباره تلاش کنید.')}
        tone="danger"
        action={
          <Button onClick={() => void ordersQuery.refetch()} variant="outline">
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  }

  const data = ordersQuery.data;
  const orders = data?.items ?? [];
  return (
    <main className="admin-reference-orders space-y-5" aria-labelledby="admin-orders-title">
      <header className="admin-reference-orders__header flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">
            فضای مدیریت / عملیات
          </p>
          <h1 className="mt-2 text-3xl font-bold" id="admin-orders-title">
            سفارش‌ها
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            پیگیری وضعیت سفارش، ارسال، درخواست بازگشت و بازپرداخت بر اساس داده‌های ثبت‌شده.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
          <Icon name="package" size={18} />
          <span>
            مجموع سفارش‌ها:{' '}
            <strong className="text-foreground">
              {formatPersianNumber(data?.total ?? 0)}
            </strong>
          </span>
        </div>
      </header>

      <section className="admin-reference-orders__metrics grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="شاخص‌های سفارش‌ها">
        <OrderMetricCard
          icon="bag"
          label="کل سفارش‌ها"
          tone="bg-warning-soft text-warning"
          value={data?.total ?? 0}
        />
        <OrderMetricCard
          icon="tag"
          label="پرداخت موفق"
          tone="bg-success-soft text-success"
          value={orders.filter((order) => order.paymentStatus === 'PAID').length}
        />
        <OrderMetricCard
          icon="package"
          label="تکمیل شده"
          tone="bg-success-soft text-success"
          value={orders.filter((order) => order.status === 'DELIVERED').length}
        />
        <OrderMetricCard
          icon="arrow-left"
          label="در انتظار مرجوعی"
          tone="bg-error-soft text-error"
          value={orders.filter((order) => order.status === 'RETURNED').length}
        />
      </section>

      <ListFilters onChange={setFilters} value={filters} />

      {orders.length === 0 ? (
        <StatePanel
          icon="package"
          title="سفارشی با این فیلتر پیدا نشد"
          description="عبارت جست‌وجو یا فیلترهای وضعیت را تغییر دهید؛ این صفحه داده عملیاتی ساختگی نمایش نمی‌دهد."
        />
      ) : (
        <section
          className="border border-border bg-surface shadow-card"
          aria-labelledby="admin-orders-list-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
            <h2 className="text-base font-semibold" id="admin-orders-list-title">
              فهرست سفارش‌ها
            </h2>
            <span className="text-xs text-muted-foreground">
              {formatPersianNumber(orders.length)} مورد در این صفحه
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-right text-xs">
              <caption className="sr-only">سفارش‌های واقعی قابل مشاهده برای کاربر فعلی</caption>
              <thead className="bg-background text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium" scope="col">
                    سفارش
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    مشتری
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    پرداخت
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    ارسال
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    مبلغ
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    <span className="sr-only">عملیات</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    className="border-b border-border last:border-b-0 hover:bg-background"
                    key={order.orderId}
                  >
                    <td className="px-4 py-4 align-top">
                      <a
                        className="block min-h-11 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                        href={detailHref(order.orderNumber)}
                      >
                        <span className="font-semibold text-primary" dir="ltr">
                          {order.orderNumber}
                        </span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </span>
                      </a>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="block">{order.customer?.email ?? 'مشتری ثبت‌نشده'}</span>
                      {order.customer?.phone ? (
                        <span className="mt-1 block text-[10px] text-muted-foreground" dir="ltr">
                          {order.customer.phone}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusChip status={order.status} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <PaymentChip status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="text-muted-foreground">
                        {order.shipmentStatus
                          ? SHIPMENT_STATUS_LABELS[order.shipmentStatus]
                          : 'ثبت نشده'}
                      </span>
                      {order.trackingReference ? (
                        <span
                          className="mt-1 block max-w-[140px] truncate text-[10px] text-primary"
                          dir="ltr"
                          title={order.trackingReference}
                        >
                          {order.trackingReference}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      {formatToman(order.totalToman)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <a
                        aria-label={`مشاهده سفارش ${order.orderNumber}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                        href={detailHref(order.orderNumber)}
                      >
                        <Icon name="eye" size={18} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 md:p-5">
            <Pagination
              limit={data?.limit ?? 10}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              page={data?.page ?? filters.page ?? 1}
              total={data?.total ?? 0}
            />
          </div>
        </section>
      )}
    </main>
  );
}

```

---

## Custom Components


### 1. Badge

**Path:** `../../packages/ui/src/badge.tsx`

```tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';

import { cn } from './cn';

export const badgeVariants = cva(
  'nova-badge inline-flex min-h-8 items-center justify-center rounded-control border px-2.5 py-1 text-[11px] font-semibold leading-4 transition-colors motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-foreground',
        outline: 'border-border bg-transparent text-foreground',
        success: 'border-success-100 bg-success-100 text-success',
        warning: 'border-warning-100 bg-warning-100 text-warning',
        destructive: 'border-destructive-100 bg-destructive-100 text-destructive',
        info: 'border-info-100 bg-info-100 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  ),
);

Badge.displayName = 'Badge';

```

---


### 2. Button

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


### 3. Card

**Path:** `../../packages/ui/src/card.tsx`

```tsx
import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';

import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ asChild = false, className, ...props }, ref) => {
    const Component = asChild ? Slot : 'div';
    return (
      <Component
        ref={ref}
        className={cn(
          'nova-card rounded-panel border border-border bg-card text-foreground shadow-card',
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
  ),
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-base font-semibold leading-none', className)} {...props} />
  ),
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
  ),
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
  ),
);

CardFooter.displayName = 'CardFooter';

```

---


### 4. Input

**Path:** `../../packages/ui/src/input.tsx`

```tsx
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

import { cn } from './cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'nova-input flex min-h-12 w-full rounded-control border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] duration-[140ms] placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-secondary disabled:opacity-70 motion-reduce:transition-none',
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = 'Input';

```

---


### 5. Select

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


### 6. ListFilters

**Path:** `src/features/orders/components/order-management/list-filters.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { type AdminOrderListQuery, type CheckoutOrderStatus } from '@nova/api-client';
import { Button, Input as UiInput, Select as UiSelect } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from '@/features/orders/pages/admin-orders-page-shared';

export function ListFilters({
  value,
  onChange,
}: {
  value: AdminOrderListQuery;
  onChange: (next: AdminOrderListQuery) => void;
}) {
  const [search, setSearch] = useState(value.q ?? '');

  useEffect(() => {
    setSearch(value.q ?? '');
  }, [value.q]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ ...value, page: 1, q: search.trim() || undefined });
  }

  return (
    <form className="border border-border bg-surface p-4 shadow-card md:p-5" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_repeat(2,minmax(150px,0.8fr))_auto] md:items-end">
        <label className="block text-xs text-muted-foreground">
          جست‌وجو در سفارش‌ها
          <span className="relative mt-2 block">
            <Icon
              className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              name="search"
              size={18}
            />
            <UiInput
              aria-label="جست‌وجو در سفارش‌ها"
              className="min-h-12 w-full border border-border bg-background px-3 pe-10 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="شماره سفارش یا شناسه مشتری"
              value={search}
            />
          </span>
        </label>
        <label className="block text-xs text-muted-foreground">
          وضعیت سفارش
          <UiSelect
            aria-label="فیلتر وضعیت سفارش"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                status: (event.target.value || undefined) as CheckoutOrderStatus | undefined,
              })
            }
            value={value.status ?? ''}
          >
            <option value="">همه وضعیت‌ها</option>
            {ORDER_STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </UiSelect>
        </label>
        <label className="block text-xs text-muted-foreground">
          وضعیت پرداخت
          <UiSelect
            aria-label="فیلتر وضعیت پرداخت"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                paymentStatus: (event.target.value ||
                  undefined) as AdminOrderListQuery['paymentStatus'],
              })
            }
            value={value.paymentStatus ?? ''}
          >
            {PAYMENT_STATUS_OPTIONS.map(([status, label]) => (
              <option key={status || 'all'} value={status}>
                {label}
              </option>
            ))}
          </UiSelect>
        </label>
        <Button size="md" type="submit">
          <Icon name="search" size={17} />
          اعمال فیلتر
        </Button>
      </div>
    </form>
  );
}

```

---


### 7. OrderMetricCard

**Path:** `src/features/orders/components/order-management/order-metric-card.tsx`

```tsx
import { Card } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function OrderMetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: 'arrow-left' | 'bag' | 'package' | 'tag';
  tone: string;
}) {
  return (
    <Card asChild className="min-h-28 p-4 md:p-5">
      <article>
        <div className="flex items-start justify-between gap-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
            <Icon name={icon} size={19} />
          </span>
          <span className="text-right text-xs text-muted-foreground">{label}</span>
        </div>
        <strong className="mt-5 block text-right font-display text-2xl leading-none tabular-nums">
          {formatPersianNumber(value)}
        </strong>
      </article>
    </Card>
  );
}

```

---


### 8. Pagination

**Path:** `src/features/orders/components/order-management/pagination.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label="صفحه‌های سفارش‌ها"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
    >
      <span className="text-xs text-muted-foreground">
        صفحه {formatPersianNumber(page)} از {formatPersianNumber(pageCount)}
      </span>
      <div className="flex items-center gap-2" dir="ltr">
        <Button
          aria-label="صفحه قبل"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon"
          variant="outline"
        >
          <Icon name="arrow-left" size={18} />
        </Button>
        <Button
          aria-label="صفحه بعد"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          size="icon"
          variant="outline"
        >
          <Icon name="arrow-right" size={18} />
        </Button>
      </div>
    </nav>
  );
}

```

---


### 9. PaymentChip

**Path:** `src/features/orders/components/order-management/payment-chip.tsx`

```tsx
import { Badge } from '@nova/ui';

import { PAYMENT_STATUS_LABELS } from '@/features/orders/pages/admin-orders-page-shared';

import { statusBadgeVariant } from '@/features/orders/components/order-management/status-badge-variant';

export function PaymentChip({ status }: { status: string }) {
  const tone =
    status === 'PAID' || status === 'REFUNDED'
      ? 'success'
      : status === 'FAILED'
        ? 'danger'
        : 'warning';
  return (
    <Badge variant={statusBadgeVariant(tone)} className="min-h-7 rounded-md text-[11px]">
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

```

---


### 10. PermissionPanel

**Path:** `src/features/orders/components/order-management/permission-panel.tsx`

```tsx
import { StatePanel } from '@/features/orders/components/order-management/state-panel';

export function PermissionPanel() {
  return (
    <StatePanel
      icon="warning"
      title="دسترسی عملیات سفارش ندارید"
      description="این بخش فقط برای اعضای مجاز پشتیبانی، عملیات یا مدیر سیستم در دسترس است."
      tone="danger"
    />
  );
}

```

---


### 11. StatePanel

**Path:** `src/features/orders/components/order-management/state-panel.tsx`

```tsx
import { type ReactNode } from 'react';

import { Icon } from '@/shared/ui/icon';

export function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: 'package' | 'warning' | 'refresh' | 'info';
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <section
      className={`border bg-surface p-8 text-center shadow-card ${tone === 'danger' ? 'border-destructive/40' : 'border-border'}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-error-soft text-destructive' : 'bg-secondary text-primary'}`}
      >
        <Icon name={icon} size={22} />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

```

---


### 12. StatusChip

**Path:** `src/features/orders/components/order-management/status-chip.tsx`

```tsx
import { Badge } from '@nova/ui';

import { adminOrderStatusLabel } from '@/features/orders/components/order-management/admin-order-status-label';

import { adminOrderStatusTone } from '@/features/orders/components/order-management/admin-order-status-tone';

import { statusBadgeVariant } from '@/features/orders/components/order-management/status-badge-variant';

export function StatusChip({
  status,
  label = adminOrderStatusLabel(status),
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge
      variant={statusBadgeVariant(adminOrderStatusTone(status))}
      className="min-h-7 rounded-md text-[11px]"
    >
      {label}
    </Badge>
  );
}

```

---


### 13. Icon

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

- Page: `src/features/orders/components/order-management/OrdersView.tsx`
- Custom component files: 13
- Total files included: 14
