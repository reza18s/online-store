import { type CustomerOrderListQuery } from '@nova/api-client';

import { normalizeOrderQuery } from './normalize-order-query';

export function queryString(query: CustomerOrderListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeOrderQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
