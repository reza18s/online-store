import { apiClient } from '@nova/api-client';

import { adminSeoMetadataPath } from '@/features/content/api/content-api-shared';

import { encodeId } from '@/features/content/api/encode-id';

export async function deleteAdminSeoMetadata(metadataId: string): Promise<void> {
  await apiClient.deleteEnvelope<null>(`${adminSeoMetadataPath}/${encodeId(metadataId)}`);
}
