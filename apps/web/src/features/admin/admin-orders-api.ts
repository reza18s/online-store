import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminOrderStatusInput,
  type AdminOrderDetail,
  type AdminOrderListQuery,
  type AdminOrderPage,
  type AdminReturnReviewInput,
  type AdminShipmentUpdateInput,
} from '@nova/api-client';

function encodeOrderNumber(orderNumber: string): string {
  return encodeURIComponent(orderNumber);
}

function normalizeAdminOrderQuery(query: AdminOrderListQuery = {}): AdminOrderListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminOrderListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}

function queryString(query: AdminOrderListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeAdminOrderQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminOrdersPath(query: AdminOrderListQuery = {}): string {
  return `/v1/admin/orders${queryString(query)}`;
}

export function adminOrderStatusPath(orderNumber: string): string {
  return `/v1/admin/orders/${encodeOrderNumber(orderNumber)}/status`;
}

export function adminOrderShipmentPath(orderNumber: string): string {
  return `/v1/admin/orders/${encodeOrderNumber(orderNumber)}/shipment`;
}

export function adminOrderReturnPath(orderNumber: string): string {
  return `/v1/admin/orders/${encodeOrderNumber(orderNumber)}/return`;
}

export async function fetchAdminOrders(query: AdminOrderListQuery = {}): Promise<AdminOrderPage> {
  const response = await apiClient.getEnvelope<AdminOrderPage>(adminOrdersPath(query));
  return response.data;
}

export async function fetchAdminOrder(orderNumber: string): Promise<AdminOrderDetail> {
  const response = await apiClient.getEnvelope<AdminOrderDetail>(
    `/v1/admin/orders/${encodeOrderNumber(orderNumber)}`,
  );
  return response.data;
}

export async function updateAdminOrderStatus(
  orderNumber: string,
  input: AdminOrderStatusInput,
): Promise<AdminOrderDetail> {
  const response = await apiClient.patchEnvelope<AdminOrderDetail>(
    adminOrderStatusPath(orderNumber),
    input,
  );
  return response.data;
}

export async function updateAdminOrderShipment(
  orderNumber: string,
  input: AdminShipmentUpdateInput,
): Promise<AdminOrderDetail> {
  const response = await apiClient.patchEnvelope<AdminOrderDetail>(
    adminOrderShipmentPath(orderNumber),
    input,
  );
  return response.data;
}

export async function reviewAdminOrderReturn(
  orderNumber: string,
  input: AdminReturnReviewInput,
): Promise<AdminOrderDetail> {
  const response = await apiClient.patchEnvelope<AdminOrderDetail>(
    adminOrderReturnPath(orderNumber),
    input,
  );
  return response.data;
}

export function useAdminOrders(query: AdminOrderListQuery = {}, enabled = true) {
  const normalized = normalizeAdminOrderQuery(query);
  return useQuery({
    queryKey: queryKeys.adminOrders.list(normalized),
    queryFn: () => fetchAdminOrders(normalized),
    enabled,
    staleTime: 15_000,
  });
}

export function useAdminOrder(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminOrders.detail(orderNumber),
    queryFn: () => fetchAdminOrder(orderNumber),
    enabled: enabled && Boolean(orderNumber),
    staleTime: 15_000,
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: AdminOrderStatusInput;
    }) => updateAdminOrderStatus(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.adminOrders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
    },
  });
}

export function useUpdateAdminOrderShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: AdminShipmentUpdateInput;
    }) => updateAdminOrderShipment(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.adminOrders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
    },
  });
}

export function useReviewAdminOrderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: AdminReturnReviewInput;
    }) => reviewAdminOrderReturn(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.adminOrders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.adminOrders.all });
    },
  });
}
