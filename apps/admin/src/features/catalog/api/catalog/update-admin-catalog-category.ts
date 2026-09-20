import {
  apiClient,
  type AdminCatalogCategory,
  type AdminCatalogCategoryUpdateInput,
} from '@nova/api-client';

import { encodeId } from '@/features/catalog/api/catalog/encode-id';

export async function updateAdminCatalogCategory(
  categoryId: string,
  input: AdminCatalogCategoryUpdateInput,
): Promise<AdminCatalogCategory> {
  const response = await apiClient.patchEnvelope<AdminCatalogCategory>(
    `/v1/admin/catalog/categories/${encodeId(categoryId)}`,
    input,
  );
  return response.data;
}
