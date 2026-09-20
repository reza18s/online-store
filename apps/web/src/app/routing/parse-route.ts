import type { Route } from '@/app/routing/route-shared';
import { editorialRoutes } from '@/app/routing/route-shared';

import { audienceFromPath } from '@/app/routing/audience-from-path';
import { decodeRouteSegment } from '@/app/routing/decode-route-segment';
import { routeParts } from '@/app/routing/route-parts';

export function parseRoute(route: string): Route {
  const { path, queryString } = routeParts(route);
  const shared = { path, queryString };

  if (path === '/' || path === '/search') return { ...shared, kind: 'home' };
  if (path === '/auth' || path === '/auth/request') return { ...shared, kind: 'auth-request' };
  if (path === '/auth/verify') return { ...shared, kind: 'auth-verify' };
  if (path.startsWith('/category/')) {
    return { ...shared, kind: 'category', audience: audienceFromPath(path) };
  }
  if (path === '/products' || path.startsWith('/products/')) {
    const mode = path.split('/')[2] ?? '';
    return {
      ...shared,
      kind: 'products',
      mode,
      audience: audienceFromPath(path),
    };
  }
  if (path.startsWith('/product/')) {
    const slug = path.split('/')[2] ?? '';
    if (slug) return { ...shared, kind: 'product', slug };
  }
  if (path === '/cart' || path === '/cart/empty' || path === '/cart/conflict') {
    return { ...shared, kind: 'cart' };
  }
  if (path === '/checkout/confirmation') return { ...shared, kind: 'checkout-confirmation' };
  if (path === '/checkout/local-payment') return { ...shared, kind: 'local-payment' };
  if (path === '/checkout/payment-pending') {
    return { ...shared, kind: 'preview-state', state: 'payment-pending' };
  }
  if (path === '/checkout/payment-failed') {
    return { ...shared, kind: 'preview-state', state: 'payment-failed' };
  }
  if (path === '/checkout/payment-recovery') {
    return { ...shared, kind: 'preview-state', state: 'payment-recovery' };
  }
  if (path.startsWith('/checkout/')) {
    return { ...shared, kind: 'checkout', step: path.split('/')[2] ?? 'address' };
  }
  if (path === '/account') return { ...shared, kind: 'account' };
  if (path === '/account/addresses') return { ...shared, kind: 'address-list' };
  if (path === '/account/addresses/create') return { ...shared, kind: 'address-create' };
  if (path === '/account/addresses/edit' || path.startsWith('/account/addresses/edit/')) {
    const addressId = path.slice('/account/addresses/edit/'.length);
    return { ...shared, kind: 'address-edit', addressId: addressId || undefined };
  }
  if (path.startsWith('/account/')) {
    return { ...shared, kind: 'account', section: path.slice('/account/'.length) || 'dashboard' };
  }
  if (path.startsWith('/order/')) {
    return {
      ...shared,
      kind: 'order',
      orderNumber: decodeRouteSegment(path.slice('/order/'.length)),
    };
  }
  if (path === '/return' || path === '/return/request') {
    return { ...shared, kind: 'return', status: false };
  }
  if (path === '/return/status') return { ...shared, kind: 'return', status: true };
  if (editorialRoutes.has(path)) {
    return { ...shared, kind: 'editorial', page: path.slice(1) };
  }
  if (path.startsWith('/content/')) {
    return { ...shared, kind: 'content', slug: decodeRouteSegment(path.slice('/content/'.length)) };
  }
  if (path === '/state/offline') return { ...shared, kind: 'preview-state', state: 'offline' };
  if (path === '/state/error') return { ...shared, kind: 'preview-state', state: 'error' };
  if (path === '/state/maintenance') {
    return { ...shared, kind: 'preview-state', state: 'maintenance' };
  }
  if (path === '/admin' || path.startsWith('/admin/')) {
    return {
      ...shared,
      kind: 'admin',
      page: path.slice('/admin'.length).replace(/^\//, '') || 'admin',
    };
  }
  return { ...shared, kind: 'not-found' };
}
