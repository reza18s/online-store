import { type CustomerOrderDetail } from '@nova/api-client';

import type { ReturnOrderState } from '../account-state-shared';

import { getReturnEligibility } from './get-return-eligibility';

export function getReturnOrderState(
  order: Pick<CustomerOrderDetail, 'status' | 'paymentStatus' | 'shipment' | 'returnRequest'>,
  now = new Date(),
): ReturnOrderState {
  if (order.returnRequest) return 'requested';
  return getReturnEligibility(order, now).eligible ? 'not-requested' : 'ineligible';
}
