import { Badge } from '@nova/ui';

import type { AdminMutationState } from '../../../pages/admin/admin-catalog-inventory-page-shared';

import { mutationStateLabel } from './mutation-state-label';

export function MutationStateBadge({ state }: { state: AdminMutationState }) {
  const variant =
    state === 'saved'
      ? 'success'
      : state === 'saving'
        ? 'info'
        : state === 'invalid' || state === 'publish-blocked'
          ? 'destructive'
          : 'warning';
  return <Badge variant={variant}>{mutationStateLabel(state)}</Badge>;
}
