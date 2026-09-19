import { Badge } from '@nova/ui';

import { PAYMENT_STATUS_LABELS } from '../../../pages/admin/admin-orders-page-shared';

import { statusBadgeVariant } from './status-badge-variant';

export function PaymentChip({ status }: { status: string }) {
  const tone =
    status === 'PAID' || status === 'REFUNDED'
      ? 'success'
      : status === 'FAILED'
        ? 'danger'
        : 'warning';
  return (
    <Badge variant={statusBadgeVariant(tone)} className="min-h-7 rounded-md text-[11px]">
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
