import { type AdminDashboardSummaryQuery } from '@nova/api-client';

export function normalizeAdminDashboardQuery(
  query: AdminDashboardSummaryQuery = {},
): AdminDashboardSummaryQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as AdminDashboardSummaryQuery;
}
