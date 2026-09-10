import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiClient,
  queryKeys,
  type AdminRedirect,
  type AdminRedirectCreateInput,
  type AdminRedirectListQuery,
  type AdminRedirectPage,
  type AdminRedirectUpdateInput,
  type AdminContentPage,
  type AdminContentPageCreateInput,
  type AdminContentPageListQuery,
  type AdminContentPagePage,
  type AdminContentPageStatusInput,
  type AdminContentPageUpdateInput,
  type AdminSeoMetadata,
  type AdminSeoMetadataCreateInput,
  type AdminSeoMetadataListQuery,
  type AdminSeoMetadataPage,
  type AdminSeoMetadataUpdateInput,
  type ContentPage,
  type SeoResolution,
} from '@nova/api-client';

export const contentPagePath = '/v1/content/pages';
export const seoResolvePath = '/v1/seo/resolve';
export const adminContentPagesPath = '/v1/admin/content/pages';
export const adminSeoMetadataPath = '/v1/admin/content/seo-metadata';
export const adminRedirectsPath = '/v1/admin/content/redirects';

function encodeId(value: string): string {
  return encodeURIComponent(value);
}

function normalizedPath(path: string): string {
  const value = path.trim();
  if (value.length <= 1) return '/';
  return value.replace(/\/+$/, '') || '/';
}

function queryString(
  query: AdminSeoMetadataListQuery | AdminRedirectListQuery | AdminContentPageListQuery,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const result = params.toString();
  return result ? `?${result}` : '';
}

export function seoResolveRequestPath(path: string): string {
  return `${seoResolvePath}?path=${encodeURIComponent(normalizedPath(path))}`;
}

export function contentPageRequestPath(slug: string): string {
  return `${contentPagePath}/${encodeURIComponent(slug.trim().toLowerCase())}`;
}

export async function fetchContentPage(slug: string): Promise<ContentPage> {
  const response = await apiClient.getEnvelope<ContentPage>(contentPageRequestPath(slug));
  return response.data;
}

export function adminSeoMetadataRequestPath(query: AdminSeoMetadataListQuery = {}): string {
  return `${adminSeoMetadataPath}${queryString(query)}`;
}

export function adminContentPagesRequestPath(query: AdminContentPageListQuery = {}): string {
  return `${adminContentPagesPath}${queryString(query)}`;
}

export function adminRedirectsRequestPath(query: AdminRedirectListQuery = {}): string {
  return `${adminRedirectsPath}${queryString(query)}`;
}

export async function fetchSeoResolution(path: string): Promise<SeoResolution> {
  const response = await apiClient.getEnvelope<SeoResolution>(seoResolveRequestPath(path));
  return response.data;
}

export async function fetchAdminSeoMetadata(
  query: AdminSeoMetadataListQuery = {},
): Promise<AdminSeoMetadataPage> {
  const response = await apiClient.getEnvelope<AdminSeoMetadataPage>(
    adminSeoMetadataRequestPath(query),
  );
  return response.data;
}

export async function fetchAdminContentPages(
  query: AdminContentPageListQuery = {},
): Promise<AdminContentPagePage> {
  const response = await apiClient.getEnvelope<AdminContentPagePage>(
    adminContentPagesRequestPath(query),
  );
  return response.data;
}

export async function fetchAdminContentPage(pageId: string): Promise<AdminContentPage> {
  const response = await apiClient.getEnvelope<AdminContentPage>(
    `${adminContentPagesPath}/${encodeId(pageId)}`,
  );
  return response.data;
}

export async function createAdminContentPage(
  input: AdminContentPageCreateInput,
): Promise<AdminContentPage> {
  const response = await apiClient.postEnvelope<AdminContentPage>(adminContentPagesPath, input);
  return response.data;
}

export async function updateAdminContentPage(
  pageId: string,
  input: AdminContentPageUpdateInput,
): Promise<AdminContentPage> {
  const response = await apiClient.patchEnvelope<AdminContentPage>(
    `${adminContentPagesPath}/${encodeId(pageId)}`,
    input,
  );
  return response.data;
}

export async function updateAdminContentPageStatus(
  pageId: string,
  input: AdminContentPageStatusInput,
): Promise<AdminContentPage> {
  const response = await apiClient.patchEnvelope<AdminContentPage>(
    `${adminContentPagesPath}/${encodeId(pageId)}/status`,
    input,
  );
  return response.data;
}

