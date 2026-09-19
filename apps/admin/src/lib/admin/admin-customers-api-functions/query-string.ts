import { type AdminCustomerListQuery } from '@nova/api-client';

import { normalizeCustomerQuery } from './normalize-customer-query';

export function queryString(query: AdminCustomerListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeCustomerQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
