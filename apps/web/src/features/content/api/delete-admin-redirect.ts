import { apiClient } from '@nova/api-client';

import { adminRedirectsPath } from '@/features/content/api/content-api-shared';

import { encodeId } from '@/features/content/api/encode-id';

export async function deleteAdminRedirect(redirectId: string): Promise<void> {
  await apiClient.deleteEnvelope<null>(`${adminRedirectsPath}/${encodeId(redirectId)}`);
}
