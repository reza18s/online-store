import { queryKeys, type AdminDashboardSummaryQuery } from '@nova/api-client';
import { useQuery } from '@tanstack/react-query';

import { fetchAdminDashboardSummary } from './fetch-admin-dashboard-summary';

import { normalizeAdminDashboardQuery } from './normalize-admin-dashboard-query';

export function useAdminDashboardSummary(query: AdminDashboardSummaryQuery = {}, enabled = true) {
  const normalized = normalizeAdminDashboardQuery(query);
  return useQuery({
    queryKey: queryKeys.adminDashboard.summary(normalized),
    queryFn: () => fetchAdminDashboardSummary(normalized),
    enabled,
    retry: false,
    staleTime: 15_000,
  });
}
