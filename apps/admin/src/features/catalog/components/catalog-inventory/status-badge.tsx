import { Badge } from '@nova/ui';

import { statusBadgeVariant } from '@/features/catalog/components/catalog-inventory/status-badge-variant';

import { statusLabel } from '@/features/catalog/components/catalog-inventory/status-label';

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>;
}
