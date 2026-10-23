# Page Context

## Page

**Path:** `src/features/account/pages/customer-account-page.tsx`

```tsx
import { useState } from 'react';

import { useCurrentCustomer, useLogoutCustomer } from '@/features/auth/api/auth-api';
import { useCustomerOrders } from '@/features/orders/api/orders-api';
import { useCustomerAddresses } from '@/features/account/api/addresses-api';
import { Icon } from '@/shared/ui/icon';
import {
  apiErrorMessage,
  formatPersianDate,
  formatToman,
  isCustomerActive,
  isOfflineError,
  isUnauthorizedError,
  orderStatusCopy,
  useCustomerCacheBoundary,
  useOnlineStatus,
} from '@/features/account/state/account-state';

import type { AccountSection } from '@/features/account/pages/account-pages-shared';
import { accountTitles } from '@/features/account/pages/account-pages-shared';

import { AccountLayout } from '@/features/account/components/account-layout';

import { CustomerOrderListContent } from '@/features/account/components/customer-order-list-content';

import { EmptyState } from '@/features/account/components/empty-state';

import { InlineQueryError } from '@/features/account/components/inline-query-error';

import { LoadingState } from '@/features/account/components/loading-state';

import { PageFrame } from '@/features/account/pages/page-frame';

import { ProfilePanel } from '@/features/account/components/profile-panel';

import { SessionState } from '@/features/account/components/session-state';

import { navigateToRoute } from '@/app/routing/route';

export function CustomerAccountPage({ section = 'dashboard' }: { section?: string }) {
  const customerQuery = useCurrentCustomer();
  const customer = customerQuery.data;
  const activeSection: AccountSection =
    section in accountTitles ? (section as AccountSection) : 'dashboard';
  const ordersQuery = useCustomerOrders({ page: 1, limit: 10 }, isCustomerActive(customer));
  const addressesQuery = useCustomerAddresses(
    activeSection === 'dashboard' && isCustomerActive(customer),
  );
  const logoutMutation = useLogoutCustomer();
  const [logoutError, setLogoutError] = useState('');
  const online = useOnlineStatus();
  useCustomerCacheBoundary(customer?.id, isUnauthorizedError(customerQuery.error));

  if (customerQuery.isPending)
    return (
      <PageFrame>
        <LoadingState label="در حال بارگذاری حساب کاربری" />
      </PageFrame>
    );
  if (customerQuery.isError) {
    const expired = isUnauthorizedError(customerQuery.error);
    const offline = !online || isOfflineError(customerQuery.error);
    return (
      <PageFrame>
        <EmptyState
          title={
            expired
              ? 'نشست شما منقضی شده است'
              : offline
                ? 'اتصال اینترنت برقرار نیست'
                : 'حساب کاربری بارگذاری نشد'
          }
          description={
            expired
              ? 'برای مشاهده امن سفارش‌ها و آدرس‌ها دوباره وارد حساب شوید.'
              : offline
                ? 'اتصال را بررسی کنید و دوباره تلاش کنید.'
                : apiErrorMessage(customerQuery.error, 'دریافت اطلاعات حساب ممکن نشد.')
          }
          action={expired ? 'ورود دوباره' : 'تلاش دوباره'}
          href={expired ? '/auth' : '/account'}
          onAction={expired ? undefined : () => void customerQuery.refetch()}
          icon={expired ? 'user' : offline ? 'refresh' : 'warning'}
        />
      </PageFrame>
    );
  }
  if (!customer || !isCustomerActive(customer)) {
    return (
      <SessionState>
        <span />
      </SessionState>
    );
  }

  const signOut = async () => {
    setLogoutError('');
    try {
      await logoutMutation.mutateAsync();
      navigateToRoute('/');
    } catch (error) {
      setLogoutError(apiErrorMessage(error, 'خروج از حساب انجام نشد؛ دوباره تلاش کنید.'));
    }
  };

  return (
    <AccountLayout
      customer={customer}
      section={activeSection}
      onLogout={() => void signOut()}
      logoutPending={logoutMutation.isPending}
      logoutError={logoutError}
    >
      <header className="simple-page-header">
        <span className="section-heading__eyebrow">MY NOVA / ۰۱</span>
        <h1>{accountTitles[activeSection]}</h1>
        <p>اطلاعات و سفارش‌های شما در یک نگاه.</p>
      </header>
      {activeSection === 'dashboard' ? (
        <section className="account-welcome" aria-labelledby="account-welcome-title">
          <img src="/assets/nova-women-lifestyle.webp" alt="استایل آرام و روزمره نوا" />
          <div>
            <span className="section-heading__eyebrow">NOVA / ATELIER</span>
            <h2 id="account-welcome-title">خوش آمدید به دنیای نوا</h2>
            <p>انتخاب‌های شما، سفارش‌ها و پیشنهادهای شخصی‌سازی‌شده در یک نگاه.</p>
            <a href="/products/new">
              دیدن انتخاب‌های تازه <Icon name="arrow-left" size={15} />
            </a>
          </div>
        </section>
      ) : null}
      {activeSection === 'profile' ? (
        <ProfilePanel customer={customer} />
      ) : activeSection === 'orders' ? (
        <CustomerOrderListContent query={ordersQuery} />
      ) : (
        <div className="nova-account-dashboard">
          <section className="account-panel nova-account-dashboard__orders">
            <header className="nova-account-dashboard__header">
              <div>
                <span className="section-heading__eyebrow">مرور سفارش‌ها</span>
                <h2>سفارش‌های اخیر</h2>
              </div>
              <a className="text-link" href="/account/orders">
                مشاهده همه <Icon name="arrow-left" size={15} />
              </a>
            </header>
            {ordersQuery.isPending ? (
              <div
                className="nova-account-dashboard__loading"
                role="status"
                aria-label="در حال بارگذاری سفارش‌ها"
              >
                <div />
                <div />
                <div />
              </div>
            ) : ordersQuery.isError ? (
              <InlineQueryError
                error={ordersQuery.error}
                onRetry={() => void ordersQuery.refetch()}
              />
            ) : ordersQuery.data?.items.length ? (
              <ul className="nova-account-dashboard__order-list">
                {ordersQuery.data.items.slice(0, 3).map((order) => (
                  <li className="nova-account-dashboard__order" key={order.orderNumber}>
                    <div className="nova-account-dashboard__order-id">
                      <span aria-hidden="true">
                        <Icon name="package" size={18} />
                      </span>
                      <div>
                        <strong>سفارش</strong>
                        <bdi dir="ltr">{order.orderNumber}</bdi>
                      </div>
                    </div>
                    <small>{formatPersianDate(order.createdAt)}</small>
                    <div className="nova-account-dashboard__order-status">
                      <strong>{formatToman(order.totalToman)}</strong>
                      <span>{orderStatusCopy[order.status]}</span>
                    </div>
                    <a
                      href={`/order/${encodeURIComponent(order.orderNumber)}`}
                      aria-label={`مشاهده جزئیات سفارش ${order.orderNumber}`}
                    >
                      <Icon name="arrow-left" size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="nova-account-dashboard__empty">
                <p>هنوز سفارشی ندارید. اولین انتخاب خود را از مجموعه نوا شروع کنید.</p>
                <a className="text-link" href="/products">
                  مشاهده فروشگاه <Icon name="arrow-left" size={15} />
                </a>
              </div>
            )}
          </section>

          <section className="account-panel nova-account-dashboard__addresses">
            <header className="nova-account-dashboard__header">
              <div>
                <span className="section-heading__eyebrow">تحویل سفارش‌ها</span>
                <h2>آدرس‌های ذخیره‌شده</h2>
              </div>
              <a className="text-link" href="/account/addresses">
                مدیریت آدرس‌ها <Icon name="arrow-left" size={15} />
              </a>
            </header>
            {addressesQuery.isPending ? (
              <div
                className="nova-account-dashboard__loading"
                role="status"
                aria-label="در حال بارگذاری آدرس‌ها"
              >
                <div />
                <div />
              </div>
            ) : addressesQuery.isError ? (
              <InlineQueryError
                error={addressesQuery.error}
                onRetry={() => void addressesQuery.refetch()}
              />
            ) : addressesQuery.data?.length ? (
              <ul className="nova-account-dashboard__address-list">
                {addressesQuery.data.slice(0, 2).map((address) => (
                  <li key={address.id}>
                    <a
                      className="nova-account-dashboard__address"
                      href={`/account/addresses/edit/${encodeURIComponent(address.id)}`}
                    >
                      <span aria-hidden="true">
                        <Icon name="home" size={18} />
                      </span>
                      <div>
                        <strong>{address.label}</strong>
                        <small>
                          {address.recipientName} · {address.city}، {address.province}
                        </small>
                        <small className="nova-account-dashboard__address-line">
                          {address.addressLine}
                        </small>
                      </div>
                      {address.isDefault ? <b>پیش‌فرض</b> : null}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="nova-account-dashboard__empty">
                <p>هنوز نشانی‌ای ثبت نکرده‌اید.</p>
                <a className="text-link" href="/account/addresses/create">
                  ثبت آدرس جدید <Icon name="arrow-left" size={15} />
                </a>
              </div>
            )}
          </section>

          <section className="account-panel nova-account-dashboard__shortcuts">
            <a href="/account/profile">
              <Icon name="user" size={19} />
              <span>اطلاعات شخصی</span>
              <Icon name="arrow-left" size={15} />
            </a>
            <a href="/account/orders">
              <Icon name="package" size={19} />
              <span>پیگیری سفارش‌ها</span>
              <Icon name="arrow-left" size={15} />
            </a>
            <a href="/support">
              <Icon name="users" size={19} />
              <span>پشتیبانی نوا</span>
              <Icon name="arrow-left" size={15} />
            </a>
          </section>
        </div>
      )}
    </AccountLayout>
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


### 2. AccountLayout

**Path:** `src/features/account/components/account-layout.tsx`

```tsx
import { type ReactNode } from 'react';

