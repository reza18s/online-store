import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

import {
  ApiClientError,
  type AdminOrderStatusInput,
  type AdminOrderDetail,
  type AdminOrderListQuery,
  type AdminReturnReviewStatus,
  type AdminShipmentStatus,
  type CheckoutOrderStatus,
} from '@nova/api-client';
import { Button } from '@nova/ui';

import {
  useAdminOrder,
  useAdminOrders,
  useReviewAdminOrderReturn,
  useUpdateAdminOrderShipment,
  useUpdateAdminOrderStatus,
} from './admin-orders-api';
import { Icon } from '../../shared/icon';

type AdminFulfillmentOrderStatus = AdminOrderStatusInput['status'];

type AdminStaffRole = 'support' | 'operations' | 'admin';

const MODAL_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getModalFocusWrapIndex(
  activeIndex: number,
  focusableCount: number,
  reverse: boolean,
): number | null {
  if (focusableCount <= 0) return null;
  const outsideDialog = activeIndex < 0 || activeIndex >= focusableCount;
  if (reverse && (outsideDialog || activeIndex === 0)) return focusableCount - 1;
  if (!reverse && (outsideDialog || activeIndex === focusableCount - 1)) return 0;
  return null;
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: 'در انتظار پرداخت',
  CONFIRMED: 'تأیید شده',
  PREPARING: 'در حال آماده‌سازی',
  SHIPPED: 'ارسال شده',
  DELAYED: 'با تأخیر',
  EXCEPTION: 'نیازمند پیگیری',
  DELIVERED: 'تحویل شده',
  CANCELLED: 'لغو شده',
  RETURNED: 'مرجوع شده',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار پرداخت',
  PAID: 'پرداخت موفق',
  FAILED: 'پرداخت ناموفق',
  REFUNDED: 'بازپرداخت شده',
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار ارسال',
  PACKED: 'بسته‌بندی شده',
  SHIPPED: 'ارسال شده',
  DELIVERED: 'تحویل شده',
  RETURNED: 'مرجوع شده',
};

const RETURN_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'در انتظار بررسی',
  APPROVED: 'تأیید شده',
  REJECTED: 'رد شده',
  RECEIVED: 'کالا دریافت شده',
  REFUNDED: 'بازپرداخت شده',
  CANCELLED: 'لغو شده',
};

const REFUND_STATUS_LABELS: Record<string, string> = {
  PENDING: 'در انتظار بازپرداخت',
  FAILED: 'بازپرداخت ناموفق',
  SUCCEEDED: 'بازپرداخت موفق',
};

const ORDER_STATUS_OPTIONS: Array<[CheckoutOrderStatus, string]> = [
  ['PENDING_PAYMENT', 'در انتظار پرداخت'],
  ['CONFIRMED', 'تأیید شده'],
  ['PREPARING', 'در حال آماده‌سازی'],
  ['SHIPPED', 'ارسال شده'],
  ['DELIVERED', 'تحویل شده'],
  ['CANCELLED', 'لغو شده'],
  ['RETURNED', 'مرجوع شده'],
];

const PAYMENT_STATUS_OPTIONS = [
  ['', 'همه پرداخت‌ها'],
  ['PENDING', 'در انتظار پرداخت'],
  ['PAID', 'پرداخت موفق'],
  ['FAILED', 'پرداخت ناموفق'],
  ['REFUNDED', 'بازپرداخت شده'],
] as const;

const FULFILLMENT_STATUS_OPTIONS: Array<[AdminFulfillmentOrderStatus, string]> = [
  ['PREPARING', 'در حال آماده‌سازی'],
  ['SHIPPED', 'ارسال شده'],
  ['DELIVERED', 'تحویل شده'],
];

const SHIPMENT_STATUS_OPTIONS: Array<[AdminShipmentStatus, string]> = [
  ['PENDING', 'در انتظار ارسال'],
  ['PACKED', 'بسته‌بندی شده'],
  ['SHIPPED', 'ارسال شده'],
  ['DELIVERED', 'تحویل شده'],
];

const RETURN_REVIEW_OPTIONS: Array<[AdminReturnReviewStatus, string]> = [
  ['APPROVED', 'تأیید درخواست'],
  ['REJECTED', 'رد درخواست'],
  ['RECEIVED', 'تأیید دریافت و بازپرداخت'],
];

const SAFE_TRACKING_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

export function adminOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function adminOrderStatusTone(
  status: string,
): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (['DELIVERED', 'RETURNED'].includes(status)) return 'success';
  if (['PENDING_PAYMENT', 'PREPARING', 'DELAYED'].includes(status)) return 'warning';
  if (['CANCELLED', 'EXCEPTION'].includes(status)) return 'danger';
  if (['SHIPPED', 'CONFIRMED'].includes(status)) return 'info';
  return 'neutral';
}

