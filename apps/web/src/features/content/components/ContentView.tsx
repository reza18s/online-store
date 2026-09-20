import { useContentPage } from '@/features/content/api/content-api';

import type { PublicContentSystemState } from '@/features/content/pages/public-content-system-page-shared';
import { stateCopy } from '@/features/content/pages/public-content-system-page-shared';

import { PublishedContent } from '@/features/content/components/published-content';

import { SystemStatePanel } from '@/features/content/components/system-state-panel';

import { getPublicContentState } from '@/features/content/components/get-public-content-state';

import { normalizePublicContentSlug } from '@/features/content/components/normalize-public-content-slug';

import { useOnlineStatus } from '@/features/content/components/use-online-status';

export function ContentView({
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