import { Button } from '@nova/ui';

import type { useCurrentCustomer } from '@/features/auth/api/auth-api';

import { Icon } from '@/shared/ui/icon';

import type { AccountSection } from '@/features/account/pages/account-pages-shared';
import { accountNavigation } from '@/features/account/pages/account-pages-shared';

import { PageFrame } from '@/features/account/pages/page-frame';

export function AccountLayout({
  customer,
  section,
  onLogout,
  logoutPending,
  logoutError,
  children,
}: {
  customer: NonNullable<ReturnType<typeof useCurrentCustomer>['data']>;
  section: AccountSection;
  onLogout: () => void;
  logoutPending: boolean;
  logoutError: string;
  children: ReactNode;
}) {
  return (
    <PageFrame className="account-page">
      <div className="breadcrumb">
        <a href="/">خانه</a>
        <span>/</span>
        <span>حساب کاربری</span>
      </div>
      <div className="account-layout lg:grid">
        <aside className="account-nav" aria-label="بخش‌های حساب کاربری">
          <div className="account-nav__profile">
            <span aria-hidden="true">ن</span>
            <div>
              <strong>{customer.email ?? 'مشتری نوا'}</strong>
              <small dir="ltr">{customer.phone}</small>
            </div>
          </div>
          {accountNavigation.map((item) => (
            <a
              className={section === item.key ? 'is-active' : ''}
              href={`/account${item.key === 'dashboard' ? '' : `/${item.key}`}`}
              key={item.key}
              aria-current={section === item.key ? 'page' : undefined}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </a>
          ))}
          {logoutError ? (
            <p className="mt-3 px-3 text-sm leading-6 text-destructive" role="alert">
              {logoutError}
            </p>
          ) : null}
          <Button
            className="mt-3 flex min-h-11 items-center gap-2 px-3 text-sm text-destructive transition-colors hover:text-destructive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={logoutPending}
            onClick={onLogout}
            type="button"
          >
            <Icon name="close" size={17} />
            {logoutPending ? 'در حال خروج...' : 'خروج از حساب'}
          </Button>
          <div className="account-nav__promo">
            <img src="/assets/nova-materials.webp" alt="بافت‌های طبیعی آتلیه نوا" />
            <div>
              <span>NOVA / ATELIER</span>
              <strong>به دنیای نوا بپیوندید</strong>
              <a href="/campaign">مشاهده کالکشن</a>
            </div>
          </div>
        </aside>
        <section className="account-content">{children}</section>
      </div>
    </PageFrame>
  );
}

