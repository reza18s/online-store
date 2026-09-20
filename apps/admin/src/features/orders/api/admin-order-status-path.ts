import { encodeOrderNumber } from '@/features/orders/api/encode-order-number';

export function adminOrderStatusPath(orderNumber: string): string {
  return `/v1/admin/orders/${encodeOrderNumber(orderNumber)}/status`;
}
