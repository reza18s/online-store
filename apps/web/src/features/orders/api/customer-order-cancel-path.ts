import { encodeOrderNumber } from '@/features/orders/api/encode-order-number';

export function customerOrderCancelPath(orderNumber: string): string {
  return `/v1/account/orders/${encodeOrderNumber(orderNumber)}/cancel`;
}
