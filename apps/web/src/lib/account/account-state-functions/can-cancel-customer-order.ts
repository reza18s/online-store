import { type CustomerOrderDetail } from '@nova/api-client';

export function canCancelCustomerOrder(order: Pick<CustomerOrderDetail, 'status'>): boolean {
  return order.status === 'PENDING_PAYMENT' || order.status === 'CONFIRMED';
}
