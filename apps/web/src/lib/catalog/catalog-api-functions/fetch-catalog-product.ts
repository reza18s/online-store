import { apiClient, type CatalogProduct } from '@nova/api-client';
import {
  getFakeCatalogProduct,
  isStorefrontFakeDataEnabled,
} from '../../fixtures/dev-store-fixtures';

export async function fetchCatalogProduct(slug: string): Promise<CatalogProduct> {
  if (isStorefrontFakeDataEnabled()) return getFakeCatalogProduct(slug);
  const response = await apiClient.getEnvelope<CatalogProduct>(
    `/v1/catalog/products/${encodeURIComponent(slug)}`,
  );
  return response.data;
}
