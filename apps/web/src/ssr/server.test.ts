import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { CatalogCategory, CatalogProduct, ContentPage, SeoResolution } from '@nova/api-client';

import {
  createWebServer,
  handleRequest,
  renderDocument,
  renderRoute,
  robotsText,
  sitemapResponse,
  type Fetcher,
  type RenderContext,
} from './server';

const optionsBase = {
  origin: 'https://nova.example',
  apiOrigin: 'https://api.nova.example',
};

const product = {
  id: 'product-1',
  slug: 'linen-overshirt',
  name: 'مانتوی لینن آوا',
  priceToman: 2490000,
  compareAtPriceToman: null,
  available: true,
  imageUrl: '/assets/nova-product-linen-overshirt.webp',
  imageAlt: 'مانتوی لینن روشن',
  categories: [{ id: 'women', slug: 'women', name: 'زنانه' }],
  options: [],
  variants: [],
  colors: [],
  stockStatus: 'IN_STOCK',
  shortDescription: 'رویه‌ای سبک برای روزهای روشن.',
  description: 'رویه‌ای سبک و خوش‌دوخت برای استفاده روزمره.',
  brand: 'NOVA',
  media: [],
  attributes: [],
} satisfies CatalogProduct;

const page = {
  slug: 'size-guide',
  title: 'راهنمای اندازه',
  body: 'اندازه‌گیری ساده برای انتخاب مطمئن‌تر.',
  blocks: [
    { kind: 'paragraph', payload: { text: 'قد و دور سینه را اندازه بگیرید.' }, sortOrder: 1 },
  ],
} satisfies ContentPage;

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fixtureFetcher(responses: Record<string, unknown>, statuses: Record<string, number> = {}) {
  const calls: string[] = [];
  const fetcher: Fetcher = async (input) => {
    const url = new URL(input);
    const key = `${url.pathname}${url.search}`;
    calls.push(key);
    if (!(key in responses)) return jsonResponse({ message: 'missing fixture' }, 500);
    return jsonResponse(responses[key], statuses[key] ?? 200);
  };
  return { fetcher, calls };
}

test('keeps product JSON-LD catalog-first when resolver structured data conflicts', async () => {
  const resolution: SeoResolution = {
    path: '/product/linen-overshirt',
    metadata: {
      path: '/product/linen-overshirt',
      title: 'مانتوی لینن آوا | NOVA',
      description: 'رویه‌ای سبک برای روزهای روشن.',
      canonicalUrl: '/product/linen-overshirt',
      noIndex: false,
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Resolver override that must not win',
        description: 'Resolver description that must not win in Product JSON-LD',
        offers: { price: '1' },
      },
    },
    redirect: null,
  };
  const { fetcher, calls } = fixtureFetcher({
    '/v1/seo/resolve?path=%2Fproduct%2Flinen-overshirt': resolution,
    '/v1/catalog/products/linen-overshirt': product,
  });

  const context = await renderRoute('/product/linen-overshirt', { ...optionsBase, fetcher });
  assert.equal(context.status, 200);
  assert.equal(context.seo.title, 'مانتوی لینن آوا | NOVA');
  assert.equal(context.seo.canonicalUrl, 'https://nova.example/product/linen-overshirt');
  assert.equal(context.seo.robots, 'index, follow');
  assert.match(context.bodyHtml, /مانتوی لینن آوا/);
  assert.match(context.bodyHtml, /وضعیت: موجود/);
  assert.match(context.bodyHtml, /product-detail__main-image/);
  assert.match(context.bodyHtml, /loading="eager"/);
  assert.match(context.bodyHtml, /decoding="async"/);
  assert.match(context.bodyHtml, /fetchpriority="high"/);
  assert.doesNotMatch(context.bodyHtml, /(?:width|height)="/);
  const graph = (context.seo.jsonLd as { '@graph': Array<Record<string, unknown>> })['@graph'];
  const productJsonLd = graph.find((entry) => entry['@type'] === 'Product');
  const breadcrumbJsonLd = graph.find((entry) => entry['@type'] === 'BreadcrumbList');
  const organizationJsonLd = graph.find((entry) => entry['@type'] === 'Organization');
  assert.ok(productJsonLd);
  assert.ok(breadcrumbJsonLd);
  assert.ok(organizationJsonLd);
  assert.equal(productJsonLd.name, product.name);
  assert.equal(
    graph.some((entry) => entry.name === 'Resolver override that must not win'),
    false,
  );
  assert.equal((productJsonLd.offers as { price: string }).price, '24900000');
  assert.equal(
    (productJsonLd.offers as { availability: string }).availability,
    'https://schema.org/InStock',
  );
  assert.equal(context.seo.description, 'رویه‌ای سبک برای روزهای روشن.');
  assert.equal(productJsonLd.description, product.description);
  assert.doesNotMatch(context.bodyHtml, /Resolver description that must not win/);
  assert.deepEqual(
    (breadcrumbJsonLd.itemListElement as Array<{ name: string }>).map((item) => item.name),
    ['خانه', 'زنانه', 'مانتوی لینن آوا'],
  );
  assert.equal(organizationJsonLd.name, 'NOVA Store');
  assert.deepEqual(calls, [
    '/v1/seo/resolve?path=%2Fproduct%2Flinen-overshirt',
    '/v1/catalog/products/linen-overshirt',
  ]);
});

