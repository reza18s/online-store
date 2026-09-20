import type { AdminLowStockItem, AdminOrderPreview } from '@/shared/fixtures/app-shared';

import { Icon } from '@/shared/ui/icon';

import { formatPersianNumber } from '@/shared/utils/format-persian-number';

import { formatToman } from '@/shared/utils/format-toman';

type AdminProductsOverviewProps = {
  lowStockItems: AdminLowStockItem[];
  lowStockCount: number;
  orderPreviews: AdminOrderPreview[];
  isPreview: boolean;
};

export function AdminProductsOverview({
  lowStockItems,
  lowStockCount,
  orderPreviews,
  isPreview,
}: AdminProductsOverviewProps) {
  return (
    <aside className="order-1 space-y-4">
      <section
        className="rounded-panel border border-border bg-surface p-4 shadow-card"
        aria-labelledby="admin-low-stock-title"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Icon name="warning" size={20} className="text-warning" />
            <h2 className="text-base font-semibold" id="admin-low-stock-title">
              موجودی کم
            </h2>
          </div>
          <span className="rounded-full bg-warning-100 px-2 py-1 text-[10px] text-warning">
            {formatPersianNumber(lowStockCount)} مورد
          </span>
        </div>
        <div className="divide-y divide-border">
          {lowStockItems.map((item) => (
            <a
              className="flex items-center gap-3 py-3 transition-colors first:pt-4 last:pb-1 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href="#admin/inventory"
              key={`${item.productId}-${item.slug}`}
            >
              {item.image ? (
                <img
                  className="h-14 w-14 rounded-control border border-border bg-background object-cover"
                  src={item.image}
                  alt={item.alt}
                  loading="lazy"
                />
              ) : (
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-control border border-border bg-background text-muted-foreground"
                  aria-hidden="true"
                >
                  <Icon name="shirt" size={20} />
                </span>
              )}
              <span className="min-w-0 flex-1 text-right">
                <strong className="block truncate text-xs font-medium">{item.name}</strong>
                <small className="mt-1 block text-[10px] text-warning">
                  {isPreview ? 'موجودی نمونه' : `${formatPersianNumber(item.stock)} عدد باقی مانده`}
                </small>
              </span>
              <Icon name="arrow-left" size={16} className="shrink-0 text-muted-foreground" />
            </a>
          ))}
        </div>
        <a
          className="mt-3 inline-flex items-center gap-2 text-xs text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          href="#admin/inventory"
        >
          مشاهده همه
          <Icon name="arrow-left" size={15} />
        </a>
      </section>

      <section
        className="rounded-panel border border-border bg-surface p-4 shadow-card"
        aria-labelledby="admin-orders-title"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Icon name="package" size={19} className="text-muted-foreground" />
            <h2 className="text-base font-semibold" id="admin-orders-title">
              سفارش‌ها
            </h2>
          </div>
          <a
            className="text-[10px] text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            href="#admin/orders"
          >
            مشاهده همه
          </a>
        </div>
        <div className="divide-y divide-border">
          {orderPreviews.map((order) => (
            <a
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-3 first:pt-4 last:pb-1 transition-colors hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href={`#admin/orders/${order.orderNumber}`}
              key={order.id}
            >
              <span className="text-[10px] text-muted-foreground" dir="ltr">
                {order.id}
              </span>
              <span className="min-w-0 text-right">
                <strong className="block truncate text-[11px] font-medium">{order.customer}</strong>
                <small className="mt-1 block text-[9px] text-muted-foreground">{order.date}</small>
              </span>
              <span className="text-left">
                <strong className="block whitespace-nowrap text-[10px] font-medium">
                  {isPreview ? 'مبلغ نمونه' : formatToman(order.amount)}
                </strong>
                <small
                  className={`mt-1 block whitespace-nowrap rounded px-1.5 py-1 text-[9px] ${order.statusTone === 'warning' ? 'bg-warning-100 text-warning' : order.statusTone === 'danger' ? 'bg-destructive-100 text-destructive' : 'bg-success-100 text-success'}`}
                >
                  {order.status}
                </small>
              </span>
            </a>
          ))}
        </div>
      </section>
    </aside>
  );
}
