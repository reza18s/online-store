import type { RouteViewProps } from './app-shared';

import { PublicApp } from './public-app';

export function RouteView(props: RouteViewProps) {
  return <PublicApp {...props} />;
}
