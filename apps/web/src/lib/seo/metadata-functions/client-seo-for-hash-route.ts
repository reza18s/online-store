import { parseHashRoute } from '../../../hooks/routing/hash-route';

import type { SeoDocument } from '../metadata-shared';
import { categoryCopy, siteDescription } from '../metadata-shared';

import { createSeoDocument } from './create-seo-document';

import { decodePathSegment } from './decode-path-segment';

import { isIndexablePublicRenderPath } from './is-indexable-public-render-path';

export function clientSeoForHashRoute(route: string, origin: string): SeoDocument {
  const path = route.split('?')[0] ?? '#home';
  const audience = path.match(/^#category\/(women|men|children)$/)?.[1];
  const audienceCopy = audience ? categoryCopy[audience] : undefined;
  const privateRoute = /^(#(?:auth|cart|checkout|account|order|return|admin|state))(?:\/|$)/.test(
    path,
  );

  if (audience && audienceCopy) {
    return createSeoDocument({
      origin,
      title: `NOVA | ${audienceCopy.label}`,
      description: audienceCopy.description,
      canonicalPath: `/category/${audience}`,
    });
  }
  if (path.startsWith('#product/')) {
    const slug = decodePathSegment(path.slice('#product/'.length));
    return createSeoDocument({
      origin,
      title: 'NOVA | محصول',
      description: 'جزئیات و مشخصات محصولات نوا.',
      canonicalPath: slug ? `/product/${encodeURIComponent(slug)}` : null,
      noIndex: !slug,
    });
  }
  if (path === '#home' || path === '#') {
    return createSeoDocument({
      origin,
      title: 'NOVA | Atelier Editorial',
      description: siteDescription,
      canonicalPath: '/',
    });
  }
  if (privateRoute) {
    return createSeoDocument({
      origin,
      title: path.startsWith('#admin') ? 'NOVA Admin' : 'NOVA',
      description: path.startsWith('#admin') ? 'پنل مدیریت فروشگاه نوا.' : siteDescription,
      noIndex: true,
    });
  }
  if (path.startsWith('#products') || path === '#search') {
    return createSeoDocument({
      origin,
      title: 'NOVA | فروشگاه پوشاک',
      description: 'انتخابی از لباس‌ها و اکسسوری‌های نوا برای روزهای پیش رو.',
      noIndex: true,
    });
  }
  if (path === '#not-found') {
    return createSeoDocument({
      origin,
      title: 'NOVA | صفحه پیدا نشد',
      description: 'این صفحه پیدا نشد.',
      noIndex: true,
    });
  }

  const parsed = parseHashRoute(path);
  if (parsed.kind === 'editorial') {
    return createSeoDocument({
      origin,
      title: 'NOVA | Atelier Editorial',
      description: siteDescription,
    });
  }
  if (parsed.kind === 'content') {
    const publicPath = `/content/${encodeURIComponent(parsed.slug)}`;
    if (!isIndexablePublicRenderPath(publicPath)) {
      return createSeoDocument({
        origin,
        title: 'NOVA | محتوا',
        description: siteDescription,
        noIndex: true,
      });
    }
    return createSeoDocument({
      origin,
      title: 'NOVA | محتوا',
      description: siteDescription,
      canonicalPath: publicPath,
    });
  }

  return createSeoDocument({
    origin,
    title: 'NOVA | Atelier Editorial',
    description: siteDescription,
    noIndex: true,
  });
}
