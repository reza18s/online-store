import { encodeOrderNumber } from './encode-order-number';

export function adminOrderStatusPath(orderNumber: string): string {
  return `/v1/admin/orders/${encodeOrderNumber(orderNumber)}/status`;
}
