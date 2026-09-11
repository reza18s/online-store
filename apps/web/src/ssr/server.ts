import {
  createServer as createHttpServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  CatalogCategory,
  CatalogProduct,
  CatalogProductPage,
  ContentPage,
  ProductSummary,
  SeoResolution,
} from '@nova/api-client';

import {
  createSeoDocument,
  defaultSiteDescription,
  isIndexablePublicRenderPath,
  normalizeCanonicalPath,
  parsePublicRenderPath,
  seoDocumentFromMetadata,
  type InitialRenderContext,
  type PublicRenderRoute,
  type SeoDocument,
} from '../seo/metadata';

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export interface RenderOptions {
  origin: string;
  apiOrigin: string;
  fetcher?: Fetcher;
}

export interface RenderContext extends InitialRenderContext {
  status: 200 | 404 | 503;
  redirect?: { location: string; status: 301 | 302 | 307 | 308 };
  bodyHtml: string;
  cacheControl: string;
}

export interface RenderResponse {
  status: number;
  headers: Headers;
  body: string;
}

class RenderApiError extends Error {
  public constructor(
    public readonly status: number,
    message = 'SSR API request failed',
  ) {
    super(message);
    this.name = 'RenderApiError';
  }
}

const publicCache = 'public, s-maxage=60, stale-while-revalidate=300';
const sitemapCache = 'public, s-maxage=300, stale-while-revalidate=900';
const redirectCache = 'public, max-age=300';
const noStoreCache = 'no-store';

