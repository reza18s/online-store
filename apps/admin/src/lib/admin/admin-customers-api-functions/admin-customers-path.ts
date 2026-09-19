import { type AdminCustomerListQuery } from '@nova/api-client';

import { queryString } from './query-string';

export function adminCustomersPath(query: AdminCustomerListQuery = {}): string {
  return `/v1/admin/customers${queryString(query)}`;
}
