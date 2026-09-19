import { encodeOrderNumber } from './encode-order-number';

export function adminOrderReturnPath(orderNumber: string): string {
  return `/v1/admin/orders/${encodeOrderNumber(orderNumber)}/return`;
}
