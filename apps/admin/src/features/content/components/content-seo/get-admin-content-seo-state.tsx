import type {
  AdminContentSeoQueryState,
  AdminContentSeoState,
} from '@/features/content/pages/admin-content-seo-page-shared';

import { canManageAdminContent } from '@/features/content/components/content-seo/can-manage-admin-content';

import { isOfflineError } from '@/features/content/components/content-seo/is-offline-error';

export function getAdminContentSeoState(
  query: AdminContentSeoQueryState,
  roles?: readonly string[],
): AdminContentSeoState {
  if (roles && !canManageAdminContent(roles)) return 'permission';
  if (query.isPending) return 'loading';
  if (query.isError) return isOfflineError(query.error) ? 'offline' : 'error';
  return query.hasItems ? 'ready' : 'empty';
}
