import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminCatalogProductListQuery } from '@nova/api-client';

import { fetchAdminCatalogProducts } from '@/features/catalog/api/catalog/fetch-admin-catalog-products';

import { normalizeProductQuery } from '@/features/catalog/api/catalog/normalize-product-query';

export function useAdminCatalogProducts(query: AdminCatalogProductListQuery = {}, enabled = true) {
  const normalized = normalizeProductQuery(query);
  return useQuery({
    queryKey: queryKeys.adminCatalog.products(normalized),
    queryFn: () => fetchAdminCatalogProducts(normalized),
    enabled,
    staleTime: 15_000,
  });
}