```

---


### 3. CustomerOrderListContent

**Path:** `src/features/account/components/customer-order-list-content.tsx`

```tsx
import { useState } from 'react';
import { type CheckoutOrderStatus } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useCustomerOrders } from '@/features/orders/api/orders-api';
import { Icon } from '@/shared/ui/icon';
import {
  formatPersianDate,
  formatToman,
  orderStatusCopy,
  useOnlineStatus,
} from '@/features/account/state/account-state';

import { EmptyState } from '@/features/account/components/empty-state';

import { InlineQueryError } from '@/features/account/components/inline-query-error';

export function CustomerOrderListContent({
  query,
}: {
  query: ReturnType<typeof useCustomerOrders>;
}) {
  const [status, setStatus] = useState<'ALL' | CheckoutOrderStatus>('ALL');
  const online = useOnlineStatus();
  const filteredQuery = useCustomerOrders(
    { page: 1, limit: 10, status: status === 'ALL' ? undefined : status },
    status !== 'ALL',
  );
  const activeQuery = status === 'ALL' ? query : filteredQuery;
  const orders = activeQuery.data?.items ?? [];
  const statuses: Array<'ALL' | CheckoutOrderStatus> = [
    'ALL',
    'PENDING_PAYMENT',
    'CONFIRMED',
    'PREPARING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ];
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="فیلتر سفارش‌ها">
        {statuses.map((item) => (
          <Button
            className={`min-h-11 border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${status === item ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`}
            key={item}
            onClick={() => setStatus(item)}
            type="button"
          >
            {item === 'ALL' ? 'همه' : orderStatusCopy[item]}
          </Button>
        ))}
      </div>
      {activeQuery.isPending ? (
        <div
          className="account-order-list animate-pulse"
          role="status"
          aria-label="در حال بارگذاری سفارش‌ها"
        >
          {[1, 2, 3].map((item) => (
            <div className="h-20 rounded bg-secondary" key={item} />
          ))}
        </div>
      ) : null}
      {activeQuery.isError ? (
        <InlineQueryError error={activeQuery.error} onRetry={() => void activeQuery.refetch()} />
      ) : null}
      {!activeQuery.isPending && !activeQuery.isError && orders.length === 0 ? (
        <EmptyState
          title="هنوز سفارشی ثبت نکرده‌اید"
          description="وقتی اولین خرید خود را انجام دهید، وضعیت آن را همین‌جا دنبال می‌کنید."
          action="مشاهده فروشگاه"
          href="/products"
          icon="package"
        />
      ) : null}
      {!activeQuery.isPending && !activeQuery.isError && orders.length > 0 ? (
        <div className="account-order-list">
          {orders.map((order) => (
            <a
              className="order-card"
              href={`/order/${encodeURIComponent(order.orderNumber)}`}
              key={order.orderId}
            >
              <div>
                <span dir="ltr">{order.orderNumber}</span>
                <small>
                  {formatPersianDate(order.createdAt)} · {formatToman(order.totalToman)}
                </small>
              </div>
              <strong>{orderStatusCopy[order.status]}</strong>
              <Icon name="arrow-left" size={17} />
            </a>
          ))}
        </div>
      ) : null}
      {!online ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          اتصال فعلی قطع است؛ اقدام‌های سفارش فقط پس از اتصال انجام می‌شوند.
        </p>
      ) : null}
    </>
  );
}

