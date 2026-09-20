import {
  apiClient,
  type AdminCatalogProductMediaPresignInput,
  type CatalogMediaUploadPlan,
} from '@nova/api-client';

import { encodeId } from '@/features/catalog/api/catalog/encode-id';

export async function presignAdminProductMedia(
  productId: string,
  input: AdminCatalogProductMediaPresignInput,
): Promise<CatalogMediaUploadPlan> {
  const response = await apiClient.postEnvelope<CatalogMediaUploadPlan>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media/presign`,
    input,
  );
  return response.data;
}
