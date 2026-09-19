import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchCatalogSuggestions } from './fetch-catalog-suggestions';

export function useCatalogSuggestions(query: string, enabled = true) {
  const normalizedQuery = query.trim();

  return useQuery({
    queryKey: queryKeys.catalog.suggestions(normalizedQuery),
    queryFn: () => fetchCatalogSuggestions(normalizedQuery),
    enabled: enabled && Boolean(normalizedQuery),
    staleTime: 30_000,
  });
}
