import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@nova/api-client';

import { fetchSeoResolution } from './fetch-seo-resolution';

import { normalizedPath } from './normalized-path';

export function useSeoResolution(path: string, enabled = true) {
  const normalized = normalizedPath(path);
  return useQuery({
    queryKey: queryKeys.seo.resolve(normalized),
    queryFn: () => fetchSeoResolution(normalized),
    enabled: enabled && Boolean(path.trim()),
    staleTime: 60_000,
  });
}
