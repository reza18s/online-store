import { type AdminInventoryItem } from '@nova/api-client';

export function isInventoryDiscrepancy(
  item: Pick<AdminInventoryItem, 'onHand' | 'reserved' | 'available'>,
): boolean {
  return item.onHand - item.reserved !== item.available;
}