function trimOrigin(value: string): string {
  return value.replace(/\/$/, '');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeJson(value: unknown): string {
  return (JSON.stringify(value) ?? 'null')
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('&', '\\u0026')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}

function apiUrl(apiOrigin: string, path: string): string {
  return `${trimOrigin(apiOrigin)}${path}`;
}

async function getApi<T>(apiOrigin: string, path: string, fetcher: Fetcher): Promise<T> {
  const response = await fetcher(apiUrl(apiOrigin, path), {
    headers: { Accept: 'application/json' },
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) throw new RenderApiError(response.status);
  if (!isApiEnvelope(body)) {
    throw new RenderApiError(502, 'SSR API returned an invalid envelope');
  }
  return body.data as T;
}

function isApiEnvelope(value: unknown): value is { data: unknown; meta: unknown } {
  if (!value || typeof value !== 'object') return false;
  const envelope = value as Record<string, unknown>;
  if (!('data' in envelope) || !envelope.meta || typeof envelope.meta !== 'object') return false;
  const meta = envelope.meta as Record<string, unknown>;
  return typeof meta.requestId === 'string' && typeof meta.timestamp === 'string';
}

function isSeoResolution(value: unknown): value is SeoResolution {
  if (!value || typeof value !== 'object') return false;
  const resolution = value as Record<string, unknown>;
  if (typeof resolution.path !== 'string') return false;

  if (resolution.metadata !== null) {
    if (!resolution.metadata || typeof resolution.metadata !== 'object') return false;
    const metadata = resolution.metadata as Record<string, unknown>;
    if (
      typeof metadata.path !== 'string' ||
      typeof metadata.title !== 'string' ||
      typeof metadata.description !== 'string' ||
      (typeof metadata.canonicalUrl !== 'string' && metadata.canonicalUrl !== null) ||
      typeof metadata.noIndex !== 'boolean' ||
      !('structuredData' in metadata)
    ) {
      return false;
    }
  }

  if (resolution.redirect !== null) {
    if (!resolution.redirect || typeof resolution.redirect !== 'object') return false;
    const redirect = resolution.redirect as Record<string, unknown>;
    if (
      typeof redirect.fromPath !== 'string' ||
      typeof redirect.toPath !== 'string' ||
      ![301, 302, 307, 308].includes(redirect.statusCode as number)
    ) {
      return false;
    }
  }

  return true;
}

function safeRedirectPath(origin: string, value: string): string | null {
  const candidate = value.trim();
  if (
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    candidate.includes('\\') ||
    candidate.includes('?') ||
    candidate.includes('#') ||
    candidate.includes('\r') ||
    candidate.includes('\n')
  ) {
    return null;
  }

  try {
    const site = new URL(origin);
    const destination = new URL(candidate, site);
    if (
      destination.origin !== site.origin ||
      destination.username ||
      destination.password ||
      destination.search ||
      destination.hash
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return candidate;
}

async function getSeoResolution(
  apiOrigin: string,
  path: string,
  fetcher: Fetcher,
): Promise<SeoResolution> {
  const candidate = await getApi<unknown>(apiOrigin, resolverPath(path), fetcher);
  if (!isSeoResolution(candidate)) {
    throw new RenderApiError(502, 'SSR API returned an invalid SEO resolution');
  }
  return candidate;
}

function resolverPath(path: string): string {
  return `/v1/seo/resolve?path=${encodeURIComponent(path)}`;
}

function catalogProductsPath(query: string): string {
  return `/v1/catalog/products?${query}`;
}

function isNonPublicPath(path: string): boolean {
  return (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes('?') ||
    /^\/(?:api|v1|health|assets|src|node_modules|@vite|@id|_vite|\.well-known)(?:\/|$)/i.test(
      path,
    ) ||
    /^\/(?:favicon\.[a-z0-9]+|manifest(?:\.json)?|service-worker\.js|robots\.txt|sitemap\.xml)$/i.test(
      path,
    )
  );
}

function routeHash(route: PublicRenderRoute): string {
  switch (route.kind) {
    case 'home':
      return '#home';
    case 'category':
      return `#category/${route.slug}`;
    case 'product':
      return `#product/${route.slug}`;
    case 'content':
      return `#content/${route.slug}`;
    case 'private':
      if (route.path.startsWith('/auth')) return '#auth';
      if (route.path.startsWith('/account')) return '#account';
      if (route.path.startsWith('/admin')) return '#admin';
      if (route.path.startsWith('/cart')) return '#cart';
      if (route.path.startsWith('/checkout')) return '#checkout/address';
      if (route.path.startsWith('/order/')) return `#order/${route.path.slice('/order/'.length)}`;
      if (route.path.startsWith('/return')) return '#return';
      return '#home';
    case 'unknown':
      return '#not-found';
  }
}

function imagePath(product: ProductSummary | CatalogProduct): string | null {
  if ('media' in product) {
    return (
      product.media.find((media) => media.kind === 'PRODUCT')?.url ??
      product.media[0]?.url ??
      product.imageUrl
    );
  }
  return product.imageUrl;
}

function productIsAvailable(product: CatalogProduct): boolean {
  return product.available && product.stockStatus !== 'OUT_OF_STOCK';
}

function catalogProductDescription(product: CatalogProduct): string {
  return product.description ?? product.shortDescription ?? `جزئیات و مشخصات ${product.name}.`;
}

function productAvailabilityLabel(product: CatalogProduct): string {
  if (!productIsAvailable(product)) return 'ناموجود';
  return product.stockStatus === 'LOW_STOCK' ? 'رو به اتمام' : 'موجود';
}

function organizationJsonLd(origin: string): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': `${trimOrigin(origin)}/#organization`,
    name: 'NOVA Store',
    url: `${trimOrigin(origin)}/`,
  };
}

function productBreadcrumbJsonLd(
  origin: string,
  product: CatalogProduct,
  productUrl: string,
): Record<string, unknown> {
  const category = product.categories.find(
    (candidate) =>
      parsePublicRenderPath(`/category/${encodeURIComponent(candidate.slug)}`).kind ===
        'category' && Boolean(candidate.name),
  );
  const items = [
    { name: 'خانه', item: `${trimOrigin(origin)}/` },
    ...(category
      ? [
          {
            name: category.name,
            item: `${trimOrigin(origin)}/category/${encodeURIComponent(category.slug)}`,
          },
        ]
      : []),
    { name: product.name, item: productUrl },
  ];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      ...item,
    })),
  };
}

