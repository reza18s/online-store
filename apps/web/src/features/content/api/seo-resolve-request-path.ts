import { seoResolvePath } from '@/features/content/api/content-api-shared';

import { normalizedPath } from '@/features/content/api/normalized-path';

export function seoResolveRequestPath(path: string): string {
  return `${seoResolvePath}?path=${encodeURIComponent(normalizedPath(path))}`;
}
