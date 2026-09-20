import type { AdminCatalogProductStatus } from '@nova/api-client';

export function adminProductStatusAction(status: AdminCatalogProductStatus): {
  label: string;
  targetStatus: AdminCatalogProductStatus;
} {
  if (status === 'PUBLISHED') {
    return { label: 'بازگشت به پیش‌نویس', targetStatus: 'DRAFT' };
  }
  if (status === 'ARCHIVED') {
    return { label: 'بازیابی پیش‌نویس', targetStatus: 'DRAFT' };
  }
  return { label: 'انتشار', targetStatus: 'PUBLISHED' };
}
