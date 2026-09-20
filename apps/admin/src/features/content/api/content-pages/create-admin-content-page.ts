import {
  apiClient,
  type AdminContentPage,
  type AdminContentPageCreateInput,
} from '@nova/api-client';

import { adminContentPagesPath } from '@/features/content/api/content/content-api-shared';

export async function createAdminContentPage(
  input: AdminContentPageCreateInput,
): Promise<AdminContentPage> {
  const response = await apiClient.postEnvelope<AdminContentPage>(adminContentPagesPath, input);
  return response.data;
}
