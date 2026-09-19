import { Badge } from '@nova/ui';

import { adminOrderStatusLabel } from './admin-order-status-label';

import { adminOrderStatusTone } from './admin-order-status-tone';

import { statusBadgeVariant } from './status-badge-variant';

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
