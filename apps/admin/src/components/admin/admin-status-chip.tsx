import { type ReactNode } from 'react';
import { Badge } from '@nova/ui';

import type { AdminStatusTone } from '../app/app-shared';
import { adminStatusVariants } from '../app/app-shared';

export function AdminStatusChip({
  tone = 'neutral',
  children,
}: {
  tone?: AdminStatusTone;
  children: ReactNode;
}) {
  return (
    <Badge
      variant={adminStatusVariants[tone]}
      className="min-h-7 rounded-md text-[10px] font-medium"
    >
      {children}
    </Badge>
  );
}
