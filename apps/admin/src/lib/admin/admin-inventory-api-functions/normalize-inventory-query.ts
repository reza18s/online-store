import { type AdminInventoryListQuery } from '@nova/api-client';

export function normalizeInventoryQuery(
  query: AdminInventoryListQuery = {},
): AdminInventoryListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminInventoryListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}
