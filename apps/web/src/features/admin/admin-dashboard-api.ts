import {
  apiClient,
  queryKeys,
  type AdminDashboardSummary,
  type AdminDashboardSummaryQuery,
} from '@nova/api-client';
import { useQuery } from '@tanstack/react-query';

function normalizeAdminDashboardQuery(
  query: AdminDashboardSummaryQuery = {},
): AdminDashboardSummaryQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as AdminDashboardSummaryQuery;
}

function queryString(query: AdminDashboardSummaryQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeAdminDashboardQuery(query))) {
    if (value !== undefined) params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminDashboardSummaryPath(query: AdminDashboardSummaryQuery = {}): string {
  return `/v1/admin/dashboard/summary${queryString(query)}`;
}

export async function fetchAdminDashboardSummary(
  query: AdminDashboardSummaryQuery = {},
): Promise<AdminDashboardSummary> {
  const response = await apiClient.getEnvelope<AdminDashboardSummary>(
    adminDashboardSummaryPath(query),
  );
  return response.data;
}

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
