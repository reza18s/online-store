import { type AdminInventoryItem } from '@nova/api-client';
import { Button } from '@nova/ui';

import { Icon } from '@/shared/ui/icon';

import { StatusBadge } from '@/features/catalog/components/catalog-inventory/status-badge';

import { formatPersianNumber as formatNumber } from '@/shared/utils/format-persian-number';

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
      className={`admin-reference-inventory-row ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(item.variantId)}
      type="button"
      variant="ghost"
    >
      <span className="admin-reference-inventory-row__product">
        <span
          className={`admin-reference-inventory-row__thumb ${item.stockStatus === 'LOW_STOCK' ? 'is-low' : item.stockStatus === 'OUT_OF_STOCK' ? 'is-out' : 'is-ok'}`}
        >
          <Icon name="shirt" size={20} />
        </span>
        <span>
          <strong>{item.productName}</strong>
          <small>{item.variantTitle ?? 'تنوع اصلی'}</small>
        </span>
      </span>
      <span dir="ltr" className="admin-reference-inventory-row__sku">{item.sku}</span>
      <span>{formatNumber(item.available)}</span>
      <span>{formatNumber(item.reserved)}</span>
      <span>{formatNumber(item.onHand)}</span>
      <span>{formatNumber(item.reorderPoint)}</span>
      <StatusBadge status={item.stockStatus} />
      <span className="admin-reference-inventory-row__more" aria-hidden="true">
        <Icon name="more-vertical" size={17} />
      </span>
    </Button>
  );
}
