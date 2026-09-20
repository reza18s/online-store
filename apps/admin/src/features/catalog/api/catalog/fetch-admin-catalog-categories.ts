import { apiClient, type AdminCatalogCategory } from '@nova/api-client';

export async function fetchAdminCatalogCategories(): Promise<AdminCatalogCategory[]> {
  const response = await apiClient.getEnvelope<AdminCatalogCategory[]>(
    '/v1/admin/catalog/categories',
  );
  return response.data;
}
