import { contentPagePath } from '@/features/content/api/content-api-shared';

export function contentPageRequestPath(slug: string): string {
  return `${contentPagePath}/${encodeURIComponent(slug.trim().toLowerCase())}`;
}
