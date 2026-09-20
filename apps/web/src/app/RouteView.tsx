import type { RouteViewProps } from '@/app/app-shared';

import { PublicApp } from '@/app/PublicApp';

export function RouteView(props: RouteViewProps) {
  return <PublicApp {...props} />;
}
