import { type AdminPaymentListQuery } from '@nova/api-client';

export function normalizePaymentQuery(query: AdminPaymentListQuery = {}): AdminPaymentListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminPaymentListQuery;
  for (const key of ['provider', 'orderNumber'] as const) {
    const value = normalized[key];
    if (value !== undefined) normalized[key] = value.trim();
  }
  return normalized;
}
