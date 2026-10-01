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
