import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminCatalogCategory,
  type AdminCatalogCategoryCreateInput,
  type AdminCatalogCategoryStatusInput,
  type AdminCatalogCategoryUpdateInput,
  type AdminCatalogProduct,
  type AdminCatalogProductCategoryInput,
  type AdminCatalogProductCreateInput,
  type AdminCatalogProductDetail,
  type AdminCatalogProductListItem,
  type AdminCatalogProductListQuery,
  type AdminCatalogProductMedia,
  type AdminCatalogProductMediaCreateInput,
  type AdminCatalogProductMediaUpdateInput,
  type AdminCatalogProductOption,
  type AdminCatalogProductOptionCreateInput,
  type AdminCatalogProductOptionUpdateInput,
  type AdminCatalogProductOptionValue,
  type AdminCatalogProductOptionValueCreateInput,
  type AdminCatalogProductOptionValueUpdateInput,
  type AdminCatalogProductPage,
  type AdminCatalogProductStatusInput,
  type AdminCatalogProductUpdateInput,
  type AdminCatalogProductVariant,
  type AdminCatalogProductVariantCreateInput,
  type AdminCatalogProductVariantUpdateInput,
  type StaffLoginInput,
  type StaffUser,
} from '@nova/api-client';

import { clearStaffSessionCache } from './admin-auth';

export interface AdminCatalogProductListResult extends AdminCatalogProductPage {
  items: AdminCatalogProductListItem[];
}

function encodeId(value: string): string {
  return encodeURIComponent(value);
}

function normalizeProductQuery(
  query: AdminCatalogProductListQuery = {},
): AdminCatalogProductListQuery {
  const normalized = Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ''),
  ) as AdminCatalogProductListQuery;
  if (normalized.q !== undefined) normalized.q = normalized.q.trim();
  return normalized.q === '' ? { ...normalized, q: undefined } : normalized;
}

function queryString(query: AdminCatalogProductListQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(normalizeProductQuery(query))) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const value = params.toString();
  return value ? `?${value}` : '';
}

export function adminCatalogProductsPath(query: AdminCatalogProductListQuery = {}): string {
  return `/v1/admin/catalog/products${queryString(query)}`;
}

export async function fetchStaffUser(): Promise<StaffUser> {
  const response = await apiClient.getEnvelope<StaffUser>('/v1/staff/auth/me');
  return response.data;
}

export async function loginStaff(input: StaffLoginInput): Promise<StaffUser> {
  const response = await apiClient.postEnvelope<StaffUser>('/v1/staff/auth/login', input);
  return response.data;
}

export async function logoutStaff(): Promise<null> {
  const response = await apiClient.postEnvelope<null>('/v1/staff/auth/logout');
  return response.data;
}

export async function fetchAdminCatalogProducts(
  query: AdminCatalogProductListQuery = {},
): Promise<AdminCatalogProductPage> {
  const response = await apiClient.getEnvelope<AdminCatalogProductPage>(
    adminCatalogProductsPath(query),
  );
  return response.data;
}

export async function fetchAdminCatalogCategories(): Promise<AdminCatalogCategory[]> {
  const response = await apiClient.getEnvelope<AdminCatalogCategory[]>(
    '/v1/admin/catalog/categories',
  );
  return response.data;
}

export async function createAdminCatalogCategory(
  input: AdminCatalogCategoryCreateInput,
): Promise<AdminCatalogCategory> {
  const response = await apiClient.postEnvelope<AdminCatalogCategory>(
    '/v1/admin/catalog/categories',
    input,
  );
  return response.data;
}

export async function updateAdminCatalogCategory(
  categoryId: string,
  input: AdminCatalogCategoryUpdateInput,
): Promise<AdminCatalogCategory> {
  const response = await apiClient.patchEnvelope<AdminCatalogCategory>(
    `/v1/admin/catalog/categories/${encodeId(categoryId)}`,
    input,
  );
  return response.data;
}

export async function updateAdminCatalogCategoryStatus(
  categoryId: string,
  input: AdminCatalogCategoryStatusInput,
): Promise<AdminCatalogCategory> {
  const response = await apiClient.patchEnvelope<AdminCatalogCategory>(
    `/v1/admin/catalog/categories/${encodeId(categoryId)}/status`,
    input,
  );
  return response.data;
}

export async function fetchAdminProductCategories(
  productId: string,
): Promise<AdminCatalogCategory[]> {
  const response = await apiClient.getEnvelope<AdminCatalogCategory[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/categories`,
  );
  return response.data;
}

export async function replaceAdminProductCategories(
  productId: string,
  input: AdminCatalogProductCategoryInput,
): Promise<AdminCatalogCategory[]> {
  const response = await apiClient.putEnvelope<AdminCatalogCategory[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/categories`,
    input,
  );
  return response.data;
}