function productJsonLd(origin: string, product: CatalogProduct): Record<string, unknown> {
  const images =
    product.media.length > 0 ? product.media.map((media) => media.url) : [product.imageUrl];
  const priceToman = product.priceToman;
  const productUrl = `${trimOrigin(origin)}/product/${encodeURIComponent(product.slug)}`;
  const imageUrls = images
    .filter((value): value is string => Boolean(value))
    .map((value) =>
      /^https?:\/\//i.test(value)
        ? value
        : `${trimOrigin(origin)}${value.startsWith('/') ? value : `/${value}`}`,
    );
  const productNode = {
    '@type': 'Product',
    '@id': `${productUrl}#product`,
    name: product.name,
    description: catalogProductDescription(product),
    ...(imageUrls.length > 0 ? { image: imageUrls } : {}),
    url: productUrl,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'IRR',
      price: String(priceToman * 10),
      availability: productIsAvailable(product)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: productUrl,
    },
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      productNode,
      productBreadcrumbJsonLd(origin, product, productUrl),
      organizationJsonLd(origin),
    ],
  };
}

function homeJsonLd(origin: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'NOVA Store',
        url: `${trimOrigin(origin)}/`,
        inLanguage: 'fa-IR',
      },
      organizationJsonLd(origin),
    ],
  };
}

function categoryJsonLd(
  origin: string,
  route: PublicRenderRoute,
  products: ProductSummary[],
  categoryName: string,
) {
  if (route.kind !== 'category') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `NOVA | ${categoryName}`,
    url: `${trimOrigin(origin)}${route.path}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${trimOrigin(origin)}/product/${encodeURIComponent(product.slug)}`,
        name: product.name,
      })),
    },
  };
}

function contentJsonLd(origin: string, route: PublicRenderRoute, page: ContentPage) {
  if (route.kind !== 'content') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: page.title,
    description: page.body?.slice(0, 320) ?? page.title,
    url: `${trimOrigin(origin)}${route.path}`,
    inLanguage: 'fa-IR',
  };
}

function initialBody(
  title: string,
  description: string,
  links: Array<{ href: string; label: string }> = [],
): string {
  const linkMarkup = links.length
    ? `<nav aria-label="NOVA links"><ul>${links
        .map(({ href, label }) => `<li><a href="${escapeHtml(href)}">${escapeHtml(label)}</a></li>`)
        .join('')}</ul></nav>`
    : '';
  return `<main data-nova-ssr-content="true"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${linkMarkup}</main>`;
}

function productBody(product: CatalogProduct, description: string): string {
  const href = `/product/${encodeURIComponent(product.slug)}`;
  const primaryMedia = product.media.find((media) => media.kind === 'PRODUCT') ?? product.media[0];
  const primaryImageUrl = primaryMedia?.url ?? product.imageUrl;
  const primaryImageAlt = primaryMedia?.altText ?? product.imageAlt ?? product.name;
  const category = product.categories.find(
    (candidate) =>
      parsePublicRenderPath(`/category/${encodeURIComponent(candidate.slug)}`).kind ===
        'category' && Boolean(candidate.name),
  );
  const breadcrumb = `<nav class="breadcrumb" aria-label="مسیر صفحه"><a href="/">خانه</a>${
    category
      ? `<span>/</span><a href="/category/${encodeURIComponent(category.slug)}">${escapeHtml(category.name)}</a>`
      : ''
  }<span>/</span><span aria-current="page">${escapeHtml(product.name)}</span></nav>`;
  const image = primaryImageUrl
    ? `<div class="product-detail__main-image"><img src="${escapeHtml(primaryImageUrl)}" alt="${escapeHtml(primaryImageAlt)}" loading="eager" decoding="async" fetchpriority="high" /></div>`
    : '<div class="product-detail__main-image" aria-hidden="true"></div>';
  return `<main data-nova-ssr-content="true"><article>${breadcrumb}${image}<a href="${escapeHtml(href)}"><h1>${escapeHtml(product.name)}</h1></a><p>${escapeHtml(description)}</p><p>${escapeHtml(String(product.priceToman))} تومان</p><p>وضعیت: ${escapeHtml(productAvailabilityLabel(product))}</p></article></main>`;
}

