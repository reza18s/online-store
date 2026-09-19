import {
  apiClient,
  type AdminNotificationListQuery,
  type AdminNotificationPage,
} from '@nova/api-client';

import { adminNotificationsPath } from './admin-notifications-path';

export async function fetchAdminNotifications(
  query: AdminNotificationListQuery = {},
): Promise<AdminNotificationPage> {
  const response = await apiClient.getEnvelope<AdminNotificationPage>(
    adminNotificationsPath(query),
  );
  return response.data;
}
