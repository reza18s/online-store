import { Badge } from '@nova/ui';

import { adminOrderStatusLabel } from '@/features/orders/components/order-management/admin-order-status-label';

import { adminOrderStatusTone } from '@/features/orders/components/order-management/admin-order-status-tone';

import { statusBadgeVariant } from '@/features/orders/components/order-management/status-badge-variant';

export function StatusChip({
  status,
  label = adminOrderStatusLabel(status),
}: {
  status: string;
  label?: string;
}) {
  return (
    <Badge
      variant={statusBadgeVariant(adminOrderStatusTone(status))}
      className="min-h-7 rounded-md text-[11px]"
    >
      {label}
    </Badge>
  );
}
