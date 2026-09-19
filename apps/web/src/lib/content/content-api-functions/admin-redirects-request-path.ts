import { type AdminRedirectListQuery } from '@nova/api-client';

import { adminRedirectsPath } from '../content-api-shared';

import { queryString } from './query-string';

export function adminRedirectsRequestPath(query: AdminRedirectListQuery = {}): string {
  return `${adminRedirectsPath}${queryString(query)}`;
}
