import { contentPagePath } from '../../../lib/content/content-api-shared';

export function contentPageRequestPath(slug: string): string {
  return `${contentPagePath}/${encodeURIComponent(slug.trim().toLowerCase())}`;
}
