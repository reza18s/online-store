import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export type Audience = 'women' | 'men' | 'children';

export type PreviewState =
  | 'cart-conflict'
  | 'payment-pending'
  | 'payment-failed'
  | 'payment-recovery'
  | 'offline'
  | 'error'
  | 'maintenance';

export type HashRoute =
  | { kind: 'home'; path: string; queryString: string }
  | { kind: 'auth-request'; path: string; queryString: string }
  | { kind: 'auth-verify'; path: string; queryString: string }
  | { kind: 'category'; path: string; queryString: string; audience?: Audience }
  | {
      kind: 'products';
      path: string;
      queryString: string;
      mode: string;
      audience?: Audience;
    }
  | { kind: 'product'; path: string; queryString: string; slug: string }
  | { kind: 'cart'; path: string; queryString: string }
  | { kind: 'preview-state'; path: string; queryString: string; state: PreviewState }
  | { kind: 'local-payment'; path: string; queryString: string }
  | { kind: 'checkout-confirmation'; path: string; queryString: string }
  | { kind: 'checkout'; path: string; queryString: string; step: string }
  | { kind: 'account'; path: string; queryString: string; section?: string }
  | { kind: 'address-list'; path: string; queryString: string }
  | { kind: 'address-create'; path: string; queryString: string }
  | { kind: 'address-edit'; path: string; queryString: string; addressId?: string }
  | { kind: 'order'; path: string; queryString: string; orderNumber: string }
  | { kind: 'return'; path: string; queryString: string; status: boolean }
  | { kind: 'editorial'; path: string; queryString: string; page: string }
  | { kind: 'content'; path: string; queryString: string; slug: string }
  | { kind: 'admin'; path: string; queryString: string; page: string }
  | { kind: 'not-found'; path: string; queryString: string };

const audiencePattern = /^#(?:category|products)\/(women|men|children)$/;
const editorialRoutes = new Set([
  '#campaign',
  '#guide',
  '#article',
  '#lookbook',
  '#about',
  '#trust',
  '#size-guide',
  '#shipping-policy',
  '#returns-policy',
  '#care-guide',
  '#faq',
  '#contact',
  '#privacy',
  '#terms',
  '#support',
]);

function routeParts(route: string): { path: string; queryString: string } {
  const queryStart = route.indexOf('?');
  return {
    path: queryStart >= 0 ? route.slice(0, queryStart) : route,
    queryString: queryStart >= 0 ? route.slice(queryStart + 1) : '',
  };
}

function audienceFromPath(path: string): Audience | undefined {
  return path.match(audiencePattern)?.[1] as Audience | undefined;
}

export function decodeHashSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function hashRouteFromLocation(location: { pathname: string; search: string }): string {
  const pathname = location.pathname.replace(/^\/+/, '');
  const routePath = pathname ? `#${pathname}` : '#home';
  return `${routePath}${location.search}`;
}

export function parseHashRoute(route: string): HashRoute {
  const { path, queryString } = routeParts(route);
  const shared = { path, queryString };

  if (path === '#home' || path === '#' || path === '#search') return { ...shared, kind: 'home' };
  if (path === '#auth' || path === '#auth/request') return { ...shared, kind: 'auth-request' };
  if (path === '#auth/verify') return { ...shared, kind: 'auth-verify' };
  if (path.startsWith('#category/')) {
    return { ...shared, kind: 'category', audience: audienceFromPath(path) };
  }
  if (path === '#products' || path.startsWith('#products/')) {
    const mode = path.split('/')[1] ?? '';
    return {
      ...shared,
      kind: 'products',
      mode,
      audience: audienceFromPath(path),
    };
  }
  if (path.startsWith('#product/')) {
    const slug = path.split('/')[1] ?? '';
    if (slug) return { ...shared, kind: 'product', slug };
  }
  if (path === '#cart' || path === '#cart/empty') return { ...shared, kind: 'cart' };
  if (path === '#cart/conflict') {
    return { ...shared, kind: 'cart' };
  }
  if (path === '#checkout/confirmation') return { ...shared, kind: 'checkout-confirmation' };
  if (path === '#checkout/local-payment') return { ...shared, kind: 'local-payment' };
  if (path === '#checkout/payment-pending') {
    return { ...shared, kind: 'preview-state', state: 'payment-pending' };
  }
  if (path === '#checkout/payment-failed') {
    return { ...shared, kind: 'preview-state', state: 'payment-failed' };
  }
  if (path === '#checkout/payment-recovery') {
    return { ...shared, kind: 'preview-state', state: 'payment-recovery' };
  }
  if (path.startsWith('#checkout/')) {
    return { ...shared, kind: 'checkout', step: path.split('/')[1] ?? 'address' };
  }
  if (path === '#account') return { ...shared, kind: 'account' };
  if (path === '#account/addresses') return { ...shared, kind: 'address-list' };
  if (path === '#account/addresses/create') return { ...shared, kind: 'address-create' };
  if (path === '#account/addresses/edit' || path.startsWith('#account/addresses/edit/')) {
    const addressId = path.slice('#account/addresses/edit/'.length);
    return { ...shared, kind: 'address-edit', addressId: addressId || undefined };
  }
  if (path.startsWith('#account/')) {
    return { ...shared, kind: 'account', section: path.slice('#account/'.length) || 'dashboard' };
  }
  if (path.startsWith('#order/')) {
    return {
      ...shared,
      kind: 'order',
      orderNumber: decodeHashSegment(path.slice('#order/'.length)),
    };
  }
  if (path === '#return' || path === '#return/request') {
    return { ...shared, kind: 'return', status: false };
  }
  if (path === '#return/status') return { ...shared, kind: 'return', status: true };
  if (editorialRoutes.has(path)) {
    return { ...shared, kind: 'editorial', page: path.slice(1) };
  }
  if (path.startsWith('#content/')) {
    return { ...shared, kind: 'content', slug: decodeHashSegment(path.slice('#content/'.length)) };
  }
  if (path === '#state/offline') return { ...shared, kind: 'preview-state', state: 'offline' };
  if (path === '#state/error') return { ...shared, kind: 'preview-state', state: 'error' };
  if (path === '#state/maintenance') {
    return { ...shared, kind: 'preview-state', state: 'maintenance' };
  }
  if (path === '#admin' || path.startsWith('#admin/')) {
    return {
      ...shared,
      kind: 'admin',
      page: path.slice('#admin'.length).replace(/^\//, '') || 'admin',
    };
  }
  return { ...shared, kind: 'not-found' };
}

export function useHashRoute(): string {
  const location = useLocation();
  if (location.pathname === '/' && !location.search) {
    return globalThis.__NOVA_RENDER_CONTEXT__?.hashRoute ?? '#home';
  }
  return hashRouteFromLocation(location);
}

export function HashNavigationBridge(): null {
  useEffect(() => {
    const onHashChange = () => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return null;
}

export function useScrollToTop(route: string): void {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [route]);
}
