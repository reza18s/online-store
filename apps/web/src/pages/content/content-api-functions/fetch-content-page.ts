import { apiClient, type ContentPage } from '@nova/api-client';
import {
  getFakeContentPage,
  isStorefrontFakeDataEnabled,
} from '../../../lib/fixtures/dev-store-fixtures';

import { contentPageRequestPath } from './content-page-request-path';

export async function fetchContentPage(slug: string): Promise<ContentPage> {
  if (isStorefrontFakeDataEnabled()) return getFakeContentPage(slug);
  const response = await apiClient.getEnvelope<ContentPage>(contentPageRequestPath(slug));
  return response.data;
}
