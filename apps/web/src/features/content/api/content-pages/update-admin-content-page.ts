import {
  apiClient,
  type AdminContentPage,
  type AdminContentPageUpdateInput,
} from '@nova/api-client';

import { adminContentPagesPath } from '@/features/content/api/content-api-shared';

import { encodeId } from '@/features/content/api/encode-id';

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
