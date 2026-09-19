import type { ContentPage } from '@nova/api-client';

import { normalizePublicContentSlug } from './normalize-public-content-slug';

import { recordValue } from './record-value';

export function isPublishedContentPage(value: unknown, slug: string): value is ContentPage {
  const record = recordValue(value);
  const normalizedSlug = normalizePublicContentSlug(slug);
  return Boolean(
    record &&
    normalizedSlug &&
    record.slug === normalizedSlug &&
    typeof record.title === 'string' &&
    record.title.trim() &&
    (record.body === null || typeof record.body === 'string') &&
    Array.isArray(record.blocks),
  );
}
