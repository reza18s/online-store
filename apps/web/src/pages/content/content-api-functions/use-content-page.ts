import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchContentPage } from './fetch-content-page';

export function useContentPage(slug: string, enabled = true) {
  const normalized = slug.trim().toLowerCase();
  return useQuery({
    queryKey: queryKeys.content.page(normalized),
    queryFn: () => fetchContentPage(normalized),
    enabled: enabled && Boolean(normalized),
    staleTime: 60_000,
  });
}
