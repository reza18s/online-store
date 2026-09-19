import type { SeoDocument } from '../metadata-shared';

import { removeMeta } from './remove-meta';

import { upsertMeta } from './upsert-meta';

export function applySeoDocument(document: Document, seo: SeoDocument): void {
  document.title = seo.title;
  upsertMeta(document, 'name', 'description', seo.description);
  upsertMeta(document, 'name', 'robots', seo.robots);

  const openGraph = [
    ['og:title', seo.title],
    ['og:description', seo.description],
    ['og:type', seo.openGraph.type],
  ] as const;
  openGraph.forEach(([property, content]) => upsertMeta(document, 'property', property, content));

  if (seo.canonicalUrl) {
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.dataset.novaSeo = 'true';
      document.head.append(canonical);
    }
    canonical.href = seo.canonicalUrl;
  } else {
    document.head.querySelectorAll('link[rel="canonical"]').forEach((element) => element.remove());
  }

  if (seo.canonicalUrl) upsertMeta(document, 'property', 'og:url', seo.canonicalUrl);
  else removeMeta(document, 'property', 'og:url');

  if (seo.openGraph.imageUrl) upsertMeta(document, 'property', 'og:image', seo.openGraph.imageUrl);
  else removeMeta(document, 'property', 'og:image');

  document.head
    .querySelectorAll('script[type="application/ld+json"][data-nova-seo]')
    .forEach((element) => element.remove());
  if (seo.jsonLd !== null) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.novaSeo = 'true';
    script.textContent = JSON.stringify(seo.jsonLd);
    document.head.append(script);
  }
}
