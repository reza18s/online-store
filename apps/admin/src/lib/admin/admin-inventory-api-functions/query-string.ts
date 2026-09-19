import { type AdminInventoryListQuery } from '@nova/api-client';

import { normalizeInventoryQuery } from './normalize-inventory-query';

export function queryString(query: AdminInventoryListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeInventoryQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
