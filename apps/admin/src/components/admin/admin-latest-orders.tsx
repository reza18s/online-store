import { Icon } from '../ui/icon';

import { adminLatestOrders } from '../app/app-shared';

import { AdminStatusChip } from './admin-status-chip';

export function AdminLatestOrders({ className = '' }: { className?: string }) {
  return (
    <section
      className={`border border-border bg-surface p-4 shadow-card md:p-5 ${className}`}
      aria-labelledby="latest-orders-title"
    >
      <header className="flex items-center justify-between border-b border-border pb-3">
        <h2 id="latest-orders-title" className="text-base md:text-lg">
          آخرین سفارش‌ها
        </h2>
        <a className="text-link text-xs" href="#admin/orders">
          مشاهده همه <Icon name="arrow-left" size={14} />
        </a>
      </header>
      <div className="mt-1">
        {adminLatestOrders.map((order) => (
          <a
            className="grid min-h-[58px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border py-2.5 text-right last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:gap-3"
            href={`#admin/orders/${order.id.slice(1)}`}
            key={order.id}
          >
            <span className="font-latin text-[10px] text-muted-foreground" dir="ltr">
              {order.id}
            </span>
            <span className="min-w-0">
              <strong className="block truncate text-xs font-medium">{order.customer}</strong>
              <small className="mt-1 block text-[9px] text-muted-foreground">{order.time}</small>
            </span>
            <span className="hidden text-[10px] text-muted-foreground md:block">
              {order.amount}
            </span>
            <AdminStatusChip tone={order.tone}>{order.status}</AdminStatusChip>
          </a>
        ))}
      </div>
    </section>
  );
}
