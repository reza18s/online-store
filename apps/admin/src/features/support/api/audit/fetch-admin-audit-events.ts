import { apiClient, type AdminAuditListQuery, type AdminAuditPage } from '@nova/api-client';

import { adminAuditEventsPath } from '@/features/support/api/audit/admin-audit-events-path';

export async function fetchAdminAuditEvents(
  query: AdminAuditListQuery = {},
): Promise<AdminAuditPage> {
  const response = await apiClient.getEnvelope<AdminAuditPage>(adminAuditEventsPath(query));
  return response.data;
}
