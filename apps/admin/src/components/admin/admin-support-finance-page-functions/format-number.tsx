import { faNumber } from '../../../pages/admin/admin-support-finance-page-shared';

export function formatNumber(value: number): string {
  return faNumber.format(value);
}
