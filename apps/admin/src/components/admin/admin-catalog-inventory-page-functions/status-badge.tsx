import { Badge } from '@nova/ui';

import { statusBadgeVariant } from './status-badge-variant';

import { statusLabel } from './status-label';

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusBadgeVariant(status)}>{statusLabel(status)}</Badge>;
}
