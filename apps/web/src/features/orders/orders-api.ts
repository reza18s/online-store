import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type CustomerOrderCancelInput,
  type CustomerOrderDetail,
  type CustomerOrderListQuery,
  type CustomerOrderPage,
  type CustomerReturnRequestInput,
} from '@nova/api-client';

function encodeOrderNumber(orderNumber: string): string {
  return encodeURIComponent(orderNumber);
}

function normalizeOrderQuery(query: CustomerOrderListQuery = {}): CustomerOrderListQuery {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as CustomerOrderListQuery;
}

function queryString(query: CustomerOrderListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeOrderQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function customerOrdersPath(query: CustomerOrderListQuery = {}): string {
  return `/v1/account/orders${queryString(query)}`;
}

export function customerOrderCancelPath(orderNumber: string): string {
  return `/v1/account/orders/${encodeOrderNumber(orderNumber)}/cancel`;
}

export function customerOrderReturnPath(orderNumber: string): string {
  return `/v1/account/orders/${encodeOrderNumber(orderNumber)}/returns`;
}

export async function fetchCustomerOrders(
  query: CustomerOrderListQuery = {},
): Promise<CustomerOrderPage> {
  const response = await apiClient.getEnvelope<CustomerOrderPage>(customerOrdersPath(query));
  return response.data;
}

export async function fetchCustomerOrder(orderNumber: string): Promise<CustomerOrderDetail> {
  const response = await apiClient.getEnvelope<CustomerOrderDetail>(
    `/v1/account/orders/${encodeOrderNumber(orderNumber)}`,
  );
  return response.data;
}

export async function cancelCustomerOrder(
  orderNumber: string,
  input: CustomerOrderCancelInput,
): Promise<CustomerOrderDetail> {
  const response = await apiClient.postEnvelope<CustomerOrderDetail>(
    customerOrderCancelPath(orderNumber),
    input,
  );
  return response.data;
}

export async function requestCustomerOrderReturn(
  orderNumber: string,
  input: CustomerReturnRequestInput,
): Promise<CustomerOrderDetail> {
  const response = await apiClient.postEnvelope<CustomerOrderDetail>(
    customerOrderReturnPath(orderNumber),
    input,
  );
  return response.data;
}

export function useCustomerOrders(query: CustomerOrderListQuery = {}, enabled = true) {
  const normalized = normalizeOrderQuery(query);
  return useQuery({
    queryKey: queryKeys.orders.list(normalized),
    queryFn: () => fetchCustomerOrders(normalized),
    enabled,
    staleTime: 15_000,
  });
}

export function useCustomerOrder(orderNumber: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderNumber),
    queryFn: () => fetchCustomerOrder(orderNumber),
    enabled: enabled && Boolean(orderNumber),
    staleTime: 15_000,
  });
}

export function useCancelCustomerOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: CustomerOrderCancelInput;
    }) => cancelCustomerOrder(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

export function useRequestCustomerOrderReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderNumber,
      input,
    }: {
      orderNumber: string;
      input: CustomerReturnRequestInput;
    }) => requestCustomerOrderReturn(orderNumber, input),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.orderNumber), order);
      return queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
