import { useEffect, useState, type FormEvent, type ReactNode } from 'react';

import {
  type AdminAuditListQuery,
  type AdminAuditPage,
  type AdminCustomerListQuery,
  type AdminCustomerPage,
  type AdminNotificationListQuery,
  type AdminNotificationPage,
  type AdminPaymentAttempt,
  type AdminPaymentListQuery,
  type AdminPaymentPage,
} from '@nova/api-client';

import { useAdminPayment, useAdminPayments } from './admin-payments-api';
import { useAdminCustomers } from './admin-customers-api';
import { useAdminNotifications } from './admin-notifications-api';
import { useAdminAuditEvents } from './admin-audit-api';
import { isStaffAuthFailure, isStaffAuthorizationFailure } from './admin-auth';
import { useStaffUser } from './admin-catalog-api';
import { Icon, type IconName } from '../../shared/icon';

export type AdminSupportFinanceView = 'payments' | 'customers' | 'notifications' | 'audit';
export type AdminStaffRole = 'support' | 'operations' | 'admin';

type QueryResult<T> = {
  data: T | undefined;
  error: unknown;
  isError: boolean;
  isPending: boolean;
  refetch: () => Promise<unknown>;
};

const VIEW_ACCESS: Record<
  AdminSupportFinanceView,
  { label: string; eyebrow: string; description: string; icon: IconName; roles: AdminStaffRole[] }
> = {
  payments: {
    label: 'پرداخت‌ها',
    eyebrow: 'FINANCE / PAYMENT ATTEMPTS',
    description: 'تلاش‌های پرداخت و بازپرداخت‌های ثبت‌شده را بدون داده‌های حساس بررسی کنید.',
    icon: 'bag',
    roles: ['admin'],
  },
  customers: {
    label: 'مشتریان',
    eyebrow: 'SUPPORT / CUSTOMER LOOKUP',
    description: 'با جست‌وجوی محدود، اطلاعات لازم برای پاسخ‌گویی به مشتری را پیدا کنید.',
    icon: 'users',
    roles: ['support', 'operations', 'admin'],
  },
  notifications: {
    label: 'تحویل اعلان‌ها',
    eyebrow: 'OPERATIONS / DELIVERY INSPECTION',
    description: 'وضعیت تحویل پیام‌ها را بررسی کنید؛ متن خطا و جزئیات داخلی نمایش داده نمی‌شود.',
    icon: 'bell',
    roles: ['operations', 'admin'],
  },
  audit: {
    label: 'گزارش فعالیت',
    eyebrow: 'GOVERNANCE / AUDIT EVENTS',
    description: 'رویدادهای مهم سیستم را برای پیگیری مسئولانه و قابل‌اعتماد مرور کنید.',
    icon: 'eye',
    roles: ['admin'],
  },
};

const PAYMENT_STATUSES = ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED'] as const;
const CUSTOMER_STATUSES = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const;
const NOTIFICATION_STATUSES = ['PENDING', 'PROCESSING', 'SENT', 'FAILED'] as const;
const ACTOR_TYPES = ['CUSTOMER', 'STAFF', 'SYSTEM'] as const;

