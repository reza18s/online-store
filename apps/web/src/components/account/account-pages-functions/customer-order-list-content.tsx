import { useState } from 'react';
import { type CheckoutOrderStatus } from '@nova/api-client';
import { Button } from '@nova/ui';

import { useCustomerOrders } from '../../../lib/orders/orders-api';
import { Icon } from '../../../components/ui/icon';
import {
  formatPersianDate,
  formatToman,
  orderStatusCopy,
  useOnlineStatus,
} from '../../../lib/account/account-state';

import { EmptyState } from './empty-state';

import { InlineQueryError } from './inline-query-error';

export function CustomerOrderListContent({
  query,
}: {
  query: ReturnType<typeof useCustomerOrders>;
}) {
  const [status, setStatus] = useState<'ALL' | CheckoutOrderStatus>('ALL');
  const online = useOnlineStatus();
  const filteredQuery = useCustomerOrders(
    { page: 1, limit: 10, status: status === 'ALL' ? undefined : status },
    status !== 'ALL',
  );
  const activeQuery = status === 'ALL' ? query : filteredQuery;
  const orders = activeQuery.data?.items ?? [];
  const statuses: Array<'ALL' | CheckoutOrderStatus> = [
    'ALL',
    'PENDING_PAYMENT',
    'CONFIRMED',
    'PREPARING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
  ];
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="فیلتر سفارش‌ها">
        {statuses.map((item) => (
          <Button
            className={`min-h-11 border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${status === item ? 'border-primary bg-accent-soft text-primary' : 'border-border bg-surface hover:border-primary'}`}
            key={item}
            onClick={() => setStatus(item)}
            type="button"
          >
            {item === 'ALL' ? 'همه' : orderStatusCopy[item]}
          </Button>
        ))}
      </div>
      {activeQuery.isPending ? (
        <div
          className="account-order-list animate-pulse"
          role="status"
          aria-label="در حال بارگذاری سفارش‌ها"
        >
          {[1, 2, 3].map((item) => (
            <div className="h-20 rounded bg-secondary" key={item} />
          ))}
        </div>
      ) : null}
      {activeQuery.isError ? (
        <InlineQueryError error={activeQuery.error} onRetry={() => void activeQuery.refetch()} />
      ) : null}
      {!activeQuery.isPending && !activeQuery.isError && orders.length === 0 ? (
        <EmptyState
          title="هنوز سفارشی ثبت نکرده‌اید"
          description="وقتی اولین خرید خود را انجام دهید، وضعیت آن را همین‌جا دنبال می‌کنید."
          action="مشاهده فروشگاه"
          href="#products"
          icon="package"
        />
      ) : null}
      {!activeQuery.isPending && !activeQuery.isError && orders.length > 0 ? (
        <div className="account-order-list">
          {orders.map((order) => (
            <a
              className="order-card"
              href={`#order/${encodeURIComponent(order.orderNumber)}`}
              key={order.orderId}
            >
              <div>
                <span dir="ltr">{order.orderNumber}</span>
                <small>
                  {formatPersianDate(order.createdAt)} · {formatToman(order.totalToman)}
                </small>
              </div>
              <strong>{orderStatusCopy[order.status]}</strong>
              <Icon name="arrow-left" size={17} />
            </a>
          ))}
        </div>
      ) : null}
      {!online ? (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          اتصال فعلی قطع است؛ اقدام‌های سفارش فقط پس از اتصال انجام می‌شوند.
        </p>
      ) : null}
    </>
  );
}
