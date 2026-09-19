import type {
  AdminContentSeoQueryState,
  AdminContentSeoState,
} from '../../../pages/admin/admin-content-seo-page-shared';

import { canManageAdminContent } from './can-manage-admin-content';

import { isOfflineError } from './is-offline-error';

export function getAdminContentSeoState(
  query: AdminContentSeoQueryState,
  roles?: readonly string[],
): AdminContentSeoState {
  if (roles && !canManageAdminContent(roles)) return 'permission';
  if (query.isPending) return 'loading';
  if (query.isError) return isOfflineError(query.error) ? 'offline' : 'error';
  return query.hasItems ? 'ready' : 'empty';
}
