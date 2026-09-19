import { seoResolvePath } from '../content-api-shared';

import { normalizedPath } from './normalized-path';

export function seoResolveRequestPath(path: string): string {
  return `${seoResolvePath}?path=${encodeURIComponent(normalizedPath(path))}`;
}
