import { type AdminNotificationListQuery } from '@nova/api-client';

export function normalizeNotificationQuery(
  query: AdminNotificationListQuery = {},
): AdminNotificationListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminNotificationListQuery;
  if (normalized.kind !== undefined) normalized.kind = normalized.kind.trim();
  return normalized.kind === '' ? { ...normalized, kind: undefined } : normalized;
}
