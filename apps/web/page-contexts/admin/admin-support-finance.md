# Page Context

## Page

**Path:** `src/features/support/components/support-finance/SupportFinanceView.tsx`

```tsx
import { Icon } from '@/shared/ui/icon';

import type { AdminSupportFinanceView } from '@/features/support/pages/admin-support-finance-page-shared';
import { VIEW_ACCESS } from '@/features/support/pages/admin-support-finance-page-shared';

import { AuditInspection } from '@/features/support/components/support-finance/audit-inspection';

import { CustomerInspection } from '@/features/support/components/support-finance/customer-inspection';

import { AdminSessionState } from '@/features/support/components/support-finance/admin-session-state';

import { NotificationInspection } from '@/features/support/components/support-finance/notification-inspection';

import { PaymentInspection } from '@/features/support/components/support-finance/payment-inspection';

import { adminCustomerLookupQuery } from '@/features/support/components/support-finance/admin-customer-lookup-query';

import { canStaffInspectView } from '@/features/support/components/support-finance/can-staff-inspect-view';

import { normalizeAdminSupportFinanceView } from '@/features/support/components/support-finance/normalize-admin-support-finance-view';

export function SupportFinanceView({
  view = 'payments',
  queryString = '',
  staffRoles = [],
}: {
  view?: string;
  queryString?: string;
  staffRoles?: readonly string[];
}) {
  const activeView = normalizeAdminSupportFinanceView(view);

  const accessibleViews = (Object.keys(VIEW_ACCESS) as AdminSupportFinanceView[]).filter(
    (candidate) => canStaffInspectView(candidate, staffRoles),
  );
  if (!canStaffInspectView(activeView, staffRoles)) return <AdminSessionState kind="denied" />;

  const config = VIEW_ACCESS[activeView];
  return (
    <main
      className="admin-reference-module admin-reference-support min-h-0 bg-transparent px-0 py-0 text-foreground"
      dir="rtl"
    >
      <div className="admin-reference-module__inner mx-auto max-w-[1120px]">
        <header className="admin-reference-module__header flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="text-right">
            <span className="section-heading__eyebrow">{config.eyebrow}</span>
            <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">{config.label}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-7 text-muted-foreground">
              {config.description}
            </p>
          </div>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-[11px] text-muted-foreground">
            <Icon name="eye" size={15} />
            داده‌های محدودشده
          </span>
        </header>
        <nav className="admin-reference-tabs mt-5 overflow-x-auto" aria-label="بخش‌های پشتیبانی و مالی">
          <div className="flex min-w-max gap-2">
            {accessibleViews.map((candidate) => {
              const item = VIEW_ACCESS[candidate];
              const selected = candidate === activeView;
              return (
                <a
                  className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'}`}
                  href={`/admin/${candidate}`}
                  aria-current={selected ? 'page' : undefined}
                  key={candidate}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>
        <div className="mt-5">
          {activeView === 'payments' ? <PaymentInspection /> : null}
          {activeView === 'customers' ? (
            <CustomerInspection initialQuery={adminCustomerLookupQuery(queryString)} />
          ) : null}
          {activeView === 'notifications' ? <NotificationInspection /> : null}
          {activeView === 'audit' ? <AuditInspection /> : null}
        </div>
      </div>
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


### 3. Input

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


### 4. Select

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


### 5. AdminSessionState

**Path:** `src/features/support/components/support-finance/admin-session-state.tsx`

