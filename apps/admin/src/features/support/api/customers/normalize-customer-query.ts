import { type AdminCustomerListQuery } from '@nova/api-client';

export function normalizeCustomerQuery(query: AdminCustomerListQuery = {}): AdminCustomerListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminCustomerListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}
