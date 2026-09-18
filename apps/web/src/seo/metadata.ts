import { isPublicSlug } from '@nova/api-client';
import type {
  CatalogCategory,
  CatalogAudience,
  CatalogProduct,
  CatalogProductPage,
  ContentPage,
  SeoMetadata,
} from '@nova/api-client';

import { parseHashRoute } from '../shared/hash-route';

export type SeoDocumentType = 'website' | 'product' | 'article';

export interface SeoDocument {
  title: string;
  description: string;
  canonicalUrl: string | null;
  robots: 'index, follow' | 'noindex, nofollow';
  openGraph: {
    type: SeoDocumentType;
    imageUrl: string | null;
  };
  jsonLd: unknown | null;
}

export type InitialRenderData =
  | { kind: 'home'; products: CatalogProductPage }
  | {
      kind: 'category';
      audience: CatalogAudience;
      categories: CatalogCategory[];
      products: CatalogProductPage;
    }
  | { kind: 'product'; product: CatalogProduct }
  | { kind: 'content'; page: ContentPage };

export interface InitialRenderContext {
  path: string;
  hashRoute: string;
  seo: SeoDocument;
  initialData?: InitialRenderData;
}

export type PublicRenderRoute =
  | { kind: 'home'; path: '/' }
  | { kind: 'category'; path: string; slug: CatalogAudience }
  | { kind: 'product'; path: string; slug: string }
  | { kind: 'content'; path: string; slug: string }
  | { kind: 'client'; path: string }
  | { kind: 'private'; path: string }
  | { kind: 'unknown'; path: string };

const siteDescription = 'NOVA Store، فروشگاه پوشاک ایرانی برای انتخابی روشن و قابل اعتماد.';
const categoryCopy: Record<string, { label: string; description: string }> = {
  women: {
    label: 'زنانه',
    description: 'رویه‌های سبک، بافت‌های آرام و جزئیاتی که هر روز را شخصی‌تر می‌کنند.',
  },
  men: {
    label: 'مردانه',
    description: 'ترکیبی از برش دقیق، پارچه‌های خوش‌دست و رنگ‌هایی که به‌راحتی کنار هم می‌نشینند.',
  },
  children: {
    label: 'بچگانه',
    description: 'لباس‌های راحت و مقاوم برای حرکت، کشف و روزهایی که باید آزاد باشند.',
  },
};

const clientOnlyRenderPaths = new Set([
  '/search',
  '/campaign',
  '/guide',
  '/article',
  '/lookbook',
  '/about',
  '/trust',
  '/size-guide',
  '/shipping-policy',
  '/returns-policy',
  '/care-guide',
  '/faq',
  '/contact',
  '/privacy',
  '/terms',
  '/support',
  '/not-found',
  '/state/offline',
  '/state/error',
  '/state/maintenance',
]);

function decodePathSegment(value: string): string | undefined {
  try {
    const decoded = decodeURIComponent(value);
    return isPublicSlug(decoded) ? decoded : undefined;
  } catch {
    return undefined;
  }
}

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

export function isIndexablePublicRenderPath(path: string): boolean {
  const route = parsePublicRenderPath(path);
  return (
    route.kind === 'home' ||
    route.kind === 'category' ||
    route.kind === 'product' ||
    route.kind === 'content'
  );
}

export function normalizeCanonicalPath(
  origin: string,
  value: string | null | undefined,
): string | null {
  if (value == null) return null;

  const candidate = value.trim();
  if (!candidate || candidate.startsWith('//') || candidate.includes('\\')) return null;

  let site: URL;
  let canonical: URL;
  try {
    site = new URL(origin);
    canonical = candidate.startsWith('/') ? new URL(candidate, site) : new URL(candidate);
  } catch {
    return null;
  }

  if (
    !['http:', 'https:'].includes(site.protocol) ||
    canonical.origin !== site.origin ||
    canonical.username ||
    canonical.password ||
    canonical.search ||
    canonical.hash
  ) {
    return null;
  }

  const path = canonical.pathname.replace(/\/+$/, '') || '/';
  return isIndexablePublicRenderPath(path) ? path : null;
}

function absoluteUrl(origin: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${origin.replace(/\/$/, '')}${value.startsWith('/') ? value : `/${value}`}`;
}

export function createSeoDocument(input: {
  origin: string;
  title: string;
  description: string;
  canonicalPath?: string | null;
  noIndex?: boolean;
  type?: SeoDocumentType;
  imagePath?: string | null;
  jsonLd?: unknown | null;
}): SeoDocument {
  const canonicalPath = normalizeCanonicalPath(input.origin, input.canonicalPath);
  const canonicalUrl = canonicalPath ? absoluteUrl(input.origin, canonicalPath) : null;
  const imageUrl = input.imagePath ? absoluteUrl(input.origin, input.imagePath) : null;

  return {
    title: input.title,
    description: input.description,
    canonicalUrl,
    robots: input.noIndex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      type: input.type ?? 'website',
      imageUrl,
    },
    jsonLd: input.noIndex ? null : (input.jsonLd ?? null),
  };
}

export function seoDocumentFromMetadata(
  origin: string,
  fallback: Omit<Parameters<typeof createSeoDocument>[0], 'origin'>,
  metadata: SeoMetadata | null,
): SeoDocument {
  const metadataCanonicalPath = normalizeCanonicalPath(origin, metadata?.canonicalUrl);
  return createSeoDocument({
    ...fallback,
    origin,
    title: metadata?.title ?? fallback.title,
    description: metadata?.description ?? fallback.description,
    canonicalPath: metadataCanonicalPath ?? fallback.canonicalPath,
    noIndex: metadata?.noIndex ?? fallback.noIndex,
    jsonLd: metadata?.structuredData ?? fallback.jsonLd,
  });
}

function upsertMeta(document: Document, key: 'name' | 'property', value: string, content: string) {
  const selector = `meta[${key}="${key === 'name' ? value : value}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(key, value);
    element.dataset.novaSeo = 'true';
    document.head.append(element);
  }
  element.content = content;
}

function removeMeta(document: Document, key: 'name' | 'property', value: string): void {
  document.head.querySelectorAll(`meta[${key}="${value}"]`).forEach((element) => element.remove());
}

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

export function readInitialRenderContext(): InitialRenderContext | undefined {
  const value = (globalThis as typeof globalThis & { __NOVA_RENDER_CONTEXT__?: unknown })
    .__NOVA_RENDER_CONTEXT__;
  if (!value || typeof value !== 'object') return undefined;
  const context = value as Partial<InitialRenderContext>;
  if (
    typeof context.path !== 'string' ||
    typeof context.hashRoute !== 'string' ||
    !context.seo ||
    typeof context.seo !== 'object'
  ) {
    return undefined;
  }
  if (context.initialData !== undefined && !isInitialRenderData(context.initialData)) {
    return undefined;
  }
  return context as InitialRenderContext;
}

function isInitialRenderData(value: unknown): value is InitialRenderData {
  if (!value || typeof value !== 'object') return false;
  const data = value as Record<string, unknown>;
  if (typeof data.kind !== 'string') return false;
  if (data.kind === 'home') return Boolean(data.products && typeof data.products === 'object');
  if (data.kind === 'category') {
    return (
      Array.isArray(data.categories) && Boolean(data.products && typeof data.products === 'object')
    );
  }
  if (data.kind === 'product') return Boolean(data.product && typeof data.product === 'object');
  if (data.kind === 'content') return Boolean(data.page && typeof data.page === 'object');
  return false;
}

export const defaultSiteDescription = siteDescription;
