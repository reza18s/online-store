import { useQuery } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminCustomerListQuery,
  type AdminCustomerPage,
} from '@nova/api-client';

function normalizeCustomerQuery(query: AdminCustomerListQuery = {}): AdminCustomerListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminCustomerListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}

function queryString(query: AdminCustomerListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeCustomerQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminCustomersPath(query: AdminCustomerListQuery = {}): string {
  return `/v1/admin/customers${queryString(query)}`;
}

export async function fetchAdminCustomers(
  query: AdminCustomerListQuery = {},
): Promise<AdminCustomerPage> {
  const response = await apiClient.getEnvelope<AdminCustomerPage>(adminCustomersPath(query));
  return response.data;
}

export function useAdminCustomers(query: AdminCustomerListQuery = {}, enabled = true) {
  const normalized = normalizeCustomerQuery(query);
  return useQuery({
    queryKey: queryKeys.adminCustomers.list(normalized),
    queryFn: () => fetchAdminCustomers(normalized),
    enabled,
    staleTime: 15_000,
  });
}
