import type { ReactNode } from 'react';

import { Button } from '@nova/ui';

import { Icon, type IconName } from '../../ui/icon';

import { AdminLogoutButton } from '../admin-logout-button';

import { AdminOperationsLogo } from '../admin-operations-logo';

export function AdminProductsPageFrame({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-background text-foreground" dir="rtl">
      <div className="flex min-h-svh flex-row">
        <aside className="hidden w-[240px] flex-none flex-col bg-primary-hover px-4 py-7 text-primary-foreground lg:flex">
          <AdminOperationsLogo />
          <span className="mt-12 px-3 text-[10px] text-primary-foreground/55">فضای مدیریت</span>
          <nav className="mt-3 flex flex-col gap-1" aria-label="ناوبری مدیریت">
            {[
              ['admin', 'فضای مدیریت', 'home'],
              ['products', 'محصولات', 'bag'],
              ['inventory', 'موجودی کم', 'warning'],
              ['orders', 'سفارش‌ها', 'package'],
              ['customers', 'مشتریان', 'users'],
              ['promotions', 'تخفیف‌ها', 'tag'],
              ['audit', 'گزارش‌ها', 'eye'],
              ['operations', 'تنظیمات', 'settings'],
            ].map(([key, label, icon]) => (
              <a
                className={`flex min-h-11 items-center gap-3 rounded-control px-3 text-xs transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-primary-foreground/85 hover:bg-primary/70'}`}
                href={`#admin${key === 'admin' ? '' : `/${key}`}`}
                key={key}
              >
                <Icon name={icon as IconName} size={18} />
                <span>{label}</span>
              </a>
            ))}
          </nav>
          <AdminLogoutButton
            label="خروج"
            className="mt-auto flex min-h-11 items-center gap-3 border-0 border-t border-primary-foreground/15 bg-transparent px-3 pt-5 text-xs text-primary-foreground/80 transition-colors hover:text-primary-foreground disabled:opacity-50"
          />
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8" dir="ltr">
            <div className="hidden items-center gap-3 lg:flex">
              <Button
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                type="button"
                aria-label="اعلان‌ها"
              >
                <Icon name="bell" size={19} />
              </Button>
              <img
                className="h-10 w-10 rounded-full object-cover"
                src="/assets/nova-hero-men.webp"
                alt=""
              />
              <div className="text-right" dir="rtl">
                <strong className="block text-xs font-medium">مدیر نمونه</strong>
                <span className="mt-1 block text-[10px] text-muted-foreground">حساب نمایشی</span>
              </div>
            </div>

            <div className="hidden text-right lg:ml-auto lg:block" dir="rtl">
              <span className="text-lg font-medium">فضای مدیریت</span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                عملیات فروشگاه نوا
              </span>
            </div>

            <div className="flex items-center justify-between lg:hidden" dir="ltr">
              <AdminLogoutButton
                compact
                label="خروج"
                className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              />
              <a
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                href="#admin"
                aria-label="داشبورد مدیریت"
              >
                <Icon name="menu" size={20} />
              </a>
              <span className="text-base font-medium" dir="rtl">
                فضای مدیریت
              </span>
              <AdminOperationsLogo mobile />
            </div>
          </header>

          <div className="mx-auto max-w-[1220px] px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
            {children}
          </div>
        </section>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex min-h-[66px] items-stretch justify-around border-t border-border bg-surface/95 px-1 pb-[max(7px,env(safe-area-inset-bottom))] pt-1 shadow-float backdrop-blur lg:hidden"
        aria-label="ناوبری مدیریت موبایل"
      >
        {[
          ['admin', 'خانه', 'home'],
          ['products', 'محصولات', 'bag'],
          ['inventory', 'موجودی کم', 'warning'],
          ['orders', 'سفارش‌ها', 'package'],
          ['operations', 'بیشتر', 'menu'],
        ].map(([key, label, icon]) => (
          <a
            className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-1 rounded-control text-[9px] transition-colors ${key === 'products' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-background hover:text-foreground'}`}
            href={`#admin${key === 'admin' ? '' : `/${key}`}`}
            key={key}
          >
            <Icon name={icon as IconName} size={18} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </main>
  );
}
