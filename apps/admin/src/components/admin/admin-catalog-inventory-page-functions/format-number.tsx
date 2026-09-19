import { faNumber } from '../../../pages/admin/admin-catalog-inventory-page-shared';

export function formatNumber(value: number): string {
  return faNumber.format(value);
}
