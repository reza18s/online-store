import {
  apiClient,
  type AdminContentPage,
  type AdminContentPageUpdateInput,
} from '@nova/api-client';

import { adminContentPagesPath } from '../../../lib/content/content-api-shared';

import { encodeId } from '../../../lib/content/content-api-functions/encode-id';

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
