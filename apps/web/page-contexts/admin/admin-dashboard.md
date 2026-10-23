# Page Context

## Page

**Path:** `src/features/dashboard/components/dashboard/DashboardView.tsx`

```tsx
import { useState } from 'react';

import { Card, Select as UiSelect } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';
import { useAdminDashboardSummary } from '@/features/dashboard/api/admin-dashboard-api';

import { PERIOD_OPTIONS, SUMMARY_METRICS } from '@/features/dashboard/pages/admin-dashboard-page-shared';

import { DashboardAccessDenied } from '@/features/dashboard/components/dashboard/dashboard-access-denied';

import { DashboardEmptyState } from '@/features/dashboard/components/dashboard/dashboard-empty-state';

import { DashboardErrorState } from '@/features/dashboard/components/dashboard/dashboard-error-state';

import { DashboardLoadingState } from '@/features/dashboard/components/dashboard/dashboard-loading-state';

import { OrderStatusCounts } from '@/features/dashboard/components/dashboard/order-status-counts';

import { hasAdminDashboardRole } from '@/features/dashboard/components/dashboard/has-admin-dashboard-role';

export function DashboardView({ staffRoles }: { staffRoles: readonly string[] | undefined }) {
  const [periodDays, setPeriodDays] = useState(30);
  const canView = hasAdminDashboardRole(staffRoles);
  const summaryQuery = useAdminDashboardSummary({ periodDays }, canView);

  if (!canView)
    return (
      <main className="min-h-full" dir="rtl">
        <DashboardAccessDenied />
      </main>
    );
  if (summaryQuery.isPending)
    return (
      <main className="min-h-full" dir="rtl">
        <DashboardLoadingState />
      </main>
    );
  if (summaryQuery.isError) {
    return (
      <main className="min-h-full" dir="rtl">
        <DashboardErrorState
          error={summaryQuery.error}
          onRetry={() => void summaryQuery.refetch()}
        />
      </main>
    );
  }
  if (!summaryQuery.data)
    return (
      <main className="min-h-full" dir="rtl">
        <DashboardEmptyState />
      </main>
    );

  const orderEntries = Object.entries(summaryQuery.data.orderStatusCounts);
  const maxOrderCount = Math.max(1, ...orderEntries.map(([, count]) => count));

  return (
    <main className="admin-reference-dashboard min-h-full" dir="rtl">
      <div className="admin-reference-dashboard__inner" dir="rtl">
        <header className="admin-reference-dashboard__header">
          <div>
            <span className="section-heading__eyebrow">NOVA / ATELIER EDITORIAL</span>
            <h1>صبح بخیر 👋</h1>
            <p>خوش آمدید به پنل مدیریت نوا. خلاصه وضعیت فروشگاه را در بازه انتخاب‌شده ببینید.</p>
          </div>
          <label className="admin-reference-period" htmlFor="admin-dashboard-period">
            <span>بازه گزارش</span>
            <UiSelect
              id="admin-dashboard-period"
              value={periodDays}
              onChange={(event) => setPeriodDays(Number(event.target.value))}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </UiSelect>
          </label>
        </header>

        <section className="admin-reference-metrics" aria-label="شاخص‌های خلاصه داشبورد">
          {SUMMARY_METRICS.map((metric) => (
            <Card asChild className="admin-reference-metric-card" key={metric.key}>
              <article>
                <span className="admin-reference-metric-card__icon" aria-hidden="true">
                  <Icon name={metric.icon} size={20} />
                </span>
                <div>
                  <h2>{metric.label}</h2>
                  <p dir="rtl">{metric.format(summaryQuery.data[metric.key])}</p>
                  <small>بر اساس داده زنده بازه انتخاب‌شده</small>
                </div>
              </article>
            </Card>
          ))}
        </section>

        <section className="admin-reference-dashboard-grid">
          <article className="admin-reference-chart-card">
            <div className="admin-reference-panel-heading">
              <div>
                <span>LIVE ORDERS</span>
                <h2>نمودار وضعیت سفارش‌ها</h2>
              </div>
              <Icon name="layers" size={19} />
            </div>
            {orderEntries.length ? (
              <div className="admin-reference-bars" aria-label="تعداد سفارش‌ها بر اساس وضعیت">
                {orderEntries.map(([status, count]) => (
                  <div className="admin-reference-bar" key={status}>
                    <span
                      style={{ height: `${Math.max(14, Math.round((count / maxOrderCount) * 100))}%` }}
                      title={`${status}: ${count.toLocaleString('fa-IR')}`}
                    />
                    <small>{count.toLocaleString('fa-IR')}</small>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-reference-empty-copy">در این بازه سفارشی ثبت نشده است.</p>
            )}
          </article>

          <OrderStatusCounts summary={summaryQuery.data} />

          <article className="admin-reference-shortcuts">
            <div className="admin-reference-panel-heading">
              <div>
                <span>QUICK ACCESS</span>
                <h2>دسترسی سریع</h2>
              </div>
              <Icon name="sparkles" size={19} />
            </div>
            <div>
              <a href="/admin/orders"><Icon name="package" size={18} /><span>سفارش‌ها<small>پیگیری و عملیات</small></span></a>
              <a href="/admin/catalog"><Icon name="bag" size={18} /><span>محصولات<small>کاتالوگ فروشگاه</small></span></a>
              <a href="/admin/inventory"><Icon name="warehouse" size={18} /><span>موجودی<small>کنترل انبار</small></span></a>
              <a href="/admin/content"><Icon name="book" size={18} /><span>محتوا<small>انتشار و SEO</small></span></a>
            </div>
          </article>
        </section>
      </div>
    </main>
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


### 2. Card

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


### 4. DashboardAccessDenied

**Path:** `src/features/dashboard/components/dashboard/dashboard-access-denied.tsx`

```tsx
import { Card } from '@nova/ui';

