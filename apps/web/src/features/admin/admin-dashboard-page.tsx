import { useState } from 'react';

import { ApiClientError, type AdminDashboardSummary } from '@nova/api-client';

import { Icon, type IconName } from '../../shared/icon';
import { useAdminDashboardSummary } from './admin-dashboard-api';

const PERIOD_OPTIONS = [
  { value: 7, label: '۷ روز گذشته' },
  { value: 30, label: '۳۰ روز گذشته' },
  { value: 90, label: '۹۰ روز گذشته' },
] as const;

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  RETURNED: 'مرجوع شده',
};

const SUMMARY_METRICS: Array<{
  key: keyof Pick<
    AdminDashboardSummary,
    | 'publishedProductCount'
    | 'newCustomerCount'
    | 'newOrderCount'
    | 'paidGrossToman'
    | 'successfulRefundToman'
  >;
  label: string;
  icon: IconName;
  format: (value: number) => string;
}> = [
  {
    key: 'publishedProductCount',
    label: 'محصولات منتشرشده',
    icon: 'package',
    format: formatPersianNumber,
  },
  {
    key: 'newCustomerCount',
    label: 'مشتریان جدید',
    icon: 'user',
    format: formatPersianNumber,
  },
  {
    key: 'newOrderCount',
    label: 'سفارش‌های جدید',
    icon: 'bag',
    format: formatPersianNumber,
  },
  {
    key: 'paidGrossToman',
    label: 'مجموع پرداخت موفق',
    icon: 'tag',
    format: formatToman,
  },
  {
    key: 'successfulRefundToman',
    label: 'بازپرداخت موفق',
    icon: 'arrow-left',
    format: formatToman,
  },
];

function formatPersianNumber(value: number): string {
  return new Intl.NumberFormat('fa-IR').format(value);
}

function formatToman(value: number): string {
  return `${formatPersianNumber(value)} تومان`;
}

export function hasAdminDashboardRole(roles: readonly string[] | undefined): boolean {
  return roles?.some((role) => role.toLowerCase() === 'admin') ?? false;
}

export function adminDashboardErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'نشست مدیریت منقضی شده است؛ دوباره وارد شوید.';
    if (error.status === 403) return 'شما اجازه مشاهده خلاصه داشبورد را ندارید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  }
  return error instanceof Error && error.message
    ? error.message
    : 'دریافت خلاصه داشبورد با خطا روبه‌رو شد.';
}

function DashboardAccessDenied() {
  return (
    <section
      className="mx-auto max-w-xl bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="alert"
    >
      <span className="section-heading__eyebrow">NOVA / ADMIN ACCESS</span>
      <h1 className="mt-2 text-xl leading-relaxed">دسترسی کافی نیست</h1>
      <p className="mt-3 text-sm leading-8 text-muted-foreground">
        حساب کاربری شما برای مشاهده خلاصه داشبورد مجوز مدیر را ندارد.
      </p>
    </section>
  );
}

function DashboardLoadingState() {
  return (
    <section className="space-y-4" aria-busy="true" aria-label="در حال دریافت خلاصه داشبورد">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {SUMMARY_METRICS.map((metric) => (
          <div
            className="min-h-32 animate-pulse border border-border bg-surface p-4"
            key={metric.key}
          />
        ))}
      </div>
      <p className="text-right text-sm text-muted-foreground" role="status">
        در حال دریافت خلاصه داشبورد…
      </p>
    </section>
  );
}

function DashboardErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <section
      className="border border-destructive/30 bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="alert"
    >
      <h2 className="text-lg leading-relaxed">خلاصه داشبورد در دسترس نیست</h2>
      <p className="mt-2 text-sm leading-8 text-muted-foreground">
        {adminDashboardErrorMessage(error)}
      </p>
      <button
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-4 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
        onClick={onRetry}
      >
        تلاش دوباره
      </button>
    </section>
  );
}

function DashboardEmptyState() {
  return (
    <section
      className="border border-border bg-surface p-6 text-right shadow-card"
      dir="rtl"
      role="status"
    >
      <h2 className="text-lg leading-relaxed">خلاصه‌ای برای نمایش وجود ندارد</h2>
      <p className="mt-2 text-sm leading-8 text-muted-foreground">
        در این بازه داده‌ای از API دریافت نشد.
      </p>
    </section>
  );
}

function OrderStatusCounts({ summary }: { summary: AdminDashboardSummary }) {
  const entries = Object.entries(summary.orderStatusCounts);

  return (
    <section className="border border-border bg-surface p-5 text-right shadow-card" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="section-heading__eyebrow">SUMMARY FIELD ۶ / ۶</span>
          <h2 className="mt-1 text-lg leading-relaxed">تعداد سفارش‌ها بر اساس وضعیت</h2>
        </div>
        <Icon name="layers" size={20} className="text-primary" aria-hidden="true" />
      </div>
      {entries.length > 0 ? (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {entries.map(([status, count]) => (
            <div
              className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
              key={status}
            >
              <dt className="text-sm text-muted-foreground">
                {ORDER_STATUS_LABELS[status] ?? status}
              </dt>
              <dd className="text-sm font-semibold tabular-nums">{formatPersianNumber(count)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">وضعیتی برای این بازه ثبت نشده است.</p>
      )}
    </section>
  );
}

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
          <select
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
          </select>
        </label>
      </header>

      <section
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
        aria-label="شاخص‌های خلاصه داشبورد"
      >
        {SUMMARY_METRICS.map((metric) => (
          <article className="border border-border bg-surface p-4 shadow-card" key={metric.key}>
            <div className="flex items-start justify-between gap-3">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-primary"
                aria-hidden="true"
              >
                <Icon name={metric.icon} size={17} />
              </span>
              <h2 className="text-right text-xs leading-6 text-muted-foreground">{metric.label}</h2>
            </div>
            <p className="mt-5 text-right text-xl font-semibold tabular-nums" dir="rtl">
              {metric.format(summaryQuery.data[metric.key])}
            </p>
          </article>
        ))}
      </section>

      <OrderStatusCounts summary={summaryQuery.data} />
    </div>
  );
}