```tsx
import { type IconName } from '@/shared/ui/icon';

export function AdminSessionState({
  kind,
}: {
  kind: 'loading' | 'expired' | 'denied' | 'missing';
}) {
  const content = {
    loading: {
      icon: 'refresh' as IconName,
      title: 'در حال بررسی نشست مدیریت',
      description: 'دسترسی امن پنل در حال بررسی است.',
    },
    expired: {
      icon: 'warning' as IconName,
      title: 'نشست مدیریت منقضی شده است',
      description: 'برای ادامه دوباره وارد فضای مدیریت شوید.',
    },
    denied: {
      icon: 'warning' as IconName,
      title: 'دسترسی کافی ندارید',
      description: 'این بخش برای نقش فعلی شما فعال نیست.',
    },
    missing: {
      icon: 'user' as IconName,
      title: 'ورود به پنل مدیریت لازم است',
      description: 'برای مشاهده اطلاعات عملیاتی، ابتدا وارد شوید.',
    },
  }[kind];
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f6f6f4] px-4 py-10" dir="rtl">
      <section
        className="w-full max-w-lg border border-border bg-surface p-7 text-right shadow-float md:p-10"
        role={kind === 'denied' || kind === 'expired' ? 'alert' : 'status'}
      >
        <span className="section-heading__eyebrow">NOVA / ADMIN INSPECTION</span>
        <h1 className="mt-2 text-2xl leading-relaxed">{content.title}</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">{content.description}</p>
        {kind !== 'loading' && kind !== 'denied' ? (
          <a
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="/admin/login"
          >
            ورود به پنل
          </a>
        ) : null}
      </section>
    </main>
  );
}

```

---


### 6. AuditInspection

**Path:** `src/features/support/components/support-finance/audit-inspection.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { type AdminAuditListQuery, type AdminAuditPage } from '@nova/api-client';

import { useAdminAuditEvents } from '@/features/support/api/audit/admin-audit-api';

import type { QueryResult } from '@/features/support/pages/admin-support-finance-page-shared';
import { ACTOR_TYPES } from '@/features/support/pages/admin-support-finance-page-shared';

import { FilterBar } from '@/features/support/components/support-finance/filter-bar';

import { InspectionPanel } from '@/features/support/components/support-finance/inspection-panel';

import { Pagination } from '@/features/support/components/support-finance/pagination';

import { QueryState } from '@/features/support/components/support-finance/query-state';

import { SelectFilter } from '@/features/support/components/support-finance/select-filter';

import { StatusBadge } from '@/features/support/components/support-finance/status-badge';

import { TextFilter } from '@/features/support/components/support-finance/text-filter';

import { formatDate } from '@/features/support/components/support-finance/format-date';

import { ltr } from '@/features/support/components/support-finance/ltr';

import { safeAuditMetadataLabel } from '@/features/support/components/support-finance/safe-audit-metadata-label';

export function AuditInspection() {
  const [draftAction, setDraftAction] = useState('');
  const [draftResourceType, setDraftResourceType] = useState('');
  const [draftResourceId, setDraftResourceId] = useState('');
  const [draftActorType, setDraftActorType] = useState('');
  const [filters, setFilters] = useState<AdminAuditListQuery>({ page: 1, limit: 12 });
  const query = useAdminAuditEvents(filters);
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      action: draftAction || undefined,
      resourceType: draftResourceType || undefined,
      resourceId: draftResourceId || undefined,
      actorType: (draftActorType || undefined) as AdminAuditListQuery['actorType'],
    });
  };

  return (
    <InspectionPanel title="گزارش رویدادها" icon="eye">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="audit-action"
          label="عملیات"
          value={draftAction}
          onChange={setDraftAction}
          placeholder="مثلاً order.cancelled"
          dir="ltr"
        />
        <TextFilter
          id="audit-resource"
          label="نوع منبع"
          value={draftResourceType}
          onChange={setDraftResourceType}
          placeholder="Order"
          dir="ltr"
        />
        <TextFilter
          id="audit-resource-id"
          label="شناسه منبع"
          value={draftResourceId}
          onChange={setDraftResourceId}
          placeholder="شناسه"
          dir="ltr"
        />
        <SelectFilter
          id="audit-actor"
          label="ثبت‌کننده"
          value={draftActorType}
          onChange={setDraftActorType}
          options={ACTOR_TYPES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminAuditPage>}
          emptyTitle="رویدادی پیدا نشد"
          emptyDescription="فیلترهای گزارش را تغییر دهید یا دوباره تلاش کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست رویدادهای حسابرسی</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">عملیات</th>
                      <th className="px-3 py-3 font-normal">منبع</th>
                      <th className="px-3 py-3 font-normal">ثبت‌کننده</th>
                      <th className="px-3 py-3 font-normal">جزئیات</th>
                      <th className="px-3 py-3 font-normal">زمان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((event) => (
                      <tr className="border-b border-border last:border-b-0" key={event.id}>
                        <td className="px-3 py-3">{ltr(event.action)}</td>
                        <td className="px-3 py-3">
                          <span>{event.resourceType}</span>
                          {event.resourceId ? (
                            <span className="mr-2 text-muted-foreground">
                              {ltr(event.resourceId)}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={event.actorType} />
                        </td>
                        <td className="max-w-[230px] px-3 py-3 text-muted-foreground">
                          {safeAuditMetadataLabel(event.metadata)}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(event.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}

```

