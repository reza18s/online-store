import { apiClient, type CatalogCategory } from '@nova/api-client';
import {
  fakeCatalogCategories,
  isStorefrontFakeDataEnabled,
} from '../../fixtures/dev-store-fixtures';

import { catalogCategoriesPath } from '../catalog-api-shared';

export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  if (isStorefrontFakeDataEnabled())
    return fakeCatalogCategories.map((category) => ({ ...category }));
  const response = await apiClient.getEnvelope<CatalogCategory[]>(catalogCategoriesPath);
  return response.data;
}
