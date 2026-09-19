import {
  catalogSearchSuggestionsDefaultLimit,
  catalogSearchSuggestionsPath,
} from '../catalog-api-shared';

export function catalogSuggestionsRequestPath(
  query: string,
  limit = catalogSearchSuggestionsDefaultLimit,
): string {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return `${catalogSearchSuggestionsPath}?${params.toString()}`;
}
