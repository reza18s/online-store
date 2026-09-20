import { type AdminSeoMetadataListQuery } from '@nova/api-client';

import { adminSeoMetadataPath } from '@/features/content/api/content/content-api-shared';

import { queryString } from '@/features/content/api/content/query-string';

export function adminSeoMetadataRequestPath(query: AdminSeoMetadataListQuery = {}): string {
  return `${adminSeoMetadataPath}${queryString(query)}`;
}
