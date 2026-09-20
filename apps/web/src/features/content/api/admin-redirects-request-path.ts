import { type AdminRedirectListQuery } from '@nova/api-client';

import { adminRedirectsPath } from '@/features/content/api/content-api-shared';

import { queryString } from '@/features/content/api/query-string';

export function adminRedirectsRequestPath(query: AdminRedirectListQuery = {}): string {
  return `${adminRedirectsPath}${queryString(query)}`;
}