export async function fetchAdminProductOptions(
  productId: string,
): Promise<AdminCatalogProductOption[]> {
  const response = await apiClient.getEnvelope<AdminCatalogProductOption[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options`,
  );
  return response.data;
}

export async function createAdminProductOption(
  productId: string,
  input: AdminCatalogProductOptionCreateInput,
): Promise<AdminCatalogProductOption> {
  const response = await apiClient.postEnvelope<AdminCatalogProductOption>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options`,
    input,
  );
  return response.data;
}

export async function updateAdminProductOption(
  productId: string,
  optionId: string,
  input: AdminCatalogProductOptionUpdateInput,
): Promise<AdminCatalogProductOption> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductOption>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options/${encodeId(optionId)}`,
    input,
  );
  return response.data;
}

export async function createAdminProductOptionValue(
  productId: string,
  optionId: string,
  input: AdminCatalogProductOptionValueCreateInput,
): Promise<AdminCatalogProductOptionValue> {
  const response = await apiClient.postEnvelope<AdminCatalogProductOptionValue>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options/${encodeId(optionId)}/values`,
    input,
  );
  return response.data;
}

export async function updateAdminProductOptionValue(
  productId: string,
  optionId: string,
  valueId: string,
  input: AdminCatalogProductOptionValueUpdateInput,
): Promise<AdminCatalogProductOptionValue> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductOptionValue>(
    `/v1/admin/catalog/products/${encodeId(productId)}/options/${encodeId(optionId)}/values/${encodeId(valueId)}`,
    input,
  );
  return response.data;
}

export async function createAdminCatalogProduct(
  input: AdminCatalogProductCreateInput,
): Promise<AdminCatalogProductDetail> {
  const response = await apiClient.postEnvelope<AdminCatalogProductDetail>(
    '/v1/admin/catalog/products',
    input,
  );
  return response.data;
}

export async function updateAdminCatalogProduct(
  productId: string,
  input: AdminCatalogProductUpdateInput,
): Promise<AdminCatalogProductDetail> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductDetail>(
    `/v1/admin/catalog/products/${encodeId(productId)}`,
    input,
  );
  return response.data;
}

export async function updateAdminCatalogProductStatus(
  productId: string,
  input: AdminCatalogProductStatusInput,
): Promise<AdminCatalogProduct> {
  const response = await apiClient.patchEnvelope<AdminCatalogProduct>(
    `/v1/admin/catalog/products/${encodeId(productId)}/status`,
    input,
  );
  return response.data;
}

export async function fetchAdminProductVariants(
  productId: string,
): Promise<AdminCatalogProductVariant[]> {
  const response = await apiClient.getEnvelope<AdminCatalogProductVariant[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/variants`,
  );
  return response.data;
}

export async function createAdminProductVariant(
  productId: string,
  input: AdminCatalogProductVariantCreateInput,
): Promise<AdminCatalogProductVariant> {
  const response = await apiClient.postEnvelope<AdminCatalogProductVariant>(
    `/v1/admin/catalog/products/${encodeId(productId)}/variants`,
    input,
  );
  return response.data;
}

export async function updateAdminProductVariant(
  productId: string,
  variantId: string,
  input: AdminCatalogProductVariantUpdateInput,
): Promise<AdminCatalogProductVariant> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductVariant>(
    `/v1/admin/catalog/products/${encodeId(productId)}/variants/${encodeId(variantId)}`,
    input,
  );
  return response.data;
}

export async function fetchAdminProductMedia(
  productId: string,
): Promise<AdminCatalogProductMedia[]> {
  const response = await apiClient.getEnvelope<AdminCatalogProductMedia[]>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media`,
  );
  return response.data;
}

export async function createAdminProductMedia(
  productId: string,
  input: AdminCatalogProductMediaCreateInput,
): Promise<AdminCatalogProductMedia> {
  const response = await apiClient.postEnvelope<AdminCatalogProductMedia>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media`,
    input,
  );
  return response.data;
}

export async function updateAdminProductMedia(
  productId: string,
  mediaId: string,
  input: AdminCatalogProductMediaUpdateInput,
): Promise<AdminCatalogProductMedia> {
  const response = await apiClient.patchEnvelope<AdminCatalogProductMedia>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media/${encodeId(mediaId)}`,
    input,
  );
  return response.data;
}

export async function deleteAdminProductMedia(
  productId: string,
  mediaId: string,
): Promise<{ deleted: true }> {
  const response = await apiClient.deleteEnvelope<{ deleted: true }>(
    `/v1/admin/catalog/products/${encodeId(productId)}/media/${encodeId(mediaId)}`,
  );
  return response.data;
}

function invalidateAdminProductList(queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.products() });
}