export function DashboardAccessDenied() {
  return (
    <Card
      asChild
      className="mx-auto max-w-xl bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="alert"
    >
      <section>
        <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
        <h1 className="mt-2 text-xl leading-relaxed">دسترسی کافی نیست</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">
          حساب کاربری شما برای مشاهده خلاصه داشبورد مجوز مدیر را ندارد.
        </p>
      </section>
    </Card>
  );
}

```

---


### 5. DashboardEmptyState

**Path:** `src/features/dashboard/components/dashboard/dashboard-empty-state.tsx`

```tsx
import { Card } from '@nova/ui';

export function DashboardEmptyState() {
  return (
    <Card
      asChild
      className="border border-border bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="status"
    >
      <section>
        <h2 className="text-lg leading-relaxed">خلاصه‌ای برای نمایش وجود ندارد</h2>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          در این بازه داده‌ای از API دریافت نشد.
        </p>
      </section>
    </Card>
  );
}

```

---


### 6. DashboardErrorState

**Path:** `src/features/dashboard/components/dashboard/dashboard-error-state.tsx`

```tsx
import { Button, Card } from '@nova/ui';

import { adminDashboardErrorMessage } from '@/features/dashboard/components/dashboard/admin-dashboard-error-message';

export function DashboardErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <Card
      asChild
      className="border border-destructive/30 bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="alert"
    >
      <section>
        <h2 className="text-lg leading-relaxed">خلاصه داشبورد در دسترس نیست</h2>
        <p className="mt-2 text-sm leading-8 text-muted-foreground">
          {adminDashboardErrorMessage(error)}
        </p>
        <Button
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-4 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          onClick={onRetry}
        >
          تلاش دوباره
        </Button>
      </section>
    </Card>
  );
}

```

---


### 7. DashboardLoadingState

**Path:** `src/features/dashboard/components/dashboard/dashboard-loading-state.tsx`

```tsx
import { SUMMARY_METRICS } from '@/features/dashboard/pages/admin-dashboard-page-shared';

export function DashboardLoadingState() {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="در حال دریافت خلاصه داشبورد">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {SUMMARY_METRICS.map((metric) => (
          <div
            className="min-h-32 animate-pulse border border-border bg-surface p-4"
            key={metric.key}
          />
        ))}
      </div>
      <p className="text-right text-sm text-muted-foreground" role="status">
        در حال دریافت خلاصه داشبورد…
      </p>
    </section>
  );
}

```

---


### 8. OrderStatusCounts

**Path:** `src/features/dashboard/components/dashboard/order-status-counts.tsx`

```tsx
import { type AdminDashboardSummary } from '@nova/api-client';
import { Card } from '@nova/ui';
import { Icon } from '@/shared/ui/icon';

import { ORDER_STATUS_LABELS } from '@/features/dashboard/pages/admin-dashboard-page-shared';

import { formatPersianNumber } from '@/shared/utils/format-persian-number';

export function OrderStatusCounts({ summary }: { summary: AdminDashboardSummary }) {
  const entries = Object.entries(summary.orderStatusCounts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Card asChild className="admin-reference-order-status" dir="rtl">
      <section>
        <div className="admin-reference-panel-heading">
          <div>
            <span>ORDER STATUS</span>
            <h2>وضعیت سفارش‌ها</h2>
          </div>
          <Icon name="package" size={19} aria-hidden="true" />
        </div>

        <div className="admin-reference-order-status__body">
          <div className="admin-reference-order-status__ring" aria-label={`مجموع ${formatPersianNumber(total)} سفارش`}>
            <strong>{formatPersianNumber(total)}</strong>
            <small>مجموع سفارش‌ها</small>
          </div>

          {entries.length > 0 ? (
            <dl>
              {entries.map(([status, count], index) => (
                <div key={status}>
                  <dt>
                    <span className={`admin-reference-dot dot-${(index % 5) + 1}`} />
                    {ORDER_STATUS_LABELS[status] ?? status}
                  </dt>
                  <dd>{formatPersianNumber(count)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="admin-reference-empty-copy">وضعیتی برای این بازه ثبت نشده است.</p>
          )}
        </div>
      </section>
    </Card>
  );
}

```

---


### 9. Icon

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

- Page: `src/features/dashboard/components/dashboard/DashboardView.tsx`
- Custom component files: 9
- Total files included: 10
