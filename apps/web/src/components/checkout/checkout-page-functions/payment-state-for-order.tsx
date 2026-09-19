import { type CustomerOrderDetail } from '@nova/api-client';

import { type PaymentRecoveryState } from '../../../lib/checkout/checkout-state';

export function paymentStateForOrder(order: CustomerOrderDetail): PaymentRecoveryState | null {
  if (order.paymentStatus === 'PAID' || order.status === 'CONFIRMED') return null;
  switch (order.payment?.status) {
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    case 'EXPIRED':
      return 'timeout';
    default:
      return 'pending';
  }
}
