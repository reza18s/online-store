import {
  apiClient,
  type AdminSeoMetadata,
  type AdminSeoMetadataCreateInput,
} from '@nova/api-client';

import { adminSeoMetadataPath } from '../content-api-shared';

export async function createAdminSeoMetadata(
  input: AdminSeoMetadataCreateInput,
): Promise<AdminSeoMetadata> {
  const response = await apiClient.postEnvelope<AdminSeoMetadata>(adminSeoMetadataPath, input);
  return response.data;
}
