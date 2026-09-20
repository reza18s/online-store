import { Button } from '@nova/ui';

import { Icon, type IconName } from '@/shared/ui/icon';

import { ADMIN_PREVIEW_NOTICE } from '@/shared/fixtures/app-shared';

import { AdminCampaignBanner } from '@/features/dashboard/components/AdminCampaignBanner';

import { AdminLatestOrders } from '@/features/dashboard/components/AdminLatestOrders';

import { AdminMetricCard } from '@/features/dashboard/components/AdminMetricCard';

import { AdminNewCustomers } from '@/features/dashboard/components/AdminNewCustomers';

import { AdminOrderStatus } from '@/features/orders/components/AdminOrderStatus';

import { AdminPopularProducts } from '@/features/dashboard/components/AdminPopularProducts';

import { AdminSalesChart } from '@/features/dashboard/components/AdminSalesChart';

export function AdminDashboard() {
  const metrics = [
    {
      label: 'محصولات فعال',
      value: 'نمونه',
      note: 'داده نمایشی',
      icon: 'package' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-3 xl:order-1',
    },
    {
      label: 'درآمد کل',
      value: 'نمونه',
      note: 'داده نمایشی',
      icon: 'tag' as IconName,
      iconTone: 'bg-warning-100 text-warning',
      orderClass: 'order-4 xl:order-2',
    },
    {
      label: 'مشتریان جدید',
      value: 'نمونه',
      note: 'داده نمایشی',
      icon: 'user' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-1 xl:order-3',
    },
    {
      label: 'سفارش‌های جدید',
      value: 'نمونه',
      note: 'داده نمایشی',
      icon: 'bag' as IconName,
      iconTone: 'bg-[#f3e7e9] text-primary',
      orderClass: 'order-2 xl:order-4',
    },
  ];
  return (
    <div className="mx-auto max-w-[1120px] space-y-4 md:space-y-5">
      <header className="flex flex-col gap-4 py-1 md:flex-row md:items-end md:justify-between">
        <div className="text-right">
          <span className="section-heading__eyebrow">NOVA / ADMIN DASHBOARD · DEV PREVIEW</span>
          <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">
            خوش آمدید، مدیر نمونه <span aria-hidden="true">👋</span>
          </h1>
          <p className="mt-1 text-xs leading-7 text-muted-foreground">{ADMIN_PREVIEW_NOTICE}</p>
        </div>
        <Button
          className="inline-flex min-h-10 w-max items-center gap-2 border border-border bg-surface px-3 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          type="button"
        >
          ۳۰ روز گذشته <Icon name="chevron-down" size={14} />
        </Button>
      </header>
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="شاخص‌های کلیدی">
        {metrics.map((metric) => (
          <AdminMetricCard {...metric} key={metric.label} />
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.45fr)]">
        <div className="hidden xl:block">
          <AdminOrderStatus />
        </div>
        <AdminSalesChart />
      </div>
      <div className="xl:hidden">
        <AdminLatestOrders />
      </div>
      <div className="hidden gap-4 xl:grid xl:grid-cols-[minmax(230px,0.8fr)_minmax(0,1.4fr)_minmax(260px,0.9fr)]">
        <AdminNewCustomers />
        <AdminLatestOrders />
        <AdminPopularProducts />
      </div>
      <AdminCampaignBanner />
    </div>
  );
}
