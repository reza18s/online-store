import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  queryKeys,
  type AdminCatalogProductMediaCompleteInput,
  type AdminCatalogProductMediaPresignInput,
} from '@nova/api-client';

import { completeAdminProductMedia } from './complete-admin-product-media';
import { invalidateAdminProductResources } from './invalidate-admin-product-resources';
import { presignAdminProductMedia } from './presign-admin-product-media';

export async function uploadAdminProductMedia(
  productId: string,
  file: File,
  input: AdminCatalogProductMediaPresignInput,
  completeInput: Omit<
    AdminCatalogProductMediaCompleteInput,
    keyof AdminCatalogProductMediaPresignInput | 'assetId'
  >,
) {
  const plan = await presignAdminProductMedia(productId, input);
  await uploadPresignedObject(plan.original.url, plan.original.headers, file);
  await uploadPresignedObject(plan.derivative.url, plan.derivative.headers, file);
  return completeAdminProductMedia(productId, {
    ...input,
    ...completeInput,
    assetId: plan.assetId,
  });
}

async function uploadPresignedObject(
  url: string,
  headers: Record<string, string>,
  file: File,
): Promise<void> {
  const response = await fetch(url, { method: 'PUT', headers, body: file });
  if (!response.ok) {
    throw new Error(`Media upload failed with status ${response.status}.`);
  }
}

export function useUploadAdminProductMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.adminCatalog.all,
    mutationFn: ({
      productId,
      file,
      input,
      completeInput,
    }: {
      productId: string;
      file: File;
      input: AdminCatalogProductMediaPresignInput;
      completeInput: Omit<
        AdminCatalogProductMediaCompleteInput,
        keyof AdminCatalogProductMediaPresignInput | 'assetId'
      >;
    }) => uploadAdminProductMedia(productId, file, input, completeInput),
    onSuccess: (_media, variables) =>
      invalidateAdminProductResources(queryClient, variables.productId),
  });
}
