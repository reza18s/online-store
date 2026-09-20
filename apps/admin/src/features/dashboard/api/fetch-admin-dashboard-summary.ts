import {
  apiClient,
  type AdminDashboardSummary,
  type AdminDashboardSummaryQuery,
} from '@nova/api-client';

import { adminDashboardSummaryPath } from '@/features/dashboard/api/admin-dashboard-summary-path';

export async function fetchAdminDashboardSummary(
  query: AdminDashboardSummaryQuery = {},
): Promise<AdminDashboardSummary> {
  const response = await apiClient.getEnvelope<AdminDashboardSummary>(
    adminDashboardSummaryPath(query),
  );
  return response.data;
}
