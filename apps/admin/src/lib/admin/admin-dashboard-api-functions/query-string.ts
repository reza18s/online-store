import { type AdminDashboardSummaryQuery } from '@nova/api-client';

import { normalizeAdminDashboardQuery } from './normalize-admin-dashboard-query';

export function queryString(query: AdminDashboardSummaryQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeAdminDashboardQuery(query))) {
    if (value !== undefined) params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}
