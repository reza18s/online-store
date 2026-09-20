import { type AdminOrderListQuery } from '@nova/api-client';

export function normalizeAdminOrderQuery(query: AdminOrderListQuery = {}): AdminOrderListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminOrderListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}