const faNumber = new Intl.NumberFormat('fa-IR');
const faDate = new Intl.DateTimeFormat('fa-IR', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function normalizeAdminSupportFinanceView(value?: string): AdminSupportFinanceView {
  if (value === 'customers' || value === 'notifications' || value === 'audit') return value;
  return 'payments';
}

export function canStaffInspectView(
  view: AdminSupportFinanceView,
  roles: readonly string[],
): boolean {
  return VIEW_ACCESS[view].roles.some((role) => roles.includes(role));
}

export function pageCount(total: number, limit: number): number {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(limit) || limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}

export function adminOrderHref(orderNumber: string): string {
  return `#admin/orders/${encodeURIComponent(orderNumber)}`;
}

export function adminCustomerLookupHref(value: string): string {
  return `#admin/customers?q=${encodeURIComponent(value)}`;
}

export function adminCustomerLookupQuery(queryString: string): string {
  return new URLSearchParams(queryString).get('q')?.trim() ?? '';
}

export function safeAuditMetadataLabel(metadata: unknown): string {
  if (metadata === null || metadata === undefined) return 'جزئیات محدودشده‌ای ثبت نشده';
  return 'جزئیات رویداد در این نما محدود شده است';
}

function formatNumber(value: number): string {
  return faNumber.format(value);
}

function formatToman(value: number): string {
  return `${formatNumber(value)} تومان`;
}

function formatDate(value: string | null): string {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'ثبت نشده' : faDate.format(date);
}

function ltr(value: ReactNode, className = ''): ReactNode {
  return (
    <span dir="ltr" className={`inline-block text-left ${className}`}>
      {value}
    </span>
  );
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'در انتظار',
    PROCESSING: 'در حال پردازش',
    REDIRECTED: 'هدایت‌شده',
    SUCCEEDED: 'موفق',
    EXPIRED: 'منقضی‌شده',
    SENT: 'ارسال‌شده',
    FAILED: 'ناموفق',
    CANCELLED: 'لغوشده',
    ACTIVE: 'فعال',
    SUSPENDED: 'معلق',
    DELETED: 'حذف‌شده',
    PENDING_PAYMENT: 'در انتظار پرداخت',
    CONFIRMED: 'تأییدشده',
    PREPARING: 'در حال آماده‌سازی',
    SHIPPED: 'ارسال‌شده',
    DELIVERED: 'تحویل‌شده',
    RETURNED: 'مرجوع‌شده',
    PAID: 'پرداخت‌شده',
    REFUNDED: 'بازپرداخت‌شده',
    CUSTOMER: 'مشتری',
    STAFF: 'کارمند',
    SYSTEM: 'سیستم',
  };
  return labels[status] ?? 'نامشخص';
}

function statusTone(status: string): string {
  if (status === 'SUCCEEDED' || status === 'SENT' || status === 'ACTIVE') {
    return 'bg-success-100 text-success';
  }
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'DELETED') {
    return 'bg-destructive-100 text-destructive';
  }
  if (status === 'PROCESSING' || status === 'PENDING' || status === 'SUSPENDED') {
    return 'bg-warning-100 text-warning';
  }
  return 'bg-secondary text-muted-foreground';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-control px-2.5 text-[10px] ${statusTone(status)}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function isOfflineError(error: unknown): boolean {
  return (
    (typeof navigator !== 'undefined' && navigator.onLine === false) ||
    (error instanceof TypeError && /fetch|network|load/i.test(error.message))
  );
}

