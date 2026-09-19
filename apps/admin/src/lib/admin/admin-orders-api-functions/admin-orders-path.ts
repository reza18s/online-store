import { type AdminOrderListQuery } from '@nova/api-client';

import { queryString } from './query-string';

export function adminOrdersPath(query: AdminOrderListQuery = {}): string {
  return `/v1/admin/orders${queryString(query)}`;
}
