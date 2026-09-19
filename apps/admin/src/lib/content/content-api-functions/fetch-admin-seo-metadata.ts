import {
  apiClient,
  type AdminSeoMetadataListQuery,
  type AdminSeoMetadataPage,
} from '@nova/api-client';

import { adminSeoMetadataRequestPath } from './admin-seo-metadata-request-path';

export async function fetchAdminSeoMetadata(
  query: AdminSeoMetadataListQuery = {},
): Promise<AdminSeoMetadataPage> {
  const response = await apiClient.getEnvelope<AdminSeoMetadataPage>(
    adminSeoMetadataRequestPath(query),
  );
  return response.data;
}