function QueryState<T>({
  query,
  emptyTitle,
  emptyDescription,
  children,
}: {
  query: QueryResult<T>;
  emptyTitle: string;
  emptyDescription: string;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <LoadingRows />;
  if (query.isError) {
    const offline = isOfflineError(query.error);
    return (
      <StateCard
        icon={offline ? 'refresh' : 'warning'}
        title={offline ? 'اتصال شبکه در دسترس نیست' : 'دریافت اطلاعات انجام نشد'}
        description={
          offline
            ? 'اتصال را بررسی کنید و برای دریافت دوباره اطلاعات تلاش کنید.'
            : 'اطلاعات فعلاً در دسترس نیست؛ می‌توانید دوباره تلاش کنید.'
        }
        action="تلاش دوباره"
        onAction={() => void query.refetch()}
        role="alert"
      />
    );
  }
  if (!query.data) return null;
  const items = query.data as { items?: unknown[] };
  if (Array.isArray(items.items) && items.items.length === 0) {
    return (
      <StateCard icon="layers" title={emptyTitle} description={emptyDescription} role="status" />
    );
  }
  return <>{children(query.data)}</>;
}

function LoadingRows() {
  return (
    <div className="space-y-3" aria-label="در حال بارگذاری" role="status">
      {[1, 2, 3, 4].map((row) => (
        <div
          className="motion-safe:animate-pulse motion-reduce:animate-none rounded-panel border border-border bg-background p-4"
          key={row}
        >
          <div className="h-3 w-1/3 rounded bg-secondary" />
          <div className="mt-3 h-3 w-2/3 rounded bg-secondary" />
        </div>
      ))}
      <span className="sr-only">در حال دریافت اطلاعات...</span>
    </div>
  );
}

function StateCard({
  icon,
  title,
  description,
  action,
  onAction,
  role,
}: {
  icon: IconName;
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  role: 'alert' | 'status';
}) {
  return (
    <section
      className="border border-dashed border-border bg-background p-8 text-center"
      role={role}
    >
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-primary">
        <Icon name={icon} size={21} />
      </span>
      <h2 className="mt-4 text-base leading-7">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-7 text-muted-foreground">{description}</p>
      {action && onAction ? (
        <button
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          onClick={onAction}
        >
          <Icon name="refresh" size={15} />
          {action}
        </button>
      ) : null}
    </section>
  );
}

function Pagination({
  page,
  total,
  limit,
  onPageChange,
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const pages = pageCount(total, limit);
  if (pages <= 1) {
    return <p className="text-[11px] text-muted-foreground">{formatNumber(total)} نتیجه</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-[11px] text-muted-foreground">
        صفحه {formatNumber(page)} از {formatNumber(pages)} · {formatNumber(total)} نتیجه
      </p>
      <div className="flex items-center gap-2" dir="ltr">
        <button
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          aria-label="صفحه قبل"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon name="arrow-left" size={16} />
        </button>
        <span className="min-w-11 text-center text-xs" dir="rtl">
          {formatNumber(page)}
        </span>
        <button
          className="flex min-h-11 min-w-11 items-center justify-center rounded-control border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          type="button"
          aria-label="صفحه بعد"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </div>
  );
}

function FilterBar({
  children,
  onSubmit,
}: {
  children: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="grid gap-3 border-b border-border bg-background p-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(130px,0.7fr))_auto]"
      onSubmit={onSubmit}
    >
      {children}
      <button
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-4 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="submit"
      >
        <Icon name="filter" size={15} />
        اعمال فیلتر
      </button>
    </form>
  );
}

function TextFilter({
  id,
  label,
  value,
  onChange,
  placeholder,
  dir = 'rtl',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[11px] text-muted-foreground" htmlFor={id}>
      {label}
      <input
        className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-accent-soft"
        id={id}
        dir={dir}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectFilter({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 text-[11px] text-muted-foreground" htmlFor={id}>
      {label}
      <select
        className="min-h-11 w-full appearance-none rounded-control border border-border bg-surface px-3 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-accent-soft"
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">همه</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {statusLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

function InspectionPanel({
  children,
  title,
  icon,
}: {
  children: ReactNode;
  title: string;
  icon: IconName;
}) {
  return (
    <section
      className="overflow-hidden rounded-panel border border-border bg-surface shadow-card"
      aria-labelledby="inspection-panel-title"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-4 md:px-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-primary">
          <Icon name={icon} size={18} />
        </span>
        <h2 className="text-base" id="inspection-panel-title">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function PaymentInspection() {
  const [draftStatus, setDraftStatus] = useState('');
  const [draftProvider, setDraftProvider] = useState('');
  const [draftOrderNumber, setDraftOrderNumber] = useState('');
  const [filters, setFilters] = useState<AdminPaymentListQuery>({ page: 1, limit: 12 });
  const [selectedId, setSelectedId] = useState('');
  const query = useAdminPayments(filters);
  const detailQuery = useAdminPayment(selectedId, Boolean(selectedId));

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelectedId('');
    setFilters({
      page: 1,
      limit: 12,
      status: (draftStatus || undefined) as AdminPaymentListQuery['status'],
      provider: draftProvider || undefined,
      orderNumber: draftOrderNumber || undefined,
    });
  };

  return (
    <InspectionPanel title="تلاش‌های پرداخت" icon="bag">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="payment-provider"
          label="درگاه"
          value={draftProvider}
          onChange={setDraftProvider}
          placeholder="مثلاً fake-gateway"
          dir="ltr"
        />
        <TextFilter
          id="payment-order"
          label="شماره سفارش"
          value={draftOrderNumber}
          onChange={setDraftOrderNumber}
          placeholder="NV-..."
          dir="ltr"
        />
        <SelectFilter
          id="payment-status"
          label="وضعیت پرداخت"
          value={draftStatus}
          onChange={setDraftStatus}
          options={PAYMENT_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminPaymentPage>}
          emptyTitle="تلاش پرداختی پیدا نشد"
          emptyDescription="با فیلترهای دیگری جست‌وجو کنید یا بعداً دوباره بررسی کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست تلاش‌های پرداخت</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">شناسه تلاش</th>
                      <th className="px-3 py-3 font-normal">سفارش</th>
                      <th className="px-3 py-3 font-normal">درگاه</th>
                      <th className="px-3 py-3 font-normal">مبلغ</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">ثبت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((payment) => (
                      <tr
                        className={`border-b border-border last:border-b-0 ${selectedId === payment.id ? 'bg-accent-soft/40' : ''}`}
                        key={payment.id}
                      >
                        <td className="px-3 py-3">
                          <button
                            className="min-h-11 rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            type="button"
                            onClick={() => setSelectedId(payment.id)}
                          >
                            {ltr(payment.id, 'max-w-[150px] truncate')}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <a
                            className="inline-flex min-h-11 items-center rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={adminOrderHref(payment.orderNumber)}
                          >
                            {ltr(payment.orderNumber)}
                          </a>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{payment.provider}</td>
                        <td className="px-3 py-3">{formatToman(payment.amountToman)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(payment.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
        {selectedId ? (
          <PaymentDetail query={detailQuery as QueryResult<AdminPaymentAttempt>} />
        ) : null}
      </div>
    </InspectionPanel>
  );
}

function PaymentDetail({ query }: { query: QueryResult<AdminPaymentAttempt> }) {
  if (query.isPending)
    return (
      <div className="mt-4">
        <LoadingRows />
      </div>
    );
  if (query.isError || !query.data) {
    return (
      <div className="mt-4">
        <StateCard
          icon="warning"
          title="جزئیات پرداخت در دسترس نیست"
          description="جزئیات این تلاش پرداخت قابل دریافت نیست؛ دوباره تلاش کنید."
          action="تلاش دوباره"
          onAction={() => void query.refetch()}
          role="alert"
        />
      </div>
    );
  }
  const payment = query.data;
  return (
    <section className="mt-5 border-t border-border pt-5" aria-labelledby="payment-detail-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="section-heading__eyebrow">PAYMENT / REDACTED DETAIL</span>
          <h3 className="mt-1 text-base" id="payment-detail-title">
            جزئیات تلاش پرداخت
          </h3>
        </div>
        <StatusBadge status={payment.status} />
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DetailField label="شناسه تلاش">{ltr(payment.id, 'break-all')}</DetailField>
        <DetailField label="شماره سفارش">
          <a
            className="text-primary underline-offset-4 hover:underline"
            href={adminOrderHref(payment.orderNumber)}
          >
            {ltr(payment.orderNumber)}
          </a>
        </DetailField>
        <DetailField label="شناسه تراکنش درگاه">
          {payment.providerTransactionId
            ? ltr(payment.providerTransactionId, 'break-all')
            : 'ثبت نشده'}
        </DetailField>
        <DetailField label="مبلغ">{formatToman(payment.amountToman)}</DetailField>
        <DetailField label="وضعیت سفارش">{statusLabel(payment.orderStatus)}</DetailField>
        <DetailField label="وضعیت پرداخت">{statusLabel(payment.paymentStatus)}</DetailField>
        <DetailField label="آخرین تغییر">{ltr(formatDate(payment.updatedAt))}</DetailField>
        <DetailField label="پرداخت موفق">{ltr(formatDate(payment.paidAt))}</DetailField>
      </dl>
      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-sm">بازپرداخت‌ها</h4>
        {payment.refunds.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            برای این تلاش بازپرداختی ثبت نشده است.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {payment.refunds.map((refund) => (
              <li
                className="rounded-control border border-border bg-background p-3 text-xs"
                key={refund.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <span>{formatToman(refund.amountToman)}</span>
                  <StatusBadge status={refund.status} />
                </div>
                <p className="mt-2 text-muted-foreground">
                  شناسه بازپرداخت: {ltr(refund.id, 'break-all')}
                </p>
                <p className="mt-1 text-muted-foreground">
                  ثبت: {ltr(formatDate(refund.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 rounded-control border border-border bg-background p-3">
      <dt className="text-[10px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-xs">{children}</dd>
    </div>
  );
}

function CustomerInspection({ initialQuery = '' }: { initialQuery?: string }) {
  const [draftQ, setDraftQ] = useState(initialQuery);
  const [draftStatus, setDraftStatus] = useState('');
  const [filters, setFilters] = useState<AdminCustomerListQuery>(() => ({
    page: 1,
    limit: 12,
    ...(initialQuery ? { q: initialQuery } : {}),
  }));
  const query = useAdminCustomers(filters);
  useEffect(() => {
    setDraftQ(initialQuery);
    setFilters({ page: 1, limit: 12, ...(initialQuery ? { q: initialQuery } : {}) });
  }, [initialQuery]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      q: draftQ || undefined,
      status: (draftStatus || undefined) as AdminCustomerListQuery['status'],
    });
  };

  return (
    <InspectionPanel title="جست‌وجوی مشتری" icon="users">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="customer-query"
          label="ایمیل، تلفن یا شناسه مشتری"
          value={draftQ}
          onChange={setDraftQ}
          placeholder="برای جست‌وجو وارد کنید..."
          dir="ltr"
        />
        <SelectFilter
          id="customer-status"
          label="وضعیت مشتری"
          value={draftStatus}
          onChange={setDraftStatus}
          options={CUSTOMER_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminCustomerPage>}
          emptyTitle="مشتری پیدا نشد"
          emptyDescription="عبارت جست‌وجو یا وضعیت را تغییر دهید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[820px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست مشتریان</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">مشتری</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">سفارش‌ها</th>
                      <th className="px-3 py-3 font-normal">آخرین سفارش</th>
                      <th className="px-3 py-3 font-normal">به‌روزرسانی</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((customer) => (
                      <tr className="border-b border-border last:border-b-0" key={customer.id}>
                        <td className="max-w-[270px] px-3 py-3">
                          <a
                            className="inline-flex min-h-11 max-w-full flex-col justify-center rounded-control px-2 text-right hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                            href={adminCustomerLookupHref(customer.email ?? customer.phone)}
                          >
                            <span className="truncate">
                              {ltr(customer.email ?? 'ایمیل ثبت نشده')}
                            </span>
                            <span className="mt-1 text-[10px] text-muted-foreground">
                              {ltr(customer.phone)}
                            </span>
                          </a>
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={customer.status} />
                        </td>
                        <td className="px-3 py-3">{formatNumber(customer.orderCount)}</td>
                        <td className="px-3 py-3">
                          {customer.lastOrderNumber ? (
                            <a
                              className="inline-flex min-h-11 items-center rounded-control px-2 text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                              href={adminOrderHref(customer.lastOrderNumber)}
                            >
                              {ltr(customer.lastOrderNumber)}
                              <span className="mr-2 text-[10px] text-muted-foreground">
                                {customer.lastOrderStatus
                                  ? statusLabel(customer.lastOrderStatus)
                                  : ''}
                              </span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground">بدون سفارش</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(customer.updatedAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}

function NotificationInspection() {
  const [draftKind, setDraftKind] = useState('');
  const [draftStatus, setDraftStatus] = useState('');
  const [filters, setFilters] = useState<AdminNotificationListQuery>({ page: 1, limit: 12 });
  const query = useAdminNotifications(filters);
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      kind: draftKind || undefined,
      status: (draftStatus || undefined) as AdminNotificationListQuery['status'],
    });
  };

  return (
    <InspectionPanel title="تحویل اعلان‌ها" icon="bell">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="notification-kind"
          label="نوع اعلان"
          value={draftKind}
          onChange={setDraftKind}
          placeholder="مثلاً PAYMENT_SUCCEEDED"
          dir="ltr"
        />
        <SelectFilter
          id="notification-status"
          label="وضعیت تحویل"
          value={draftStatus}
          onChange={setDraftStatus}
          options={NOTIFICATION_STATUSES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminNotificationPage>}
          emptyTitle="اعلانی پیدا نشد"
          emptyDescription="فیلترها را تغییر دهید یا بازه دیگری را بررسی کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[780px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست وضعیت تحویل اعلان‌ها</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">نوع اعلان</th>
                      <th className="px-3 py-3 font-normal">وضعیت</th>
                      <th className="px-3 py-3 font-normal">تلاش</th>
                      <th className="px-3 py-3 font-normal">زمان آماده‌سازی</th>
                      <th className="px-3 py-3 font-normal">آخرین وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((notification) => (
                      <tr className="border-b border-border last:border-b-0" key={notification.id}>
                        <td className="px-3 py-3">{ltr(notification.kind)}</td>
                        <td className="px-3 py-3">
                          <StatusBadge status={notification.status} />
                        </td>
                        <td className="px-3 py-3">{formatNumber(notification.attempts)}</td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(notification.availableAt))}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {notification.processedAt
                            ? ltr(formatDate(notification.processedAt))
                            : notification.lastError
                              ? 'خطای تحویل ثبت شده'
                              : 'در انتظار نتیجه'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}

function AuditInspection() {
  const [draftAction, setDraftAction] = useState('');
  const [draftResourceType, setDraftResourceType] = useState('');
  const [draftResourceId, setDraftResourceId] = useState('');
  const [draftActorType, setDraftActorType] = useState('');
  const [filters, setFilters] = useState<AdminAuditListQuery>({ page: 1, limit: 12 });
  const query = useAdminAuditEvents(filters);
  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      page: 1,
      limit: 12,
      action: draftAction || undefined,
      resourceType: draftResourceType || undefined,
      resourceId: draftResourceId || undefined,
      actorType: (draftActorType || undefined) as AdminAuditListQuery['actorType'],
    });
  };

  return (
    <InspectionPanel title="گزارش رویدادها" icon="eye">
      <FilterBar onSubmit={applyFilters}>
        <TextFilter
          id="audit-action"
          label="عملیات"
          value={draftAction}
          onChange={setDraftAction}
          placeholder="مثلاً order.cancelled"
          dir="ltr"
        />
        <TextFilter
          id="audit-resource"
          label="نوع منبع"
          value={draftResourceType}
          onChange={setDraftResourceType}
          placeholder="Order"
          dir="ltr"
        />
        <TextFilter
          id="audit-resource-id"
          label="شناسه منبع"
          value={draftResourceId}
          onChange={setDraftResourceId}
          placeholder="شناسه"
          dir="ltr"
        />
        <SelectFilter
          id="audit-actor"
          label="ثبت‌کننده"
          value={draftActorType}
          onChange={setDraftActorType}
          options={ACTOR_TYPES}
        />
      </FilterBar>
      <div className="p-3 md:p-5">
        <QueryState
          query={query as QueryResult<AdminAuditPage>}
          emptyTitle="رویدادی پیدا نشد"
          emptyDescription="فیلترهای گزارش را تغییر دهید یا دوباره تلاش کنید."
        >
          {(data) => (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[850px] w-full border-collapse text-right text-xs">
                  <caption className="sr-only">فهرست رویدادهای حسابرسی</caption>
                  <thead>
                    <tr className="border-b border-border text-[10px] text-muted-foreground">
                      <th className="px-3 py-3 font-normal">عملیات</th>
                      <th className="px-3 py-3 font-normal">منبع</th>
                      <th className="px-3 py-3 font-normal">ثبت‌کننده</th>
                      <th className="px-3 py-3 font-normal">جزئیات</th>
                      <th className="px-3 py-3 font-normal">زمان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((event) => (
                      <tr className="border-b border-border last:border-b-0" key={event.id}>
                        <td className="px-3 py-3">{ltr(event.action)}</td>
                        <td className="px-3 py-3">
                          <span>{event.resourceType}</span>
                          {event.resourceId ? (
                            <span className="mr-2 text-muted-foreground">
                              {ltr(event.resourceId)}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge status={event.actorType} />
                        </td>
                        <td className="max-w-[230px] px-3 py-3 text-muted-foreground">
                          {safeAuditMetadataLabel(event.metadata)}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">
                          {ltr(formatDate(event.createdAt))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <Pagination
                  page={data.page}
                  total={data.total}
                  limit={data.limit}
                  onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
                />
              </div>
            </>
          )}
        </QueryState>
      </div>
    </InspectionPanel>
  );
}

function AdminSessionState({ kind }: { kind: 'loading' | 'expired' | 'denied' | 'missing' }) {
  const content = {
    loading: {
      icon: 'refresh' as IconName,
      title: 'در حال بررسی نشست مدیریت',
      description: 'دسترسی امن پنل در حال بررسی است.',
    },
    expired: {
      icon: 'warning' as IconName,
      title: 'نشست مدیریت منقضی شده است',
      description: 'برای ادامه دوباره وارد فضای مدیریت شوید.',
    },
    denied: {
      icon: 'warning' as IconName,
      title: 'دسترسی کافی ندارید',
      description: 'این بخش برای نقش فعلی شما فعال نیست.',
    },
    missing: {
      icon: 'user' as IconName,
      title: 'ورود به پنل مدیریت لازم است',
      description: 'برای مشاهده اطلاعات عملیاتی، ابتدا وارد شوید.',
    },
  }[kind];
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#f6f6f4] px-4 py-10" dir="rtl">
      <section
        className="w-full max-w-lg border border-border bg-surface p-7 text-right shadow-float md:p-10"
        role={kind === 'denied' || kind === 'expired' ? 'alert' : 'status'}
      >
        <span className="section-heading__eyebrow">NOVA / ADMIN INSPECTION</span>
        <h1 className="mt-2 text-2xl leading-relaxed">{content.title}</h1>
        <p className="mt-3 text-sm leading-8 text-muted-foreground">{content.description}</p>
        {kind !== 'loading' && kind !== 'denied' ? (
          <a
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-control bg-primary px-5 text-xs text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#admin/login"
          >
            ورود به پنل
          </a>
        ) : null}
      </section>
    </main>
  );
}

export function AdminSupportFinancePage({
  view = 'payments',
  queryString = '',
}: {
  view?: string;
  queryString?: string;
}) {
  const activeView = normalizeAdminSupportFinanceView(view);
  const staffQuery = useStaffUser();
  const roles = staffQuery.data?.roles ?? [];

  if (staffQuery.isPending) return <AdminSessionState kind="loading" />;
  if (isStaffAuthFailure(staffQuery.error)) return <AdminSessionState kind="expired" />;
  if (isStaffAuthorizationFailure(staffQuery.error)) return <AdminSessionState kind="denied" />;
  if (!staffQuery.data) return <AdminSessionState kind="missing" />;

  const accessibleViews = (Object.keys(VIEW_ACCESS) as AdminSupportFinanceView[]).filter(
    (candidate) => canStaffInspectView(candidate, roles),
  );
  if (!canStaffInspectView(activeView, roles)) return <AdminSessionState kind="denied" />;

  const config = VIEW_ACCESS[activeView];
  return (
    <main
      className="min-h-svh bg-[#f6f6f4] px-4 py-5 text-foreground md:px-6 md:py-8 lg:px-8"
      dir="rtl"
    >
      <div className="mx-auto max-w-[1120px]">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="text-right">
            <span className="section-heading__eyebrow">{config.eyebrow}</span>
            <h1 className="mt-1 text-2xl leading-relaxed md:text-3xl">{config.label}</h1>
            <p className="mt-1 max-w-2xl text-xs leading-7 text-muted-foreground">
              {config.description}
            </p>
          </div>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border bg-surface px-3 text-[11px] text-muted-foreground">
            <Icon name="eye" size={15} />
            داده‌های محدودشده
          </span>
        </header>
        <nav className="mt-5 overflow-x-auto" aria-label="بخش‌های پشتیبانی و مالی">
          <div className="flex min-w-max gap-2">
            {accessibleViews.map((candidate) => {
              const item = VIEW_ACCESS[candidate];
              const selected = candidate === activeView;
              return (
                <a
                  className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-4 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary'}`}
                  href={`#admin/${candidate}`}
                  aria-current={selected ? 'page' : undefined}
                  key={candidate}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </a>
              );
            })}
          </div>
        </nav>
        <div className="mt-5">
          {activeView === 'payments' ? <PaymentInspection /> : null}
          {activeView === 'customers' ? (
            <CustomerInspection initialQuery={adminCustomerLookupQuery(queryString)} />
          ) : null}
          {activeView === 'notifications' ? <NotificationInspection /> : null}
          {activeView === 'audit' ? <AuditInspection /> : null}
        </div>
      </div>
    </main>
  );
}
