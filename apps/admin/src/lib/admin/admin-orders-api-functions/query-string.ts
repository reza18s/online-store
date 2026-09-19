import { type AdminOrderListQuery } from '@nova/api-client';

import { normalizeAdminOrderQuery } from './normalize-admin-order-query';

export function queryString(query: AdminOrderListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeAdminOrderQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
