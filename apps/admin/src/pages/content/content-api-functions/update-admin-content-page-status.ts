import {
  apiClient,
  type AdminContentPage,
  type AdminContentPageStatusInput,
} from '@nova/api-client';

import { adminContentPagesPath } from '../../../lib/content/content-api-shared';

import { encodeId } from '../../../lib/content/content-api-functions/encode-id';

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
