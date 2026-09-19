import {
  apiClient,
  type AdminCatalogCategory,
  type AdminCatalogProductCategoryInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function replaceAdminProductCategories(
  productId: string,
  input: AdminCatalogProductCategoryInput,
): Promise<AdminCatalogCategory[]> {
  const response = await apiClient.putEnvelope<AdminCatalogCategory[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/categories`,
    input,
  );
  return response.data;
}