test('uses catalog availability and a safe image fallback for unavailable products', async () => {
  const unavailableProduct = {
    ...product,
    slug: 'unavailable-overshirt',
    available: false,
    imageUrl: null,
    imageAlt: null,
    stockStatus: 'OUT_OF_STOCK',
  } satisfies CatalogProduct;
  const { fetcher } = fixtureFetcher({
    '/v1/seo/resolve?path=%2Fproduct%2Funavailable-overshirt': {
      path: '/product/unavailable-overshirt',
      metadata: null,
      redirect: null,
    } satisfies SeoResolution,
    '/v1/catalog/products/unavailable-overshirt': unavailableProduct,
  });

  const context = await renderRoute('/product/unavailable-overshirt', {
    ...optionsBase,
    fetcher,
  });
  assert.equal(context.status, 200);
  assert.match(context.bodyHtml, /وضعیت: ناموجود/);
  assert.doesNotMatch(context.bodyHtml, /<img\b/);
  assert.equal(context.seo.openGraph.imageUrl, null);
  const graph = (context.seo.jsonLd as { '@graph': Array<Record<string, unknown>> })['@graph'];
  const productJsonLd = graph.find((entry) => entry['@type'] === 'Product');
  assert.ok(productJsonLd);
  assert.equal(productJsonLd.image, undefined);
  assert.equal(
    (productJsonLd.offers as { availability: string }).availability,
    'https://schema.org/OutOfStock',
  );
});

test('renders home, category, and published content initial HTML from public reads', async () => {
  const resolution = (path: string): SeoResolution => ({
    path,
    metadata: null,
    redirect: null,
  });
  const categories: CatalogCategory[] = [{ id: 'women', slug: 'women', name: 'زنانه' }];
  const { fetcher } = fixtureFetcher({
    '/v1/seo/resolve?path=%2F': resolution('/'),
    '/v1/catalog/products?limit=8&sort=newest&page=1': {
      items: [product],
      total: 1,
      page: 1,
      limit: 8,
    },
    '/v1/seo/resolve?path=%2Fcategory%2Fwomen': resolution('/category/women'),
    '/v1/catalog/categories': categories,
    '/v1/catalog/products?audience=women&limit=8&sort=newest&page=1': {
      items: [product],
      total: 1,
      page: 1,
      limit: 8,
    },
    '/v1/seo/resolve?path=%2Fcontent%2Fsize-guide': resolution('/content/size-guide'),
    '/v1/content/pages/size-guide': page,
  });

  const home = await renderRoute('/', { ...optionsBase, fetcher });
  assert.match(home.bodyHtml, /مانتوی لینن آوا/);
  assert.equal(home.seo.canonicalUrl, 'https://nova.example/');

  const category = await renderRoute('/category/women', { ...optionsBase, fetcher });
  assert.match(category.bodyHtml, /مانتوی لینن آوا/);
  assert.equal((category.seo.jsonLd as { '@type': string })['@type'], 'CollectionPage');

  const content = await renderRoute('/content/size-guide', { ...optionsBase, fetcher });
  assert.match(content.bodyHtml, /راهنمای اندازه/);
  assert.match(content.bodyHtml, /قد و دور سینه/);
  assert.equal((content.seo.jsonLd as { '@type': string })['@type'], 'Article');
});

