import { Badge } from '@nova/ui';

import { statusBadgeVariant } from '@/features/support/components/support-finance/status-badge-variant';

import { statusLabel } from '@/features/support/components/support-finance/status-label';

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>;
}
