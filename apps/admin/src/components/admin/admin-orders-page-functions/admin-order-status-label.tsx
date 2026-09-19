import { ORDER_STATUS_LABELS } from '../../../pages/admin/admin-orders-page-shared';

export function adminOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