test('follows resolver redirects before loading catalog content', async () => {
  const { fetcher, calls } = fixtureFetcher({
    '/v1/seo/resolve?path=%2Fproduct%2Fold': {
      path: '/product/old',
      metadata: null,
      redirect: { fromPath: '/product/old', toPath: '/product/new', statusCode: 308 },
    } satisfies SeoResolution,
  });
  const result = await handleRequest(
    'https://nova.example/product/old',
    { ...optionsBase, fetcher },
    '<html><head></head><body><div id="root"></div></body></html>',
  );
  assert.equal(result.status, 308);
  assert.equal(result.headers.get('location'), '/product/new');
  assert.equal(calls.length, 1);
});

test('resolves unknown public paths before a final noindex 404', async () => {
  const { fetcher, calls } = fixtureFetcher({
    '/v1/seo/resolve?path=%2Flegacy-product': {
      path: '/legacy-product',
      metadata: null,
      redirect: null,
    } satisfies SeoResolution,
  });
  const context = await renderRoute('/legacy-product', { ...optionsBase, fetcher });
  assert.equal(context.status, 404);
  assert.equal(context.hashRoute, '#not-found');
  assert.equal(context.seo.robots, 'noindex, nofollow');
  assert.deepEqual(calls, ['/v1/seo/resolve?path=%2Flegacy-product']);
});

test('allows persisted redirects for unknown legacy public paths', async () => {
  const { fetcher, calls } = fixtureFetcher({
    '/v1/seo/resolve?path=%2Fold-catalog-path': {
      path: '/old-catalog-path',
      metadata: null,
      redirect: { fromPath: '/old-catalog-path', toPath: '/product/new', statusCode: 308 },
    } satisfies SeoResolution,
  });
  const result = await handleRequest(
    'https://nova.example/old-catalog-path',
    { ...optionsBase, fetcher },
    '<html><head></head><body><div id="root"></div></body></html>',
  );
  assert.equal(result.status, 308);
  assert.equal(result.headers.get('location'), '/product/new');
  assert.deepEqual(calls, ['/v1/seo/resolve?path=%2Fold-catalog-path']);
});

test('returns a safe noindex 404 for missing published products', async () => {
  const { fetcher } = fixtureFetcher(
    {
      '/v1/seo/resolve?path=%2Fproduct%2Fmissing': {
        path: '/product/missing',
        metadata: null,
        redirect: null,
      } satisfies SeoResolution,
      '/v1/catalog/products/missing': { error: 'not found' },
    },
    { '/v1/catalog/products/missing': 404 },
  );
  const context = await renderRoute('/product/missing', { ...optionsBase, fetcher });
  assert.equal(context.status, 404);
  assert.equal(context.seo.robots, 'noindex, nofollow');
  assert.equal(context.seo.canonicalUrl, null);
  assert.equal(context.seo.jsonLd, null);
});

test('keeps private clean paths on their existing client routes while excluding them from indexing', async () => {
  const context = await renderRoute('/account/orders', optionsBase);
  assert.equal(context.status, 200);
  assert.equal(context.hashRoute, '#account');
  assert.equal(context.seo.robots, 'noindex, nofollow');
  assert.equal(context.seo.canonicalUrl, null);
});

test('keeps private, system, and asset paths out of resolver lookup and indexing', async () => {
  const { fetcher, calls } = fixtureFetcher({});
  for (const path of [
    '/account/orders',
    '/health',
    '/v1/catalog/products',
    '/assets/missing.webp',
  ]) {
    const context = await renderRoute(path, { ...optionsBase, fetcher });
    assert.equal(context.seo.robots, 'noindex, nofollow', path);
    assert.equal(context.seo.canonicalUrl, null, path);
  }
  assert.deepEqual(calls, []);
});

