import { useEffect } from 'react';

export function useScrollToTop(route: string): void {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [route]);
}
