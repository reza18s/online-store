import { ORDER_STATUS_LABELS } from '@/features/orders/pages/admin-orders-page-shared';

export function adminOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}