---


### 7. CustomerInspection

**Path:** `src/features/support/components/support-finance/customer-inspection.tsx`

```tsx
import { useEffect, useState, type FormEvent } from 'react';
import { type AdminCustomerListQuery, type AdminCustomerPage } from '@nova/api-client';

import { useAdminCustomers } from '@/features/support/api/customers/admin-customers-api';

import { Icon } from '@/shared/ui/icon';

import type { QueryResult } from '@/features/support/pages/admin-support-finance-page-shared';
import { CUSTOMER_STATUSES } from '@/features/support/pages/admin-support-finance-page-shared';

import { FilterBar } from '@/features/support/components/support-finance/filter-bar';

import { InspectionPanel } from '@/features/support/components/support-finance/inspection-panel';

import { Pagination } from '@/features/support/components/support-finance/pagination';

import { QueryState } from '@/features/support/components/support-finance/query-state';

import { SelectFilter } from '@/features/support/components/support-finance/select-filter';

import { StatusBadge } from '@/features/support/components/support-finance/status-badge';

import { TextFilter } from '@/features/support/components/support-finance/text-filter';

import { adminCustomerLookupHref } from '@/features/support/components/support-finance/admin-customer-lookup-href';

import { adminOrderHref } from '@/features/support/components/support-finance/admin-order-href';

import { formatDate } from '@/features/support/components/support-finance/format-date';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { ltr } from '@/features/support/components/support-finance/ltr';

import { statusLabel } from '@/features/support/components/support-finance/status-label';

export function CustomerInspection({ initialQuery = '' }: { initialQuery?: string }) {
  const [draftQ, setDraftQ] = useState(initialQuery);
  const [draftStatus, setDraftStatus] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminCustomerListQuery>(() => ({
    page: 1,
    limit: 12,
    ...(initialQuery ? { q: initialQuery } : {}),
  }));
  const query = useAdminCustomers(filters);

  useEffect(() => {
    setDraftQ(initialQuery);
    setSelectedCustomerId(null);
    setFilters({ page: 1, limit: 12, ...(initialQuery ? { q: initialQuery } : {}) });
  }, [initialQuery]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedCustomerId(null);
    setFilters({
      page: 1,
      limit: 12,
      q: draftQ || undefined,
      status: (draftStatus || undefined) as AdminCustomerListQuery['status'],
    });
  };

  return (
    <InspectionPanel title="مدیریت مشتریان" icon="users">
      <div className="admin-reference-customer-filters">
        <FilterBar onSubmit={applyFilters}>
          <TextFilter
            id="customer-query"
            label="جست‌وجو"
            value={draftQ}
            onChange={setDraftQ}
            placeholder="ایمیل، تلفن یا شناسه مشتری..."
            dir="ltr"
          />
          <SelectFilter
            id="customer-status"
            label="وضعیت"
            value={draftStatus}
            onChange={setDraftStatus}
            options={CUSTOMER_STATUSES}
          />
        </FilterBar>
      </div>

      <div className="admin-reference-customers">
        <QueryState
          query={query as QueryResult<AdminCustomerPage>}
          emptyTitle="مشتری پیدا نشد"
          emptyDescription="عبارت جست‌وجو یا وضعیت را تغییر دهید."
        >
          {(data) => {
            const activeCount = data.items.filter((customer) => customer.status === 'ACTIVE').length;
            const inactiveCount = data.items.filter((customer) => customer.status !== 'ACTIVE').length;
            const orderedCount = data.items.filter((customer) => customer.orderCount > 0).length;
            const selected =
              data.items.find((customer) => customer.id === selectedCustomerId) ?? null;

            return (
              <>
                <section className="admin-reference-customer-metrics" aria-label="خلاصه مشتریان">
                  <article>
                    <span><Icon name="users" size={20} /></span>
                    <div><strong>{formatNumber(data.total)}</strong><small>کل مشتریان</small></div>
                  </article>
                  <article>
                    <span><Icon name="check" size={20} /></span>
                    <div><strong>{formatNumber(activeCount)}</strong><small>فعال در این صفحه</small></div>
                  </article>
                  <article>
                    <span><Icon name="bag" size={20} /></span>
                    <div><strong>{formatNumber(orderedCount)}</strong><small>دارای سفارش</small></div>
                  </article>
                  <article>
                    <span><Icon name="warning" size={20} /></span>
                    <div><strong>{formatNumber(inactiveCount)}</strong><small>غیرفعال در این صفحه</small></div>
                  </article>
                </section>

                <div className="admin-reference-customer-layout">
                  <section className="admin-reference-customer-table">
                    <div className="overflow-x-auto">
                      <table>
                        <caption className="sr-only">فهرست مشتریان</caption>
                        <thead>
                          <tr>
                            <th>مشتری</th>
                            <th>وضعیت</th>
                            <th>سفارش‌ها</th>
                            <th>آخرین سفارش</th>
                            <th>به‌روزرسانی</th>
                            <th><span className="sr-only">عملیات</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((customer) => (
                            <tr
                              className={selected?.id === customer.id ? 'is-selected' : ''}
                              key={customer.id}
                              onClick={() => setSelectedCustomerId(customer.id)}
                            >
                              <td>
                                <button
                                  type="button"
                                  className="admin-reference-customer-name"
                                  onClick={() => setSelectedCustomerId(customer.id)}
                                >
                                  <span className="admin-reference-avatar">
                                    <Icon name="user" size={17} />
                                  </span>
                                  <span>
                                    <strong>{ltr(customer.email ?? customer.phone)}</strong>
                                    <small>{ltr(customer.phone)}</small>
                                  </span>
                                </button>
                              </td>
                              <td><StatusBadge status={customer.status} /></td>
                              <td>{formatNumber(customer.orderCount)}</td>
                              <td>
                                {customer.lastOrderNumber ? (
                                  <a href={adminOrderHref(customer.lastOrderNumber)}>
                                    {ltr(customer.lastOrderNumber)}
                                    <small>{customer.lastOrderStatus ? statusLabel(customer.lastOrderStatus) : ''}</small>
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground">بدون سفارش</span>
                                )}
                              </td>
                              <td>{ltr(formatDate(customer.updatedAt))}</td>
                              <td>
                                <a
                                  className="admin-reference-more"
                                  href={adminCustomerLookupHref(customer.email ?? customer.phone)}
                                  aria-label="مشاهده مشتری"
                                >
                                  <Icon name="more-vertical" size={17} />
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="admin-reference-customer-mobile">
                      {data.items.map((customer) => (
                        <article
                          className={selected?.id === customer.id ? 'is-selected' : ''}
                          key={customer.id}
                        >
                          <button type="button" onClick={() => setSelectedCustomerId(customer.id)}>
                            <span className="admin-reference-avatar"><Icon name="user" size={16} /></span>
                            <span>
                              <strong>{ltr(customer.email ?? customer.phone)}</strong>
                              <small>{ltr(customer.phone)}</small>
                            </span>
                          </button>
                          <StatusBadge status={customer.status} />
                          <a href={adminCustomerLookupHref(customer.email ?? customer.phone)}>
                            <Icon name="more-vertical" size={17} />
                          </a>
                        </article>
                      ))}
                    </div>

                    <Pagination
                      page={data.page}
                      total={data.total}
                      limit={data.limit}
                      onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                    />
                  </section>

                  {selected ? (
                    <aside className="admin-reference-customer-detail">
                      <button
                        type="button"
                        className="admin-reference-customer-detail__close"
                        aria-label="بستن جزئیات"
                        onClick={() => setSelectedCustomerId(null)}
                      >
                        <Icon name="close" size={16} />
                      </button>
                      <span className="admin-reference-customer-detail__avatar">
                        <Icon name="user" size={28} />
                      </span>
                      <h3>{ltr(selected.email ?? 'مشتری نوا')}</h3>
                      <p>{ltr(selected.phone)}</p>
                      <StatusBadge status={selected.status} />
                      <dl>
                        <div><dt>تعداد سفارش</dt><dd>{formatNumber(selected.orderCount)}</dd></div>
                        <div><dt>آخرین سفارش</dt><dd>{selected.lastOrderNumber ? ltr(selected.lastOrderNumber) : '—'}</dd></div>
                        <div><dt>آخرین به‌روزرسانی</dt><dd>{ltr(formatDate(selected.updatedAt))}</dd></div>
                      </dl>
                      <div className="admin-reference-customer-detail__actions">
                        <a href={adminCustomerLookupHref(selected.email ?? selected.phone)}>
                          مشاهده پروفایل
                        </a>
                        {selected.lastOrderNumber ? (
                          <a href={adminOrderHref(selected.lastOrderNumber)}>مشاهده سفارش</a>
                        ) : null}
                      </div>
                    </aside>
                  ) : null}
                </div>
              </>
            );
          }}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}

```

