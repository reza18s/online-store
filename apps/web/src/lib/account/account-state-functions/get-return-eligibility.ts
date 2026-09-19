import { type CustomerOrderDetail } from '@nova/api-client';

import type { ReturnEligibility } from '../account-state-shared';
import { CUSTOMER_RETURN_WINDOW_MILLISECONDS } from '../account-state-shared';

export function getReturnEligibility(
  order: Pick<CustomerOrderDetail, 'status' | 'paymentStatus' | 'shipment' | 'returnRequest'>,
  now = new Date(),
): ReturnEligibility {
  if (order.returnRequest) return { eligible: false, reason: 'already-requested' };
  if (order.status !== 'DELIVERED') return { eligible: false, reason: 'not-delivered' };
  if (order.paymentStatus !== 'PAID') {
    return { eligible: false, reason: 'payment-unconfirmed' };
  }
  if (!order.shipment || order.shipment.status !== 'DELIVERED') {
    return { eligible: false, reason: 'shipment-unconfirmed' };
  }
  if (!order.shipment.deliveredAt) {
    return { eligible: false, reason: 'missing-delivery-date' };
  }
  const deliveredAt = new Date(order.shipment.deliveredAt);
  if (Number.isNaN(deliveredAt.getTime())) {
    return { eligible: false, reason: 'missing-delivery-date' };
  }
  const age = now.getTime() - deliveredAt.getTime();
  if (age < 0) return { eligible: false, reason: 'delivery-date-in-future' };
  if (age > CUSTOMER_RETURN_WINDOW_MILLISECONDS) {
    return { eligible: false, reason: 'expired' };
  }
  return { eligible: true, reason: 'eligible' };
}
