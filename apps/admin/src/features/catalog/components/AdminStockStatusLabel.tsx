import type { AdminProductStockStatus } from '@/features/catalog/types';

export function adminStockStatusLabel(status: AdminProductStockStatus): string {
  const labels: Record<AdminProductStockStatus, string> = {
    IN_STOCK: 'فعال',
    LOW_STOCK: 'موجودی کم',
    OUT_OF_STOCK: 'ناموجود',
  };
  return labels[status];
}
