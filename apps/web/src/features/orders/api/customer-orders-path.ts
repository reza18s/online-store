import { type CustomerOrderListQuery } from '@nova/api-client';

import { queryString } from '@/features/orders/api/query-string';

export function customerOrdersPath(query: CustomerOrderListQuery = {}): string {
  return `/v1/account/orders${queryString(query)}`;
}
