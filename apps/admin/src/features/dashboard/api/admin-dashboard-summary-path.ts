import { type AdminDashboardSummaryQuery } from '@nova/api-client';

import { queryString } from '@/features/dashboard/api/query-string';

export function adminDashboardSummaryPath(query: AdminDashboardSummaryQuery = {}): string {
  return `/v1/admin/dashboard/summary${queryString(query)}`;
}
