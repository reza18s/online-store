import { type CustomerOrderDetail } from '@nova/api-client';

export function canCancelCustomerOrder(
  order: Pick<CustomerOrderDetail, 'status' | 'paymentStatus'>,
): boolean {
  return (
    (order.status === 'PENDING_PAYMENT' && order.paymentStatus === 'PENDING') ||
    (order.status === 'CONFIRMED' && order.paymentStatus === 'PAID')
  );
}
