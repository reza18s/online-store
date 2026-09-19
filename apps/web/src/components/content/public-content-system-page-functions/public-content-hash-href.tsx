import { normalizePublicContentSlug } from './normalize-public-content-slug';

export function publicContentHashHref(slug: string): string | null {
  const normalized = normalizePublicContentSlug(slug);
  return normalized ? `#content/${encodeURIComponent(normalized)}` : null;
}
