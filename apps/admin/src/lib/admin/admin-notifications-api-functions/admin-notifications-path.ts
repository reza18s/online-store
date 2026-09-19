import { type AdminNotificationListQuery } from '@nova/api-client';

import { queryString } from './query-string';

export function adminNotificationsPath(query: AdminNotificationListQuery = {}): string {
  return `/v1/admin/notifications${queryString(query)}`;
}