function contentBody(route: PublicRenderRoute, page: ContentPage, description: string): string {
  const body = page.body ? `<p>${escapeHtml(page.body)}</p>` : '';
  const blocks = page.blocks
    .map((block) => {
      const payload =
        typeof block.payload === 'string'
          ? block.payload
          : typeof block.payload === 'object' && block.payload !== null && 'text' in block.payload
            ? String((block.payload as { text: unknown }).text)
            : '';
      return payload ? `<p>${escapeHtml(payload)}</p>` : '';
    })
    .join('');
  const canonical = route.kind === 'content' ? route.path : '/';
  return `<main data-nova-ssr-content="true"><article><a href="${escapeHtml(canonical)}"><h1>${escapeHtml(page.title)}</h1></a><p>${escapeHtml(description)}</p>${body}${blocks}</article></main>`;
}

function metadataFallback(
  origin: string,
  route: PublicRenderRoute,
): Omit<Parameters<typeof createSeoDocument>[0], 'origin'> {
  switch (route.kind) {
    case 'home':
      return {
        title: 'NOVA | Atelier Editorial',
        description: defaultSiteDescription,
        canonicalPath: '/',
        jsonLd: homeJsonLd(origin),
      };
    case 'category':
      return {
        title: `NOVA | ${route.slug}`,
        description: `انتخاب‌های نوا در دسته ${route.slug}.`,
        canonicalPath: route.path,
        jsonLd: null,
      };
    case 'product':
      return {
        title: 'NOVA | محصول',
        description: 'جزئیات و مشخصات محصولات نوا.',
        canonicalPath: route.path,
        jsonLd: null,
      };
    case 'content':
      return {
        title: 'NOVA | محتوا',
        description: defaultSiteDescription,
        canonicalPath: route.path,
        type: 'article',
        jsonLd: null,
      };
    case 'private':
      return { title: 'NOVA', description: defaultSiteDescription, noIndex: true };
    case 'unknown':
      return { title: 'NOVA | صفحه پیدا نشد', description: 'این صفحه پیدا نشد.', noIndex: true };
  }
}

function notFoundContext(origin: string, route: PublicRenderRoute): RenderContext {
  const seo = createSeoDocument({
    origin,
    ...metadataFallback(origin, route),
    canonicalPath: null,
    noIndex: true,
    jsonLd: null,
  });
  return {
    path: route.path,
    hashRoute: routeHash(route),
    seo,
    status: 404,
    bodyHtml: initialBody(seo.title, seo.description),
    cacheControl: noStoreCache,
  };
}

function serviceUnavailableContext(origin: string, route: PublicRenderRoute): RenderContext {
  const seo = createSeoDocument({
    origin,
    title: 'NOVA | موقتاً در دسترس نیست',
    description: 'این صفحه موقتاً در دسترس نیست.',
    noIndex: true,
  });
  return {
    path: route.path,
    hashRoute: routeHash(route),
    seo,
    status: 503,
    bodyHtml: initialBody(seo.title, seo.description),
    cacheControl: noStoreCache,
  };
}

