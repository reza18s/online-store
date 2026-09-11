import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminCoupon,
  type AdminCouponCreateInput,
  type AdminCouponListQuery,
  type AdminCouponPage,
  type AdminCouponUpdateInput,
} from '@nova/api-client';

function encodeId(value: string): string {
  return encodeURIComponent(value);
}

function normalizeCouponQuery(query: AdminCouponListQuery = {}): AdminCouponListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminCouponListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}

function queryString(query: AdminCouponListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeCouponQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminCouponsPath(query: AdminCouponListQuery = {}): string {
  return `/v1/admin/coupons${queryString(query)}`;
}

export async function fetchAdminCoupons(
  query: AdminCouponListQuery = {},
): Promise<AdminCouponPage> {
  const response = await apiClient.getEnvelope<AdminCouponPage>(adminCouponsPath(query));
  return response.data;
}

export async function createAdminCoupon(input: AdminCouponCreateInput): Promise<AdminCoupon> {
  const response = await apiClient.postEnvelope<AdminCoupon>('/v1/admin/coupons', input);
  return response.data;
}

export async function updateAdminCoupon(
  couponId: string,
  input: AdminCouponUpdateInput,
): Promise<AdminCoupon> {
  const response = await apiClient.patchEnvelope<AdminCoupon>(
    `/v1/admin/coupons/${encodeId(couponId)}`,
    input,
  );
  return response.data;
}

export function useAdminCoupons(query: AdminCouponListQuery = {}, enabled = true) {
  const normalized = normalizeCouponQuery(query);
  return useQuery({
    queryKey: queryKeys.adminCoupons.list(normalized),
    queryFn: () => fetchAdminCoupons(normalized),
    enabled,
    staleTime: 15_000,
  });
}

export function useCreateAdminCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCoupons.all,
    mutationFn: createAdminCoupon,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all }),
  });
}

export function useUpdateAdminCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCoupons.all,
    mutationFn: ({ couponId, input }: { couponId: string; input: AdminCouponUpdateInput }) =>
      updateAdminCoupon(couponId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.adminCoupons.all }),
  });
}
