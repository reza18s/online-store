import { type AdminCatalogProductListQuery } from '@nova/api-client';

import { queryString } from '@/features/catalog/api/catalog/query-string';

export function adminCatalogProductsPath(query: AdminCatalogProductListQuery = {}): string {
  return `/v1/admin/catalog/products${queryString(query)}`;
}
