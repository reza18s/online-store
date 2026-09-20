import { apiClient, type AdminRedirect, type AdminRedirectUpdateInput } from '@nova/api-client';

import { adminRedirectsPath } from '@/features/content/api/content/content-api-shared';

import { encodeId } from '@/features/content/api/content/encode-id';

export async function updateAdminRedirect(
  redirectId: string,
  input: AdminRedirectUpdateInput,
): Promise<AdminRedirect> {
  const response = await apiClient.patchEnvelope<AdminRedirect>(
    `${adminRedirectsPath}/${encodeId(redirectId)}`,
    input,
  );
  return response.data;
}
