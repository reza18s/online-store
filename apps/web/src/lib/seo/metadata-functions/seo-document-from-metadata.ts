import type { SeoMetadata } from '@nova/api-client';

import type { SeoDocument } from '../metadata-shared';

import { createSeoDocument } from './create-seo-document';

import { normalizeCanonicalPath } from './normalize-canonical-path';

export function seoDocumentFromMetadata(
  origin: string,
  fallback: Omit<Parameters<typeof createSeoDocument>[0], 'origin'>,
  metadata: SeoMetadata | null,
): SeoDocument {
  const metadataCanonicalPath = normalizeCanonicalPath(origin, metadata?.canonicalUrl);
  return createSeoDocument({
    ...fallback,
    origin,
    title: metadata?.title ?? fallback.title,
    description: metadata?.description ?? fallback.description,
    canonicalPath: metadataCanonicalPath ?? fallback.canonicalPath,
    noIndex: metadata?.noIndex ?? fallback.noIndex,
    jsonLd: metadata?.structuredData ?? fallback.jsonLd,
  });
}
