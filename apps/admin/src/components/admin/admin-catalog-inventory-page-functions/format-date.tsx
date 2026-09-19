import { faDate } from '../../../pages/admin/admin-catalog-inventory-page-shared';

export function formatDate(value: string | null | undefined): string {
  if (!value) return 'ثبت نشده';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'تاریخ نامشخص' : faDate.format(date);
}
