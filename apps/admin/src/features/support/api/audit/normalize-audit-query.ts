import { type AdminAuditListQuery } from '@nova/api-client';

export function normalizeAuditQuery(query: AdminAuditListQuery = {}): AdminAuditListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminAuditListQuery;
  for (const key of ['action', 'resourceType', 'resourceId', 'actorUserId'] as const) {
    const value = normalized[key];
    if (value !== undefined) normalized[key] = value.trim();
  }
  return normalized;
}
