import { useLocation } from 'react-router-dom';

import { hashRouteFromLocation } from './hash-route-from-location';

export function useHashRoute(): string {
  const location = useLocation();
  if (location.pathname === '/' && !location.search) {
    return globalThis.__NOVA_RENDER_CONTEXT__?.hashRoute ?? '#home';
  }
  return hashRouteFromLocation(location);
}
