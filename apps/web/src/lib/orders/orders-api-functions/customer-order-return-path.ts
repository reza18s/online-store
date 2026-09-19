import { encodeOrderNumber } from './encode-order-number';

export function customerOrderReturnPath(orderNumber: string): string {
  return `/v1/account/orders/${encodeOrderNumber(orderNumber)}/returns`;
}