```

---


### 4. EmptyState

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


### 5. InlineQueryError

**Path:** `src/features/account/components/inline-query-error.tsx`

```tsx
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';
import {
  apiErrorMessage,
  isOfflineError,
  isPermissionError,
  isUnauthorizedError,
} from '@/features/account/state/account-state';

export function InlineQueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const offline = isOfflineError(error);
  return (
    <div className="inline-message inline-message--error" role="alert">
      <Icon name={offline ? 'refresh' : 'warning'} size={16} />
      <span>
        {offline
          ? 'اتصال برقرار نیست؛ اطلاعات خصوصی شما پس از اتصال دوباره بارگذاری می‌شود.'
          : isPermissionError(error)
            ? 'دسترسی به این اطلاعات ممکن نیست.'
            : apiErrorMessage(error, 'دریافت اطلاعات انجام نشد.')}
      </span>
      {!isPermissionError(error) && !isUnauthorizedError(error) ? (
        <Button
          className="mr-auto min-h-8 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={onRetry}
          type="button"
        >
          تلاش دوباره
        </Button>
      ) : null}
    </div>
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


### 7. ProfilePanel

**Path:** `src/features/account/components/profile-panel.tsx`

```tsx
import { Icon } from '@/shared/ui/icon';

export function ProfilePanel({
  customer,
}: {
  customer: { email: string | null; phone: string; status: string };
}) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <div className="account-panel">
        <span className="section-heading__eyebrow">اطلاعات تماس</span>
        <h2>شماره موبایل</h2>
        <p dir="ltr">{customer.phone}</p>
        <h2 className="mt-5">ایمیل</h2>
        <p dir="ltr">{customer.email ?? 'ثبت نشده'}</p>
      </div>
      <div className="account-panel">
        <span className="section-heading__eyebrow">وضعیت حساب</span>
        <h2>{customer.status === 'ACTIVE' ? 'حساب فعال' : 'حساب محدود'}</h2>
        <p>برای تغییر اطلاعات ورود یا کمک درباره حساب، با پشتیبانی نوا در تماس باشید.</p>
        <a className="text-link" href="/support">
          ارتباط با پشتیبانی <Icon name="arrow-left" size={15} />
        </a>
      </div>
    </section>
  );
}

```

---


### 8. SessionState

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


### 9. PageFrame

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


### 10. Icon

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

- Page: `src/features/account/pages/customer-account-page.tsx`
- Custom component files: 10
- Total files included: 11
