import { type IconName } from '@/shared/ui/icon';

import type { AdminContentSeoState } from '@/features/content/pages/admin-content-seo-page-shared';

export function stateIcon(kind: AdminContentSeoState): IconName {
  return kind === 'loading'
    ? 'refresh'
    : kind === 'permission' || kind === 'offline'
      ? 'warning'
      : kind === 'error'
        ? 'info'
        : kind === 'empty'
          ? 'book'
          : 'check';
}
