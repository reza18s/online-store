import type { AdminMutationState } from '../../../pages/admin/admin-catalog-inventory-page-shared';

export function resolveAdminMutationState(input: {
  isDirty: boolean;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  hasInvalidFields: boolean;
  hasPublishBlockers?: boolean;
}): AdminMutationState {
  if (input.isPending) return 'saving';
  if (input.hasPublishBlockers) return 'publish-blocked';
  if (input.hasInvalidFields || input.isError) return 'invalid';
  if (input.isSuccess) return 'saved';
  return input.isDirty ? 'draft' : 'saved';
}