test('returns controlled asset headers for GET and HEAD requests', async () => {
  const server = createWebServer({
    ...optionsBase,
    staticRoot: fileURLToPath(new URL('../../public/', import.meta.url)),
    template: '<html><head></head><body><div id="root"></div></body></html>',
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Server did not expose a port.');
    const assetUrl = `http://127.0.0.1:${address.port}/assets/nova-product-linen-overshirt.webp`;
    const assetResponse = await fetch(assetUrl);
    assert.equal(assetResponse.status, 200);
    assert.equal(assetResponse.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.equal(assetResponse.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.ok((await assetResponse.arrayBuffer()).byteLength > 0);

    const assetHeadResponse = await fetch(assetUrl, { method: 'HEAD' });
    assert.equal(assetHeadResponse.status, 200);
    assert.equal(
      assetHeadResponse.headers.get('cache-control'),
      'public, max-age=31536000, immutable',
    );
    assert.equal(assetHeadResponse.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(await assetHeadResponse.text(), '');

    const response = await fetch(
      `http://127.0.0.1:${address.port}/assets/__missing-seo-001-asset__.webp`,
    );
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(await response.text(), 'Not found');

    const headResponse = await fetch(
      `http://127.0.0.1:${address.port}/assets/__missing-seo-001-asset__.webp`,
      { method: 'HEAD' },
    );
    assert.equal(headResponse.status, 404);
    assert.equal(headResponse.headers.get('cache-control'), 'no-store');
    assert.equal(headResponse.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(await headResponse.text(), '');
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('renders one managed head set and safely serializes the initial context', () => {
  const context: RenderContext = {
    path: '/product/linen-overshirt',
    hashRoute: '#product/linen-overshirt',
    seo: {
      title: 'Title <safe>',
      description: 'Description & safe',
      canonicalUrl: 'https://nova.example/product/linen-overshirt',
      robots: 'index, follow',
      openGraph: { type: 'product', imageUrl: null },
      jsonLd: { '@type': 'Product', name: '</script><script>alert(1)</script>' },
    },
    status: 200,
    bodyHtml: '<main><h1>Already escaped by renderer</h1></main>',
    cacheControl: 'public, s-maxage=60',
  };
  const html = renderDocument(
    '<html><head><title>Old</title><meta name="description" content="Old"></head><body><div id="root"></div></body></html>',
    context,
  );
  assert.equal((html.match(/<title>/g) ?? []).length, 1);
  assert.equal((html.match(/name="description"/g) ?? []).length, 1);
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.match(html, /<div id="root" data-nova-ssr="true"><div data-nova-ssr-shell="true">/);
  assert.match(html, /Title &lt;safe&gt;/);
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.match(html, /__NOVA_RENDER_CONTEXT__/);
});

test('crawler files are deterministic, renderer-aware, and resolver-filtered', async () => {
  const categories: CatalogCategory[] = [
    { id: 'women', slug: 'women', name: 'زنانه' },
    { id: 'sale', slug: 'sale', name: 'حراج' },
  ];
  const hiddenProduct = { ...product, slug: 'hidden-product' };
  const redirectedProduct = { ...product, slug: 'redirected-product' };
  const { fetcher } = fixtureFetcher({
    '/v1/catalog/categories': categories,
    '/v1/catalog/products?limit=100&sort=newest&page=1': {
      items: [product, hiddenProduct, redirectedProduct],
      total: 3,
      page: 1,
      limit: 100,
    },
    '/v1/seo/resolve?path=%2F': {
      path: '/',
      metadata: null,
      redirect: null,
    } satisfies SeoResolution,
    '/v1/seo/resolve?path=%2Fcategory%2Fwomen': {
      path: '/category/women',
      metadata: null,
      redirect: null,
    } satisfies SeoResolution,
    '/v1/seo/resolve?path=%2Fproduct%2Fhidden-product': {
      path: '/product/hidden-product',
      metadata: {
        path: '/product/hidden-product',
        title: 'پنهان',
        description: 'برای فهرست نیست.',
        canonicalUrl: '/product/hidden-product',
        noIndex: true,
        structuredData: null,
      },
      redirect: null,
    } satisfies SeoResolution,
    '/v1/seo/resolve?path=%2Fproduct%2Flinen-overshirt': {
      path: '/product/linen-overshirt',
      metadata: null,
      redirect: null,
    } satisfies SeoResolution,
    '/v1/seo/resolve?path=%2Fproduct%2Fredirected-product': {
      path: '/product/redirected-product',
      metadata: null,
      redirect: {
        fromPath: '/product/redirected-product',
        toPath: '/product/linen-overshirt',
        statusCode: 308,
      },
    } satisfies SeoResolution,
  });
  const sitemap = await sitemapResponse({
    ...optionsBase,
    fetcher,
  });
  assert.equal(sitemap.status, 200);
  const locations = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  assert.deepEqual(locations, [
    'https://nova.example/',
    'https://nova.example/category/women',
    'https://nova.example/product/linen-overshirt',
  ]);
  assert.doesNotMatch(sitemap.body, /sale|hidden-product|redirected-product|content/);

  const robots = robotsText(optionsBase.origin);
  assert.match(robots, /Disallow: \/account/);
  assert.match(robots, /Disallow: \/assets\//);
  assert.match(robots, /Sitemap: https:\/\/nova\.example\/sitemap\.xml/);
});

test('crawler generation fails closed when the API is unavailable', async () => {
  const { fetcher } = fixtureFetcher({}, {});
  const result = await sitemapResponse({ ...optionsBase, fetcher });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});
