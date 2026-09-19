import {
  apiClient,
  type AdminSeoMetadata,
  type AdminSeoMetadataUpdateInput,
} from '@nova/api-client';

import { adminSeoMetadataPath } from '../content-api-shared';

import { encodeId } from './encode-id';

export async function updateAdminSeoMetadata(
  metadataId: string,
  input: AdminSeoMetadataUpdateInput,
): Promise<AdminSeoMetadata> {
  const response = await apiClient.patchEnvelope<AdminSeoMetadata>(
    `${adminSeoMetadataPath}/${encodeId(metadataId)}`,
    input,
  );
  return response.data;
}
