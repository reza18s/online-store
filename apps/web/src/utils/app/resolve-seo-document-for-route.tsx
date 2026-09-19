import { clientSeoForHashRoute, type InitialRenderContext } from '../../lib/seo/metadata';

import { normalizeSeoPath } from './normalize-seo-path';

export function resolveSeoDocumentForRoute(
  route: string,
  initial: InitialRenderContext | undefined,
  pathname: string,
  origin: string,
) {
  const initialMatches =
    initial &&
    initial.hashRoute === route &&
    normalizeSeoPath(initial.path) === normalizeSeoPath(pathname);

  return initialMatches ? initial.seo : clientSeoForHashRoute(route, origin);
}
