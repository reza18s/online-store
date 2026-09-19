import { type AdminCouponListQuery } from '@nova/api-client';

export function normalizeCouponQuery(query: AdminCouponListQuery = {}): AdminCouponListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminCouponListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}
