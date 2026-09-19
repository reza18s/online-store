import type { AdminOrderSummary } from '@nova/api-client';

import type { AdminOrderPreview } from '../../components/app/app-shared';

import { adminOrderStatusLabel } from '../../components/admin/admin-order-status-label';

import { formatAdminDate } from './format-admin-date';

export function toAdminOrderPreview(source: AdminOrderSummary): AdminOrderPreview {
  const customer = source.customer?.email || source.customer?.phone || 'مشتری نوا';
  const statusTone: AdminOrderPreview['statusTone'] =
    source.status === 'CANCELLED' || source.status === 'RETURNED'
      ? 'danger'
      : source.status === 'DELIVERED' || source.status === 'SHIPPED'
        ? 'success'
        : 'warning';

  return {
    id: `#${source.orderNumber}`,
    orderNumber: source.orderNumber,
    customer,
    amount: source.totalToman,
    status: adminOrderStatusLabel(source.status),
    statusTone,
    date: formatAdminDate(source.createdAt),
  };
}