---


### 8. DetailField

**Path:** `src/features/support/components/support-finance/detail-field.tsx`

```tsx
import { type ReactNode } from 'react';

export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-control border border-border bg-background p-3">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-xs">{children}</dd>
    </div>
  );
}

```

---


### 9. FilterBar

**Path:** `src/features/support/components/support-finance/filter-bar.tsx`

```tsx
import { type FormEvent, type ReactNode } from 'react';

import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

export function FilterBar({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="grid gap-3 border-b border-border bg-background p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(130px,0.7fr))_auto]"
      onSubmit={onSubmit}
    >
      {children}
      <Button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="submit"
      >
        <Icon name="filter" size={15} />
        اعمال فیلتر
      </Button>
    </form>
  );
}

```

---


### 10. InspectionPanel

**Path:** `src/features/support/components/support-finance/inspection-panel.tsx`

```tsx
import { type ReactNode } from 'react';

import { Icon, type IconName } from '@/shared/ui/icon';

export function InspectionPanel({
  children,
  title,
  icon,
}: {
  children: ReactNode;
  title: string;
  icon: IconName;
}) {
  return (
    <section
      className="overflow-hidden rounded-panel border border-border bg-surface shadow-card"
      aria-labelledby="inspection-panel-title"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-primary">
          <Icon name={icon} size={18} />
        </span>
        <h2 className="text-base" id="inspection-panel-title">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

```

