import {
  apiClient,
  type AdminCatalogProductCreateInput,
  type AdminCatalogProductDetail,
} from '@nova/api-client';

export async function createAdminCatalogProduct(
  input: AdminCatalogProductCreateInput,
): Promise<AdminCatalogProductDetail> {
  const response = await apiClient.postEnvelope<AdminCatalogProductDetail>(
    '/v1/admin/catalog/products',
    input,
  );
  return response.data;
}
