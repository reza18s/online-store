import { useQuery } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminPaymentAttempt,
  type AdminPaymentListQuery,
  type AdminPaymentPage,
} from '@nova/api-client';

function encodeId(value: string): string {
  return encodeURIComponent(value);
}

function normalizePaymentQuery(query: AdminPaymentListQuery = {}): AdminPaymentListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminPaymentListQuery;
  for (const key of ['provider', 'orderNumber'] as const) {
    const value = normalized[key];
    if (value !== undefined) normalized[key] = value.trim();
  }
  return normalized;
}

function queryString(query: AdminPaymentListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizePaymentQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminPaymentsPath(query: AdminPaymentListQuery = {}): string {
  return `/v1/admin/payments${queryString(query)}`;
}

export async function fetchAdminPayments(
  query: AdminPaymentListQuery = {},
): Promise<AdminPaymentPage> {
  const response = await apiClient.getEnvelope<AdminPaymentPage>(adminPaymentsPath(query));
  return response.data;
}

export async function fetchAdminPayment(paymentAttemptId: string): Promise<AdminPaymentAttempt> {
  const response = await apiClient.getEnvelope<AdminPaymentAttempt>(
    `/v1/admin/payments/${encodeId(paymentAttemptId)}`,
  );
  return response.data;
}

export function useAdminPayments(query: AdminPaymentListQuery = {}, enabled = true) {
  const normalized = normalizePaymentQuery(query);
  return useQuery({
    queryKey: queryKeys.adminPayments.list(normalized),
    queryFn: () => fetchAdminPayments(normalized),
    enabled,
    staleTime: 15_000,
  });
}

export function useAdminPayment(paymentAttemptId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminPayments.detail(paymentAttemptId),
    queryFn: () => fetchAdminPayment(paymentAttemptId),
    enabled: enabled && Boolean(paymentAttemptId),
    staleTime: 15_000,
  });
}
