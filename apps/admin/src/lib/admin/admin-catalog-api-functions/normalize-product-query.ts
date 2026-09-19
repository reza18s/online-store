import { type AdminCatalogProductListQuery } from '@nova/api-client';

export function normalizeProductQuery(
  query: AdminCatalogProductListQuery = {},
): AdminCatalogProductListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminCatalogProductListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}
