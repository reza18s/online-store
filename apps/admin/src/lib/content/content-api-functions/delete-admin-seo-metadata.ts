import { apiClient } from '@nova/api-client';

import { adminSeoMetadataPath } from '../content-api-shared';

import { encodeId } from './encode-id';

export async function deleteAdminSeoMetadata(metadataId: string): Promise<void> {
  await apiClient.deleteEnvelope<null>(`${adminSeoMetadataPath}/${encodeId(metadataId)}`);
}
