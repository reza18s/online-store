import { type AdminRedirect } from '@nova/api-client';

import { normalizeSiteRelativePath } from './normalize-site-relative-path';

export function wouldCreateRedirectCycle(
  redirects: readonly Pick<AdminRedirect, 'id' | 'fromPath' | 'toPath'>[],
  candidate: { id?: string; fromPath: string; toPath: string },
): boolean {
  const from = normalizeSiteRelativePath(candidate.fromPath);
  const firstTo = normalizeSiteRelativePath(candidate.toPath);
  if (from === firstTo) return true;
  const edges = new Map<string, string>();
  for (const redirect of redirects) {
    if (redirect.id !== candidate.id)
      edges.set(
        normalizeSiteRelativePath(redirect.fromPath),
        normalizeSiteRelativePath(redirect.toPath),
      );
  }
  edges.set(from, firstTo);
  const visited = new Set<string>();
  let current: string | undefined = from;
  while (current) {
    if (visited.has(current)) return true;
    visited.add(current);
    current = edges.get(current);
  }
  return false;
}
