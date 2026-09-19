import type { AdminCatalogProductStatus } from '@nova/api-client';

export function adminLifecycleStatusLabel(status: AdminCatalogProductStatus): string {
  const labels: Record<AdminCatalogProductStatus, string> = {
    DRAFT: 'پیش‌نویس',
    PUBLISHED: 'فعال',
    ARCHIVED: 'بایگانی شده',
  };
  return labels[status];
}
