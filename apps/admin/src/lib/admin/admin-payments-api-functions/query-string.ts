import { type AdminPaymentListQuery } from '@nova/api-client';

import { normalizePaymentQuery } from './normalize-payment-query';

export function queryString(query: AdminPaymentListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizePaymentQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
