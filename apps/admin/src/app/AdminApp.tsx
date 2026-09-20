import { useEffect, useState } from 'react';

import { AdminNavigationBridge } from '@/app/routing/navigation-bridge';
import { decodeRouteSegment } from '@/app/routing/decode-route-segment';
import { AdminRouter } from '@/app/routes/AdminRouter';

type AdminLocation = {
  page: string;
  queryString: string;
};

function readAdminLocation(): AdminLocation {
  const path = window.location.pathname.replace(/^\/admin\/?/, '').replace(/^\/+/, '');
  return {
    page: decodeRouteSegment(path) || 'admin',
    queryString: window.location.search.slice(1),
  };
}

export function AdminApp({ page, queryString = '' }: AdminLocation) {
  const [location, setLocation] = useState<AdminLocation>({
    page: page || 'admin',
    queryString,
  });

  useEffect(() => {
    const updateLocation = () => setLocation(readAdminLocation());
    window.addEventListener('popstate', updateLocation);
    return () => {
      window.removeEventListener('popstate', updateLocation);
    };
  }, []);

  return (
    <>
      <AdminNavigationBridge />
      <AdminRouter page={location.page} queryString={location.queryString} />
    </>
  );
}
