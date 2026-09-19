import { useState } from 'react';

import { Card, Select as UiSelect } from '@nova/ui';
import { Icon } from '../../ui/icon';
import { useAdminDashboardSummary } from '../../../lib/admin/admin-dashboard-api';

import { PERIOD_OPTIONS, SUMMARY_METRICS } from '../../../pages/admin/admin-dashboard-page-shared';

import { DashboardAccessDenied } from './dashboard-access-denied';

import { DashboardEmptyState } from './dashboard-empty-state';

import { DashboardErrorState } from './dashboard-error-state';

import { DashboardLoadingState } from './dashboard-loading-state';

import { OrderStatusCounts } from './order-status-counts';

import { hasAdminDashboardRole } from './has-admin-dashboard-role';

export function AdminDashboardPage({ staffRoles }: { staffRoles: readonly string[] | undefined }) {
  const [periodDays, setPeriodDays] = useState(30);
  const canView = hasAdminDashboardRole(staffRoles);
  const summaryQuery = useAdminDashboardSummary({ periodDays }, canView);

  if (!canView) return <DashboardAccessDenied />;
  if (summaryQuery.isPending) return <DashboardLoadingState />;
  if (summaryQuery.isError) {
    return (
      <DashboardErrorState error={summaryQuery.error} onRetry={() => void summaryQuery.refetch()} />
    );
  }
  if (!summaryQuery.data) return <DashboardEmptyState />;

  return (
    <div className="mx-auto max-w-[1120px] space-y-4 md:space-y-5" dir="rtl">
      <header className="flex flex-col gap-4 py-1 md:flex-row md:items-end md:justify-between">
        <div className="text-right">
          <span className="section-heading__eyebrow">NOVA / ADMIN DASHBOARD · LIVE SUMMARY</span>
          <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">نمای کلی مدیریت</h1>
          <p className="mt-1 text-xs leading-7 text-muted-foreground">
            این نما فقط خلاصه خواندنی بازه انتخاب‌شده را از API نمایش می‌دهد.
          </p>
        </div>
        <label
          className="flex min-h-11 items-center gap-2 border border-border bg-surface px-3 text-xs text-muted-foreground"
          htmlFor="admin-dashboard-period"
        >
          <span>بازه گزارش</span>
          <UiSelect
            className="min-h-9 bg-transparent text-foreground outline-none focus-visible:outline-2 focus-visible:outline-primary"
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

      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="شاخص‌های خلاصه داشبورد"
      >
        {SUMMARY_METRICS.map((metric) => (
          <Card
            asChild
            className="border border-border bg-surface p-4 shadow-card"
            key={metric.key}
          >
            <article>
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-primary"
                  aria-hidden="true"
                >
                  <Icon name={metric.icon} size={17} />
                </span>
                <h2 className="text-right text-xs leading-6 text-muted-foreground">
                  {metric.label}
                </h2>
              </div>
              <p className="mt-5 text-right text-xl font-semibold tabular-nums" dir="rtl">
                {metric.format(summaryQuery.data[metric.key])}
              </p>
            </article>
          </Card>
        ))}
      </section>

      <OrderStatusCounts summary={summaryQuery.data} />
    </div>
  );
}
