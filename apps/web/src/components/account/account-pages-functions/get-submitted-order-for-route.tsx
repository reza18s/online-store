import { type CustomerOrderDetail } from '@nova/api-client';

import type { SubmittedCustomerOrder } from '../../../pages/account/account-pages-shared';

export function getSubmittedOrderForRoute(
  submittedOrder: SubmittedCustomerOrder | undefined,
  routeOrderNumber: string,
): CustomerOrderDetail | undefined {
  return submittedOrder?.routeOrderNumber === routeOrderNumber ? submittedOrder.order : undefined;
}
