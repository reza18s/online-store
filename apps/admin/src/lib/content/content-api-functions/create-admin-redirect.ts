import { apiClient, type AdminRedirect, type AdminRedirectCreateInput } from '@nova/api-client';

import { adminRedirectsPath } from '../content-api-shared';

export async function createAdminRedirect(input: AdminRedirectCreateInput): Promise<AdminRedirect> {
  const response = await apiClient.postEnvelope<AdminRedirect>(adminRedirectsPath, input);
  return response.data;
}
