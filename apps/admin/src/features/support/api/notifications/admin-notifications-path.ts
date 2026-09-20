import { type AdminNotificationListQuery } from '@nova/api-client';

import { queryString } from '@/features/support/api/notifications/query-string';

export function adminNotificationsPath(query: AdminNotificationListQuery = {}): string {
  return `/v1/admin/notifications${queryString(query)}`;
}
