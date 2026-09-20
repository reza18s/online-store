import { useLocation } from 'react-router-dom';

import { routeFromLocation } from '@/app/routing/route-from-location';

export function useRoute(): string {
  const location = useLocation();
  return routeFromLocation(location);
}