---


### 11. LoadingRows

**Path:** `src/features/support/components/support-finance/loading-rows.tsx`

```tsx
export function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="در حال بارگذاری" role="status">
      {[1, 2, 3, 4].map((row) => (
        <div
          className="motion-safe:animate-pulse motion-reduce:animate-none rounded-panel border border-border bg-background p-4"
          key={row}
        >
          <div className="h-3 w-1/3 rounded bg-secondary" />
          <div className="mt-3 h-3 w-2/3 rounded bg-secondary" />
        </div>
      ))}
      <span className="sr-only">در حال دریافت اطلاعات...</span>
    </div>
  );
}

```

---


### 12. NotificationInspection

**Path:** `src/features/support/components/support-finance/notification-inspection.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import { type AdminNotificationListQuery, type AdminNotificationPage } from '@nova/api-client';

import { useAdminNotifications } from '@/features/support/api/notifications/admin-notifications-api';

import type { QueryResult } from '@/features/support/pages/admin-support-finance-page-shared';
import { NOTIFICATION_STATUSES } from '@/features/support/pages/admin-support-finance-page-shared';

import { FilterBar } from '@/features/support/components/support-finance/filter-bar';

import { InspectionPanel } from '@/features/support/components/support-finance/inspection-panel';

import { Pagination } from '@/features/support/components/support-finance/pagination';

import { QueryState } from '@/features/support/components/support-finance/query-state';

import { SelectFilter } from '@/features/support/components/support-finance/select-filter';

import { StatusBadge } from '@/features/support/components/support-finance/status-badge';

import { TextFilter } from '@/features/support/components/support-finance/text-filter';

import { formatDate } from '@/features/support/components/support-finance/format-date';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { ltr } from '@/features/support/components/support-finance/ltr';

export function NotificationInspection() {
  const [draftKind, setDraftKind] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [filters, setFilters] = useState<AdminNotificationListQuery>({ page: 1, limit: 12 });
  const query = useAdminNotifications(filters);
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      kind: draftKind || undefined,
      status: (draftStatus || undefined) as AdminNotificationListQuery['status'],
    });
  };

  return (
    <InspectionPanel title="تحویل اعلان‌ها" icon="bell">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="notification-kind"
          label="نوع اعلان"
          value={draftKind}
          onChange={setDraftKind}
          placeholder="مثلاً PAYMENT_SUCCEEDED"
          dir="ltr"
        />
        <SelectFilter
          id="notification-status"
          label="وضعیت تحویل"
          value={draftStatus}
          onChange={setDraftStatus}
          options={NOTIFICATION_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminNotificationPage>}
          emptyTitle="اعلانی پیدا نشد"
          emptyDescription="فیلترها را تغییر دهید یا بازه دیگری را بررسی کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست وضعیت تحویل اعلان‌ها</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">نوع اعلان</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">تلاش</th>
                      <th className="px-3 py-3 font-normal">زمان آماده‌سازی</th>
                      <th className="px-3 py-3 font-normal">آخرین وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((notification) => (
                      <tr className="border-b border-border last:border-b-0" key={notification.id}>
                        <td className="px-3 py-3">{ltr(notification.kind)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={notification.status} />
                        </td>
                        <td className="px-3 py-3">{formatNumber(notification.attempts)}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(notification.availableAt))}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {notification.processedAt
                            ? ltr(formatDate(notification.processedAt))
                            : notification.lastError
                              ? 'خطای تحویل ثبت شده'
                              : 'در انتظار نتیجه'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}

```

