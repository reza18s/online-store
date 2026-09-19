import type { AdminMutationState } from '../../../pages/admin/admin-catalog-inventory-page-shared';

export function mutationStateLabel(state: AdminMutationState): string {
  return {
    draft: 'تغییرات ذخیره‌نشده',
    invalid: 'فرم نیازمند اصلاح است',
    saving: 'در حال ذخیره...',
    saved: 'ذخیره شد',
    'publish-blocked': 'انتشار مسدود است',
  }[state];
}
