import type { CatalogAudience } from '@nova/api-client';

import type { PublicRenderRoute } from '../metadata-shared';
import { categoryCopy, clientOnlyRenderPaths } from '../metadata-shared';

import { decodePathSegment } from './decode-path-segment';

export function parsePublicRenderPath(input: string): PublicRenderRoute {
  const trimmed = input.trim();
  if (trimmed.startsWith('//')) return { kind: 'unknown', path: trimmed };
  const path = trimmed.replace(/\/+$/, '') || '/';
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.includes('?')) {
    return { kind: 'unknown', path };
  }
  if (path === '/') return { kind: 'home', path };

  const segments = path.slice(1).split('/');
  if (segments.length === 2) {
    const [prefix, rawSlug] = segments;
    const slug = rawSlug ? decodePathSegment(rawSlug) : undefined;
    if (slug && prefix === 'category' && slug in categoryCopy) {
      return { kind: 'category', path, slug: slug as CatalogAudience };
    }
    if (slug && prefix === 'product') return { kind: 'product', path, slug };
    if (slug && prefix === 'content') return { kind: 'content', path, slug };
  }

  if (/^\/(?:auth|account|admin|cart|checkout|order|return)(?:\/|$)/.test(path)) {
    return { kind: 'private', path };
  }
  if (path === '/products' || path.startsWith('/products/') || clientOnlyRenderPaths.has(path)) {
    return { kind: 'client', path };
  }
  return { kind: 'unknown', path };
}
