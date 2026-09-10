import { useQuery } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminAuditListQuery,
  type AdminAuditPage,
} from '@nova/api-client';

function normalizeAuditQuery(query: AdminAuditListQuery = {}): AdminAuditListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminAuditListQuery;
  for (const key of ['action', 'resourceType', 'resourceId', 'actorUserId'] as const) {
    const value = normalized[key];
    if (value !== undefined) normalized[key] = value.trim();
  }
  return normalized;
}

function queryString(query: AdminAuditListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeAuditQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminAuditEventsPath(query: AdminAuditListQuery = {}): string {
  return `/v1/admin/audit-events${queryString(query)}`;
}

export async function fetchAdminAuditEvents(
  query: AdminAuditListQuery = {},
): Promise<AdminAuditPage> {
  const response = await apiClient.getEnvelope<AdminAuditPage>(adminAuditEventsPath(query));
  return response.data;
}

export function useAdminAuditEvents(query: AdminAuditListQuery = {}, enabled = true) {
  const normalized = normalizeAuditQuery(query);
  return useQuery({
    queryKey: queryKeys.adminAudit.events(normalized),
    queryFn: () => fetchAdminAuditEvents(normalized),
    enabled,
    staleTime: 15_000,
  });
}
