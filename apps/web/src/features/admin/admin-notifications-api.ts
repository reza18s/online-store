import { useQuery } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminNotificationListQuery,
  type AdminNotificationPage,
} from '@nova/api-client';

function normalizeNotificationQuery(
  query: AdminNotificationListQuery = {},
): AdminNotificationListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminNotificationListQuery;
  if (normalized.kind !== undefined) normalized.kind = normalized.kind.trim();
  return normalized.kind === '' ? { ...normalized, kind: undefined } : normalized;
}

function queryString(query: AdminNotificationListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeNotificationQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminNotificationsPath(query: AdminNotificationListQuery = {}): string {
  return `/v1/admin/notifications${queryString(query)}`;
}

export async function fetchAdminNotifications(
  query: AdminNotificationListQuery = {},
): Promise<AdminNotificationPage> {
  const response = await apiClient.getEnvelope<AdminNotificationPage>(adminNotificationsPath(query));
  return response.data;
}

export function useAdminNotifications(query: AdminNotificationListQuery = {}, enabled = true) {
  const normalized = normalizeNotificationQuery(query);
  return useQuery({
    queryKey: queryKeys.adminNotifications.list(normalized),
    queryFn: () => fetchAdminNotifications(normalized),
    enabled,
    staleTime: 10_000,
  });
}
