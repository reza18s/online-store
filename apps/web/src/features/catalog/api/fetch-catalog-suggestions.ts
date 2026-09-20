import { apiClient, type CatalogSearchSuggestion } from '@nova/api-client';
import {
  getFakeCatalogSuggestions,
  isStorefrontFakeDataEnabled,
} from '@/shared/fixtures/dev-store-fixtures';

import { catalogSearchSuggestionsDefaultLimit } from '@/features/catalog/api/catalog-api-shared';

import { catalogSuggestionsRequestPath } from '@/features/catalog/api/catalog-suggestions-request-path';

export async function fetchCatalogSuggestions(
  query: string,
  limit = catalogSearchSuggestionsDefaultLimit,
): Promise<CatalogSearchSuggestion[]> {
  if (isStorefrontFakeDataEnabled()) return getFakeCatalogSuggestions(query, limit);
  const response = await apiClient.getEnvelope<CatalogSearchSuggestion[]>(
    catalogSuggestionsRequestPath(query, limit),
  );
  return response.data;
}
