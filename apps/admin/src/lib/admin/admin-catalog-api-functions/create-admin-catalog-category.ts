import {
  apiClient,
  type AdminCatalogCategory,
  type AdminCatalogCategoryCreateInput,
} from '@nova/api-client';

export async function createAdminCatalogCategory(
  input: AdminCatalogCategoryCreateInput,
): Promise<AdminCatalogCategory> {
  const response = await apiClient.postEnvelope<AdminCatalogCategory>(
    '/v1/admin/catalog/categories',
    input,
  );
  return response.data;
}
