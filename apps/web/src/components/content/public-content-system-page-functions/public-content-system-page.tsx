import { useContentPage } from '../../../lib/content/content-api';

import type { PublicContentSystemState } from '../../../pages/content/public-content-system-page-shared';
import { stateCopy } from '../../../pages/content/public-content-system-page-shared';

import { PublishedContent } from './published-content';

import { SystemStatePanel } from './system-state-panel';

import { getPublicContentState } from './get-public-content-state';

import { normalizePublicContentSlug } from './normalize-public-content-slug';

import { useOnlineStatus } from './use-online-status';

export function PublicContentSystemPage({
  slug,
  systemState,
}: {
  slug: string;
  systemState?: PublicContentSystemState;
}) {
  const normalizedSlug = normalizePublicContentSlug(slug);
  const online = useOnlineStatus();
  const query = useContentPage(normalizedSlug ?? '', Boolean(normalizedSlug) && !systemState);
  const state = getPublicContentState({
    slug,
    systemState,
    query,
    online,
  });

  if (state === 'published' || state === 'empty' || state === 'unsupported') {
    if (!query.data || !normalizedSlug) return <SystemStatePanel state="missing" />;
    return <PublishedContent page={query.data} slug={normalizedSlug} state={state} />;
  }

  return (
    <SystemStatePanel
      state={state}
      onRetry={stateCopy[state].retry ? () => void query.refetch() : undefined}
    />
  );
}