export async function renderRoute(path: string, options: RenderOptions): Promise<RenderContext> {
  const origin = trimOrigin(options.origin);
  const route = parsePublicRenderPath(path);
  if (route.kind === 'private') {
    return {
      path: route.path,
      hashRoute: routeHash(route),
      seo: createSeoDocument({ origin, ...metadataFallback(origin, route) }),
      status: 200,
      bodyHtml: initialBody('NOVA', defaultSiteDescription),
      cacheControl: noStoreCache,
    };
  }
  if (route.kind === 'unknown' && isNonPublicPath(route.path))
    return notFoundContext(origin, route);

  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  let resolution: SeoResolution;
  try {
    resolution = await getSeoResolution(options.apiOrigin, route.path, fetcher);
  } catch (error) {
    if (route.kind === 'unknown' && error instanceof RenderApiError && error.status === 404)
      return notFoundContext(origin, route);
    return serviceUnavailableContext(origin, route);
  }

  if (resolution.redirect) {
    const location = safeRedirectPath(origin, resolution.redirect.toPath);
    if (!location) return serviceUnavailableContext(origin, route);
    return {
      path: route.path,
      hashRoute: routeHash(route),
      seo: createSeoDocument({ origin, ...metadataFallback(origin, route), noIndex: true }),
      status: 200,
      redirect: { location, status: resolution.redirect.statusCode },
      bodyHtml: initialBody('NOVA', 'הمسیر در حال انتقال است.'),
      cacheControl: redirectCache,
    };
  }
  if (route.kind === 'unknown') return notFoundContext(origin, route);

  try {
    if (route.kind === 'home') {
      const products = await getApi<CatalogProductPage>(
        options.apiOrigin,
        catalogProductsPath('limit=8&sort=newest&page=1'),
        fetcher,
      );
      const fallback = metadataFallback(origin, route);
      const seo = seoDocumentFromMetadata(origin, fallback, resolution.metadata);
      return {
        path: route.path,
        hashRoute: routeHash(route),
        seo,
        status: 200,
        bodyHtml: initialBody(
          seo.title,
          seo.description,
          products.items.map((product) => ({
            href: `/product/${encodeURIComponent(product.slug)}`,
            label: product.name,
          })),
        ),
        cacheControl: publicCache,
      };
    }
    if (route.kind === 'category') {
      const [categories, products] = await Promise.all([
        getApi<CatalogCategory[]>(options.apiOrigin, '/v1/catalog/categories', fetcher),
        getApi<CatalogProductPage>(
          options.apiOrigin,
          catalogProductsPath(
            `audience=${encodeURIComponent(route.slug)}&limit=8&sort=newest&page=1`,
          ),
          fetcher,
        ),
      ]);
      const category = categories.find((candidate) => candidate.slug === route.slug);
      if (!category) return notFoundContext(origin, route);
      const fallback = metadataFallback(origin, route);
      const seo = seoDocumentFromMetadata(
        origin,
        { ...fallback, title: `NOVA | ${category.name}` },
        resolution.metadata,
      );
      return {
        path: route.path,
        hashRoute: routeHash(route),
        seo: {
          ...seo,
          jsonLd:
            seo.robots === 'index, follow'
              ? (seo.jsonLd ?? categoryJsonLd(origin, route, products.items, category.name))
              : null,
        },
        status: 200,
        bodyHtml: initialBody(
          seo.title,
          seo.description,
          products.items.map((product) => ({
            href: `/product/${encodeURIComponent(product.slug)}`,
            label: product.name,
          })),
        ),
        cacheControl: publicCache,
      };
    }
    if (route.kind === 'product') {
      const product = await getApi<CatalogProduct>(
        options.apiOrigin,
        `/v1/catalog/products/${encodeURIComponent(route.slug)}`,
        fetcher,
      );
      const fallback = metadataFallback(origin, route);
      const productDescription = catalogProductDescription(product);
      const seo = seoDocumentFromMetadata(
        origin,
        {
          ...fallback,
          title: `NOVA | ${product.name}`,
          description: productDescription,
          imagePath: imagePath(product),
          jsonLd: productJsonLd(origin, product),
        },
        resolution.metadata ? { ...resolution.metadata, structuredData: null } : null,
      );
      return {
        path: route.path,
        hashRoute: routeHash(route),
        seo: {
          ...seo,
          jsonLd: seo.robots === 'index, follow' ? productJsonLd(origin, product) : null,
        },
        status: 200,
        bodyHtml: productBody(product, productDescription),
        cacheControl: publicCache,
      };
    }

    const page = await getApi<ContentPage>(
      options.apiOrigin,
      `/v1/content/pages/${encodeURIComponent(route.slug)}`,
      fetcher,
    );
    const fallback = metadataFallback(origin, route);
    const seo = seoDocumentFromMetadata(
      origin,
      {
        ...fallback,
        title: `NOVA | ${page.title}`,
        description: page.body?.slice(0, 320) ?? page.title,
        jsonLd: contentJsonLd(origin, route, page),
      },
      resolution.metadata,
    );
    return {
      path: route.path,
      hashRoute: routeHash(route),
      seo,
      status: 200,
      bodyHtml: contentBody(route, page, seo.description),
      cacheControl: publicCache,
    };
  } catch (error) {
    if (error instanceof RenderApiError && error.status === 404)
      return notFoundContext(origin, route);
    return serviceUnavailableContext(origin, route);
  }
}