---


### 13. Pagination

**Path:** `src/features/support/components/support-finance/pagination.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

import { pageCount } from '@/features/support/components/support-finance/page-count';

export function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const pages = pageCount(total, limit);
  if (pages <= 1) {
    return <p className="text-[11px] text-muted-foreground">{formatNumber(total)} نتیجه</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-[11px] text-muted-foreground">
        صفحه {formatNumber(page)} از {formatNumber(pages)} · {formatNumber(total)} نتیجه
      </p>
      <div className="flex items-center gap-2" dir="ltr">
        <Button
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          aria-label="صفحه قبل"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="arrow-left" size={16} />
        </Button>
        <span className="min-w-11 text-center text-xs" dir="rtl">
          {formatNumber(page)}
        </span>
        <Button
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          aria-label="صفحه بعد"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <Icon name="arrow-right" size={16} />
        </Button>
      </div>
    </div>
  );
}

```

---


### 14. PaymentDetail

**Path:** `src/features/support/components/support-finance/payment-detail.tsx`

```tsx
import { type AdminPaymentAttempt } from '@nova/api-client';

import type { QueryResult } from '@/features/support/pages/admin-support-finance-page-shared';

import { DetailField } from '@/features/support/components/support-finance/detail-field';

import { LoadingRows } from '@/features/support/components/support-finance/loading-rows';

import { StateCard } from '@/features/support/components/support-finance/state-card';

import { StatusBadge } from '@/features/support/components/support-finance/status-badge';

import { adminOrderHref } from '@/features/support/components/support-finance/admin-order-href';

import { formatDate } from '@/features/support/components/support-finance/format-date';

import { formatToman } from '@/shared/utils/format-toman';

import { ltr } from '@/features/support/components/support-finance/ltr';

import { statusLabel } from '@/features/support/components/support-finance/status-label';

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

```

---


