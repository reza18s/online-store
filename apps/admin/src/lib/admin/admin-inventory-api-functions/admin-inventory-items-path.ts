import { type AdminInventoryListQuery } from '@nova/api-client';

import { queryString } from './query-string';

export function adminInventoryItemsPath(query: AdminInventoryListQuery = {}): string {
  return `/v1/admin/inventory/items${queryString(query)}`;
}