function renderHead(seo: SeoDocument): string {
  const meta = (key: string, value: string, attribute = 'name') =>
    `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(value)}" data-nova-seo="true" />`;
  const canonical = seo.canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(seo.canonicalUrl)}" data-nova-seo="true" />`
    : '';
  const image = seo.openGraph.imageUrl ? meta('og:image', seo.openGraph.imageUrl, 'property') : '';
  const jsonLd =
    seo.jsonLd === null
      ? ''
      : `<script type="application/ld+json" data-nova-seo="true">${safeJson(seo.jsonLd)}</script>`;
  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    meta('description', seo.description),
    meta('robots', seo.robots),
    meta('og:title', seo.title, 'property'),
    meta('og:description', seo.description, 'property'),
    meta('og:type', seo.openGraph.type, 'property'),
    seo.canonicalUrl ? meta('og:url', seo.canonicalUrl, 'property') : '',
    image,
    canonical,
    jsonLd,
  ].join('');
}

function stripManagedHead(template: string): string {
  return template
    .replace(/\s*<title>[\s\S]*?<\/title>/i, '')
    .replace(/\s*<meta\s+[^>]*name=["']description["'][^>]*\/?\s*>/gi, '')
    .replace(/\s*<meta\s+[^>]*name=["']robots["'][^>]*\/?\s*>/gi, '')
    .replace(/\s*<meta\s+[^>]*property=["']og:[^"']+["'][^>]*\/?\s*>/gi, '')
    .replace(/\s*<link\s+[^>]*rel=["']canonical["'][^>]*\/?\s*>/gi, '')
    .replace(/\s*<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');
}

export function renderDocument(template: string, context: RenderContext): string {
  const cleanTemplate = stripManagedHead(template);
  const root = `<div id="root" data-nova-ssr="true"><div data-nova-ssr-shell="true">${context.bodyHtml}</div></div>`;
  const contextScript = `<script>globalThis.__NOVA_RENDER_CONTEXT__=${safeJson({ path: context.path, hashRoute: context.hashRoute, seo: context.seo })};</script>`;
  return cleanTemplate
    .replace('</head>', `${renderHead(context.seo)}</head>`)
    .replace(/<div id="root"><\/div>/, root)
    .replace('</body>', `${contextScript}</body>`);
}

export function robotsText(origin: string): string {
  const lines = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /auth',
    'Disallow: /account',
    'Disallow: /admin',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /order',
    'Disallow: /return',
    'Disallow: /assets/',
    'Disallow: /api/',
    'Disallow: /v1/',
    'Disallow: /health',
    'Disallow: /favicon.ico',
    'Disallow: /manifest.json',
    `Sitemap: ${trimOrigin(origin)}/sitemap.xml`,
  ];
  return `${lines.join('\n')}\n`;
}

function xmlEscape(value: string): string {
  return escapeHtml(value).replaceAll('&#39;', '&apos;').replaceAll('&quot;', '&quot;');
}

function sitemapXml(origin: string, paths: string[]): string {
  const uniquePaths = [...new Set(paths)].sort();
  const entries = uniquePaths
    .map((path) => `<url><loc>${xmlEscape(`${trimOrigin(origin)}${path}`)}</loc></url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries}</urlset>`;
}

function isRecognizedSitemapPath(path: string): boolean {
  return isIndexablePublicRenderPath(path);
}

function effectiveSitemapPath(
  origin: string,
  fallbackPath: string,
  canonicalUrl: string | null,
): string | null {
  if (canonicalUrl === null) return fallbackPath;
  return normalizeCanonicalPath(origin, canonicalUrl);
}

async function indexableSitemapPaths(
  apiOrigin: string,
  paths: string[],
  fetcher: Fetcher,
  origin: string,
): Promise<string[]> {
  const candidates = [...new Set(paths)].filter(isRecognizedSitemapPath).sort();
  const resolved = await Promise.all(
    candidates.map(async (path) => {
      const resolution = await getSeoResolution(apiOrigin, path, fetcher);
      if (resolution.redirect || resolution.metadata?.noIndex) return null;
      return effectiveSitemapPath(origin, path, resolution.metadata?.canonicalUrl ?? null);
    }),
  );
  return resolved.filter((path): path is string => path !== null);
}

async function allCatalogProducts(apiOrigin: string, fetcher: Fetcher): Promise<ProductSummary[]> {
  const products: ProductSummary[] = [];
  let page = 1;
  let total = 0;
  do {
    const result = await getApi<CatalogProductPage>(
      apiOrigin,
      catalogProductsPath(`limit=100&sort=newest&page=${page}`),
      fetcher,
    );
    products.push(...result.items);
    total = result.total;
    page += 1;
  } while (products.length < total && page <= 1000);
  if (products.length < total)
    throw new RenderApiError(502, 'Sitemap catalog pagination did not converge');
  return products;
}

export async function sitemapResponse(options: RenderOptions): Promise<RenderResponse> {
  const origin = trimOrigin(options.origin);
  const fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  try {
    const [categories, products] = await Promise.all([
      getApi<CatalogCategory[]>(options.apiOrigin, '/v1/catalog/categories', fetcher),
      allCatalogProducts(options.apiOrigin, fetcher),
    ]);
    const paths = [
      '/',
      ...categories
        .map((category) => `/category/${encodeURIComponent(category.slug)}`)
        .filter(isRecognizedSitemapPath),
      ...products
        .map((product) => `/product/${encodeURIComponent(product.slug)}`)
        .filter(isRecognizedSitemapPath),
    ];
    const indexablePaths = await indexableSitemapPaths(options.apiOrigin, paths, fetcher, origin);
    return {
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': sitemapCache,
      }),
      body: sitemapXml(origin, indexablePaths),
    };
  } catch {
    return {
      status: 503,
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': noStoreCache,
      }),
      body: 'Sitemap temporarily unavailable',
    };
  }
}

function responseFromContext(context: RenderContext, template: string): RenderResponse {
  if (context.redirect) {
    return {
      status: context.redirect.status,
      headers: new Headers({
        Location: context.redirect.location,
        'Cache-Control': context.cacheControl,
      }),
      body: '',
    };
  }
  return {
    status: context.status,
    headers: new Headers({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': context.cacheControl,
      'X-Robots-Tag': context.seo.robots,
    }),
    body: renderDocument(template, context),
  };
}

export async function handleRequest(
  url: string,
  options: RenderOptions,
  template: string,
): Promise<RenderResponse> {
  const rawUrl = url.trim();
  if (rawUrl.startsWith('//')) {
    return responseFromContext(
      notFoundContext(trimOrigin(options.origin), { kind: 'unknown', path: rawUrl }),
      template,
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl, options.origin);
  } catch {
    return responseFromContext(
      notFoundContext(trimOrigin(options.origin), { kind: 'unknown', path: rawUrl }),
      template,
    );
  }
  if (parsed.pathname === '/robots.txt') {
    return {
      status: 200,
      headers: new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      }),
      body: robotsText(options.origin),
    };
  }
  if (parsed.pathname === '/sitemap.xml') return sitemapResponse(options);

  const context = await renderRoute(parsed.pathname, options);
  return responseFromContext(context, template);
}

function mimeType(path: string): string {
  return (
    (
      {
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.mjs': 'text/javascript',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.png': 'image/png',
        '.ico': 'image/x-icon',
      } as Record<string, string>
    )[extname(path)] ?? 'application/octet-stream'
  );
}

async function serveStatic(
  staticRoot: string,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<boolean> {
  const rawUrl = (request.url ?? '/').trim();
  if (rawUrl.startsWith('//')) return false;
  const requestPath = new URL(rawUrl, 'http://localhost').pathname;
  if (!requestPath.startsWith('/assets/')) return false;
  const normalizedRoot = normalize(staticRoot);
  const separator = process.platform === 'win32' ? '\\' : '/';
  const rootPrefix = normalizedRoot.endsWith(separator)
    ? normalizedRoot
    : `${normalizedRoot}${separator}`;
  const filePath = normalize(join(normalizedRoot, requestPath));
  if (!filePath.startsWith(rootPrefix)) return false;
  try {
    const file = await stat(filePath);
    if (!file.isFile()) return false;
  } catch (error) {
    if (!['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
    response.writeHead(404, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': noStoreCache,
      'X-Robots-Tag': 'noindex, nofollow',
    });
    response.end(request.method === 'HEAD' ? undefined : 'Not found');
    return true;
  }
  response.writeHead(200, {
    'Content-Type': mimeType(filePath),
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Robots-Tag': 'noindex, nofollow',
  });
  if (request.method === 'HEAD') {
    response.end();
    return true;
  }
  createReadStream(filePath)
    .on('error', () => response.destroy())
    .pipe(response);
  return true;
}

async function handleNodeRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: RenderOptions & { template: string; staticRoot: string },
): Promise<void> {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    if (await serveStatic(options.staticRoot, request, response)) return;
    const result = await handleRequest(request.url ?? '/', options, options.template);
    response.writeHead(result.status, Object.fromEntries(result.headers.entries()));
    response.end(request.method === 'HEAD' ? undefined : result.body);
  } catch {
    response
      .writeHead(500, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': noStoreCache,
        'X-Robots-Tag': 'noindex, nofollow',
      })
      .end('Internal server error');
  }
}

export function createWebServer(options: RenderOptions & { template: string; staticRoot: string }) {
  return createHttpServer((request, response) => {
    void handleNodeRequest(request, response, options);
  });
}

export async function startServer(): Promise<void> {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const staticRoot = resolve(currentDir, '..');
  const template = await readFile(resolve(staticRoot, 'index.html'), 'utf8');
  const origin = process.env.NOVA_WEB_ORIGIN ?? 'http://localhost:4173';
  const server = createWebServer({
    origin,
    apiOrigin: process.env.NOVA_API_ORIGIN ?? 'http://localhost:4000',
    staticRoot,
    template,
  });
  const port = Number(process.env.PORT ?? 4173);
  await new Promise<void>((resolvePromise) => server.listen(port, resolvePromise));
  console.log(`NOVA web server listening on ${origin}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void startServer();
}
