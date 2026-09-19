import { type IconName } from '../../ui/icon';

import type { AdminContentSeoState } from '../../../pages/admin/admin-content-seo-page-shared';

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
