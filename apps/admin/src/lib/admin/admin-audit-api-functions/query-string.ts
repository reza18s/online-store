import { type AdminAuditListQuery } from '@nova/api-client';

import { normalizeAuditQuery } from './normalize-audit-query';

export function queryString(query: AdminAuditListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeAuditQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
