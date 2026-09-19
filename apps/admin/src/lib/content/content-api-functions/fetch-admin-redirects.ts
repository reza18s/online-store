import { apiClient, type AdminRedirectListQuery, type AdminRedirectPage } from '@nova/api-client';

import { adminRedirectsRequestPath } from './admin-redirects-request-path';

export async function fetchAdminRedirects(
  query: AdminRedirectListQuery = {},
): Promise<AdminRedirectPage> {
  const response = await apiClient.getEnvelope<AdminRedirectPage>(adminRedirectsRequestPath(query));
  return response.data;
}
