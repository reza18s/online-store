import { apiClient } from '@nova/api-client';

import { adminRedirectsPath } from '../content-api-shared';

import { encodeId } from './encode-id';

export async function deleteAdminRedirect(redirectId: string): Promise<void> {
  await apiClient.deleteEnvelope<null>(`${adminRedirectsPath}/${encodeId(redirectId)}`);
}
