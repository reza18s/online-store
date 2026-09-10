import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminInventoryAdjustmentInput,
  type AdminInventoryItem,
  type AdminInventoryListQuery,
  type AdminInventoryPage,
  type AdminInventoryReorderPointInput,
} from '@nova/api-client';

function encodeId(value: string): string {
  return encodeURIComponent(value);
}

function normalizeInventoryQuery(query: AdminInventoryListQuery = {}): AdminInventoryListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminInventoryListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}

function queryString(query: AdminInventoryListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeInventoryQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminInventoryItemsPath(query: AdminInventoryListQuery = {}): string {
  return `/v1/admin/inventory/items${queryString(query)}`;
}

export async function fetchAdminInventory(
  query: AdminInventoryListQuery = {},
): Promise<AdminInventoryPage> {
  const response = await apiClient.getEnvelope<AdminInventoryPage>(adminInventoryItemsPath(query));
  return response.data;
}

export async function fetchAdminInventoryItem(variantId: string): Promise<AdminInventoryItem> {
  const response = await apiClient.getEnvelope<AdminInventoryItem>(
    `/v1/admin/inventory/items/${encodeId(variantId)}`,
  );
  return response.data;
}

export async function adjustAdminInventory(
  variantId: string,
  input: AdminInventoryAdjustmentInput,
): Promise<AdminInventoryItem> {
  const response = await apiClient.postEnvelope<AdminInventoryItem>(
    `/v1/admin/inventory/items/${encodeId(variantId)}/adjustments`,
    input,
  );
  return response.data;
}

export async function updateAdminInventoryReorderPoint(
  variantId: string,
  input: AdminInventoryReorderPointInput,
): Promise<AdminInventoryItem> {
  const response = await apiClient.patchEnvelope<AdminInventoryItem>(
    `/v1/admin/inventory/items/${encodeId(variantId)}/reorder-point`,
    input,
  );
  return response.data;
}

function invalidateAdminInventory(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.adminInventory.items() });
}

export function useAdminInventory(query: AdminInventoryListQuery = {}, enabled = true) {
  const normalized = normalizeInventoryQuery(query);
  return useQuery({
    queryKey: queryKeys.adminInventory.items(normalized),
    queryFn: () => fetchAdminInventory(normalized),
    enabled,
    staleTime: 15_000,
  });
}

export function useAdminInventoryItem(variantId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminInventory.item(variantId),
    queryFn: () => fetchAdminInventoryItem(variantId),
    enabled: enabled && Boolean(variantId),
    staleTime: 15_000,
  });
}

export function useAdjustAdminInventory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      input,
    }: {
      variantId: string;
      input: AdminInventoryAdjustmentInput;
    }) => adjustAdminInventory(variantId, input),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.adminInventory.item(item.variantId), item);
      return invalidateAdminInventory(queryClient);
    },
  });
}

export function useUpdateAdminInventoryReorderPoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      input,
    }: {
      variantId: string;
      input: AdminInventoryReorderPointInput;
    }) => updateAdminInventoryReorderPoint(variantId, input),
    onSuccess: (item) => {
      queryClient.setQueryData(queryKeys.adminInventory.item(item.variantId), item);
      return invalidateAdminInventory(queryClient);
    },
  });
}
