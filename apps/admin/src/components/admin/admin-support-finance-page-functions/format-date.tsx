import { faDate } from '../../../pages/admin/admin-support-finance-page-shared';

export function formatDate(value: string | null): string {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'ثبت نشده' : faDate.format(date);
}
