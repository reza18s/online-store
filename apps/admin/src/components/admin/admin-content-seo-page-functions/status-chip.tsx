import { type AdminContentStatus } from '@nova/api-client';
import { Badge } from '@nova/ui';

import { statusLabel } from './status-label';

export function StatusChip({ status }: { status: AdminContentStatus }) {
  const tone = status === 'PUBLISHED' ? 'success' : status === 'ARCHIVED' ? 'neutral' : 'warning';
  const variant = tone === 'neutral' ? 'secondary' : tone;
  return (
    <Badge variant={variant} className="min-h-7 rounded-md text-[11px]">
      {statusLabel(status)}
    </Badge>
  );
}
