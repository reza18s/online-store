import { normalizePublicContentSlug } from '@/features/content/components/normalize-public-content-slug';

export function publicContentPath(slug: string): string | null {
  const normalized = normalizePublicContentSlug(slug);
  return normalized ? `/content/${encodeURIComponent(normalized)}` : null;
}
