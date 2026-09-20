import type { SeoDocument, SeoDocumentType } from '@/features/seo/api/metadata-shared';

import { absoluteUrl } from '@/features/seo/api/absolute-url';

import { normalizeCanonicalPath } from '@/features/seo/api/normalize-canonical-path';

export function createSeoDocument(input: {
  origin: string;
  title: string;
  description: string;
  canonicalPath?: string | null;
  noIndex?: boolean;
  type?: SeoDocumentType;
  imagePath?: string | null;
  jsonLd?: unknown | null;
}): SeoDocument {
  const canonicalPath = normalizeCanonicalPath(input.origin, input.canonicalPath);
  const canonicalUrl = canonicalPath ? absoluteUrl(input.origin, canonicalPath) : null;
  const imageUrl = input.imagePath ? absoluteUrl(input.origin, input.imagePath) : null;

  return {
    title: input.title,
    description: input.description,
    canonicalUrl,
    robots: input.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      type: input.type ?? 'website',
      imageUrl,
    },
    jsonLd: input.noIndex ? null : (input.jsonLd ?? null),
  };
}
