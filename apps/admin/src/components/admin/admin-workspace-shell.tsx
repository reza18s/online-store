import { type ReactNode } from 'react';
import { Button, Input as UiInput } from '@nova/ui';

import { Icon, type IconName } from '../ui/icon';

import { Logo } from '../ui/site-shell';

import { AdminLogoutButton } from './admin-logout-button';

export function AdminWorkspaceShell({
  page,
  allowDevelopmentPreview,
  adminDisplayName,
  adminAccountLabel,
  children,
}: {
  page: string;
  allowDevelopmentPreview: boolean;
  adminDisplayName: string;
  adminAccountLabel: string;
  children: ReactNode;
}) {
  const nav = [
    ['admin', 'داشبورد', 'home'],
    ['catalog', 'محصولات', 'bag'],
    ['catalog/categories', 'دسته‌بندی‌ها', 'layers'],
    ['orders', 'سفارش‌ها', 'package'],
    ['customers', 'مشتریان', 'users'],
    ['marketing', 'بازاریابی', 'send'],
    ['content', 'محتوا', 'book'],
    ['audit', 'گزارش‌ها', 'eye'],
    ['promotions', 'تخفیف‌ها', 'tag'],
    ['operations', 'تنظیمات', 'settings'],
  ].map(([key, label, icon]) => ({ key, label, icon: icon as IconName }));
  const isNavActive = (key: string) =>
    page === key ||
    (key === 'catalog' && page.startsWith('catalog/products')) ||
    (key !== 'catalog' && page.startsWith(`${key}/`));

  return (
    <main className="admin-shell min-h-svh bg-background text-foreground">
      <aside className="admin-sidebar flex-[0_0_194px] px-3 py-6">
        <Logo descriptor="ADMIN PANEL" />
        <span className="admin-sidebar__label">فضای مدیریت</span>
        <nav className="flex flex-col gap-1" aria-label="ناوبری مدیریت">
          {nav.map((item) => (
            <a
              className={`flex min-h-11 items-center gap-3 rounded-md px-3 text-xs transition-colors ${isNavActive(item.key ?? '') ? 'is-active' : ''}`}
              href={`#admin${item.key === 'admin' ? '' : `/${item.key}`}`}
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
              alt={allowDevelopmentPreview ? '' : `پروفایل ${adminDisplayName}`}
            />
            <div className="min-w-0 text-right">
              <strong className="block truncate text-xs">{adminDisplayName}</strong>
              <small className="mt-1 block text-[9px] opacity-70">{adminAccountLabel}</small>
            </div>
          </div>
          <AdminLogoutButton className="mt-4 flex min-h-10 w-full items-center gap-2 border-0 bg-transparent px-2 text-right text-[10px] opacity-75 transition-colors hover:opacity-100 disabled:opacity-50" />
        </div>
      </aside>
      <section className="admin-content min-h-svh w-full">
        <header
          className="admin-topbar !flex-row min-h-[68px] gap-3 bg-surface px-4 py-3 md:px-6"
          dir="ltr"
        >
          <div className="!flex !flex-row w-full items-center justify-between md:!hidden" dir="ltr">
            <AdminLogoutButton
              compact
              label="خروج"
              className="icon-button border-0 disabled:opacity-50"
            />
            <a className="icon-button" href="#admin" aria-label="داشبورد">
              <Icon name="menu" size={20} />
            </a>
            <Logo descriptor="ADMIN PANEL" />
            <a className="icon-button" href="#admin" aria-label="اعلان‌ها">
              <Icon name="bell" size={19} />
            </a>
          </div>
          <form
            className="hidden w-full max-w-[375px] items-center gap-2 rounded-control border border-border bg-background px-3 md:flex"
            dir="rtl"
            onSubmit={(event) => event.preventDefault()}
          >
            <Icon name="search" size={18} className="text-muted-foreground" />
            <UiInput
              className="min-h-9 min-w-0 flex-1 bg-transparent text-xs outline-none"
              aria-label="جست‌وجو در پنل مدیریت"
              placeholder="جست‌وجو در محصولات، سفارش‌ها، مشتریان ..."
            />
            <kbd className="hidden rounded bg-secondary px-2 py-1 text-[9px] text-muted-foreground lg:inline-block">
              Ctrl K
            </kbd>
          </form>
          <div className="ml-auto hidden !flex-row items-center gap-4 md:flex" dir="rtl">
            <Button
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-secondary"
              type="button"
              aria-label="اعلان‌ها"
            >
              <Icon name="bell" size={19} />
              {allowDevelopmentPreview ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">
                  ۱
                </span>
              ) : null}
            </Button>
            <img
              className="h-9 w-9 rounded-full bg-secondary object-cover"
              src="/assets/nova-hero-men.webp"
              alt={`پروفایل ${adminDisplayName}`}
            />
            <span className="hidden text-xs text-muted-foreground lg:inline">
              {allowDevelopmentPreview ? 'تاریخ نمایشی' : 'نشست فعال'}
            </span>
            <Button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary transition-colors hover:bg-accent-soft"
              type="button"
              aria-label="تغییر پوسته"
            >
              <Icon name="sparkles" size={19} />
            </Button>
          </div>
        </header>
        <div className="admin-page bg-background p-4 pb-24 md:p-6 md:pb-8 lg:p-8">{children}</div>
      </section>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-2 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur md:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {[
          ['admin', 'داشبورد', 'home'],
          ['catalog', 'محصولات', 'bag'],
          ['orders', 'سفارش‌ها', 'package'],
          ['operations', 'بیشتر', 'menu'],
        ].map(([key, label, icon]) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[10px] ${isNavActive(key ?? '') ? 'text-primary' : 'text-muted-foreground'}`}
            href={`#admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon as IconName} size={19} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
