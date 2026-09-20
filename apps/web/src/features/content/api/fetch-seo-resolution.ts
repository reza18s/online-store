import { apiClient, type SeoResolution } from '@nova/api-client';

import { seoResolveRequestPath } from '@/features/content/api/seo-resolve-request-path';

export async function fetchSeoResolution(path: string): Promise<SeoResolution> {
  const response = await apiClient.getEnvelope<SeoResolution>(seoResolveRequestPath(path));
  return response.data;
}
