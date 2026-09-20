import { getRenderableContentBlocks } from '@/features/content/api/content-blocks';

import type {
  ContentQuerySnapshot,
  PublicContentSystemState,
  PublicContentViewState,
} from '@/features/content/pages/public-content-system-page-shared';
import { MAX_TEXT_LENGTH } from '@/features/content/pages/public-content-system-page-shared';

import { boundedText } from '@/features/content/components/bounded-text';

import { classifyContentError } from '@/features/content/components/classify-content-error';

import { isPublishedContentPage } from '@/features/content/components/is-published-content-page';

import { normalizePublicContentSlug } from '@/features/content/components/normalize-public-content-slug';

export function getPublicContentState({
  slug,
  systemState,
  query,
  online = true,
}: {
  slug: string;
  systemState?: PublicContentSystemState;
  query: ContentQuerySnapshot;
  online?: boolean;
}): PublicContentViewState {
  const normalizedSlug = normalizePublicContentSlug(slug);
  if (!normalizedSlug) return 'invalid-route';
  if (systemState === 'offline' || systemState === 'maintenance') return systemState;
  if (query.isPending) return 'loading';
  if (query.isError) return classifyContentError(query.error, online);
  if (!isPublishedContentPage(query.data, normalizedSlug)) return 'missing';

  const hasBody = Boolean(boundedText(query.data.body, MAX_TEXT_LENGTH));
  const blocks = getRenderableContentBlocks(query.data.blocks);
  if (!hasBody && blocks.blocks.length === 0) {
    return blocks.unsupportedCount > 0 ? 'unsupported' : 'empty';
  }
  return 'published';
}
