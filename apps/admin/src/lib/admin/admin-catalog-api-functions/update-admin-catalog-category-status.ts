import {
  apiClient,
  type AdminCatalogCategory,
  type AdminCatalogCategoryStatusInput,
} from '@nova/api-client';

import { encodeId } from './encode-id';

export async function updateAdminCatalogCategoryStatus(
  categoryId: string,
  input: AdminCatalogCategoryStatusInput,
): Promise<AdminCatalogCategory> {
  const response = await apiClient.patchEnvelope<AdminCatalogCategory>(
    `/v1/admin/catalog/categories/${encodeId(categoryId)}/status`,
    input,
  );
  return response.data;
}
