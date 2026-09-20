import { type AdminRedirectListQuery } from '@nova/api-client';

import { adminRedirectsPath } from '@/features/content/api/content/content-api-shared';

import { queryString } from '@/features/content/api/content/query-string';

export function adminRedirectsRequestPath(query: AdminRedirectListQuery = {}): string {
  return `${adminRedirectsPath}${queryString(query)}`;
}
