import { apiClient, type AdminContentPage } from '@nova/api-client';

import { adminContentPagesPath } from '../../../lib/content/content-api-shared';

import { encodeId } from '../../../lib/content/content-api-functions/encode-id';

export async function fetchAdminContentPage(pageId: string): Promise<AdminContentPage> {
  const response = await apiClient.getEnvelope<AdminContentPage>(
    `${adminContentPagesPath}/${encodeId(pageId)}`,
  );
  return response.data;
}
