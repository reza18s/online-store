import { seoResolvePath } from '@/features/content/api/content/content-api-shared';

import { normalizedPath } from '@/features/content/api/content/normalized-path';

export function seoResolveRequestPath(path: string): string {
  return `${seoResolvePath}?path=${encodeURIComponent(normalizedPath(path))}`;
}
