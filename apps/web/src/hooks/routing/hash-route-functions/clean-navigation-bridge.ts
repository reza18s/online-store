import { useEffect } from 'react';

import { browserPathFromHash } from './browser-path-from-hash';

export function CleanNavigationBridge(): null {
  useEffect(() => {
    const dispatchNavigation = () => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    const normalizeLegacyHash = () => {
      const nextPath = browserPathFromHash(window.location.hash);
      if (!nextPath) return;
      window.history.replaceState(window.history.state, '', nextPath);
      dispatchNavigation();
    };
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
      const nextPath = anchor ? browserPathFromHash(anchor.getAttribute('href') ?? '') : undefined;
      if (!anchor || !nextPath) return;
      event.preventDefault();
      window.history.pushState(window.history.state, '', nextPath);
      dispatchNavigation();
    };
    const onHashChange = () => {
      normalizeLegacyHash();
    };
    normalizeLegacyHash();
    document.addEventListener('click', onClick, true);
    window.addEventListener('hashchange', onHashChange);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  return null;
}
