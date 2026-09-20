import {
  apiClient,
  type AdminContentPageListQuery,
  type AdminContentPagePage,
} from '@nova/api-client';

import { adminContentPagesRequestPath } from '@/features/content/api/content-pages/admin-content-pages-request-path';

export async function fetchAdminContentPages(
  query: AdminContentPageListQuery = {},
): Promise<AdminContentPagePage> {
  const response = await apiClient.getEnvelope<AdminContentPagePage>(
    adminContentPagesRequestPath(query),
  );
  return response.data;
}
