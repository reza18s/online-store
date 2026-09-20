import { type AdminAuditListQuery } from '@nova/api-client';

import { queryString } from '@/features/support/api/audit/query-string';

export function adminAuditEventsPath(query: AdminAuditListQuery = {}): string {
  return `/v1/admin/audit-events${queryString(query)}`;
}
