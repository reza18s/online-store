# Page Context

## Page

**Path:** `src/app/layouts/AdminWorkspaceLayout.tsx`

```tsx
import { type ReactNode } from 'react';
import { Input as UiInput } from '@nova/ui';

import { Icon, type IconName } from '@/shared/ui/icon';

import { Logo } from '@/shared/ui/site-shell';

import { AdminLogoutButton } from '@/features/auth';

import { hasAdminStaffRole, type AdminStaffRole } from '@/features/orders';

import '@/styles/admin-reference.css';

type AdminNavigationItem = {
  key: string;
  label: string;
  icon: IconName;
  requiredRoles: AdminStaffRole[];
};

const ALL_STAFF_ROLES: AdminStaffRole[] = ['support', 'operations', 'admin'];
const ADMIN_ONLY: AdminStaffRole[] = ['admin'];
const OPERATIONS_OR_ADMIN: AdminStaffRole[] = ['operations', 'admin'];

const ADMIN_NAVIGATION_DEFINITIONS: Array<[string, string, IconName, AdminStaffRole[]]> = [
  ['admin', 'داشبورد', 'home', ADMIN_ONLY],
  ['catalog', 'محصولات', 'bag', ALL_STAFF_ROLES],
  ['catalog/categories', 'دسته‌بندی‌ها', 'layers', ALL_STAFF_ROLES],
  ['orders', 'سفارش‌ها', 'package', ALL_STAFF_ROLES],
  ['customers', 'مشتریان', 'users', ALL_STAFF_ROLES],
  ['payments', 'پرداخت‌ها', 'bag', ADMIN_ONLY],
  ['content', 'محتوا', 'book', ADMIN_ONLY],
  ['audit', 'گزارش‌ها', 'eye', ADMIN_ONLY],
  ['notifications', 'اعلان‌ها', 'bell', OPERATIONS_OR_ADMIN],
  ['inventory', 'موجودی', 'warehouse', OPERATIONS_OR_ADMIN],
];

const ADMIN_NAVIGATION: AdminNavigationItem[] = ADMIN_NAVIGATION_DEFINITIONS.map(
  ([key, label, icon, requiredRoles]) => ({
    key,
    label,
    icon,
    requiredRoles,
  }),
);

const ADMIN_MOBILE_NAVIGATION_DEFINITIONS: Array<[string, string, IconName, AdminStaffRole[]]> = [
  ['admin', 'داشبورد', 'home', ADMIN_ONLY],
  ['orders', 'سفارش‌ها', 'package', ALL_STAFF_ROLES],
  ['catalog', 'محصولات', 'bag', ALL_STAFF_ROLES],
  ['content', 'محتوا', 'book', ADMIN_ONLY],
  ['inventory', 'موجودی', 'warehouse', OPERATIONS_OR_ADMIN],
];

const ADMIN_MOBILE_NAVIGATION: AdminNavigationItem[] = ADMIN_MOBILE_NAVIGATION_DEFINITIONS.map(
  ([key, label, icon, requiredRoles]) => ({
    key,
    label,
    icon,
    requiredRoles,
  }),
);

function filterNavigation(
  navigation: AdminNavigationItem[],
  staffRoles: readonly string[] | undefined,
): AdminNavigationItem[] {
  return navigation.filter((item) => hasAdminStaffRole(staffRoles, item.requiredRoles));
}

export function getAdminWorkspaceNavigation(
  staffRoles: readonly string[] | undefined,
): AdminNavigationItem[] {
  return filterNavigation(ADMIN_NAVIGATION, staffRoles);
}

export function getAdminMobileNavigation(
  staffRoles: readonly string[] | undefined,
): AdminNavigationItem[] {
  return filterNavigation(ADMIN_MOBILE_NAVIGATION, staffRoles);
}

export function AdminWorkspaceLayout({
  page,
  adminDisplayName,
  staffRoles,
  children,
}: {
  page: string;
  adminDisplayName: string;
  staffRoles?: readonly string[];
  children: ReactNode;
}) {
  const nav = getAdminWorkspaceNavigation(staffRoles);
  const mobileNav = getAdminMobileNavigation(staffRoles);
  const canViewNotifications = hasAdminStaffRole(staffRoles, OPERATIONS_OR_ADMIN);
  const isNavActive = (key: string) =>
    page === key ||
    (key === 'catalog' && page.startsWith('catalog/products')) ||
    (key !== 'catalog' && page.startsWith(`${key}/`));

  return (
    <div className="admin-shell admin-reference-shell min-h-svh bg-background text-foreground">
      <aside className="admin-sidebar admin-reference-sidebar flex-[0_0_194px] px-3 py-6">
        <Logo descriptor="ADMIN PANEL" />
        <span className="admin-sidebar__label">فضای مدیریت</span>
        <nav className="flex flex-col gap-1" aria-label="ناوبری مدیریت">
          {nav.map((item) => (
            <a
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-xs transition-colors ${isNavActive(item.key ?? '') ? 'is-active' : ''}`}
              href={`/admin${item.key === 'admin' ? '' : `/${item.key}`}`}
              key={item.key}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto border-t border-border pt-5">
          <div className="flex items-center gap-3 px-2">
            <img
              className="h-10 w-10 rounded-full object-cover"
              src="/assets/nova-hero-men.webp"
              alt={`پروفایل ${adminDisplayName}`}
            />
            <div className="min-w-0 text-right">
              <strong className="block truncate text-xs">{adminDisplayName}</strong>
              <small className="mt-1 block text-xs opacity-70">نشست فعال</small>
            </div>
          </div>
          <AdminLogoutButton className="mt-4 flex min-h-10 w-full items-center gap-2 border-0 bg-transparent px-2 text-right text-xs opacity-75 transition-colors hover:opacity-100 disabled:opacity-50" />
        </div>
      </aside>
      <section className="admin-content admin-reference-content min-h-svh w-full">
        <header
          className="admin-topbar admin-reference-topbar !flex-row min-h-[68px] gap-3 bg-surface px-4 py-3 md:px-6"
          dir="ltr"
        >
          <div className="admin-reference-mobile-head w-full items-center justify-between" dir="ltr">
            <a className="icon-button" href="/admin" aria-label="داشبورد مدیریت">
              <Icon name="home" size={20} />
            </a>
            <Logo descriptor="ATELIER EDITORIAL" />
            <div className="flex items-center gap-2">
              {canViewNotifications ? (
                <a className="icon-button" href="/admin/notifications" aria-label="اعلان‌ها">
                  <Icon name="bell" size={19} />
                </a>
              ) : null}
              <img
                className="h-9 w-9 rounded-full bg-secondary object-cover"
                src="/assets/nova-hero-men.webp"
                alt={`پروفایل ${adminDisplayName}`}
              />
            </div>
          </div>
          <form
            className="hidden w-full max-w-[375px] items-center gap-2 rounded-control border border-border bg-background px-3 md:flex"
            dir="rtl"
            action="/admin/catalog"
            method="get"
          >
            <Icon name="search" size={18} className="text-muted-foreground" />
            <UiInput
              className="min-h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
              aria-label="جست‌وجو در پنل مدیریت"
              name="q"
              placeholder="جست‌وجو در محصولات ..."
            />
          </form>
          <div className="admin-reference-desktop-head ml-auto items-center gap-4" dir="rtl">
            {canViewNotifications ? <a
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
              href="/admin/notifications"
              aria-label="اعلان‌ها"
            >
              <Icon name="bell" size={19} />
            </a> : null}
            <img
              className="h-9 w-9 rounded-full bg-secondary object-cover"
              src="/assets/nova-hero-men.webp"
              alt={`پروفایل ${adminDisplayName}`}
            />
            <span className="hidden text-xs text-muted-foreground lg:inline">
              نشست فعال
            </span>
          </div>
        </header>
        <div className="admin-page admin-reference-page bg-background p-4 pb-24 md:p-6 md:pb-8 lg:p-8">{children}</div>
      </section>
      <nav
        className="admin-reference-bottom-nav fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur md:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {mobileNav.map(({ key, label, icon }) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs ${isNavActive(key ?? '') ? 'text-primary' : 'text-muted-foreground'}`}
            href={`/admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon} size={19} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
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


### 2. Input

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


### 3. AdminLogoutButton

**Path:** `src/features/auth/api/admin-auth.ts`

```ts
export { isAdminQueryKey } from '@/features/auth/api/is-admin-query-key';
export { isStaffCurrentQueryKey } from '@/features/auth/api/is-staff-current-query-key';
export { isStaffProtectedQueryKey } from '@/features/auth/api/is-staff-protected-query-key';
export { isStaffAuthFailure } from '@/features/auth/api/is-staff-auth-failure';
export { isStaffAuthorizationFailure } from '@/features/auth/api/is-staff-authorization-failure';
export { isStaffProtectedMutationKey } from '@/features/auth/api/is-staff-protected-mutation-key';
export { clearStaffSessionCache } from '@/features/auth/api/clear-staff-session-cache';
export { handleStaffSessionFailure } from '@/features/auth/api/handle-staff-session-failure';
export { staffAuthCsrfPath } from '@/features/auth/api/staff-auth-paths';
export { fetchStaffUser } from '@/features/auth/api/fetch-staff-user';
export { loginStaff } from '@/features/auth/api/login-staff';
export { logoutStaff } from '@/features/auth/api/logout-staff';
export { useStaffUser } from '@/features/auth/api/use-staff-user';
export { useStaffLogin } from '@/features/auth/api/use-staff-login';
export { useStaffLogout } from '@/features/auth/api/use-staff-logout';

```

---


### 4. AdminLogoutButton

**Path:** `src/features/auth/components/AdminLogoutButton.tsx`

```tsx
import { Button } from '@nova/ui';

import { useStaffLogout } from '@/features/auth/api/use-staff-logout';

import { Icon } from '@/shared/ui/icon';

import { navigateToRoute } from '@/app/routing/navigate-to-route';

export function AdminLogoutButton({
  className = '',
  compact = false,
  label = 'خروج از حساب',
}: {
  className?: string;
  compact?: boolean;
  label?: string;
}) {
  const logoutMutation = useStaffLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        navigateToRoute('/admin/login');
      },
    });
  };

  return (
    <Button
      className={className}
      type="button"
      disabled={logoutMutation.isPending}
      aria-busy={logoutMutation.isPending}
      aria-label={compact ? label : undefined}
      onClick={handleLogout}
    >
      <Icon name="arrow-right" size={17} />
      {compact ? (
        <span className="sr-only">{logoutMutation.isPending ? 'در حال خروج...' : label}</span>
      ) : logoutMutation.isPending ? (
        'در حال خروج...'
      ) : (
        label
      )}
    </Button>
  );
}

```

---


### 5. Icon

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


### 6. Logo

**Path:** `src/shared/ui/logo.tsx`

```tsx
export function Logo({ descriptor = 'ATELIER EDITORIAL' }: { descriptor?: string } = {}) {
  return (
    <a
      className="brand-lockup inline-flex w-max flex-col items-center leading-none"
      href="/admin"
      aria-label="NOVA، داشبورد مدیریت"
    >
      <span className="brand-lockup__name">NOVA</span>
      <span className="brand-lockup__descriptor !text-muted-foreground">{descriptor}</span>
    </a>
  );
}

```

---


## Summary

- Page: `src/app/layouts/AdminWorkspaceLayout.tsx`
- Custom component files: 6
- Total files included: 7