export function hasAdminStaffRole(
  roles: readonly string[] | undefined,
  required: AdminStaffRole | AdminStaffRole[] = ['support', 'operations', 'admin'],
): boolean {
  if (!roles) return false;
  const requiredRoles = Array.isArray(required) ? required : [required];
  const normalized = new Set(roles.map((role) => role.toLowerCase()));
  return requiredRoles.some((role) => normalized.has(role));
}

export function normalizeTrackingReference(value: string): string | null {
  const normalized = value.trim();
  return normalized === '' ? null : normalized;
}

export function isSafeTrackingReference(value: string): boolean {
  return SAFE_TRACKING_PATTERN.test(value);
}

export function adminOrderErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'نشست کاربری منقضی شده است؛ دوباره وارد شوید.';
    if (error.status === 403) return 'شما اجازه انجام این عملیات را ندارید.';
    if (error.status === 409) return 'این سفارش هم‌زمان تغییر کرده است؛ نسخه تازه را بارگیری کنید.';
    if (error.payload?.error.message) return error.payload.error.message;
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'اتصال شبکه برقرار نیست؛ پس از اتصال دوباره تلاش کنید.';
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

function formatToman(value: number): string {
  return `${new Intl.NumberFormat('fa-IR').format(value)} تومان`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'تاریخ نامشخص';
  return new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatSnapshot(snapshot: unknown): string {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 'مشخصات ثبت‌شده';
  const entries = Object.entries(snapshot).filter(
    ([, value]) =>
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean',
  );
  if (!entries.length) return 'مشخصات ثبت‌شده';
  return entries
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

function statusClass(tone: ReturnType<typeof adminOrderStatusTone>): string {
  const classes = {
    success: 'border-success/30 bg-success-soft text-success',
    warning: 'border-warning/30 bg-warning-soft text-warning',
    danger: 'border-destructive/30 bg-error-soft text-destructive',
    info: 'border-info/30 bg-info-soft text-info',
    neutral: 'border-border bg-secondary text-muted-foreground',
  };
  return classes[tone];
}

function StatusChip({
  status,
  label = adminOrderStatusLabel(status),
}: {
  status: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-[11px] ${statusClass(adminOrderStatusTone(status))}`}
    >
      {label}
    </span>
  );
}

function PaymentChip({ status }: { status: string }) {
  const tone =
    status === 'PAID' || status === 'REFUNDED'
      ? 'success'
      : status === 'FAILED'
        ? 'danger'
        : 'warning';
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-md border px-2.5 py-1 text-[11px] ${statusClass(tone)}`}
    >
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function StatePanel({
  icon,
  title,
  description,
  action,
  tone = 'neutral',
}: {
  icon: 'package' | 'warning' | 'refresh' | 'info';
  title: string;
  description: string;
  action?: ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <section
      className={`border bg-surface p-8 text-center shadow-card ${tone === 'danger' ? 'border-destructive/40' : 'border-border'}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${tone === 'danger' ? 'bg-error-soft text-destructive' : 'bg-secondary text-primary'}`}
      >
        <Icon name={icon} size={22} />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </section>
  );
}

function PermissionPanel() {
  return (
    <StatePanel
      icon="warning"
      title="دسترسی عملیات سفارش ندارید"
      description="این بخش فقط برای اعضای مجاز پشتیبانی، عملیات یا مدیر سیستم در دسترس است."
      tone="danger"
    />
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);
      const activeIndex = focusable.indexOf(document.activeElement as HTMLElement);
      const wrapIndex = getModalFocusWrapIndex(activeIndex, focusable.length, event.shiftKey);
      if (wrapIndex === null) return;

      event.preventDefault();
      focusable[wrapIndex]?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previous?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/45 p-4 pt-[10vh]"
      role="presentation"
    >
      <div
        aria-labelledby="admin-order-dialog-title"
        aria-modal="true"
        className="w-full max-w-xl border border-border bg-surface p-5 shadow-float md:p-7"
        role="dialog"
        ref={dialogRef}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">تأیید عملیات</p>
            <h2 className="mt-2 text-xl font-semibold" id="admin-order-dialog-title">
              {title}
            </h2>
            {description ? (
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            aria-label="بستن پنجره"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="pt-5">{children}</div>
      </div>
    </div>
  );
}

function ListFilters({
  value,
  onChange,
}: {
  value: AdminOrderListQuery;
  onChange: (next: AdminOrderListQuery) => void;
}) {
  const [search, setSearch] = useState(value.q ?? '');

  useEffect(() => {
    setSearch(value.q ?? '');
  }, [value.q]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange({ ...value, page: 1, q: search.trim() || undefined });
  }

  return (
    <form className="border border-border bg-surface p-4 shadow-card md:p-5" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.7fr)_repeat(2,minmax(150px,0.8fr))_auto] md:items-end">
        <label className="block text-xs text-muted-foreground">
          جست‌وجو در سفارش‌ها
          <span className="relative mt-2 block">
            <Icon
              className="pointer-events-none absolute inset-inline-end-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              name="search"
              size={18}
            />
            <input
              aria-label="جست‌وجو در سفارش‌ها"
              className="min-h-12 w-full border border-border bg-background px-3 pe-10 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="شماره سفارش یا شناسه مشتری"
              value={search}
            />
          </span>
        </label>
        <label className="block text-xs text-muted-foreground">
          وضعیت سفارش
          <select
            aria-label="فیلتر وضعیت سفارش"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                status: (event.target.value || undefined) as CheckoutOrderStatus | undefined,
              })
            }
            value={value.status ?? ''}
          >
            <option value="">همه وضعیت‌ها</option>
            {ORDER_STATUS_OPTIONS.map(([status, label]) => (
              <option key={status} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-muted-foreground">
          وضعیت پرداخت
          <select
            aria-label="فیلتر وضعیت پرداخت"
            className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) =>
              onChange({
                ...value,
                page: 1,
                paymentStatus: (event.target.value ||
                  undefined) as AdminOrderListQuery['paymentStatus'],
              })
            }
            value={value.paymentStatus ?? ''}
          >
            {PAYMENT_STATUS_OPTIONS.map(([status, label]) => (
              <option key={status || 'all'} value={status}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <Button size="md" type="submit">
          <Icon name="search" size={17} />
          اعمال فیلتر
        </Button>
      </div>
    </form>
  );
}

function Pagination({
  page,
  limit,
  total,
  onPageChange,
}: {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  if (pageCount <= 1) return null;
  return (
    <nav
      aria-label="صفحه‌های سفارش‌ها"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
    >
      <span className="text-xs text-muted-foreground">
        صفحه {new Intl.NumberFormat('fa-IR').format(page)} از{' '}
        {new Intl.NumberFormat('fa-IR').format(pageCount)}
      </span>
      <div className="flex items-center gap-2" dir="ltr">
        <Button
          aria-label="صفحه قبل"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="icon"
          variant="outline"
        >
          <Icon name="arrow-left" size={18} />
        </Button>
        <Button
          aria-label="صفحه بعد"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          size="icon"
          variant="outline"
        >
          <Icon name="arrow-right" size={18} />
        </Button>
      </div>
    </nav>
  );
}

export function AdminOrdersPage({
  staffRoles,
  detailHref = (orderNumber) => `#admin/orders/${encodeURIComponent(orderNumber)}`,
}: {
  staffRoles?: readonly string[];
  detailHref?: (orderNumber: string) => string;
}) {
  const canView = hasAdminStaffRole(staffRoles);
  const [filters, setFilters] = useState<AdminOrderListQuery>({ page: 1, limit: 10 });
  const ordersQuery = useAdminOrders(filters, canView);

  if (!canView) return <PermissionPanel />;
  if (ordersQuery.isPending && !ordersQuery.data) {
    return (
      <StatePanel
        icon="package"
        title="در حال دریافت سفارش‌ها"
        description="فهرست واقعی سفارش‌ها از سرویس مدیریت بارگیری می‌شود."
      />
    );
  }
  if (ordersQuery.isError) {
    return (
      <StatePanel
        icon="warning"
        title="دریافت سفارش‌ها ممکن نشد"
        description={adminOrderErrorMessage(ordersQuery.error, 'دوباره تلاش کنید.')}
        tone="danger"
        action={
          <Button onClick={() => void ordersQuery.refetch()} variant="outline">
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );
  }

  const data = ordersQuery.data;
  const orders = data?.items ?? [];
  return (
    <main className="space-y-5" aria-labelledby="admin-orders-title">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">
            فضای مدیریت / عملیات
          </p>
          <h1 className="mt-2 text-3xl font-bold" id="admin-orders-title">
            سفارش‌ها
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            پیگیری وضعیت سفارش، ارسال، درخواست بازگشت و بازپرداخت بر اساس داده‌های ثبت‌شده.
          </p>
        </div>
        <div className="flex items-center gap-2 border border-border bg-surface px-4 py-3 text-xs text-muted-foreground">
          <Icon name="package" size={18} />
          <span>
            مجموع سفارش‌ها:{' '}
            <strong className="text-foreground">
              {new Intl.NumberFormat('fa-IR').format(data?.total ?? 0)}
            </strong>
          </span>
        </div>
      </header>

      <ListFilters onChange={setFilters} value={filters} />

      {orders.length === 0 ? (
        <StatePanel
          icon="package"
          title="سفارشی با این فیلتر پیدا نشد"
          description="عبارت جست‌وجو یا فیلترهای وضعیت را تغییر دهید؛ این صفحه داده عملیاتی ساختگی نمایش نمی‌دهد."
        />
      ) : (
        <section
          className="border border-border bg-surface shadow-card"
          aria-labelledby="admin-orders-list-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
            <h2 className="text-base font-semibold" id="admin-orders-list-title">
              فهرست سفارش‌ها
            </h2>
            <span className="text-xs text-muted-foreground">
              {new Intl.NumberFormat('fa-IR').format(orders.length)} مورد در این صفحه
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] border-collapse text-right text-xs">
              <caption className="sr-only">سفارش‌های واقعی قابل مشاهده برای کاربر فعلی</caption>
              <thead className="bg-background text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 font-medium" scope="col">
                    سفارش
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    مشتری
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    وضعیت
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    پرداخت
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    ارسال
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    مبلغ
                  </th>
                  <th className="px-4 py-3 font-medium" scope="col">
                    <span className="sr-only">عملیات</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    className="border-b border-border last:border-b-0 hover:bg-background"
                    key={order.orderId}
                  >
                    <td className="px-4 py-4 align-top">
                      <a
                        className="block min-h-11 rounded-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                        href={detailHref(order.orderNumber)}
                      >
                        <span className="font-semibold text-primary" dir="ltr">
                          {order.orderNumber}
                        </span>
                        <span className="mt-1 block text-[10px] text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </span>
                      </a>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="block">{order.customer?.email ?? 'مشتری ثبت‌نشده'}</span>
                      {order.customer?.phone ? (
                        <span className="mt-1 block text-[10px] text-muted-foreground" dir="ltr">
                          {order.customer.phone}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <StatusChip status={order.status} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <PaymentChip status={order.paymentStatus} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="text-muted-foreground">
                        {order.shipmentStatus
                          ? SHIPMENT_STATUS_LABELS[order.shipmentStatus]
                          : 'ثبت نشده'}
                      </span>
                      {order.trackingReference ? (
                        <span
                          className="mt-1 block max-w-[140px] truncate text-[10px] text-primary"
                          dir="ltr"
                          title={order.trackingReference}
                        >
                          {order.trackingReference}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 align-top whitespace-nowrap">
                      {formatToman(order.totalToman)}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <a
                        aria-label={`مشاهده سفارش ${order.orderNumber}`}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-primary hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                        href={detailHref(order.orderNumber)}
                      >
                        <Icon name="eye" size={18} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 md:p-5">
            <Pagination
              limit={data?.limit ?? 10}
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
              page={data?.page ?? filters.page ?? 1}
              total={data?.total ?? 0}
            />
          </div>
        </section>
      )}
    </main>
  );
}

type PendingAction =
  | { kind: 'status'; target: AdminFulfillmentOrderStatus }
  | { kind: 'shipment' }
  | { kind: 'return'; target: AdminReturnReviewStatus };

type ShipmentDraft = {
  provider: string;
  method: string;
  status: AdminShipmentStatus;
  trackingReference: string;
};

function orderActionTitle(action: PendingAction): string {
  if (action.kind === 'status') return `تغییر وضعیت به «${adminOrderStatusLabel(action.target)}»`;
  if (action.kind === 'shipment') return 'ثبت یا به‌روزرسانی ارسال';
  return action.target === 'RECEIVED'
    ? 'تأیید دریافت و شروع بازپرداخت'
    : `${action.target === 'APPROVED' ? 'تأیید' : 'رد'} درخواست بازگشت`;
}

export function AdminOrderDetailPage({
  orderNumber,
  staffRoles,
}: {
  orderNumber: string;
  staffRoles?: readonly string[];
}) {
  const canView = hasAdminStaffRole(staffRoles);
  const canOperate = hasAdminStaffRole(staffRoles, ['operations', 'admin']);
  const canReviewReturns = hasAdminStaffRole(staffRoles, ['support', 'admin']);
  const orderQuery = useAdminOrder(orderNumber, canView);
  const statusMutation = useUpdateAdminOrderStatus();
  const shipmentMutation = useUpdateAdminOrderShipment();
  const returnMutation = useReviewAdminOrderReturn();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [shipmentDraft, setShipmentDraft] = useState<ShipmentDraft>({
    provider: '',
    method: '',
    status: 'PENDING',
    trackingReference: '',
  });

  const closeAction = () => {
    if (statusMutation.isPending || shipmentMutation.isPending || returnMutation.isPending) return;
    setPendingAction(null);
    setActionError('');
    setReason('');
  };

  function openStatus(target: AdminFulfillmentOrderStatus) {
    setSuccessMessage('');
    setActionError('');
    setReason('');
    setPendingAction({ kind: 'status', target });
  }

  function openShipment() {
    setSuccessMessage('');
    setActionError('');
    setReason('');
    setShipmentDraft({
      provider: orderQuery.data?.shipment?.provider ?? '',
      method: orderQuery.data?.shipment?.method ?? '',
      status:
        orderQuery.data?.shipment?.status === 'RETURNED'
          ? 'PENDING'
          : (orderQuery.data?.shipment?.status ?? 'PENDING'),
      trackingReference: orderQuery.data?.shipment?.trackingReference ?? '',
    });
    setPendingAction({ kind: 'shipment' });
  }

  function openReturn(target: AdminReturnReviewStatus) {
    setSuccessMessage('');
    setActionError('');
    setReason('');
    setPendingAction({ kind: 'return', target });
  }

  async function submitAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const order = orderQuery.data;
    if (!order || !pendingAction) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setActionError('برای ثبت عملیات، دلیل را وارد کنید.');
      return;
    }
    if (trimmedReason.length > 500) {
      setActionError('دلیل عملیات نباید بیشتر از ۵۰۰ نویسه باشد.');
      return;
    }
    setActionError('');
    try {
      if (pendingAction.kind === 'status') {
        await statusMutation.mutateAsync({
          orderNumber: order.orderNumber,
          input: {
            status: pendingAction.target,
            reason: trimmedReason,
            expectedUpdatedAt: order.updatedAt,
          },
        });
        setSuccessMessage('وضعیت سفارش با موفقیت ثبت شد.');
      } else if (pendingAction.kind === 'shipment') {
        const provider = shipmentDraft.provider.trim();
        const method = shipmentDraft.method.trim();
        const trackingReference = normalizeTrackingReference(shipmentDraft.trackingReference);
        if (!provider || !method) {
          setActionError('نام سرویس و روش ارسال را وارد کنید.');
          return;
        }
        if (trackingReference && !isSafeTrackingReference(trackingReference)) {
          setActionError('شناسه رهگیری فقط می‌تواند شامل حروف لاتین، عدد و . _ : - باشد.');
          return;
        }
        await shipmentMutation.mutateAsync({
          orderNumber: order.orderNumber,
          input: {
            provider,
            method,
            status: shipmentDraft.status,
            trackingReference,
            reason: trimmedReason,
            expectedUpdatedAt: order.updatedAt,
          },
        });
        setSuccessMessage('اطلاعات ارسال با موفقیت ثبت شد.');
      } else {
        await returnMutation.mutateAsync({
          orderNumber: order.orderNumber,
          input: {
            status: pendingAction.target,
            reason: trimmedReason,
            expectedUpdatedAt: order.updatedAt,
          },
        });
        setSuccessMessage(
          pendingAction.target === 'RECEIVED'
            ? 'دریافت ثبت شد؛ وضعیت بازپرداخت از پاسخ سرویس به‌روزرسانی می‌شود.'
            : 'بررسی درخواست بازگشت با موفقیت ثبت شد.',
        );
      }
      closeAction();
    } catch (error) {
      setActionError(
        adminOrderErrorMessage(
          error,
          'عملیات انجام نشد؛ اطلاعات تازه را بررسی و دوباره تلاش کنید.',
        ),
      );
    }
  }

  if (!canView) return <PermissionPanel />;
  if (orderQuery.isPending && !orderQuery.data)
    return (
      <StatePanel
        icon="package"
        title="در حال دریافت جزئیات سفارش"
        description="نمایش سفارش از سرویس مدیریت بارگیری می‌شود."
      />
    );
  if (orderQuery.isError || !orderQuery.data)
    return (
      <StatePanel
        icon="warning"
        title="جزئیات سفارش در دسترس نیست"
        description={adminOrderErrorMessage(
          orderQuery.error,
          'این سفارش پیدا نشد یا قابل مشاهده نیست.',
        )}
        tone="danger"
        action={
          <Button onClick={() => void orderQuery.refetch()} variant="outline">
            <Icon name="refresh" size={17} />
            تلاش دوباره
          </Button>
        }
      />
    );

  const order = orderQuery.data;
  const isSubmitting =
    statusMutation.isPending || shipmentMutation.isPending || returnMutation.isPending;
  const returnRequest = order.returnRequest;
  return (
    <main className="space-y-5" aria-labelledby="admin-order-detail-title">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <a
            className="inline-flex min-h-11 items-center gap-2 text-xs text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            href="#admin/orders"
          >
            <Icon name="arrow-right" size={17} />
            بازگشت به سفارش‌ها
          </a>
          <p className="mt-4 text-[10px] font-semibold tracking-[0.18em] text-primary">
            جزئیات سفارش / عملیات
          </p>
          <h1 className="mt-2 text-3xl font-bold" id="admin-order-detail-title">
            <span dir="ltr">{order.orderNumber}</span>
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            آخرین تغییر: {formatDate(order.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={order.status} />
          <PaymentChip status={order.paymentStatus} />
        </div>
      </header>

      {successMessage ? (
        <div
          className="flex items-start gap-3 border border-success/30 bg-success-soft p-4 text-sm text-success"
          role="status"
        >
          <Icon name="check" size={19} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3" aria-label="خلاصه سفارش">
        <SummaryCard
          icon="package"
          label="مبلغ نهایی"
          value={formatToman(order.totalToman)}
          detail={`ثبت شده در ${formatDate(order.createdAt)}`}
        />
        <SummaryCard
          icon="user"
          label="مشتری"
          value={order.customer?.email ?? 'مشتری ثبت‌نشده'}
          detail={order.customer?.phone ?? 'شماره ثبت نشده'}
          ltrDetail={Boolean(order.customer?.phone)}
        />
        <SummaryCard
          icon="truck"
          label="ارسال"
          value={
            order.shipment
              ? (SHIPMENT_STATUS_LABELS[order.shipment.status] ?? 'نامشخص')
              : 'ثبت نشده'
          }
          detail={order.shipment?.trackingReference ?? 'شناسه رهگیری ثبت نشده'}
          ltrDetail={Boolean(order.shipment?.trackingReference)}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-5">
          <section
            className="border border-border bg-surface shadow-card"
            aria-labelledby="admin-order-items-title"
          >
            <PanelHeading icon="bag" title="اقلام سفارش" id="admin-order-items-title">
              <span className="text-xs text-muted-foreground">نسخه ثبت‌شده و غیرقابل ویرایش</span>
            </PanelHeading>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div
                  className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center md:p-5"
                  key={item.id}
                >
                  <div>
                    <strong className="block text-sm">{item.productName}</strong>
                    <span className="mt-1 block text-xs text-muted-foreground" dir="ltr">
                      SKU: {item.sku}
                    </span>
                    <span className="mt-2 block text-[11px] text-primary">
                      {formatSnapshot(item.variantSnapshot)}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    تعداد: {new Intl.NumberFormat('fa-IR').format(item.quantity)}
                  </span>
                  <strong className="text-sm whitespace-nowrap">
                    {formatToman(item.totalToman)}
                  </strong>
                </div>
              ))}
            </div>
          </section>

          <section
            className="border border-border bg-surface shadow-card"
            aria-labelledby="admin-order-timeline-title"
          >
            <PanelHeading icon="calendar" title="خط زمانی وضعیت" id="admin-order-timeline-title" />
            {order.events.length ? (
              <ol className="divide-y divide-border">
                {order.events.map((event, index) => (
                  <li className="flex gap-3 p-4 md:p-5" key={`${event.createdAt}-${index}`}>
                    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-primary">
                      <Icon name="check" size={16} />
                    </span>
                    <div>
                      <strong className="block text-sm">
                        {event.toStatus ? adminOrderStatusLabel(event.toStatus) : 'ثبت سفارش'}
                      </strong>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDate(event.createdAt)}
                        {event.fromStatus ? ` · از ${adminOrderStatusLabel(event.fromStatus)}` : ''}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="p-5 text-sm text-muted-foreground">رویداد قابل نمایش ثبت نشده است.</p>
            )}
          </section>
        </div>

        <div className="space-y-5">
          <OperationsPanel
            canOperate={canOperate}
            onShipment={openShipment}
            onStatus={openStatus}
            order={order}
          />
          <ReturnPanel canReview={canReviewReturns} onReview={openReturn} request={returnRequest} />
          <RefundPanel refunds={order.refunds} payment={order.payment} />
          <AddressPanel address={order.address} />
        </div>
      </section>

      {pendingAction ? (
        <Modal
          description={
            pendingAction.kind === 'return' && pendingAction.target === 'RECEIVED'
              ? 'این عملیات طبق قرارداد سرویس، دریافت کالا و فرایند بازپرداخت را ثبت می‌کند. نتیجه موفق یا ناموفق در همین سفارش قابل مشاهده خواهد بود.'
              : 'این تغییر پس از تأیید با نسخه فعلی سفارش ثبت می‌شود.'
          }
          onClose={closeAction}
          title={orderActionTitle(pendingAction)}
        >
          <form className="space-y-4" onSubmit={submitAction}>
            {pendingAction.kind === 'status' ? (
              <label className="block text-xs text-muted-foreground">
                وضعیت هدف
                <select
                  className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) =>
                    setPendingAction({
                      kind: 'status',
                      target: event.target.value as AdminFulfillmentOrderStatus,
                    })
                  }
                  value={pendingAction.target}
                >
                  {FULFILLMENT_STATUS_OPTIONS.map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {pendingAction.kind === 'return' ? (
              <label className="block text-xs text-muted-foreground">
                نتیجه بررسی
                <select
                  className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) =>
                    setPendingAction({
                      kind: 'return',
                      target: event.target.value as AdminReturnReviewStatus,
                    })
                  }
                  value={pendingAction.target}
                >
                  {RETURN_REVIEW_OPTIONS.map(([status, label]) => (
                    <option key={status} value={status}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {pendingAction.kind === 'shipment' ? (
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block text-xs text-muted-foreground">
                  سرویس ارسال
                  <input
                    required
                    className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={80}
                    onChange={(event) =>
                      setShipmentDraft((draft) => ({ ...draft, provider: event.target.value }))
                    }
                    value={shipmentDraft.provider}
                  />
                </label>
                <label className="block text-xs text-muted-foreground">
                  روش ارسال
                  <input
                    required
                    className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    maxLength={80}
                    onChange={(event) =>
                      setShipmentDraft((draft) => ({ ...draft, method: event.target.value }))
                    }
                    value={shipmentDraft.method}
                  />
                </label>
                <label className="block text-xs text-muted-foreground">
                  وضعیت ارسال
                  <select
                    className="mt-2 min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) =>
                      setShipmentDraft((draft) => ({
                        ...draft,
                        status: event.target.value as AdminShipmentStatus,
                      }))
                    }
                    value={shipmentDraft.status}
                  >
                    {SHIPMENT_STATUS_OPTIONS.map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs text-muted-foreground">
                  شناسه رهگیری
                  <span className="relative mt-2 block">
                    <input
                      className="min-h-12 w-full border border-border bg-background px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      dir="ltr"
                      maxLength={128}
                      onChange={(event) =>
                        setShipmentDraft((draft) => ({
                          ...draft,
                          trackingReference: event.target.value,
                        }))
                      }
                      placeholder="TRK-2026-001"
                      value={shipmentDraft.trackingReference}
                    />
                  </span>
                </label>
              </div>
            ) : null}
            <label className="block text-xs text-muted-foreground">
              دلیل عملیات
              <textarea
                required
                aria-describedby={actionError ? 'admin-order-action-error' : undefined}
                className="mt-2 min-h-28 w-full resize-y border border-border bg-background px-3 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                placeholder="دلیل قابل پیگیری این تغییر را بنویسید."
                value={reason}
              />
            </label>
            {actionError ? (
              <p
                className="border border-destructive/30 bg-error-soft p-3 text-sm leading-7 text-destructive"
                id="admin-order-action-error"
                role="alert"
              >
                {actionError}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button disabled={isSubmitting} onClick={closeAction} type="button" variant="outline">
                انصراف
              </Button>
              <Button loading={isSubmitting} type="submit">
                تأیید و ثبت
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  detail,
  ltrDetail = false,
}: {
  icon: 'package' | 'user' | 'truck';
  label: string;
  value: string;
  detail: string;
  ltrDetail?: boolean;
}) {
  return (
    <article className="border border-border bg-surface p-4 shadow-card md:p-5">
      <div className="flex items-center gap-3 text-primary">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft">
          <Icon name={icon} size={18} />
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <strong className="mt-4 block truncate text-base" title={value}>
        {value}
      </strong>
      <span
        className="mt-2 block truncate text-[10px] text-muted-foreground"
        dir={ltrDetail ? 'ltr' : undefined}
        title={detail}
      >
        {detail}
      </span>
    </article>
  );
}

function PanelHeading({
  icon,
  title,
  id,
  children,
}: {
  icon: 'bag' | 'calendar' | 'truck' | 'rotate' | 'info';
  title: string;
  id: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 md:px-5">
      <h2 className="flex items-center gap-2 text-base font-semibold" id={id}>
        <Icon name={icon} size={18} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function OperationsPanel({
  order,
  canOperate,
  onStatus,
  onShipment,
}: {
  order: AdminOrderDetail;
  canOperate: boolean;
  onStatus: (target: AdminFulfillmentOrderStatus) => void;
  onShipment: () => void;
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-operations-title"
    >
      <PanelHeading
        icon="truck"
        title="عملیات fulfillment و ارسال"
        id="admin-order-operations-title"
      />
      <div className="space-y-4 p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">وضعیت فعلی</span>
          <StatusChip status={order.status} />
        </div>
        <div className="grid gap-2">
          <p className="text-xs font-medium">تغییر وضعیت</p>
          <div className="grid grid-cols-3 gap-2">
            {FULFILLMENT_STATUS_OPTIONS.map(([status, label]) => (
              <Button
                disabled={!canOperate || order.status === status}
                key={status}
                onClick={() => onStatus(status)}
                size="sm"
                variant={order.status === status ? 'secondary' : 'outline'}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="border-t border-border pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium">اطلاعات ارسال</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {order.shipment
                  ? `${SHIPMENT_STATUS_LABELS[order.shipment.status]} · ${order.shipment.method}`
                  : 'هنوز ثبت نشده'}
              </p>
            </div>
            {order.shipment?.trackingReference ? (
              <span className="max-w-[130px] truncate text-[10px] text-primary" dir="ltr">
                {order.shipment.trackingReference}
              </span>
            ) : null}
          </div>
          <Button
            className="mt-3 w-full"
            disabled={!canOperate}
            onClick={onShipment}
            size="sm"
            variant="outline"
          >
            <Icon name="edit" size={16} />
            ویرایش اطلاعات ارسال
          </Button>
        </div>
        {!canOperate ? (
          <p className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
            <Icon name="info" size={15} />
            نقش فعلی فقط اجازه مشاهده این عملیات را دارد.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ReturnPanel({
  request,
  canReview,
  onReview,
}: {
  request: AdminOrderDetail['returnRequest'];
  canReview: boolean;
  onReview: (target: AdminReturnReviewStatus) => void;
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-return-title"
    >
      <PanelHeading icon="rotate" title="بررسی بازگشت" id="admin-order-return-title" />
      {request ? (
        <div className="space-y-4 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">وضعیت درخواست</span>
            <StatusChip
              label={RETURN_STATUS_LABELS[request.status] ?? request.status}
              status={request.status}
            />
          </div>
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">دلیل</dt>
              <dd>{request.reason}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">درخواست در</dt>
              <dd>{formatDate(request.requestedAt)}</dd>
            </div>
          </dl>
          <div className="grid gap-2">
            {RETURN_REVIEW_OPTIONS.map(([status, label]) => (
              <Button
                disabled={
                  !canReview ||
                  request.status === status ||
                  (request.status !== 'REQUESTED' && status !== 'RECEIVED')
                }
                key={status}
                onClick={() => onReview(status)}
                size="sm"
                variant={status === 'RECEIVED' ? 'primary' : 'outline'}
              >
                {label}
              </Button>
            ))}
          </div>
          {!canReview ? (
            <p className="flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
              <Icon name="info" size={15} />
              نقش فعلی اجازه بررسی درخواست بازگشت را ندارد.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="p-5 text-sm leading-7 text-muted-foreground">
          برای این سفارش درخواست بازگشتی ثبت نشده است.
        </p>
      )}
    </section>
  );
}

function RefundPanel({
  refunds,
  payment,
}: {
  refunds: AdminOrderDetail['refunds'];
  payment: AdminOrderDetail['payment'];
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-refund-title"
    >
      <PanelHeading icon="rotate" title="بازپرداخت‌ها" id="admin-order-refund-title" />
      {refunds.length ? (
        <div className="divide-y divide-border">
          {refunds.map((refund) => (
            <div className="space-y-2 p-4 md:p-5" key={refund.id}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{formatToman(refund.amountToman)}</span>
                <StatusChip
                  label={REFUND_STATUS_LABELS[refund.status] ?? refund.status}
                  status={refund.status}
                />
              </div>
              <div className="flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
                <span>{formatDate(refund.createdAt)}</span>
                <span dir="ltr">شناسه داخلی: {refund.id}</span>
              </div>
              {refund.reason ? (
                <p className="text-xs leading-6 text-muted-foreground">دلیل: {refund.reason}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-5">
          <p className="text-sm text-muted-foreground">بازپرداختی برای این سفارش ثبت نشده است.</p>
          {payment ? (
            <p className="mt-2 text-xs text-muted-foreground">
              وضعیت تلاش پرداخت: {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function AddressPanel({ address }: { address: AdminOrderDetail['address'] }) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-order-address-title"
    >
      <PanelHeading icon="info" title="نشانی ثبت‌شده" id="admin-order-address-title" />
      {address ? (
        <div className="space-y-2 p-4 text-xs leading-7 md:p-5">
          <p>{address.recipientName}</p>
          <p className="text-muted-foreground">
            {address.province}، {address.city}، {address.addressLine}
          </p>
          <p className="text-muted-foreground">
            <span dir="ltr">{address.phone}</span> · <span dir="ltr">{address.postalCode}</span>
          </p>
        </div>
      ) : (
        <p className="p-5 text-sm text-muted-foreground">نشانی برای این سفارش ثبت نشده است.</p>
      )}
    </section>
  );
}
