import { type AdminContentPageListQuery } from '@nova/api-client';

import { adminContentPagesPath } from '../../../lib/content/content-api-shared';

import { queryString } from '../../../lib/content/content-api-functions/query-string';

export function adminContentPagesRequestPath(query: AdminContentPageListQuery = {}): string {
  return `${adminContentPagesPath}${queryString(query)}`;
}
