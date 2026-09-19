import { useState } from 'react';
import { type AdminOrderListQuery } from '@nova/api-client';
import { Button } from '@nova/ui';
import { useAdminOrders } from '../../../lib/admin/admin-orders-api';
import { Icon } from '../../ui/icon';

import { SHIPMENT_STATUS_LABELS } from '../../../pages/admin/admin-orders-page-shared';

import { ListFilters } from './list-filters';

import { OrderMetricCard } from './order-metric-card';

import { Pagination } from './pagination';

import { PaymentChip } from './payment-chip';

import { PermissionPanel } from './permission-panel';

import { StatePanel } from './state-panel';

import { StatusChip } from './status-chip';

import { adminOrderErrorMessage } from './admin-order-error-message';

import { formatDate } from './format-date';

import { formatToman } from './format-toman';

import { hasAdminStaffRole } from './has-admin-staff-role';

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

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4" aria-label="شاخص‌های سفارش‌ها">
        <OrderMetricCard
          icon="bag"
          label="کل سفارش‌ها"
          tone="bg-warning-soft text-warning"
          value={data?.total ?? 0}
        />
        <OrderMetricCard
          icon="tag"
          label="پرداخت موفق"
          tone="bg-success-soft text-success"
          value={orders.filter((order) => order.paymentStatus === 'PAID').length}
        />
        <OrderMetricCard
          icon="package"
          label="تکمیل شده"
          tone="bg-success-soft text-success"
          value={orders.filter((order) => order.status === 'DELIVERED').length}
        />
        <OrderMetricCard
          icon="arrow-left"
          label="در انتظار مرجوعی"
          tone="bg-error-soft text-error"
          value={orders.filter((order) => order.status === 'RETURNED').length}
        />
      </section>

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
