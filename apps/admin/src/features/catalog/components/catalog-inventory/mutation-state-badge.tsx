import { Badge } from '@nova/ui';

import type { AdminMutationState } from '@/features/catalog/pages/admin-catalog-inventory-page-shared';

import { mutationStateLabel } from '@/features/catalog/components/catalog-inventory/mutation-state-label';

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
