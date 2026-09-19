import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminAuditListQuery } from '@nova/api-client';

import { fetchAdminAuditEvents } from './fetch-admin-audit-events';

import { normalizeAuditQuery } from './normalize-audit-query';

export function useAdminAuditEvents(query: AdminAuditListQuery = {}, enabled = true) {
  const normalized = normalizeAuditQuery(query);
  return useQuery({
    queryKey: queryKeys.adminAudit.events(normalized),
    queryFn: () => fetchAdminAuditEvents(normalized),
    enabled,
    staleTime: 15_000,
  });
}
