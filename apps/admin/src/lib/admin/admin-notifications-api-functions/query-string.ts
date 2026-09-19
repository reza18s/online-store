import { type AdminNotificationListQuery } from '@nova/api-client';

import { normalizeNotificationQuery } from './normalize-notification-query';

export function queryString(query: AdminNotificationListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeNotificationQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
