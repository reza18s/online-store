import { type AdminContentPageListQuery } from '@nova/api-client';

import { adminContentPagesPath } from '@/features/content/api/content/content-api-shared';

import { queryString } from '@/features/content/api/content/query-string';

export function adminContentPagesRequestPath(query: AdminContentPageListQuery = {}): string {
  return `${adminContentPagesPath}${queryString(query)}`;
}
