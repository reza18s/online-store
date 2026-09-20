import { type CustomerOrderDetail } from '@nova/api-client';

import type { SubmittedCustomerOrder } from '@/features/account/pages/account-pages-shared';

export function getSubmittedOrderForRoute(
  submittedOrder: SubmittedCustomerOrder | undefined,
  routeOrderNumber: string,
): CustomerOrderDetail | undefined {
  return submittedOrder?.routeOrderNumber === routeOrderNumber ? submittedOrder.order : undefined;
}
