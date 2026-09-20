import { clientSeoForRoute, type InitialRenderContext } from '@/features/seo/api/metadata';

import { normalizeSeoPath } from '@/features/seo/utils/normalize-seo-path';

export function resolveSeoDocumentForRoute(
  route: string,
  initial: InitialRenderContext | undefined,
  pathname: string,
  origin: string,
) {
  const initialMatches =
    initial &&
    initial.route === route &&
    normalizeSeoPath(initial.path) === normalizeSeoPath(pathname);

  return initialMatches ? initial.seo : clientSeoForRoute(route, origin);
}
