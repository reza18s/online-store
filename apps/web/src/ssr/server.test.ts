import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { CatalogCategory, CatalogProduct, ContentPage, SeoResolution } from '@nova/api-client';

import {
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

test('renders a product with resolver metadata and catalog-derived Product JSON-LD', async () => {
  const resolution: SeoResolution = {
    path: '/product/linen-overshirt',
    metadata: {
      path: '/product/linen-overshirt',
      title: 'مانتوی لینن آوا | NOVA',
      description: 'رویه‌ای سبک برای روزهای روشن.',
      canonicalUrl: '/product/linen-overshirt',
      noIndex: false,
      structuredData: null,
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
  assert.match(context.bodyHtml, /مانتوی لینن آوا/);
  assert.deepEqual((context.seo.jsonLd as { offers: { price: string } }).offers.price, '24900000');
  assert.deepEqual(calls, [
    '/v1/seo/resolve?path=%2Fproduct%2Flinen-overshirt',
    '/v1/catalog/products/linen-overshirt',
  ]);
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
  assert.match(html, /Title &lt;safe&gt;/);
  assert.match(html, /\\u003c\/script\\u003e/);
  assert.match(html, /__NOVA_RENDER_CONTEXT__/);
});

test('crawler files include public catalog/content truth and exclude private routes', async () => {
  const categories: CatalogCategory[] = [{ id: 'women', slug: 'women', name: 'زنانه' }];
  const { fetcher } = fixtureFetcher(
    {
      '/v1/catalog/categories': categories,
      '/v1/catalog/products?limit=100&sort=newest&page=1': {
        items: [product],
        total: 1,
        page: 1,
        limit: 100,
      },
      '/v1/content/pages/size-guide': page,
      '/v1/content/pages/draft': { error: 'not found' },
    },
    { '/v1/content/pages/draft': 404 },
  );
  const sitemap = await sitemapResponse({
    ...optionsBase,
    fetcher,
    contentSlugs: ['size-guide', 'draft'],
  });
  assert.equal(sitemap.status, 200);
  assert.match(sitemap.body, /https:\/\/nova\.example\/product\/linen-overshirt/);
  assert.match(sitemap.body, /https:\/\/nova\.example\/content\/size-guide/);
  assert.doesNotMatch(sitemap.body, /draft/);
  assert.doesNotMatch(sitemap.body, /account|admin|checkout|cart/);

  const robots = robotsText(optionsBase.origin);
  assert.match(robots, /Disallow: \/account/);
  assert.match(robots, /Sitemap: https:\/\/nova\.example\/sitemap\.xml/);
});

test('crawler generation fails closed when the API is unavailable', async () => {
  const { fetcher } = fixtureFetcher({}, {});
  const result = await sitemapResponse({ ...optionsBase, fetcher });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
});
