import { useEffect, useState } from 'react';

import { AdminPage } from './admin-page';

type AdminLocation = {
  page: string;
  queryString: string;
};

function readAdminLocation(fallbackPage: string, fallbackQueryString: string): AdminLocation {
  const hash = window.location.hash;
  if (hash.startsWith('#admin')) {
    const [path = '', queryString = ''] = hash.slice('#admin'.length).split('?');
    return { page: path.replace(/^\//, '') || 'admin', queryString };
  }
  return { page: fallbackPage || 'admin', queryString: fallbackQueryString };
}

export function AdminApp({ page, queryString = '' }: AdminLocation) {
  const [location, setLocation] = useState<AdminLocation>(() =>
    readAdminLocation(page, queryString),
  );

  useEffect(() => {
    const updateLocation = () => setLocation(readAdminLocation(page, queryString));
    window.addEventListener('hashchange', updateLocation);
    window.addEventListener('popstate', updateLocation);
    return () => {
      window.removeEventListener('hashchange', updateLocation);
      window.removeEventListener('popstate', updateLocation);
    };
  }, [page, queryString]);

  return <AdminPage page={location.page} queryString={location.queryString} />;
}