function invalidateAdminProductResources(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
): Promise<void[]> {
  return Promise.all([
    invalidateAdminProductList(queryClient),
    queryClient.invalidateQueries({
      queryKey: queryKeys.adminCatalog.productCategories(productId),
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.productOptions(productId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.productVariants(productId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.productMedia(productId) }),
  ]);
}

export function useStaffUser(enabled = true) {
  return useQuery({
    queryKey: queryKeys.staffAuth.current(),
    queryFn: fetchStaffUser,
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useStaffLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: loginStaff,
    onSuccess: (user) => {
      clearStaffSessionCache(queryClient);
      queryClient.setQueryData(queryKeys.staffAuth.current(), user);
    },
  });
}

export function useStaffLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutStaff,
    onSettled: () => clearStaffSessionCache(queryClient),
  });
}

export function useAdminCatalogProducts(query: AdminCatalogProductListQuery = {}, enabled = true) {
  const normalized = normalizeProductQuery(query);
  return useQuery({
    queryKey: queryKeys.adminCatalog.products(normalized),
    queryFn: () => fetchAdminCatalogProducts(normalized),
    enabled,
    staleTime: 15_000,
  });
}

export function useAdminCatalogCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.categories(),
    queryFn: fetchAdminCatalogCategories,
    enabled,
    staleTime: 60_000,
  });
}

export function useAdminProductCategories(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productCategories(productId),
    queryFn: () => fetchAdminProductCategories(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 30_000,
  });
}

export function useAdminProductOptions(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productOptions(productId),
    queryFn: () => fetchAdminProductOptions(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 30_000,
  });
}

export function useAdminProductVariants(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productVariants(productId),
    queryFn: () => fetchAdminProductVariants(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 15_000,
  });
}

export function useAdminProductMedia(productId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminCatalog.productMedia(productId),
    queryFn: () => fetchAdminProductMedia(productId),
    enabled: enabled && Boolean(productId),
    staleTime: 30_000,
  });
}

export function useCreateAdminCatalogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: createAdminCatalogCategory,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.categories() }),
  });
}

export function useUpdateAdminCatalogCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: AdminCatalogCategoryUpdateInput;
    }) => updateAdminCatalogCategory(categoryId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.categories() }),
  });
}

export function useUpdateAdminCatalogCategoryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      categoryId,
      input,
    }: {
      categoryId: string;
      input: AdminCatalogCategoryStatusInput;
    }) => updateAdminCatalogCategoryStatus(categoryId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog.categories() }),
  });
}

export function useReplaceAdminProductCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductCategoryInput;
    }) => replaceAdminProductCategories(productId, input),
    onSuccess: (_categories, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useCreateAdminCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: createAdminCatalogProduct,
    onSuccess: () => invalidateAdminProductList(queryClient),
  });
}

export function useUpdateAdminCatalogProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductUpdateInput;
    }) => updateAdminCatalogProduct(productId, input),
    onSuccess: (_product, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useUpdateAdminCatalogProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductStatusInput;
    }) => updateAdminCatalogProductStatus(productId, input),
    onSuccess: (_product, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useCreateAdminProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductOptionCreateInput;
    }) => createAdminProductOption(productId, input),
    onSuccess: (_option, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useUpdateAdminProductOption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      optionId,
      input,
    }: {
      productId: string;
      optionId: string;
      input: AdminCatalogProductOptionUpdateInput;
    }) => updateAdminProductOption(productId, optionId, input),
    onSuccess: (_option, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useCreateAdminProductOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      optionId,
      input,
    }: {
      productId: string;
      optionId: string;
      input: AdminCatalogProductOptionValueCreateInput;
    }) => createAdminProductOptionValue(productId, optionId, input),
    onSuccess: (_value, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useUpdateAdminProductOptionValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      optionId,
      valueId,
      input,
    }: {
      productId: string;
      optionId: string;
      valueId: string;
      input: AdminCatalogProductOptionValueUpdateInput;
    }) => updateAdminProductOptionValue(productId, optionId, valueId, input),
    onSuccess: (_value, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useCreateAdminProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductVariantCreateInput;
    }) => createAdminProductVariant(productId, input),
    onSuccess: (_variant, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useUpdateAdminProductVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      variantId,
      input,
    }: {
      productId: string;
      variantId: string;
      input: AdminCatalogProductVariantUpdateInput;
    }) => updateAdminProductVariant(productId, variantId, input),
    onSuccess: (_variant, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useCreateAdminProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      input,
    }: {
      productId: string;
      input: AdminCatalogProductMediaCreateInput;
    }) => createAdminProductMedia(productId, input),
    onSuccess: (_media, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useUpdateAdminProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      mediaId,
      input,
    }: {
      productId: string;
      mediaId: string;
      input: AdminCatalogProductMediaUpdateInput;
    }) => updateAdminProductMedia(productId, mediaId, input),
    onSuccess: (_media, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}

export function useDeleteAdminProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({ productId, mediaId }: { productId: string; mediaId: string }) =>
      deleteAdminProductMedia(productId, mediaId),
    onSuccess: (_result, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
