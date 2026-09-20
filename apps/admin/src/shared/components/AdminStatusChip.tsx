import { type ReactNode } from 'react';
import { Badge } from '@nova/ui';

import type { AdminStatusTone } from '@/shared/fixtures/app-shared';
import { adminStatusVariants } from '@/shared/fixtures/app-shared';

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
