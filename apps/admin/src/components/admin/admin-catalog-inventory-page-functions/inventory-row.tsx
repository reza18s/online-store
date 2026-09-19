import { type AdminInventoryItem } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '../../ui/icon';

import { StatusBadge } from './status-badge';

import { formatNumber } from './format-number';

export function InventoryRow({
  item,
  selected,
  onSelect,
}: {
  item: AdminInventoryItem;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <Button
      className={`flex min-h-[92px] w-full items-center gap-3 px-4 py-4 text-right transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${selected ? 'bg-accent-soft' : ''}`}
      onClick={() => onSelect(item.variantId)}
      type="button"
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${item.stockStatus === 'LOW_STOCK' ? 'bg-warning-soft text-warning' : item.stockStatus === 'OUT_OF_STOCK' ? 'bg-error-soft text-destructive' : 'bg-success-soft text-success'}`}
      >
        <Icon name="warehouse" size={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{item.productName}</span>
        <span className="mt-1 block truncate text-[10px] text-muted-foreground">
          {item.variantTitle ?? 'تنوع اصلی'} · <span dir="ltr">{item.sku}</span>
        </span>
      </span>
      <span className="hidden text-left text-xs sm:block">
        <span className="block">{formatNumber(item.available)} قابل فروش</span>
        <span className="mt-1 block text-[10px] text-muted-foreground">
          نقطه سفارش {formatNumber(item.reorderPoint)}
        </span>
      </span>
      <StatusBadge status={item.stockStatus} />
    </Button>
  );
}
