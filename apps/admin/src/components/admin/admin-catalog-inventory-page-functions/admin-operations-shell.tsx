import { type ReactNode } from 'react';

import { Icon, type IconName } from '../../ui/icon';

import type { AdminCatalogInventoryView } from '../../../pages/admin/admin-catalog-inventory-page-shared';

export function AdminOperationsShell({
  view,
  roles,
  children,
}: {
  view: AdminCatalogInventoryView;
  roles: readonly string[];
  children: ReactNode;
}) {
  const navigation: Array<[AdminCatalogInventoryView, string, IconName, string]> = [
    ['catalog', 'محصولات', 'bag', '#admin/catalog'],
    ['categories', 'دسته‌بندی‌ها', 'layers', '#admin/catalog/categories'],
    ['inventory', 'موجودی کم', 'warning', '#admin/inventory'],
  ];
  return (
    <main
      className="min-h-svh bg-background px-3 py-4 text-foreground md:px-6 md:py-7 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1320px]">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="section-heading__eyebrow">ATELIER / ADMIN OPERATIONS</span>
            <h1 className="mt-2 text-2xl font-semibold leading-relaxed md:text-3xl">
              کاتالوگ و موجودی
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-7 text-muted-foreground">
              مدیریت محصول، طبقه‌بندی و موجودی بر پایه داده‌های واقعی سرویس مدیریت.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3">
              <Icon name="user" size={15} /> {roles.join('، ') || 'کاربر مدیریت'}
            </span>
            <span className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3">
              <Icon name="eye" size={15} /> داده زنده
            </span>
          </div>
        </header>
        <nav className="mt-5 overflow-x-auto" aria-label="بخش‌های کاتالوگ و عملیات">
          <div className="flex min-w-max gap-2">
            {navigation.map(([key, label, icon, href]) => (
              <a
                className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${view === key ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface hover:border-primary hover:text-primary'}`}
                href={href}
                aria-current={view === key ? 'page' : undefined}
                key={key}
              >
                <Icon name={icon} size={16} /> {label}
              </a>
            ))}
          </div>
        </nav>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0">{children}</div>
          <aside
            className="hidden border border-border bg-surface p-5 shadow-card xl:block"
            aria-label="راهنمای عملیات"
          >
            <p className="text-[10px] font-semibold tracking-[0.16em] text-primary">
              OPERATIONS NOTE
            </p>
            <h2 className="mt-3 text-base font-semibold">ثبت مسئولانه</h2>
            <p className="mt-2 text-xs leading-7 text-muted-foreground">
              شناسه‌ها در مسیرهای لاتین جدا نگه داشته می‌شوند و هر تغییر موجودی با نسخه آخر داده
              ارسال می‌شود.
            </p>
            <div className="mt-5 border-t border-border pt-4 text-xs leading-7 text-muted-foreground">
              <p className="flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                پیش‌نویس تا زمان انتشار عمومی است.
              </p>
              <p className="mt-2 flex gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                موجودی کم نیازمند بررسی عملیات است.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
