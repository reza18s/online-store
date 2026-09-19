import { type AdminContentStatus } from '@nova/api-client';

export function statusLabel(status: AdminContentStatus): string {
  return status === 'PUBLISHED' ? 'منتشر شده' : status === 'ARCHIVED' ? 'بایگانی شده' : 'پیش‌نویس';
}
