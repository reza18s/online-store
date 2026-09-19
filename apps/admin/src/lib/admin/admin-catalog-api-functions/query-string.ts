import { type AdminCatalogProductListQuery } from '@nova/api-client';

import { normalizeProductQuery } from './normalize-product-query';

export function queryString(query: AdminCatalogProductListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeProductQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
