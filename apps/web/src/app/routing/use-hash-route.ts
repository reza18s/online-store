import { useLocation } from 'react-router-dom';

import { hashRouteFromLocation } from '@/app/routing/hash-route-from-location';

export function useHashRoute(): string {
  const location = useLocation();
  if (location.pathname === '/' && !location.search) {
    if (typeof window !== 'undefined' && window.location.hash) {
      return window.location.hash;
    }
    return globalThis.__NOVA_RENDER_CONTEXT__?.hashRoute ?? '#home';
  }
  return hashRouteFromLocation(location);
}
