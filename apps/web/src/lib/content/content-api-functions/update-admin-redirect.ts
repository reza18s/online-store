import { apiClient, type AdminRedirect, type AdminRedirectUpdateInput } from '@nova/api-client';

import { adminRedirectsPath } from '../content-api-shared';

import { encodeId } from './encode-id';

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
