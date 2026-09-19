import { type AdminInventoryItem } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { LoadingState } from './loading-state';

import { formatNumber } from './format-number';

export function LowStockCard({
  items,
  query,
}: {
  items: AdminInventoryItem[];
  query: { isPending: boolean; isError: boolean; refetch: () => Promise<unknown> };
}) {
  return (
    <section
      className="border border-border bg-surface shadow-card"
      aria-labelledby="admin-low-stock-title"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.14em] text-warning">
            INVENTORY WATCH
          </p>
          <h3 className="mt-1 font-semibold" id="admin-low-stock-title">
            موجودی کم
          </h3>
        </div>
        <Icon className="text-warning" name="warning" size={20} />
      </div>
      {query.isPending ? (
        <div className="p-4">
          <LoadingState label="در حال دریافت هشدارهای موجودی..." />
        </div>
      ) : query.isError ? (
        <div className="p-4">
          <Button
            className="min-h-11 text-xs text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => void query.refetch()}
            type="button"
          >
            دریافت دوباره
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="p-5 text-xs leading-7 text-muted-foreground">
          هشدار موجودی فعالی ثبت نشده است.
        </p>
      ) : (
        <div className="divide-y divide-border">
          {items.map((item) => (
            <a
              className="flex min-h-[76px] items-center gap-3 px-4 py-3 transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              href={`#admin/inventory/${encodeURIComponent(item.variantId)}`}
              key={item.id}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-warning-soft text-warning">
                <Icon name="package" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{item.productName}</span>
                <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                  {item.variantTitle ?? 'تنوع اصلی'} · {formatNumber(item.available)} قابل فروش
                </span>
              </span>
              <Icon name="arrow-left" size={15} />
            </a>
          ))}
        </div>
      )}
      <a
        className="flex min-h-11 items-center justify-center gap-2 border-t border-border text-xs text-primary hover:bg-background focus-visible:outline-2 focus-visible:outline-primary"
        href="#admin/inventory"
      >
        مشاهده همه <Icon name="arrow-left" size={15} />
      </a>
    </section>
  );
}
