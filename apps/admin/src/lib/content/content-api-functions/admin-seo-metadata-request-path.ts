import { type AdminSeoMetadataListQuery } from '@nova/api-client';

import { adminSeoMetadataPath } from '../content-api-shared';

import { queryString } from './query-string';

export function adminSeoMetadataRequestPath(query: AdminSeoMetadataListQuery = {}): string {
  return `${adminSeoMetadataPath}${queryString(query)}`;
}
