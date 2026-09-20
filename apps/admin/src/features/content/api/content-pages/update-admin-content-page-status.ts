import {
  apiClient,
  type AdminContentPage,
  type AdminContentPageStatusInput,
} from '@nova/api-client';

import { adminContentPagesPath } from '@/features/content/api/content/content-api-shared';

import { encodeId } from '@/features/content/api/content/encode-id';

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