### 15. PaymentInspection

**Path:** `src/features/support/components/support-finance/payment-inspection.tsx`

```tsx
import { useState, type FormEvent } from 'react';
import {
  type AdminPaymentAttempt,
  type AdminPaymentListQuery,
  type AdminPaymentPage,
} from '@nova/api-client';
import { Button } from '@nova/ui';
import { useAdminPayment, useAdminPayments } from '@/features/support/api/payments/admin-payments-api';

import type { QueryResult } from '@/features/support/pages/admin-support-finance-page-shared';
import { PAYMENT_STATUSES } from '@/features/support/pages/admin-support-finance-page-shared';

import { FilterBar } from '@/features/support/components/support-finance/filter-bar';

import { InspectionPanel } from '@/features/support/components/support-finance/inspection-panel';

import { Pagination } from '@/features/support/components/support-finance/pagination';

import { PaymentDetail } from '@/features/support/components/support-finance/payment-detail';

import { QueryState } from '@/features/support/components/support-finance/query-state';

import { SelectFilter } from '@/features/support/components/support-finance/select-filter';

import { StatusBadge } from '@/features/support/components/support-finance/status-badge';

import { TextFilter } from '@/features/support/components/support-finance/text-filter';

import { adminOrderHref } from '@/features/support/components/support-finance/admin-order-href';

import { formatDate } from '@/features/support/components/support-finance/format-date';

import { formatToman } from '@/shared/utils/format-toman';

import { ltr } from '@/features/support/components/support-finance/ltr';

export function PaymentInspection() {
  const [draftStatus, setDraftStatus] = useState('');
  const [draftProvider, setDraftProvider] = useState('');
  const [draftOrderNumber, setDraftOrderNumber] = useState('');
  const [filters, setFilters] = useState<AdminPaymentListQuery>({ page: 1, limit: 12 });
  const [selectedId, setSelectedId] = useState('');
  const query = useAdminPayments(filters);
  const detailQuery = useAdminPayment(selectedId, Boolean(selectedId));

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedId('');
    setFilters({
      page: 1,
      limit: 12,
      status: (draftStatus || undefined) as AdminPaymentListQuery['status'],
      provider: draftProvider || undefined,
      orderNumber: draftOrderNumber || undefined,
    });
  };

  return (
    <InspectionPanel title="تلاش‌های پرداخت" icon="bag">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="payment-provider"
          label="درگاه"
          value={draftProvider}
          onChange={setDraftProvider}
          placeholder="مثلاً fake-gateway"
          dir="ltr"
        />
        <TextFilter
          id="payment-order"
          label="شماره سفارش"
          value={draftOrderNumber}
          onChange={setDraftOrderNumber}
          placeholder="NV-..."
          dir="ltr"
        />
        <SelectFilter
          id="payment-status"
          label="وضعیت پرداخت"
          value={draftStatus}
          onChange={setDraftStatus}
          options={PAYMENT_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminPaymentPage>}
          emptyTitle="تلاش پرداختی پیدا نشد"
          emptyDescription="با فیلترهای دیگری جست‌وجو کنید یا بعداً دوباره بررسی کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست تلاش‌های پرداخت</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">شناسه تلاش</th>
                      <th className="px-3 py-3 font-normal">سفارش</th>
                      <th className="px-3 py-3 font-normal">درگاه</th>
                      <th className="px-3 py-3 font-normal">مبلغ</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">ثبت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((payment) => (
                      <tr
                        className={`border-b border-border last:border-b-0 ${selectedId === payment.id ? 'bg-accent-soft/40' : ''}`}
                        key={payment.id}
                      >
                        <td className="px-3 py-3">
                          <Button
                            className="min-h-11 rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            type="button"
                            onClick={() => setSelectedId(payment.id)}
                          >
                            {ltr(payment.id, 'max-w-[150px] truncate')}
                          </Button>
                        </td>
                        <td className="px-3 py-3">
                          <a
                            className="inline-flex min-h-11 items-center rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={adminOrderHref(payment.orderNumber)}
                          >
                            {ltr(payment.orderNumber)}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{payment.provider}</td>
                        <td className="px-3 py-3">{formatToman(payment.amountToman)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(payment.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
        {selectedId ? (
          <PaymentDetail query={detailQuery as QueryResult<AdminPaymentAttempt>} />
        ) : null}
      </div>
    </InspectionPanel>
  );
}

```

