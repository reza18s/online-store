import { Button } from '@nova/ui';

import { Icon, type IconName } from '../ui/icon';

import { Logo } from '../ui/site-shell';

import { ADMIN_PREVIEW_NOTICE } from '../app/app-shared';

import { AdminLogoutButton } from './admin-logout-button';

export function AdminLegacyPage({ page }: { page: string }) {
  const titleMap: Record<string, string> = {
    admin: 'نمای کلی',
    products: 'محصولات',
    categories: 'دسته‌بندی‌ها',
    inventory: 'موجودی',
    orders: 'سفارش‌ها',
    payments: 'پرداخت‌ها',
    promotions: 'کدهای تخفیف',
    customers: 'مشتری‌ها',
    content: 'محتوا',
    audit: 'گزارش فعالیت',
    operations: 'عملیات',
    login: 'ورود مدیر',
    'products/new': 'محصول جدید',
    'products/linen-overshirt/edit': 'ویرایش محصول',
    'products/linen-overshirt/variants': 'تنوع‌ها',
    'products/linen-overshirt/media': 'رسانه محصول',
    'orders/NV-DEMO-001': 'جزئیات سفارش نمونه',
  };
  const title = titleMap[page] ?? 'پنل مدیریت';
  const nav = [
    ['admin', 'نمای کلی', 'grid'],
    ['products', 'محصولات', 'shirt'],
    ['categories', 'دسته‌بندی‌ها', 'layers'],
    ['inventory', 'موجودی', 'warehouse'],
    ['orders', 'سفارش‌ها', 'package'],
    ['payments', 'پرداخت‌ها', 'tag'],
    ['customers', 'مشتری‌ها', 'users'],
    ['content', 'محتوا', 'book'],
    ['audit', 'گزارش فعالیت', 'eye'],
  ].map(([key, label, icon]) => ({ key, label, icon: icon as IconName }));
  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Logo />
        <span className="admin-sidebar__label">فضای مدیریت</span>
        {nav.map((item) => (
          <a
            className={page === item.key ? 'is-active' : ''}
            href={`#admin${item.key === 'admin' ? '' : `/${item.key}`}`}
            key={item.key}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </a>
        ))}
        <AdminLogoutButton className="admin-sidebar__logout flex min-h-11 w-full items-center gap-2 border-0 bg-transparent px-[11px] text-right text-xs text-inherit transition-colors hover:bg-secondary disabled:opacity-50" />
      </aside>
      <section className="admin-content">
        <header className="admin-topbar">
          <AdminLogoutButton
            compact
            label="خروج"
            className="icon-button border-0 md:hidden disabled:opacity-50"
          />
          <Button className="icon-button" type="button" aria-label="اعلان‌ها">
            <Icon name="bell" size={19} />
          </Button>
          <div>
            <span>سلام، مدیر نمونه</span>
            <small>آخرین ورود: داده نمایشی</small>
          </div>
        </header>
        <div className="admin-page">
          <div className="admin-page__heading">
            <div>
              <span className="section-heading__eyebrow">NOVA / ADMIN · DEV PREVIEW</span>
              <h1>{title}</h1>
              <p className="mt-2 text-[10px] text-muted-foreground">{ADMIN_PREVIEW_NOTICE}</p>
            </div>
            <div className="admin-page__actions">
              <Button className="admin-secondary" type="button">
                <Icon name="settings" size={16} />
                تنظیمات
              </Button>
              {page === 'products' ? (
                <Button asChild>
                  <a href="#admin/products/new">
                    <Icon name="plus" size={17} />
                    محصول جدید
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="admin-stat-grid">
            <div>
              <span>سفارش‌های امروز</span>
              <strong>نمونه</strong>
              <small className="stat-up">داده نمایشی</small>
            </div>
            <div>
              <span>در انتظار بررسی</span>
              <strong>نمونه</strong>
              <small>داده نمایشی</small>
            </div>
            <div>
              <span>موجودی کم</span>
              <strong>نمونه</strong>
              <small className="stat-warning">داده نمایشی</small>
            </div>
            <div>
              <span>فروش این ماه</span>
              <strong>نمونه</strong>
              <small>داده نمایشی</small>
            </div>
          </div>
          <div className="admin-panels">
            <section className="admin-panel admin-panel--wide">
              <div className="admin-panel__heading">
                <h2>
                  {page === 'orders'
                    ? 'صف سفارش‌ها'
                    : page === 'products'
                      ? 'محصولات اخیر'
                      : 'کارهای نیازمند اقدام'}
                </h2>
                <a className="text-link" href="#admin/orders">
                  مشاهده همه <Icon name="arrow-left" size={15} />
                </a>
              </div>
              {[
                ['NV-DEMO-001', 'محصول نمونه ۱', 'وضعیت نمونه'],
                ['NV-DEMO-002', 'محصول نمونه ۲', 'وضعیت نمونه'],
                ['NV-DEMO-003', 'محصول نمونه ۳', 'وضعیت نمونه'],
              ].map(([id, name, status]) => (
                <div className="admin-row" key={id}>
                  <span dir="ltr">{id}</span>
                  <strong>{name}</strong>
                  <span className="status-badge">{status}</span>
                  <Button className="icon-button" type="button" aria-label={`مشاهده ${id}`}>
                    <Icon name="arrow-left" size={16} />
                  </Button>
                </div>
              ))}
            </section>
            <section className="admin-panel">
              <div className="admin-panel__heading">
                <h2>سلامت عملیات</h2>
                <Icon name="check" size={18} />
              </div>
              {['پرداخت آنلاین', 'ارسال سفارش‌ها', 'رسانه‌ها', 'اعلان‌ها'].map((item) => (
                <div className="health-row" key={item}>
                  <span className="health-dot" />
                  {item}
                  <strong>فعال</strong>
                </div>
              ))}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
