import { useEffect } from 'react';

import { isAdminRoute } from '@/app/routing/navigate-to-route';

export function AdminNavigationBridge(): null {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>('a[href]');
      const href = anchor?.getAttribute('href');
      if (
        !anchor ||
        !href ||
        !isAdminRoute(href) ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }
      event.preventDefault();
      window.history.pushState(window.history.state, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