---


### 16. QueryState

**Path:** `src/features/support/components/support-finance/query-state.tsx`

```tsx
import { type ReactNode } from 'react';

import type { QueryResult } from '@/features/support/pages/admin-support-finance-page-shared';

import { LoadingRows } from '@/features/support/components/support-finance/loading-rows';

import { StateCard } from '@/features/support/components/support-finance/state-card';

import { isOfflineError } from '@/features/support/components/support-finance/is-offline-error';

export function QueryState<T>({
  query,
  emptyTitle,
  emptyDescription,
  children,
}: {
  query: QueryResult<T>;
  emptyTitle: string;
  emptyDescription: string;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <LoadingRows />;
  if (query.isError) {
    const offline = isOfflineError(query.error);
    return (
      <StateCard
        icon={offline ? 'refresh' : 'warning'}
        title={offline ? 'اتصال شبکه در دسترس نیست' : 'دریافت اطلاعات انجام نشد'}
        description={
          offline
            ? 'اتصال را بررسی کنید و برای دریافت دوباره اطلاعات تلاش کنید.'
            : 'اطلاعات فعلاً در دسترس نیست؛ می‌توانید دوباره تلاش کنید.'
        }
        action="تلاش دوباره"
        onAction={() => void query.refetch()}
        role="alert"
      />
    );
  }
  if (!query.data) return null;
  const items = query.data as { items?: unknown[] };
  if (Array.isArray(items.items) && items.items.length === 0) {
    return (
      <StateCard icon="layers" title={emptyTitle} description={emptyDescription} role="status" />
    );
  }
  return <>{children(query.data)}</>;
}

```

---


### 17. SelectFilter

**Path:** `src/features/support/components/support-finance/select-filter.tsx`

```tsx
import { Select as UiSelect } from '@nova/ui';

import { statusLabel } from '@/features/support/components/support-finance/status-label';

export function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[11px] text-muted-foreground" htmlFor={id}>
      {label}
      <UiSelect
        className="min-h-11 w-full appearance-none rounded-control border border-border bg-surface px-3 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">همه</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {statusLabel(option)}
          </option>
        ))}
      </UiSelect>
    </label>
  );
}

```

---


### 18. StateCard

**Path:** `src/features/support/components/support-finance/state-card.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon, type IconName } from '@/shared/ui/icon';

export function StateCard({
  icon,
  title,
  description,
  action,
  onAction,
  role,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  role: 'alert' | 'status';
}) {
  return (
    <section
      className="border border-dashed border-border bg-background p-8 text-center"
      role={role}
    >
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-primary">
        <Icon name={icon} size={21} />
      </span>
      <h2 className="mt-4 text-base leading-7">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-muted-foreground">{description}</p>
      {action && onAction ? (
        <Button
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          onClick={onAction}
        >
          <Icon name="refresh" size={15} />
          {action}
        </Button>
      ) : null}
    </section>
  );
}

```

---


### 19. StatusBadge

**Path:** `src/features/support/components/support-finance/status-badge.tsx`

```tsx
import { Badge } from '@nova/ui';

import { statusBadgeVariant } from '@/features/support/components/support-finance/status-badge-variant';

import { statusLabel } from '@/features/support/components/support-finance/status-label';

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>;
}

```

---


### 20. TextFilter

**Path:** `src/features/support/components/support-finance/text-filter.tsx`

```tsx
import { Input as UiInput } from '@nova/ui';

export function TextFilter({
  id,
  label,
  value,
  onChange,
  placeholder,
  dir = 'rtl',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[11px] text-muted-foreground" htmlFor={id}>
      {label}
      <UiInput
        className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
        id={id}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

```

---


### 21. Icon

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

- Page: `src/features/support/components/support-finance/SupportFinanceView.tsx`
- Custom component files: 21
- Total files included: 22
