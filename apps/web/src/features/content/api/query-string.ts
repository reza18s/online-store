import {
  type AdminRedirectListQuery,
  type AdminContentPageListQuery,
  type AdminSeoMetadataListQuery,
} from '@nova/api-client';

export function queryString(
  query: AdminSeoMetadataListQuery | AdminRedirectListQuery | AdminContentPageListQuery,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const result = params.toString();
  return result ? `?${result}` : '';
}
