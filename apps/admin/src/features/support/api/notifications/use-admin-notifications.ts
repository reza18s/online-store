import { useQuery } from '@tanstack/react-query';
import { queryKeys, type AdminNotificationListQuery } from '@nova/api-client';

import { fetchAdminNotifications } from '@/features/support/api/notifications/fetch-admin-notifications';

import { normalizeNotificationQuery } from '@/features/support/api/notifications/normalize-notification-query';

export function useAdminNotifications(query: AdminNotificationListQuery = {}, enabled = true) {
  const normalized = normalizeNotificationQuery(query);
  return useQuery({
    queryKey: queryKeys.adminNotifications.list(normalized),
    queryFn: () => fetchAdminNotifications(normalized),
    enabled,
    staleTime: 10_000,
  });
}
