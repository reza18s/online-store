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
