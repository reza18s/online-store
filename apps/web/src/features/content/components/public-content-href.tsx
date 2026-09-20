import { normalizePublicContentSlug } from '@/features/content/components/normalize-public-content-slug';

export function publicContentHref(slug: string): string | null {
  const normalized = normalizePublicContentSlug(slug);
  return normalized ? `/content/${encodeURIComponent(normalized)}` : null;
}