export async function createAdminSeoMetadata(
  input: AdminSeoMetadataCreateInput,
): Promise<AdminSeoMetadata> {
  const response = await apiClient.postEnvelope<AdminSeoMetadata>(adminSeoMetadataPath, input);
  return response.data;
}

export async function updateAdminSeoMetadata(
  metadataId: string,
  input: AdminSeoMetadataUpdateInput,
): Promise<AdminSeoMetadata> {
  const response = await apiClient.patchEnvelope<AdminSeoMetadata>(
    `${adminSeoMetadataPath}/${encodeId(metadataId)}`,
    input,
  );
  return response.data;
}

export async function deleteAdminSeoMetadata(metadataId: string): Promise<void> {
  await apiClient.deleteEnvelope<null>(`${adminSeoMetadataPath}/${encodeId(metadataId)}`);
}

export async function fetchAdminRedirects(
  query: AdminRedirectListQuery = {},
): Promise<AdminRedirectPage> {
  const response = await apiClient.getEnvelope<AdminRedirectPage>(adminRedirectsRequestPath(query));
  return response.data;
}

export async function createAdminRedirect(input: AdminRedirectCreateInput): Promise<AdminRedirect> {
  const response = await apiClient.postEnvelope<AdminRedirect>(adminRedirectsPath, input);
  return response.data;
}

export async function updateAdminRedirect(
  redirectId: string,
  input: AdminRedirectUpdateInput,
): Promise<AdminRedirect> {
  const response = await apiClient.patchEnvelope<AdminRedirect>(
    `${adminRedirectsPath}/${encodeId(redirectId)}`,
    input,
  );
  return response.data;
}

export async function deleteAdminRedirect(redirectId: string): Promise<void> {
  await apiClient.deleteEnvelope<null>(`${adminRedirectsPath}/${encodeId(redirectId)}`);
}

export function useSeoResolution(path: string, enabled = true) {
  const normalized = normalizedPath(path);
  return useQuery({
    queryKey: queryKeys.seo.resolve(normalized),
    queryFn: () => fetchSeoResolution(normalized),
    enabled: enabled && Boolean(path.trim()),
    staleTime: 60_000,
  });
}

export function useContentPage(slug: string, enabled = true) {
  const normalized = slug.trim().toLowerCase();
  return useQuery({
    queryKey: queryKeys.content.page(normalized),
    queryFn: () => fetchContentPage(normalized),
    enabled: enabled && Boolean(normalized),
    staleTime: 60_000,
  });
}

export function useAdminSeoMetadata(query: AdminSeoMetadataListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.seoMetadata(query),
    queryFn: () => fetchAdminSeoMetadata(query),
    enabled,
    staleTime: 15_000,
  });
}

export function useAdminContentPages(query: AdminContentPageListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.pages(query),
    queryFn: () => fetchAdminContentPages(query),
    enabled,
    staleTime: 15_000,
  });
}

export function useAdminContentPage(pageId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.page(pageId),
    queryFn: () => fetchAdminContentPage(pageId),
    enabled: enabled && Boolean(pageId),
    staleTime: 15_000,
  });
}

function invalidateContentQueries(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.content.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
}

export function useCreateAdminContentPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminContentPage,
    onSuccess: () => invalidateContentQueries(queryClient),
  });
}

export function useUpdateAdminContentPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, input }: { pageId: string; input: AdminContentPageUpdateInput }) =>
      updateAdminContentPage(pageId, input),
    onSuccess: () => invalidateContentQueries(queryClient),
  });
}

export function useUpdateAdminContentPageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pageId, input }: { pageId: string; input: AdminContentPageStatusInput }) =>
      updateAdminContentPageStatus(pageId, input),
    onSuccess: () => invalidateContentQueries(queryClient),
  });
}

export function useCreateAdminSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminSeoMetadata,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}

export function useUpdateAdminSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      metadataId,
      input,
    }: {
      metadataId: string;
      input: AdminSeoMetadataUpdateInput;
    }) => updateAdminSeoMetadata(metadataId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}

export function useDeleteAdminSeoMetadata() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminSeoMetadata,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}

export function useAdminRedirects(query: AdminRedirectListQuery = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.adminContent.redirects(query),
    queryFn: () => fetchAdminRedirects(query),
    enabled,
    staleTime: 15_000,
  });
}

export function useCreateAdminRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdminRedirect,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}

export function useUpdateAdminRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ redirectId, input }: { redirectId: string; input: AdminRedirectUpdateInput }) =>
      updateAdminRedirect(redirectId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}

export function useDeleteAdminRedirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAdminRedirect,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.seo.all });
    },
  });
}
